import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useState, type JSX } from "react";
import ConfirmationDialog from "components/ConfirmationDialog";
import { EventField, EventFieldDataType, EventFieldScopes, type EventInfo } from "types/services/EventsService";
import { PersonRole } from "types/services/PeopleService";
import { OfficialRole, RegistrationOfficial, type RegistrationPerson } from "types/services/RegistrationService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    /** Section title displayed above the card deck. */
    title?: string;

    /** Icon to display next to the title. */
    icon: string;

    /** Event being registered for (used to look up custom fields). */
    event: EventInfo;

    /** Field scope to use when rendering each person's custom fields. */
    scope: EventFieldScopes;

    /** Label for the "Add" button (e.g. "Add Quizzer"). */
    addLabel: string;

    /** People to render. */
    people: RegistrationPerson[];

    /** Whether the user is allowed to add / edit / remove people in this deck. */
    isEditable: boolean;

    /** Handler invoked when an existing person card is clicked. */
    onEdit: (person: RegistrationPerson) => void;

    /** Handler invoked when the "Add" card-button is clicked. */
    onAdd: () => void;

    /** Optional message shown when the deck is empty. */
    emptyMessage?: string;

    /**
     * Removes a person, after the user confirms (optional; without it there's no Remove button). If it throws,
     * the error's message is shown above the cards.
     */
    onRemove?: (person: RegistrationPerson) => Promise<void> | void;

    /** What removing does, shown when confirming (e.g. whether it's saved right away). */
    removeMessage?: string;
}

/**
 * Formats a custom field value for human-readable display on a card.
 */
function formatFieldValue(field: EventField, rawValue: string): string {
    switch (field.DataType) {
        case EventFieldDataType.Boolean:
            return rawValue === "1" || rawValue === "true" ? "Yes" : "No";
        case EventFieldDataType.TextList:
            return rawValue.replace(EventField.ListValueSeparator, ", ");
        case EventFieldDataType.Date:
            return DataTypeHelpers.formatDate(rawValue) ?? rawValue;
        default:
            return rawValue;
    }
}

/**
 * The people of one role in a registration (R3 in docs/task-navigation-plan.md): a large "+ Add" button at the
 * top, then a card per person with their details and Edit and Remove buttons. Each card shows the person's name,
 * role, and any custom fields that have a value, formatted in a readable way (e.g. "Yes/No" for booleans).
 */
export default function PersonCardDeck({
    title,
    icon,
    event,
    scope,
    addLabel,
    people,
    isEditable,
    onEdit,
    onAdd,
    emptyMessage,
    onRemove,
    removeMessage = "They'll be taken off this registration.",
}: Props) {

    const [removingPerson, setRemovingPerson] = useState<RegistrationPerson | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const [removeError, setRemoveError] = useState<string | null>(null);

    const getPersonName = (person: RegistrationPerson) =>
        person.Person?.FirstName || person.Person?.LastName
            ? `${person.Person?.FirstName ?? ""} ${person.Person?.LastName ?? ""}`.trim()
            : "(Unnamed)";

    const confirmRemove = async (person: RegistrationPerson) => {
        setRemovingPerson(null);
        if (!onRemove) {
            return;
        }

        setIsRemoving(true);
        setRemoveError(null);
        try {
            await onRemove(person);
        }
        catch (error) {
            setRemoveError((error as Error)?.message || `${getPersonName(person)} couldn't be removed.`);
        }
        finally {
            setIsRemoving(false);
        }
    };

    const scopedFields = event.Fields?.filter(
        f => DataTypeHelpers.hasEnumFlag(f.Scopes, scope)) ?? [];

    const renderFieldRows = (person: RegistrationPerson): JSX.Element[] => {

        if (!person.Fields) {
            return [];
        }

        const rows: JSX.Element[] = [];
        for (const field of scopedFields) {
            const rawValue = person.Fields[field.Id!];
            if (DataTypeHelpers.isNullOrEmpty(rawValue)) {
                continue;
            }

            rows.push((
                <li
                    key={`field-${person.Id ?? person.PersonId}-${field.Id}`}
                    className="text-sm text-base-content/70 truncate">
                    <span className="font-medium">{field.Label}:</span>{" "}
                    <span>{formatFieldValue(field, rawValue!)}</span>
                </li>));
        }

        return rows;
    };

    return (
        <section className={title ? "mt-4" : "mt-0"}>
            {title && (
                <h3 className="text-lg font-semibold mb-2 mt-0 flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} />
                    <span>{title}</span>
                    <span className="badge badge-neutral">{people.length}</span>
                </h3>)}
            {isEditable && (
                <button
                    type="button"
                    className="btn btn-primary bq-people-add"
                    disabled={isRemoving}
                    onClick={onAdd}>
                    <FontAwesomeIcon icon="fas faPlus" />
                    {addLabel}
                </button>)}
            {removeError && (
                <div role="alert" className="alert alert-error mt-2">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    {/* The server HTML-encodes the values in its messages. */}
                    <span dangerouslySetInnerHTML={{ __html: removeError }} />
                </div>)}
            <div className="bq-people">
                {people.map((person, index) => {

                    const personName = getPersonName(person);
                    const fieldRows = renderFieldRows(person);

                    // Officials have additional metadata to surface.
                    let officialMetadata: JSX.Element | null = null;
                    if (person.Role === PersonRole.Official) {
                        const official = person as RegistrationOfficial;
                        const preferences = (official.RolePreferences ?? [])
                            .map(p => OfficialRole[p])
                            .join(", ");
                        const divisionLabel = official.DivisionId
                            ? event.Divisions?.find(d => d.Id === official.DivisionId)?.Label ?? official.DivisionId
                            : null;
                        officialMetadata = (
                            <>
                                {preferences && (
                                    <li className="text-sm text-base-content/70 truncate">
                                        <span className="font-medium">Roles:</span> {preferences}
                                    </li>)}
                                {divisionLabel && (
                                    <li className="text-sm text-base-content/70 truncate">
                                        <span className="font-medium">Division:</span> {divisionLabel}
                                    </li>)}
                            </>);
                    }

                    return (
                        <article
                            key={`person-${person.Id ?? person.PersonId ?? index}`}
                            className="bq-person">
                            <h4 className="bq-person-name">
                                <FontAwesomeIcon icon={icon} />
                                {personName}
                            </h4>
                            {(officialMetadata || fieldRows.length > 0) && (
                                <ul className="m-0 p-0 list-none">
                                    {officialMetadata}
                                    {fieldRows}
                                </ul>)}
                            <div className="bq-person-actions">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline m-0"
                                    disabled={isRemoving}
                                    onClick={() => onEdit(person)}>
                                    <FontAwesomeIcon icon={isEditable ? "fas faPenToSquare" : "fas faEye"} />
                                    {isEditable ? "Edit" : "View"}
                                </button>
                                {isEditable && onRemove && (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-ghost text-error m-0"
                                        disabled={isRemoving}
                                        onClick={() => setRemovingPerson(person)}>
                                        <FontAwesomeIcon icon="fas faTrash" />
                                        Remove
                                    </button>)}
                            </div>
                        </article>);
                })}
            </div>
            {people.length === 0 && (
                <p className="bq-people-empty">{emptyMessage ?? "Nobody added yet."}</p>)}
            {removingPerson && (
                <ConfirmationDialog
                    title={`Remove ${getPersonName(removingPerson)}?`}
                    yesLabel="Remove"
                    noLabel="Keep"
                    onYes={() => void confirmRemove(removingPerson)}
                    onNo={() => setRemovingPerson(null)}>
                    {removeMessage}
                </ConfirmationDialog>)}
        </section>);
}