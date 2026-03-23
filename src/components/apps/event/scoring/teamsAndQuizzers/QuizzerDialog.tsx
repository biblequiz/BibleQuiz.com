import { useRef, useState, useEffect } from "react";
import { Quizzer, Team } from "types/Meets";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PersonLookupDialog from "components/PersonLookupDialog";
import type { Church } from "types/services/ChurchesService";
import { PersonParentType } from "types/services/PeopleService";
import ChurchLookup, { ChurchSearchTips, type SelectedChurch } from "components/ChurchLookup";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    regionId?: string;
    districtId?: string;
    churches: Record<string, Church>;
    people: Record<string, string>;
    quizzer: Quizzer | null;
    teams: Team[];
    excludePeopleId: string[];
    defaultTeamId?: number;
    isReadOnly: boolean;
    onDiscoveredChurch: (church: Church) => void;
    onSave: (quizzer: Quizzer) => void;
    onCancel: () => void;
}

interface SelectedPerson {
    id: string;
    name: string;
}

export default function QuizzerDialog({
    regionId,
    districtId,
    churches,
    people,
    quizzer,
    teams,
    defaultTeamId,
    excludePeopleId,
    isReadOnly,
    onDiscoveredChurch,
    onSave,
    onCancel }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [church, setChurch] = useState<SelectedChurch | undefined>();
    const [person, setPerson] = useState<SelectedPerson | undefined>();
    const [isSelectingPerson, setIsSelectingPerson] = useState(false);
    const [isDefaultPersonName, setIsDefaultPersonName] = useState(true);

    const [name, setName] = useState<string | undefined>();
    const [yearsOfQuizzing, setYearsOfQuizzing] = useState<number | undefined>();
    const [team, setTeam] = useState<Team | undefined>();
    const [isHidden, setIsHidden] = useState(false);

    // Load quizzer data when dialog opens
    useEffect(() => {
        const newPersonName = quizzer?.RemotePersonId ? people[quizzer.RemotePersonId] : undefined;

        setPerson(newPersonName
            ? { id: quizzer?.RemotePersonId, name: newPersonName } as SelectedPerson
            : undefined);
        setIsSelectingPerson(false);

        // Handle case where quizzer has no team (TeamId is undefined/null)
        const initialTeamId = quizzer?.TeamId ?? defaultTeamId;
        const initialTeam = initialTeamId !== undefined ? teams.find(t => t.Id === initialTeamId) : undefined;
        setTeam(initialTeam);

        if (quizzer?.RemoteChurchId) {
            const initialChurch = churches[quizzer.RemoteChurchId];
            setChurch(initialChurch ? { id: initialChurch.Id!, displayName: initialChurch.Name! } : undefined);
        }
        else {
            setChurch(undefined);
        }

        setName(quizzer?.Name);
        setIsDefaultPersonName(!quizzer || newPersonName === quizzer.Name);
        setYearsOfQuizzing(quizzer?.YearsQuizzing);
        setIsHidden(quizzer?.IsHidden || false);
    }, [quizzer, defaultTeamId]);

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current?.reportValidity()) {
            return;
        }

        const updatedQuizzer: Quizzer = quizzer
            ? { ...quizzer }
            : new Quizzer();

        updatedQuizzer.Name = name!.trim();
        updatedQuizzer.YearsQuizzing = yearsOfQuizzing;
        updatedQuizzer.TeamId = team?.Id;
        updatedQuizzer.RemotePersonId = person?.id;
        updatedQuizzer.RemoteChurchId = church?.id || team?.RemoteChurchId;
        updatedQuizzer.ChurchName = church?.displayName || team?.Church;
        updatedQuizzer.IsHidden = isHidden;

        onSave(updatedQuizzer);
        dialogRef.current?.close();
    };

    const handleClose = () => {
        onCancel();
        dialogRef.current?.close();
    };

    return (
        <>
            <dialog ref={dialogRef} className="modal" onClose={handleClose} open>
                <div className="modal-box w-full max-w-lg">
                    <h3 className="font-bold text-lg">
                        {quizzer ? "Edit Quizzer" : "Add Quizzer"}
                    </h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-0"
                        onClick={handleClose}
                    >
                        ✕
                    </button>

                    <form ref={formRef} className="mt-4 space-y-4" onSubmit={handleSave}>
                        {!isReadOnly && (
                            <>
                                <div className="w-full">
                                    <label className="label">
                                        <span className="label-text font-semibold">Church</span>
                                        <span className="label-text-alt text-error">*</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full mt-0"
                                        value={church?.id ?? ""}
                                        onChange={e => {
                                            const targetValue = e.target.value;
                                            const newValue = DataTypeHelpers.isNullOrEmpty(targetValue)
                                                ? undefined
                                                : targetValue;

                                            setChurch(newValue ? { id: newValue, displayName: churches[newValue]!.Name } : undefined);
                                        }}
                                        disabled={isReadOnly}
                                        required
                                    >
                                        {Object.entries(churches).map(([, c]) => (
                                            <option key={`church_${c.Id}`} value={c.Id!}>
                                                {c.Name}
                                            </option>
                                        ))}
                                        <option value="">Other</option>
                                    </select>
                                </div>

                                {!church && (
                                    <ChurchLookup
                                        regionId={regionId ?? undefined}
                                        districtId={districtId ?? undefined}
                                        showTips={ChurchSearchTips.None}
                                        subtitle="Selecting a church helps deduplicate when generating reports."
                                        required={true}
                                        disabled={isReadOnly}
                                        onSelect={(c, info) => {
                                            setChurch(c);
                                            onDiscoveredChurch(info);
                                        }}
                                    />)}
                            </>)}
                        <div className={`relative flex gap-2 ${!isReadOnly ? "mt-4" : "mt-0"} mb-0`}>
                            <input
                                type="text"
                                className="input input-bordered grow"
                                placeholder="Person"
                                value={person?.name ?? ""}
                                title="Select a Person"
                                required
                                readOnly
                            />
                            {!isReadOnly && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => setIsSelectingPerson(true)}
                                    disabled={isSelectingPerson || (!team && !church)}
                                    title={!team ? "Find a person from the selected church" : "Find a person from the team's church"}
                                >
                                    <FontAwesomeIcon icon="fas faSearch" />
                                    Find
                                </button>)}
                        </div>
                        <div className="mt-0 text-xs text-gray-500 italic">
                            {!team
                                ? "Select a church to enable person lookup."
                                : "Selecting a person helps deduplicate when generating reports."}
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Display Name</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Display Name"
                                value={name ?? ""}
                                onChange={e => {
                                    const newName = e.target.value;
                                    setIsDefaultPersonName(person ? newName === person.name : false);
                                    setName(newName);
                                }}
                                maxLength={100}
                                disabled={isReadOnly}
                                required
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Years of Quizzing</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered w-full"
                                value={yearsOfQuizzing ?? ""}
                                onChange={e => {
                                    const newValue = parseInt(e.target.value);
                                    if (isNaN(newValue) || newValue < 0) {
                                        setYearsOfQuizzing(undefined);
                                    } else {
                                        setYearsOfQuizzing(newValue);
                                    }
                                }}
                                min={0}
                                max={30}
                                step={1}
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Team</span>
                            </label>
                            <select
                                className="select select-bordered w-full mt-0"
                                value={team?.Id ?? ""}
                                onChange={e => {
                                    const newTeamId = e.target.value
                                        ? Number(e.target.value)
                                        : undefined;
                                    setTeam(newTeamId !== undefined ? teams.find(t => t.Id === newTeamId) : undefined);

                                    if (newTeamId && !church) {
                                        const teamChurchId = teams.find(t => t.Id === newTeamId)?.RemoteChurchId;
                                        if (teamChurchId) {
                                            const teamChurch = churches[teamChurchId];
                                            if (teamChurch) {
                                                setChurch({ id: teamChurch.Id!, displayName: teamChurch.Name! });
                                            }
                                        }
                                    }
                                }}
                                disabled={isReadOnly}
                            >
                                <option value="">-- No Team --</option>
                                {teams.map(team => {
                                    const teamChurch = team.RemoteChurchId
                                        ? churches[team.RemoteChurchId]
                                        : undefined;

                                    return (
                                        <option key={team.Id} value={team.Id}>
                                            {team.Name} {teamChurch ? `(${teamChurch.Name})` : " (Missing or Invalid Church)"}
                                        </option>);
                                })}
                            </select>
                        </div>

                        {/* Hidden */}
                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={isHidden}
                                    onChange={e => setIsHidden(e.target.checked)}
                                    disabled={isReadOnly}
                                />
                                <span className="label-text">Hidden</span>
                            </label>
                        </div>
                    </form>

                    <div className="modal-action">
                        {!isReadOnly && (
                            <button
                                type="button"
                                className="btn btn-primary mt-0"
                                onClick={handleSave}
                            >
                                <FontAwesomeIcon icon="fas faSave" />
                                Save
                            </button>)}
                        <button
                            type="button"
                            className="btn btn-secondary mt-0"
                            onClick={handleClose}
                        >
                            {isReadOnly ? "Close" : "Cancel"}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleClose}>close</button>
                </form>
            </dialog>
            {isSelectingPerson && (
                <PersonLookupDialog
                    title="Find Person"
                    description={`Find a person from ${church?.displayName || team?.Church}.`}
                    parentType={PersonParentType.Church}
                    parentId={church?.id || team?.RemoteChurchId!}
                    excludeIds={new Set<string>(excludePeopleId.filter(id => id !== person?.id))}
                    onSelect={person => {
                        if (person) {
                            const name = `${person.FirstName} ${person.LastName}`;
                            setPerson({ id: person.Id!, name });
                            people[person.Id!] = name;

                            if (isDefaultPersonName) {
                                setName(name);
                            }
                        }

                        setIsSelectingPerson(false);
                    }}
                />)}
        </>);
}