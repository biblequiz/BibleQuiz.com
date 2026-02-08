import { useRef, useState, useEffect } from "react";
import { Quizzer, Team } from "types/Meets";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    quizzer: Quizzer | null;
    teams: Team[];
    defaultTeamId?: number;
    isOpen: boolean;
    isReadOnly: boolean;
    onSave: (quizzer: Quizzer) => void;
    onCancel: () => void;
}

export default function QuizzerDialog({ quizzer, teams, defaultTeamId, isOpen, isReadOnly, onSave, onCancel }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [name, setName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [teamId, setTeamId] = useState<number | undefined>(undefined);
    const [isHidden, setIsHidden] = useState(false);

    // Load quizzer data when dialog opens
    useEffect(() => {
        if (isOpen && quizzer) {
            setName(quizzer.Name || "");
            setDateOfBirth(quizzer.DateOfBirth || "");
            setTeamId(quizzer.TeamId);
            setIsHidden(quizzer.IsHidden || false);
        } else if (isOpen && !quizzer) {
            // Reset for new quizzer
            setName("");
            setDateOfBirth("");
            setTeamId(defaultTeamId);
            setIsHidden(false);
        }
    }, [isOpen, quizzer, defaultTeamId]);

    useEffect(() => {
        if (isOpen) {
            dialogRef.current?.showModal();
        } else {
            dialogRef.current?.close();
        }
    }, [isOpen]);

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current?.reportValidity()) {
            return;
        }

        const updatedQuizzer: Quizzer = quizzer
            ? { ...quizzer }
            : new Quizzer();

        updatedQuizzer.Name = name.trim();
        updatedQuizzer.DateOfBirth = dateOfBirth || undefined;
        updatedQuizzer.TeamId = teamId;
        updatedQuizzer.IsHidden = isHidden;

        onSave(updatedQuizzer);
    };

    const handleClose = () => {
        onCancel();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <dialog ref={dialogRef} className="modal" onClose={handleClose}>
            <div className="modal-box w-full max-w-lg">
                <h3 className="font-bold text-lg">
                    {quizzer ? "Edit Quizzer" : "Add Quizzer"}
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleClose}
                >
                    ✕
                </button>

                <form ref={formRef} className="mt-4 space-y-4" onSubmit={handleSave}>
                    {/* Person Lookup Placeholder */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Person</span>
                        </label>
                        <div className="p-3 border border-dashed border-base-300 rounded-lg bg-base-200">
                            <div className="flex items-center gap-2 text-base-content/60">
                                <FontAwesomeIcon icon="fas faUser" />
                                <span className="text-sm italic">Person Lookup will be added here</span>
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Name *</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="Quizzer name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isReadOnly}
                            required
                        />
                    </div>

                    {/* Date of Birth */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Date of Birth</span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered w-full"
                            value={dateOfBirth}
                            disabled={isReadOnly}
                            onChange={e => setDateOfBirth(e.target.value)}
                        />
                    </div>

                    {/* Team */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Team</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={teamId ?? ""}
                            onChange={e => setTeamId(e.target.value ? Number(e.target.value) : undefined)}
                            disabled={isReadOnly}
                        >
                            <option value="">No team assigned</option>
                            {teams.map(team => (
                                <option key={team.Id} value={team.Id}>
                                    {team.Name} {team.Church ? `(${team.Church})` : ""}
                                </option>
                            ))}
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
                            className="btn btn-primary"
                            onClick={handleSave}
                        >
                            <FontAwesomeIcon icon="fas faSave" />
                            Save
                        </button>)}
                    <button
                        type="button"
                        className="btn btn-ghost"
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
    );
}