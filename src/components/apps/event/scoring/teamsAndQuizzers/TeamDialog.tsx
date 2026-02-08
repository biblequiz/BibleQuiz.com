import { useRef, useState, useEffect } from "react";
import { Team } from "types/Meets";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ChurchLookup, { ChurchSearchTips, type SelectedChurch } from "components/ChurchLookup";
import type { AddingChurchState } from "components/ChurchSettingsDialog";
import ChurchSettingsDialog from "components/ChurchSettingsDialog";
import type { Church } from "types/services/ChurchesService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    regionId: string | null;
    districtId: string | null;
    churches: Record<string, Church>;
    team: Team | null;
    isReadOnly: boolean;
    onSave: (team: Team) => void;
    onCancel: () => void;
    onDiscoveredChurch: (church: Church) => void;
}

export default function TeamDialog({
    regionId,
    districtId,
    churches,
    team,
    isReadOnly,
    onSave,
    onCancel,
    onDiscoveredChurch }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [name, setName] = useState<string | undefined>(undefined);
    const [league, setLeague] = useState<string | undefined>(undefined);
    const [selectedChurchId, setSelectedChurchId] = useState<string | undefined>(undefined);
    const [church, setChurch] = useState<Church | undefined>(undefined);
    const [addingChurchState, setAddingChurchState] = useState<AddingChurchState | null>(null);
    const [isHidden, setIsHidden] = useState<boolean>(false);

    const knownChurches = Object.values(churches)
        .sort((a, b) => a.Name.localeCompare(b.Name));

    useEffect(() => {

        const newChurchId = team?.RemoteChurchId || (knownChurches.length > 0 ? knownChurches[0].Id! : undefined);

        setName(team?.Name);
        setLeague(team?.League);
        setSelectedChurchId(newChurchId);
        setChurch(newChurchId
            ? churches[newChurchId] || undefined
            : undefined);
        setIsHidden(team?.IsHidden || false);
        setAddingChurchState(null);
    }, [team]);

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current?.reportValidity()) {
            return;
        }

        const updatedTeam: Team = team
            ? { ...team }
            : new Team();
        updatedTeam.Name = name!.trim();
        updatedTeam.League = league!.trim().toUpperCase();
        updatedTeam.RemoteChurchId = church!.Id!;
        updatedTeam.Church = church!.Name!;
        updatedTeam.City = church!.PhysicalAddress?.City || undefined;
        updatedTeam.State = church!.PhysicalAddress?.State || undefined;
        updatedTeam.IsHidden = isHidden;

        onSave(updatedTeam);
    };

    const handleClose = () => {
        onCancel();
    };

    return (
        <>
            <dialog ref={dialogRef} className="modal" onClose={handleClose} open>
                <div className="modal-box w-full max-w-2xl">
                    <h3 className="font-bold text-lg">
                        {team ? "Edit Team" : "Add Team"}
                    </h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-0"
                        onClick={handleClose}
                    >
                        ✕
                    </button>

                    <form ref={formRef} className="mt-4 space-y-4" onSubmit={handleSave}>

                        <div className="form-control w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Team Name</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="Team Name"
                                value={name}
                                maxLength={80}
                                onChange={e => setName(e.target.value)}
                                required
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="form-control w-full mt-0">
                            <label className="label">
                                <span className="label-text font-semibold">Division Abbreviation</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="e.g., A, B, C"
                                value={league}
                                onChange={e => setLeague(e.target.value)}
                                maxLength={1}
                                pattern="[A-Z]"
                                title="Single uppercase alphabetic character"
                                required
                                disabled={isReadOnly}
                            />
                        </div>

                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text font-semibold">Church</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <select
                                className="select select-bordered w-full mt-0"
                                value={selectedChurchId}
                                onChange={e => {
                                    const targetValue = e.target.value;
                                    const newValue = DataTypeHelpers.isNullOrEmpty(targetValue)
                                        ? undefined
                                        : targetValue;

                                    setSelectedChurchId(newValue);
                                    setChurch(newValue ? churches[newValue] : undefined);
                                }}
                                required
                            >
                                {knownChurches.map(church => (
                                    <option key={`church_${church.Id}`} value={church.Id!}>
                                        {church.Name}
                                    </option>
                                ))}
                                <option value="">Other</option>
                            </select>
                        </div>

                        {!selectedChurchId && (
                            <ChurchLookup
                                regionId={regionId ?? undefined}
                                districtId={districtId ?? undefined}
                                showTips={ChurchSearchTips.None}
                                required={true}
                                disabled={isReadOnly}
                                allowAdd={{ authorizeChurch: false, onAdding: setAddingChurchState }}
                                onSelect={(_church, info) => {
                                    setChurch(info);
                                    onDiscoveredChurch(info);
                                }}
                            />)}

                        <div className="form-control mt-2">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={isHidden}
                                    onChange={e => setIsHidden(e.target.checked)}
                                    disabled={isReadOnly}
                                />
                                <span className="label-text text-sm">
                                    Hide Team from scheduling in divisions.
                                </span>
                            </label>
                        </div>
                    </form>

                    <div className="modal-action mt-0">
                        {!isReadOnly && (
                            <button
                                type="button"
                                className="btn btn-sm btn-primary mt-0"
                                onClick={handleSave}
                            >
                                <FontAwesomeIcon icon="fas faSave" />
                                Save
                            </button>)}
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary mt-0"
                            onClick={handleClose}
                        >
                            {isReadOnly ? "Close" : "Cancel"}
                        </button>
                    </div>
                </div >
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleClose}>Close</button>
                </form>
            </dialog >
            {addingChurchState && (
                <ChurchSettingsDialog
                    title="Add Church"
                    regionId={regionId ?? undefined}
                    districtId={districtId ?? undefined}
                    addState={addingChurchState}
                    onSave={() => setAddingChurchState(null)}
                />)
            }
        </>
    );
}