import { useRef, useState, useEffect } from "react";
import { Quizzer, Team } from "types/Meets";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PersonLookupDialog from "components/PersonLookupDialog";
import type { Church } from "types/services/ChurchesService";
import { PersonParentType } from "types/services/PeopleService";

interface Props {
    churches: Record<string, Church>;
    people: Record<string, string>;
    quizzer: Quizzer | null;
    teams: Team[];
    excludePeopleId: string[];
    defaultTeamId?: number;
    isReadOnly: boolean;
    onSave: (quizzer: Quizzer) => void;
    onCancel: () => void;
}

interface SelectedPerson {
    id: string;
    name: string;
}

export default function QuizzerDialog({
    churches,
    people,
    quizzer,
    teams,
    defaultTeamId,
    excludePeopleId,
    isReadOnly,
    onSave,
    onCancel }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

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

        const initialTeamId = (quizzer?.TeamId || defaultTeamId || teams[0]!.Id);
        const initialTeam = teams.find(t => t.Id === initialTeamId);
        setTeam(initialTeam?.RemoteChurchId && churches[initialTeam.RemoteChurchId] ? initialTeam : undefined);

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
        updatedQuizzer.RemoteChurchId = team?.RemoteChurchId;
        updatedQuizzer.ChurchName = team?.Church;
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
                        <div className="relative flex gap-2 mt-0">
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
                                    disabled={isSelectingPerson}
                                >
                                    <FontAwesomeIcon icon="fas faSearch" />
                                    Find
                                </button>)}
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
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <select
                                className="select select-bordered w-full mt-0"
                                value={team?.Id ?? ""}
                                onChange={e => {
                                    const newTeamId = e.target.value
                                        ? Number(e.target.value)
                                        : undefined;
                                    setTeam(teams.find(t => t.Id === newTeamId));
                                }}
                                required
                                disabled={isReadOnly}
                            >
                                {teams.map(team => {
                                    const teamChurch = team.RemoteChurchId
                                        ? churches[team.RemoteChurchId]
                                        : undefined;

                                    return (
                                        <option key={team.Id} value={team.Id} disabled={!teamChurch}>
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
            {isSelectingPerson && team && (
                <PersonLookupDialog
                    title="Find Person"
                    description={`Find a person from ${team.Church}.`}
                    parentType={PersonParentType.Church}
                    parentId={team.RemoteChurchId!}
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