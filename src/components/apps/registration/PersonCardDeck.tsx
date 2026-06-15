import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { JSX } from "react";
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
 * Card deck that renders a list of RegistrationPersons as clickable cards.
 * Each card shows the person's name, role, and any custom fields that have
 * a value, formatted in a readable way (e.g. "Yes/No" for booleans).
 * An "Add" card-button appears at the end of the deck when `isEditable`.
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
}: Props) {

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
            <div className="flex flex-wrap gap-3">
                {people.map((person, index) => {

                    const personName = person.Person?.FirstName || person.Person?.LastName
                        ? `${person.Person?.FirstName ?? ""} ${person.Person?.LastName ?? ""}`.trim()
                        : "(Unnamed)";

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
                        <button
                            type="button"
                            key={`person-${person.Id ?? person.PersonId ?? index}`}
                            className="card card-sm bg-base-100 border-2 border-base-300 w-72 text-left hover:border-primary transition-colors mt-0"
                            onClick={() => onEdit(person)}>
                            <div className="card-body p-3">
                                <div className="flex justify-between items-start gap-2">
                                    <h4 className="card-title text-base mt-0">
                                        {personName}
                                    </h4>
                                </div>
                                <ul className="m-0 p-0 list-none">
                                    {officialMetadata}
                                    {fieldRows}
                                </ul>
                                {isEditable && (
                                    <div className="text-right mt-2">
                                        <span className="text-xs text-primary">
                                            <FontAwesomeIcon icon="fas faPenToSquare" /> Edit
                                        </span>
                                    </div>)}
                            </div>
                        </button>);
                })}
                {isEditable && (
                    <button
                        type="button"
                        className="card card-sm w-72 border-2 border-dashed border-base-300 hover:border-primary hover:bg-base-200 transition-colors flex items-center justify-center text-base-content/70 mt-0"
                        onClick={onAdd}
                        style={{ minHeight: "8rem" }}>
                        <div className="card-body items-center justify-center text-center p-3 h-full">
                            <FontAwesomeIcon icon="fas faPlus" classNames={["text-2xl"]} />
                            <span className="font-medium">{addLabel}</span>
                        </div>
                    </button>)}
                {!isEditable && people.length === 0 && emptyMessage && (
                    <div className="text-base-content/60 italic">{emptyMessage}</div>)}
            </div>
        </section>);
}