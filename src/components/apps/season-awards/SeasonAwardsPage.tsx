import { useEffect, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PersonLookupDialog from "components/PersonLookupDialog";
import { AuthManager } from "types/AuthManager";
import { filterToAuthorizedDistricts, type DistrictInfo } from "types/RegionAndDistricts";
import {
    Church,
    ChurchesService,
} from "types/services/ChurchesService";
import {
    AstroPeopleSeasonAwardsService,
    type OnlinePersonSeasonAward,
} from "types/services/AstroPeopleSeasonAwardsService";
import { PersonParentType, type Person } from "types/services/PeopleService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import OtherChurchDialog from "./OtherChurchDialog";
import SeasonAwardEditorDialog from "./SeasonAwardEditorDialog";

interface Props {
    districts: DistrictInfo[];
}

type AwardScope = "district" | "church";

const OTHER_CHURCH_VALUE = "__other__";

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
}

function getChurchDisplayName(church: Church): string {
    const location = [church.PhysicalAddress?.City, church.PhysicalAddress?.State]
        .filter(Boolean)
        .join(", ");

    return location ? `${church.Name}, ${location}` : church.Name;
}

function getCurrentSeason(): number {
    const today = DataTypeHelpers.formatDate(
        DataTypeHelpers.nowDateOnly,
        "yyyy-MM-dd",
    );

    return DataTypeHelpers.getSeasonFromDate(today ?? "")
        ?? DataTypeHelpers.nowDateOnly.getFullYear();
}

export default function SeasonAwardsPage({ districts }: Props) {
    const auth = AuthManager.useNanoStore();
    const profile = auth.userProfile;
    const season = getCurrentSeason();
    const authorizedDistricts = filterToAuthorizedDistricts(auth, districts, "agtbq")
        .sort((left, right) => left.name.localeCompare(right.name));
    const hasDistrictScope = authorizedDistricts.length > 0;
    const hasDirectChurches = !!profile?.churchPermissions?.size;
    const hasChurchScope = hasDistrictScope || hasDirectChurches;

    const [scope, setScope] = useState<AwardScope>(hasDistrictScope ? "district" : "church");
    const [selectedDistrictId, setSelectedDistrictId] = useState<string>(authorizedDistricts[0]?.id ?? "");
    const [directChurches, setDirectChurches] = useState<Church[]>([]);
    const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
    const [isLoadingChurches, setIsLoadingChurches] = useState(hasDirectChurches);
    const [showOtherChurch, setShowOtherChurch] = useState(false);
    const [awards, setAwards] = useState<OnlinePersonSeasonAward[]>([]);
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState(0);
    const [showPersonLookup, setShowPersonLookup] = useState(false);
    const [editingAward, setEditingAward] = useState<OnlinePersonSeasonAward | null>(null);
    const [isLoadingEditor, setIsLoadingEditor] = useState(false);

    useEffect(() => {
        const churchIds = Array.from(profile?.churchPermissions ?? []);
        if (churchIds.length === 0) {
            setDirectChurches([]);
            setIsLoadingChurches(false);
            return;
        }

        let isCurrent = true;
        setIsLoadingChurches(true);
        Promise.all(churchIds.map((churchId) => ChurchesService.getChurch(auth, churchId)))
            .then((churches) => {
                if (!isCurrent) {
                    return;
                }

                const sortedChurches = churches.sort((left, right) =>
                    getChurchDisplayName(left).localeCompare(getChurchDisplayName(right)));
                setDirectChurches(sortedChurches);
                setSelectedChurch((current) => current ?? sortedChurches[0] ?? null);
                setIsLoadingChurches(false);
            })
            .catch((loadError: unknown) => {
                if (isCurrent) {
                    setError(`Unable to load churches: ${getErrorMessage(loadError)}`);
                    setIsLoadingChurches(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [profile]);

    useEffect(() => {
        const parentId = scope === "district" ? selectedDistrictId : selectedChurch?.Id;
        if (!parentId) {
            setAwards([]);
            return;
        }

        let isCurrent = true;
        setIsLoading(true);
        setError(null);

        const request = scope === "district"
            ? AstroPeopleSeasonAwardsService.getAwardsByDistrict(auth, season, parentId)
            : AstroPeopleSeasonAwardsService.getAwardsByChurch(auth, season, parentId);

        request
            .then((loadedAwards) => {
                if (isCurrent) {
                    setAwards(loadedAwards);
                    setIsLoading(false);
                }
            })
            .catch((loadError: unknown) => {
                if (isCurrent) {
                    setAwards([]);
                    setError(getErrorMessage(loadError));
                    setIsLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [scope, selectedDistrictId, selectedChurch?.Id, refreshToken]);

    if (!profile) {
        return null;
    }

    const normalizedSearch = searchText.trim().toLocaleLowerCase();
    const filteredAwards = awards
        .filter((award) => !normalizedSearch
            || award.PersonName.toLocaleLowerCase().includes(normalizedSearch)
            || award.ChurchName.toLocaleLowerCase().includes(normalizedSearch)
            || award.ChurchLocation.toLocaleLowerCase().includes(normalizedSearch))
        .sort((left, right) => left.PersonName.localeCompare(right.PersonName));
    const activeParentId = scope === "district" ? selectedDistrictId : selectedChurch?.Id;

    async function openNewPersonEditor(personId: string): Promise<void> {
        setIsLoadingEditor(true);
        setError(null);
        try {
            const award = await AstroPeopleSeasonAwardsService.getAwardsByPerson(auth, season, personId);
            setEditingAward(award);
        } catch (loadError: unknown) {
            setError(getErrorMessage(loadError));
        } finally {
            setIsLoadingEditor(false);
        }
    }

    function handlePersonSelected(person: Person | null): void {
        setShowPersonLookup(false);
        if (person?.Id) {
            void openNewPersonEditor(person.Id);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {hasDistrictScope && (
                        <button
                            type="button"
                            className={`btn btn-sm mt-0 mb-0 ${scope === "district" ? "btn-primary" : "btn-outline"}`}
                            onClick={() => setScope("district")}
                        >
                            <FontAwesomeIcon icon="fas faMapPin" />
                            Districts
                        </button>
                    )}
                    {hasChurchScope && (
                        <button
                            type="button"
                            className={`btn btn-sm mt-0 mb-0 ${scope === "church" ? "btn-primary" : "btn-outline"}`}
                            onClick={() => setScope("church")}
                        >
                            <FontAwesomeIcon icon="fas faChurch" />
                            Churches
                        </button>
                    )}
                </div>
                <span className="font-semibold">{season} Season</span>
            </div>

            {scope === "district" && (
                <label className="form-control w-full max-w-xl">
                    <span className="label-text font-semibold mb-1">District</span>
                    <select
                        className="select select-bordered w-full"
                        value={selectedDistrictId}
                        onChange={(event) => setSelectedDistrictId(event.target.value)}
                    >
                        {authorizedDistricts.map((district) => (
                            <option key={district.id} value={district.id}>{district.name}</option>
                        ))}
                    </select>
                </label>
            )}

            {scope === "church" && (
                <label className="form-control w-full max-w-xl">
                    <span className="label-text font-semibold mb-1">Church</span>
                    <select
                        className="select select-bordered w-full"
                        value={selectedChurch?.Id ?? ""}
                        disabled={isLoadingChurches}
                        onChange={(event) => {
                            if (event.target.value === OTHER_CHURCH_VALUE) {
                                setShowOtherChurch(true);
                                return;
                            }

                            setSelectedChurch(directChurches.find((church) => church.Id === event.target.value) ?? selectedChurch);
                        }}
                    >
                        {!selectedChurch && <option value="">Select a church</option>}
                        {selectedChurch?.Id && !directChurches.some((church) => church.Id === selectedChurch.Id) && (
                            <option value={selectedChurch.Id}>{getChurchDisplayName(selectedChurch)}</option>
                        )}
                        {directChurches.map((church) => church.Id && (
                            <option key={church.Id} value={church.Id}>{getChurchDisplayName(church)}</option>
                        ))}
                        {hasDistrictScope && <option value={OTHER_CHURCH_VALUE}>Other...</option>}
                    </select>
                </label>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <label className="input input-bordered flex grow items-center gap-2 mt-0">
                    <FontAwesomeIcon icon="fas faSearch" classNames={["opacity-50"]} />
                    <input
                        type="search"
                        className="grow"
                        placeholder="Search people or churches"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                    />
                </label>
                <button
                    type="button"
                    className="btn btn-primary mt-0"
                    disabled={!activeParentId || isLoading || isLoadingEditor}
                    onClick={() => setShowPersonLookup(true)}
                >
                    <FontAwesomeIcon icon="fas faPlus" />
                    Add Person
                </button>
            </div>

            {error && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <span>{error}</span>
                </div>
            )}

            {(isLoading || isLoadingEditor) && (
                <div className="flex justify-center items-center py-6">
                    <span className="loading loading-spinner loading-lg"></span>&nbsp;
                    {isLoadingEditor ? "Loading person awards ..." : "Loading season awards ..."}
                </div>
            )}

            {!isLoading && !isLoadingEditor && activeParentId && filteredAwards.length === 0 && (
                <div role="alert" className="alert alert-info alert-outline">
                    <FontAwesomeIcon icon="far faLightbulb" />
                    <span>{awards.length === 0 ? "No season awards have been entered for this selection." : "No people match your search."}</span>
                </div>
            )}

            {!isLoading && !isLoadingEditor && filteredAwards.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Person</th>
                                <th>Church</th>
                                <th className="text-center">NMA</th>
                                <th className="text-center">Master</th>
                                <th className="text-center">Discipleship</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAwards.map((award) => (
                                <tr
                                    key={award.PersonId}
                                    className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setEditingAward(award)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            setEditingAward(award);
                                        }
                                    }}
                                >
                                    <td className="font-medium">{award.PersonName}</td>
                                    <td>
                                        {award.ChurchName}
                                        {award.ChurchLocation && <span className="block text-sm opacity-70">{award.ChurchLocation}</span>}
                                    </td>
                                    <td className="text-center">
                                        {Object.values(award.NationalMemorization).filter(Boolean).length}
                                    </td>
                                    <td className="text-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={award.MasterMemorization !== null}
                                            readOnly
                                            aria-label={`Master Memorization status for ${award.PersonName}`}
                                        />
                                    </td>
                                    <td className="text-center">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={award.Discipleship !== null}
                                            readOnly
                                            aria-label={`Discipleship status for ${award.PersonName}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showOtherChurch && (
                <OtherChurchDialog
                    districts={authorizedDistricts}
                    onSelect={(church) => {
                        setSelectedChurch(church);
                        setShowOtherChurch(false);
                    }}
                    onClose={() => setShowOtherChurch(false)}
                />
            )}

            {showPersonLookup && activeParentId && (
                <PersonLookupDialog
                    title="Add Person"
                    description="Select a person whose season awards you want to enter."
                    parentType={scope === "district" ? PersonParentType.District : PersonParentType.Church}
                    parentId={activeParentId}
                    excludeIds={new Set(awards.map((award) => award.PersonId))}
                    hideExcluded
                    onSelect={handlePersonSelected}
                />
            )}

            {editingAward && (
                <SeasonAwardEditorDialog
                    award={editingAward}
                    season={season}
                    witnessName={profile.displayName ?? ""}
                    onClose={() => setEditingAward(null)}
                    onSaved={() => {
                        setEditingAward(null);
                        setRefreshToken((value) => value + 1);
                    }}
                />
            )}
        </div>
    );
}