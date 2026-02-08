import { useRef, useState, useEffect } from "react";
import { Team } from "types/Meets";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    team: Team | null;
    isOpen: boolean;
    isReadOnly: boolean;
    onSave: (team: Team) => void;
    onCancel: () => void;
}

export default function TeamDialog({ team, isOpen, isReadOnly, onSave, onCancel }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [name, setName] = useState("");
    const [league, setLeague] = useState("");
    const [church, setChurch] = useState("");
    const [isHidden, setIsHidden] = useState(false);

    // Load team data when dialog opens
    useEffect(() => {
        if (isOpen && team) {
            setName(team.Name || "");
            setLeague(team.League || "");
            setChurch(team.Church || "");
            setIsHidden(team.IsHidden || false);
        } else if (isOpen && !team) {
            // Reset for new team
            setName("");
            setLeague("");
            setChurch("");
            setIsHidden(false);
        }
    }, [isOpen, team]);

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

        const updatedTeam: Team = team
            ? { ...team }
            : new Team();

        updatedTeam.Name = name.trim();
        updatedTeam.League = league.trim() ? league.trim().substring(0, 1).toUpperCase() : undefined;
        updatedTeam.Church = church.trim() || undefined;
        updatedTeam.IsHidden = isHidden;

        onSave(updatedTeam);
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
                    {team ? "Edit Team" : "Add Team"}
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={handleClose}
                >
                    ✕
                </button>

                <form ref={formRef} className="mt-4 space-y-4" onSubmit={handleSave}>
                    {/* Name */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Name *</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="Team name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            disabled={isReadOnly}
                        />
                    </div>

                    {/* League */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">League</span>
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            placeholder="e.g., A, B, C"
                            value={league}
                            onChange={e => setLeague(e.target.value)}
                            maxLength={1}
                            disabled={isReadOnly}
                        />
                        <label className="label">
                            <span className="label-text-alt">Single letter (A, B, C, etc.)</span>
                        </label>
                    </div>

                    {/* Church Lookup Placeholder */}
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-semibold">Church</span>
                        </label>
                        <div className="p-3 border border-dashed border-base-300 rounded-lg bg-base-200">
                            <div className="flex items-center gap-2 text-base-content/60">
                                <FontAwesomeIcon icon="fas faChurch" />
                                <span className="text-sm italic">Church Lookup will be added here</span>
                            </div>
                        </div>
                        <input
                            type="text"
                            className="input input-bordered w-full mt-2"
                            placeholder="Church name (temporary field)"
                            value={church}
                            onChange={e => setChurch(e.target.value)}
                            disabled={isReadOnly}
                        />
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