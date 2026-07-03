import { useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import PersonLookupDialog from "components/PersonLookupDialog";
import { Person, PersonParentType, PersonRole } from "types/services/PeopleService";
import {
    EventFieldScopes,
    type EventInfo,
} from "types/services/EventsService";
import {
    IdRolePair,
    OfficialRole,
    RegistrationOfficial,
    RegistrationPerson,
} from "types/services/RegistrationService";
import type { Church } from "types/services/ChurchesService";
import RegistrationFieldsGrid from "./RegistrationFieldsGrid";
import { useModalDialog } from "hooks/useModalDialog";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    /** Title for the dialog (e.g. "Add Quizzer"). */
    title: string;

    /** Event the person is being registered for. */
    event: EventInfo;

    /** Church the person belongs to (their parent for lookups). */
    church: Church;

    /**
     * Existing registration person being edited. If null, the dialog is
     * in "add new" mode.
     */
    existingPerson: RegistrationPerson | null;

    /** Role being added/edited. */
    role: PersonRole;

    /**
     * Set of person/role keys that are already used in this registration
     * (so duplicates can be flagged).
     */
    existingPeopleIds: Set<string>;

    /** Whether the dialog should disable all editing controls. */
    readOnly?: boolean;

    /**
     * Handler invoked when the dialog is closed.
     *
     * @param result The saved person if the user saved, "delete" if the
     *   user removed the person, or null if the dialog was cancelled.
     */
    onClose: (result: RegistrationPerson | "delete" | null) => void;
}

/** Returns the EventFieldScope to use for the supplied role. */
function getScopeForRole(role: PersonRole): EventFieldScopes {
    switch (role) {
        case PersonRole.Quizzer:
            return EventFieldScopes.Quizzer;
        case PersonRole.QuizzerWithoutTeam:
            return EventFieldScopes.QuizzerWithoutTeam;
        case PersonRole.Coach:
            return EventFieldScopes.Coach;
        case PersonRole.Official:
            return EventFieldScopes.Official;
        case PersonRole.Attendee:
            return EventFieldScopes.Attendee;
        default:
            return EventFieldScopes.None;
    }
}

/**
 * Dialog for adding or editing a single person (quizzer, coach, individual,
 * official, or attendee) within a registration.
 */
export default function RegistrationPersonDialog({
    title,
    event,
    church,
    existingPerson,
    role,
    existingPeopleIds,
    readOnly = false,
    onClose,
}: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    const [linkedPerson, setLinkedPerson] = useState<Person | null>(
        existingPerson?.Person ?? null);
    const [personId, setPersonId] = useState<string | null>(
        existingPerson?.PersonId ?? null);
    const [fieldValues, setFieldValues] = useState<Record<string, string | null>>(
        existingPerson?.Fields ? { ...existingPerson.Fields } : {});

    // Official-specific state.
    const [rolePreferences, setRolePreferences] = useState<OfficialRole[]>(() => {
        if (role === PersonRole.Official && existingPerson) {
            return (existingPerson as RegistrationOfficial).RolePreferences ?? [];
        }
        return [];
    });
    const [divisionId, setDivisionId] = useState<string | null>(() => {
        if (role === PersonRole.Official && existingPerson) {
            return (existingPerson as RegistrationOfficial).DivisionId ?? null;
        }
        return null;
    });

    const [isShowingLookup, setIsShowingLookup] = useState<boolean>(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Promote to the browser's top layer so this dialog (and its nested person lookup)
    // stack above Starlight's header/sidebar and any parent dialog. The dialog can be
    // Escape-closed unless a nested lookup dialog is up (so the lookup closes first).
    useModalDialog(dialogRef, () => onClose(null), isShowingLookup);

    const scope = getScopeForRole(role);
    const roleLabel = role === PersonRole.QuizzerWithoutTeam
        ? "Quizzer (No Team)"
        : PersonRole[role];

    const isDuplicate = (candidatePersonId: string | null): boolean => {
        if (!candidatePersonId) {
            return false;
        }

        // It's not a duplicate if it's the person already being edited.
        if (existingPerson?.PersonId === candidatePersonId) {
            return false;
        }

        const key = IdRolePair.generateKey(candidatePersonId, role);
        return existingPeopleIds.has(key);
    };

    const handleSelectExistingPerson = (selected: Person | null): void => {
        setIsShowingLookup(false);
        if (!selected) {
            return;
        }

        if (isDuplicate(selected.Id ?? null)) {
            setValidationError(`${selected.FirstName} ${selected.LastName} is already registered as a ${roleLabel}.`);
            return;
        }

        setLinkedPerson(selected);
        setPersonId(selected.Id ?? null);
        setValidationError(null);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        event.stopPropagation();

        if (!personId || !linkedPerson) {
            setValidationError("Please select a person before saving.");
            return;
        }

        if (isDuplicate(personId)) {
            setValidationError(`This person is already registered as a ${roleLabel}.`);
            return;
        }

        // Build the registration person object.
        let registrationPerson: RegistrationPerson;

        if (role === PersonRole.Official) {
            const official = new RegistrationOfficial();
            official.RolePreferences = rolePreferences;
            official.DivisionId = divisionId;
            registrationPerson = official;
        }
        else {
            registrationPerson = new RegistrationPerson();
        }

        registrationPerson.Id = existingPerson?.Id ?? null;
        registrationPerson.PersonId = personId;
        registrationPerson.Role = role;
        registrationPerson.Fields = fieldValues;

        // Stash the resolved Person on the model so the caller can display it
        // without having to re-fetch. `Person` is declared `readonly` on the
        // server-facing model, but we set it here for client-side rendering.
        (registrationPerson as { Person: Person }).Person = linkedPerson;

        onClose(registrationPerson);
    };

    const linkedPersonDisplay = linkedPerson
        ? `${linkedPerson.FirstName} ${linkedPerson.LastName}`.trim()
        : "";

    const officialRoleOptions: OfficialRole[] = [
        OfficialRole.Quizmaster,
        OfficialRole.Judge,
        OfficialRole.Scorekeeper,
        OfficialRole.Timekeeper,
    ];

    return (
        <>
            <dialog ref={dialogRef} className="modal">
                <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FontAwesomeIcon icon="fas faUser" />
                        <span>{title}</span>
                        <span className="badge badge-info">{roleLabel}</span>
                    </h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        aria-label="Close"
                        onClick={() => onClose(null)}>
                        ✕
                    </button>

                    {validationError && (
                        <div role="alert" className="alert alert-error mt-2 mb-2 w-full">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b> {validationError}
                            </div>
                        </div>)}

                    <form onSubmit={handleSubmit}>
                        <div className="w-full mt-0">
                            <label className="label mb-0">
                                <span className="label-text font-medium text-sm">Person</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <div className="join w-full mt-0 mb-0">
                                <input
                                    type="text"
                                    className="input input-bordered join-item w-full"
                                    value={linkedPersonDisplay}
                                    placeholder="No person selected"
                                    readOnly
                                    required
                                />
                                <button
                                    type="button"
                                    className="btn btn-info join-item mt-0"
                                    onClick={() => setIsShowingLookup(true)}
                                    disabled={readOnly}>
                                    <FontAwesomeIcon icon="fas faMagnifyingGlass" />
                                    Find Person
                                </button>
                            </div>
                            {linkedPerson?.Email && (
                                <p className="text-sm text-base-content/70 mt-1">
                                    <FontAwesomeIcon icon="fas faEnvelope" /> {linkedPerson.Email}
                                </p>)}
                        </div>

                        {role === PersonRole.Official && (
                            <>
                                <div className="w-full mt-2">
                                    <label className="label mb-0">
                                        <span className="label-text font-medium text-sm">Role Preferences</span>
                                    </label>
                                    <p className="text-xs text-base-content/60 mt-0 mb-1">
                                        Select all roles this person is willing to fill.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {officialRoleOptions.map(officialRole => {
                                            const isChecked = rolePreferences.includes(officialRole);
                                            return (
                                                <label key={`role-${officialRole}`} className="label cursor-pointer gap-2 mt-0">
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-info checkbox-sm"
                                                        checked={isChecked}
                                                        disabled={readOnly}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setRolePreferences(prev => [...prev, officialRole]);
                                                            }
                                                            else {
                                                                setRolePreferences(prev => prev.filter(p => p !== officialRole));
                                                            }
                                                        }}
                                                    />
                                                    <span>{OfficialRole[officialRole]}</span>
                                                </label>);
                                        })}
                                    </div>
                                </div>

                                {event.Divisions && event.Divisions.length > 0 && (
                                    <div className="w-full mt-2">
                                        <label className="label mb-0">
                                            <span className="label-text font-medium text-sm">Preferred Division</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full mt-0"
                                            value={divisionId ?? ""}
                                            disabled={readOnly}
                                            onChange={e => {
                                                setDivisionId(DataTypeHelpers.isNullOrEmpty(e.target.value)
                                                    ? null
                                                    : e.target.value);
                                            }}>
                                            <option value="">No preference</option>
                                            {event.Divisions.map(division => (
                                                <option key={`division-${division.Id}`} value={division.Id ?? ""}>
                                                    {division.Label} ({division.Abbreviation})
                                                </option>))}
                                        </select>
                                    </div>)}
                            </>)}

                        <RegistrationFieldsGrid
                            fields={event.Fields ?? []}
                            scope={scope}
                            values={fieldValues}
                            onChange={setFieldValues}
                            isEventOwner={event.IsOwner}
                            controlNamePrefix={`person-${personId ?? "new"}-`}
                            disabled={readOnly}
                        />

                        <div className="mt-4 flex flex-wrap gap-2 justify-end">
                            {existingPerson && !readOnly && (
                                <button
                                    type="button"
                                    className="btn btn-error mr-auto mt-0"
                                    onClick={() => onClose("delete")}>
                                    <FontAwesomeIcon icon="fas faTrash" />
                                    Remove
                                </button>)}
                            <button
                                type="submit"
                                className="btn btn-primary mt-0"
                                disabled={readOnly}>
                                <FontAwesomeIcon icon="fas faCheck" />
                                Save
                            </button>
                            <button
                                type="button"
                                className="btn btn-warning mt-0"
                                onClick={() => onClose(null)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {isShowingLookup && (
                <PersonLookupDialog
                    title={`Find a ${roleLabel}`}
                    parentType={PersonParentType.Church}
                    parentId={church.Id ?? undefined}
                    eventId={event.Id ?? undefined}
                    allowParentChange={!event.IsOfficial}
                    newParentRegionId={event.RegionId ?? undefined}
                    newParentDistrictId={event.DistrictId ?? undefined}
                    newEntityLabel={roleLabel}
                    requiredFields={event.RequiredRoleFields[PersonRole[role]]}
                    hideOptionalFieldsOnPersonPage={true}
                    currentParent={church}
                    onSelect={handleSelectExistingPerson}
                />)}
        </>);
}