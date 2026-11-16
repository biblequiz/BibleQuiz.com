import { useEffect, useState } from 'react';
import { AuthManager, type UserAccountProfile } from 'types/AuthManager';
import { PersonPermissionScope } from 'types/services/PermissionsService';
import type { Person } from 'types/services/PeopleService';
import { ChurchesService, ChurchResultFilter, type Church } from 'types/services/ChurchesService';
import type { DistrictInfo } from 'types/RegionAndDistricts';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ScopeSelector from './ScopeSelector';
import SearchAndFilterBar, { ALL_DISTRICTS, DEFAULT_DISTRICT_ID, DEFAULT_REGION_ID } from './SearchAndFilterBar';
import PermissionsTable from './PermissionsTable';
import ChurchesTable from './ChurchesTable';
import PeopleTable from './PeopleTable';
import MergePanel from './MergePanel';

interface Props {
}

/**
 * Districts whose people the user administers, at any competition type (the People API doesn't
 * restrict by competition type).
 */
function getPeopleDistricts(profile: UserAccountProfile | null): DistrictInfo[] {
    if (!profile) {
        return [];
    }

    if (profile.organizationPermission) {
        return ALL_DISTRICTS;
    }

    return ALL_DISTRICTS.filter(d =>
        (!!profile.regionPermissions && d.regionId in profile.regionPermissions) ||
        (!!profile.districtPermissions && d.id in profile.districtPermissions));
}

export default function PermissionsPage({ }: Props) {
    const authManager = AuthManager.useNanoStore();
    const auth = authManager;
    const userProfile = authManager.userProfile;

    const [currentScope, setCurrentScope] = useState<PersonPermissionScope | null>(PersonPermissionScope.Church);
    
    // Search and filter state
    const [searchText, setSearchText] = useState<string>('');
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>(DEFAULT_REGION_ID);
    const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(DEFAULT_DISTRICT_ID);
    const [checkboxStates, setCheckboxStates] = useState({
        allDistricts: false,
        unapprovedOnly: false,
        potentialDuplicates: false,
        usersOnly: false,
        manuallyAdded: false
    });
    const [mergeFirstPerson, setMergeFirstPerson] = useState<Person | null>(null);
    const [mergeSecondPerson, setMergeSecondPerson] = useState<Person | null>(null);
    const [mergeFirstChurch, setMergeFirstChurch] = useState<Church | null>(null);
    const [mergeSecondChurch, setMergeSecondChurch] = useState<Church | null>(null);
    const [peopleRefreshToken, setPeopleRefreshToken] = useState(0);
    const [churchesRefreshToken, setChurchesRefreshToken] = useState(0);
    const [selectedChurch, setSelectedChurch] = useState<string | undefined>(undefined);
    const [peopleChurches, setPeopleChurches] = useState<Church[] | null>(null);
    const [peopleChurchesError, setPeopleChurchesError] = useState<string | undefined>(undefined);

    // People are only visible within the districts the user administers. Users who only administer
    // churches have no districts, so they pick one of their churches instead.
    const peopleDistricts = getPeopleDistricts(userProfile);
    const churchPermissions = userProfile?.churchPermissions ?? null;
    const isChurchOnlyAdmin = peopleDistricts.length === 0 && (churchPermissions?.size ?? 0) > 0;

    // Only needed once the People tab is open; reloaded if the user's churches change.
    const needsPeopleChurches = isChurchOnlyAdmin && currentScope === null;
    useEffect(() => {
        if (!needsPeopleChurches) {
            return;
        }

        let isCurrent = true;
        ChurchesService.getChurches(
            auth,
            churchPermissions?.size ?? 0,
            0,
            null,
            null,
            null,
            ChurchResultFilter.IncludeDirectAuthorized)
            .then(page => {
                if (isCurrent) {
                    setPeopleChurches(page.Items || []);
                    setPeopleChurchesError(undefined);
                }
            })
            .catch(err => {
                if (isCurrent) {
                    setPeopleChurchesError((err as any).message || 'Failed to load churches');
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [needsPeopleChurches, auth, churchPermissions]);

    // ProtectedRoute handles auth, profile completion, and permission checks.
    if (!userProfile) {
        return null;
    }

    const canMergeAndImpersonate = userProfile.hasUnrestrictedOrganizationPermission();

    const peopleDistrictId = peopleDistricts.some(d => d.id === selectedDistrict)
        ? selectedDistrict
        : peopleDistricts[0]?.id;
    const peopleChurchId = peopleChurches?.some(c => c.Id === selectedChurch)
        ? selectedChurch
        : (peopleChurches?.[0]?.Id ?? undefined);

    type CheckboxKey = keyof typeof checkboxStates;

    const handleCheckboxChange = (key: CheckboxKey) => {
        setCheckboxStates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleMergePerson = (person: Person) => {
        if (mergeFirstPerson?.Id === person.Id) {
            setMergeFirstPerson(mergeSecondPerson);
            setMergeSecondPerson(null);
        } else if (mergeSecondPerson?.Id === person.Id) {
            setMergeSecondPerson(null);
        } else if (!mergeFirstPerson) {
            setMergeFirstPerson(person);
        } else if (!mergeSecondPerson) {
            setMergeSecondPerson(person);
        } else {
            setMergeSecondPerson(person);
        }
    };

    const handleMergeChurch = (church: Church) => {
        if (mergeFirstChurch?.Id === church.Id) {
            setMergeFirstChurch(mergeSecondChurch);
            setMergeSecondChurch(null);
        } else if (mergeSecondChurch?.Id === church.Id) {
            setMergeSecondChurch(null);
        } else if (!mergeFirstChurch) {
            setMergeFirstChurch(church);
        } else if (!mergeSecondChurch) {
            setMergeSecondChurch(church);
        } else {
            setMergeSecondChurch(church);
        }
    };

    const handleClearMerge = (type: 'people' | 'church', item: 'first' | 'second' | 'all') => {
        if (type === 'people') {
            if (item === 'all') {
                setMergeFirstPerson(null);
                setMergeSecondPerson(null);
            } else if (item === 'first') {
                setMergeFirstPerson(mergeSecondPerson);
                setMergeSecondPerson(null);
            } else if (item === 'second') {
                setMergeSecondPerson(null);
            }
        } else {
            if (item === 'all') {
                setMergeFirstChurch(null);
                setMergeSecondChurch(null);
            } else if (item === 'first') {
                setMergeFirstChurch(mergeSecondChurch);
                setMergeSecondChurch(null);
            } else if (item === 'second') {
                setMergeSecondChurch(null);
            }
        }
    };

    const currentMergePersonIds = [mergeFirstPerson?.Id, mergeSecondPerson?.Id].filter(
        (id): id is string => !!id
    );
    const currentMergeChurchIds = [mergeFirstChurch?.Id, mergeSecondChurch?.Id].filter(
        (id): id is string => !!id
    );

    return (
        <div className="space-y-6">
            {/* Scope Selector */}
            <ScopeSelector
                currentScope={currentScope}
                onScopeChange={setCurrentScope}
                userProfile={userProfile}
            />

            {/* Search and Filter Bar */}
            <SearchAndFilterBar
                searchText={searchText}
                onSearchChange={setSearchText}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedDistrict={currentScope === null ? peopleDistrictId : selectedDistrict}
                onDistrictChange={setSelectedDistrict}
                checkboxStates={checkboxStates}
                onCheckboxChange={handleCheckboxChange}
                currentScope={currentScope}
                peopleDistricts={peopleDistricts}
                peopleChurches={isChurchOnlyAdmin ? (peopleChurches ?? []) : null}
                selectedChurch={peopleChurchId}
                onChurchChange={setSelectedChurch}
            />

            {/* Content based on scope */}
            <div className="space-y-4">
                {currentScope === PersonPermissionScope.Organization && (
                    <PermissionsTable
                        scope={PersonPermissionScope.Organization}
                        regionId={selectedRegion}
                        districtId={selectedDistrict}
                        searchText={searchText}
                        auth={auth}
                    />
                )}
                {currentScope === PersonPermissionScope.Region && (
                    <PermissionsTable
                        scope={PersonPermissionScope.Region}
                        regionId={selectedRegion}
                        districtId={selectedDistrict}
                        searchText={searchText}
                        auth={auth}
                    />
                )}
                {currentScope === PersonPermissionScope.District && (
                    <PermissionsTable
                        scope={PersonPermissionScope.District}
                        regionId={selectedRegion}
                        districtId={selectedDistrict}
                        searchText={searchText}
                        auth={auth}
                    />
                )}
                {currentScope === PersonPermissionScope.Church && (
                    <>
                        {canMergeAndImpersonate && (
                            <MergePanel
                                canShow={true}
                                mergeType="church"
                                firstItem={mergeFirstChurch}
                                secondItem={mergeSecondChurch}
                                onClear={(item) => handleClearMerge('church', item)}
                                auth={auth}
                                onMergeComplete={() => setChurchesRefreshToken(prev => prev + 1)}
                            />
                        )}
                        <ChurchesTable
                            searchText={searchText}
                            districtId={selectedDistrict}
                            allDistricts={checkboxStates.allDistricts}
                            potentialDuplicates={checkboxStates.potentialDuplicates}
                            manuallyAdded={checkboxStates.manuallyAdded}
                            auth={auth}
                            canMergeAndImpersonate={canMergeAndImpersonate}
                            onMergeSelect={handleMergeChurch}
                            currentMergeChurchIds={currentMergeChurchIds}
                            refreshToken={churchesRefreshToken}
                        />
                    </>
                )}
                {currentScope === null && (
                    <>
                        <MergePanel
                            canShow={canMergeAndImpersonate}
                            mergeType="people"
                            firstItem={mergeFirstPerson}
                            secondItem={mergeSecondPerson}
                            onClear={(item) => handleClearMerge('people', item)}
                            auth={auth}
                            onMergeComplete={() => setPeopleRefreshToken(prev => prev + 1)}
                        />
                        {peopleChurchesError && (
                            <div role="alert" className="alert alert-error">
                                <FontAwesomeIcon icon="fas faCircleExclamation" />
                                <span>{peopleChurchesError}</span>
                            </div>
                        )}
                        {isChurchOnlyAdmin && !peopleChurchesError && !peopleChurchId && (
                            peopleChurches === null
                                ? <div className="text-center py-8"><span className="loading loading-spinner loading-lg"></span></div>
                                : <div className="text-center text-base-content/60">No churches found</div>
                        )}
                        {(!isChurchOnlyAdmin || peopleChurchId) && (
                            <PeopleTable
                                // Remount when the filters change so paging starts over at the first page.
                                key={[searchText, peopleDistrictId, peopleChurchId, checkboxStates.allDistricts, checkboxStates.unapprovedOnly, checkboxStates.potentialDuplicates, checkboxStates.usersOnly].join('|')}
                                searchText={searchText}
                                districtId={peopleDistrictId}
                                churchId={isChurchOnlyAdmin ? peopleChurchId : undefined}
                                allDistricts={checkboxStates.allDistricts}
                                unapprovedOnly={checkboxStates.unapprovedOnly}
                                potentialDuplicates={checkboxStates.potentialDuplicates}
                                usersOnly={checkboxStates.usersOnly}
                                auth={auth}
                                canMergeAndImpersonate={canMergeAndImpersonate}
                                onMergeSelect={handleMergePerson}
                                currentMergePersonIds={currentMergePersonIds}
                                refreshToken={peopleRefreshToken}
                            />)}
                    </>
                )}
            </div>
        </div>
    );
}
