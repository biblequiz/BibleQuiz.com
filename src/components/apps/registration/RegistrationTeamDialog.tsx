import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PersonCardDeck from "./PersonCardDeck";
import RegistrationPersonDialog from "./RegistrationPersonDialog";
import RegistrationFieldsGrid from "./RegistrationFieldsGrid";
import { useEscapeToClose } from "hooks/useEscapeToClose";
import { PersonRole } from "types/services/PeopleService";
import {
    EventFieldScopes,
    type EventInfo,
} from "types/services/EventsService";
import {
    IdRolePair,
    RegistrationPerson,
    RegistrationService,
    RegistrationTeam,
    type RegistrationTeamResult,
} from "types/services/RegistrationService";
import type { Church } from "types/services/ChurchesService";
import { AuthManager } from "types/AuthManager";

interface Props {
    event: EventInfo;
    church: Church;
    eventId: string;
    team: RegistrationTeam | null;
    /** The church's other teams, so a person can't be put in the same role on two teams. */
    otherTeams: RegistrationTeam[];
    onClose: (result: RegistrationTeamResult | null) => void;
}

export default function RegistrationTeamDialog({
    event,
    church,
    eventId,
    team,
    otherTeams,
    onClose,
}: Props) {
    const auth = AuthManager.useNanoStore();
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [teamName, setTeamName] = useState(team?.Name ?? "");
    // Only keep a division that still exists; otherwise the select shows the placeholder so the user must pick one.
    const [divisionId, setDivisionId] = useState(() =>
        team?.DivisionId && event.Divisions?.some(d => d.Id === team.DivisionId) ? team.DivisionId : "");
    const [people, setPeople] = useState<RegistrationPerson[]>(team?.People ?? []);
    const [fields, setFields] = useState<Record<string, string | null>>(team?.Fields ?? {});
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingPerson, setEditingPerson] = useState<{ person: RegistrationPerson | null; role: PersonRole } | null>(null);

    // Coaches and quizzers share the team's People list; the role tells them apart.
    const quizzers = people.filter(p => p.Role !== PersonRole.Coach);
    const coaches = people.filter(p => p.Role === PersonRole.Coach);

    const keyOf = (p: RegistrationPerson) => IdRolePair.generateKey(p.PersonId, p.Role);
    const isSamePerson = (a: RegistrationPerson, b: RegistrationPerson) => keyOf(a) === keyOf(b);

    // Keys the person dialog treats as duplicates for the role being added. The server rejects
    // a person who is on this team twice (in any role) or in the same role on another team.
    const getTakenKeys = (role: PersonRole): Set<string> => new Set([
        ...people.map(p => IdRolePair.generateKey(p.PersonId, role)),
        ...otherTeams.flatMap(t => t.People ?? []).filter(p => p.Role === role).map(keyOf),
    ]);

    useEscapeToClose(() => onClose(null), isSaving || isDeleting || editingPerson !== null);

    // Show dialog on mount.
    const showDialog = (el: HTMLDialogElement | null) => {
        if (el && !el.open) {
            el.showModal();
        }
    };

    const handleSave = async () => {
        if (!teamName.trim()) {
            setError("Team name is required.");
            return;
        }

        if (event.Divisions?.length > 0 && !divisionId) {
            setError("Division is required.");
            return;
        }

        if (event.RequireTeamCoaches && coaches.length === 0) {
            setError("Each team must have at least one coach.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const teamToSave: RegistrationTeam = Object.assign(new RegistrationTeam(), {
                ...(team ?? {}),
                Name: teamName.trim(),
                DivisionId: divisionId || null,
                People: people,
                Fields: fields,
                ChurchId: church.Id,
                Version: team ? team?.Version : null,
            });

            if (team?.Id) {
                teamToSave.Id = team.Id;
            }

            const result = await RegistrationService.createOrUpdateTeam(
                auth,
                eventId,
                church.Id!,
                teamToSave.Version ?? 0,
                teamToSave
            );

            onClose(result);
        } catch (err: any) {
            setError(err?.message || "An error occurred while saving the team.");
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!team?.Id) return;

        setIsDeleting(true);
        setError(null);

        try {
            const result = await RegistrationService.deleteTeam(
                auth,
                eventId,
                church.Id!,
                team.Version ?? 0,
                team.Id!
            );
            onClose(result);
        } catch (err: any) {
            setError(err?.message || "An error occurred while deleting the team.");
            setIsDeleting(false);
        }
    };

    const handlePersonDialogClose = (result: RegistrationPerson | "delete" | null) => {
        const edited = editingPerson?.person ?? null;
        setEditingPerson(null);

        if (result === "delete" && edited) {
            setPeople(prev => prev.filter(p => !isSamePerson(p, edited)));
            return;
        }

        if (!result || result === "delete") return;

        setPeople(prev => {
            // Replace the person being edited, even if a different person was picked for them.
            const existing = prev.findIndex(p => isSamePerson(p, edited ?? result));
            if (existing >= 0) {
                const copy = [...prev];
                copy[existing] = result;
                return copy;
            }
            return [...prev, result];
        });
    };

    return (
        <dialog
            ref={(el) => { dialogRef.current = el; showDialog(el); }}
            className="modal"
            onClose={() => onClose(null)}
        >
            <div className="modal-box max-w-5xl w-11/12 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg m-0">
                        <FontAwesomeIcon icon="fas faPeopleGroup" classNames={["mr-2"]} />
                        {team ? "Edit Team" : "Add Team"}
                    </h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost m-0"
                        onClick={() => onClose(null)}
                    >
                        <FontAwesomeIcon icon="fas faXmark" />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div role="alert" className="alert alert-error mb-2">
                        <FontAwesomeIcon icon="fas faCircleExclamation" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Team Name + Division */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-control mt-0">
                            <label className="label">
                                <span className="label-text font-semibold">Team Name</span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                placeholder="e.g. Team Alpha"
                                value={teamName}
                                onChange={e => setTeamName(e.target.value)}
                                disabled={isSaving || isDeleting}
                            />
                        </div>

                        {event.Divisions?.length > 0 && (
                            <div className="form-control mt-0">
                                <label className="label">
                                    <span className="label-text font-semibold">Division</span>
                                </label>
                                <select
                                    className="select select-bordered w-full mt-0"
                                    value={divisionId}
                                    onChange={e => setDivisionId(e.target.value)}
                                    disabled={isSaving || isDeleting}
                                    required
                                >
                                    <option value="" disabled>Select a division…</option>
                                    {event.Divisions.map(d => (
                                        <option key={d.Id} value={d.Id!}>{d.Label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Custom Fields */}
                    {event.Fields?.some(f => (f.Scopes & EventFieldScopes.Team) !== 0) && (
                        <RegistrationFieldsGrid
                            fields={event.Fields}
                            scope={EventFieldScopes.Team}
                            values={fields}
                            onChange={setFields}
                            disabled={isSaving || isDeleting}
                        />
                    )}

                    {/* People (Quizzers) */}
                    <div>
                        <PersonCardDeck
                            title="Quizzers"
                            icon="fas faPerson"
                            event={event}
                            scope={EventFieldScopes.Quizzer}
                            addLabel="Add Quizzer"
                            people={quizzers}
                            isEditable={!isSaving && !isDeleting}
                            onEdit={person => setEditingPerson({ person, role: PersonRole.Quizzer })}
                            onAdd={() => setEditingPerson({ person: null, role: PersonRole.Quizzer })}
                            emptyMessage="No quizzers added yet."
                        />
                        {event.MaxTeamMembers > 0 && (
                            <p className="text-xs text-base-content/60 mt-1">
                                {quizzers.length} / {event.MaxTeamMembers} quizzers
                            </p>
                        )}
                    </div>

                    {/* Coaches */}
                    <div>
                        <PersonCardDeck
                            title="Coaches"
                            icon="fas faChalkboardUser"
                            event={event}
                            scope={EventFieldScopes.Coach}
                            addLabel="Add Coach"
                            people={coaches}
                            isEditable={!isSaving && !isDeleting}
                            onEdit={person => setEditingPerson({ person, role: PersonRole.Coach })}
                            onAdd={() => setEditingPerson({ person: null, role: PersonRole.Coach })}
                            emptyMessage={event.RequireTeamCoaches ? "Each team must have at least one coach." : "No coaches added yet."}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-action mt-4 flex justify-between">
                    <div>
                        {team?.Id && (
                            <button
                                type="button"
                                className="btn btn-error btn-sm m-0"
                                disabled={isSaving || isDeleting}
                                onClick={handleDelete}
                            >
                                {isDeleting
                                    ? (<><span className="loading loading-spinner loading-xs"></span> Deleting...</>)
                                    : (<><FontAwesomeIcon icon="fas faTrash" classNames={["mr-1"]} /> Delete Team</>)}
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="btn btn-primary btn-sm m-0"
                            disabled={isSaving || isDeleting}
                            onClick={handleSave}
                        >
                            {isSaving
                                ? (<><span className="loading loading-spinner loading-xs"></span> Saving...</>)
                                : (<><FontAwesomeIcon icon="fas faFloppyDisk" classNames={["mr-1"]} /> Save</>)}
                        </button>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm m-0"
                            disabled={isSaving || isDeleting}
                            onClick={() => onClose(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Click-outside to close */}
            <form method="dialog" className="modal-backdrop">
                <button type="button" onClick={() => onClose(null)}>close</button>
            </form>

            {/* Nested Person Dialog */}
            {editingPerson !== null && (
                <RegistrationPersonDialog
                    title={`${editingPerson.person ? "Edit" : "Add"} ${editingPerson.role === PersonRole.Coach ? "Coach" : "Quizzer"}`}
                    event={event}
                    church={church}
                    existingPerson={editingPerson.person}
                    role={editingPerson.role}
                    existingPeopleIds={getTakenKeys(editingPerson.role)}
                    onClose={handlePersonDialogClose}
                />
            )}
        </dialog>
    );
}
