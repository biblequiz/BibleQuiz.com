import { EventField, EventFieldScopes, EventFieldVisibility } from "types/services/EventsService";
import EventFieldControl from "components/apps/event/fields/EventFieldControl";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    /** Full set of registration fields (will be filtered to those matching `scope`). */
    fields: EventField[];

    /** Scope of fields to render (Team, Quizzer, Coach, etc.). */
    scope: EventFieldScopes;

    /** Current values for the fields (keyed by EventField.Id). */
    values: Record<string, string | null>;

    /** Setter that updates the values map (immutably). */
    onChange: (newValues: Record<string, string | null>) => void;

    /** True if the user owns the event (and may therefore edit AdminOnly fields). */
    isEventOwner?: boolean;

    /** Prefix for control names (required for radio button groups inside nested dialogs). */
    controlNamePrefix?: string;

    /** When true, all controls are disabled. */
    disabled?: boolean;
}

/**
 * Renders the subset of EventFields that match the supplied scope as a
 * vertical stack of label + control pairs. Visibility is honored:
 * fields marked AdminOnly are hidden from non-owners, and fields marked
 * ReadOnly are rendered disabled.
 */
export default function RegistrationFieldsGrid({
    fields,
    scope,
    values,
    onChange,
    isEventOwner = false,
    controlNamePrefix = "",
    disabled = false,
}: Props) {

    const filteredFields = fields.filter(f => DataTypeHelpers.hasEnumFlag(f.Scopes, scope));
    if (filteredFields.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 mt-2">
            {filteredFields.map(field => {

                // Hide fields the registrant isn't supposed to see.
                if (!isEventOwner && field.Visibility === EventFieldVisibility.AdminOnly) {
                    return null;
                }

                const isDisabled =
                    disabled
                    || (!isEventOwner && field.Visibility === EventFieldVisibility.ReadOnly);

                const fieldId = field.Id ?? `field-${field.Label}`;
                const value = values[fieldId!] ?? undefined;

                return (
                    <div key={`field-${fieldId}`} className="w-full mt-0">
                        <label className="label mb-0">
                            <span className="label-text font-medium text-sm">
                                {field.Label}
                            </span>
                            {field.IsRequired && (
                                <span className="label-text-alt text-error">*</span>
                            )}
                        </label>
                        <EventFieldControl
                            field={field}
                            value={value ?? undefined}
                            setValue={newValue => {
                                const updated = { ...values };
                                if (DataTypeHelpers.isNullOrEmpty(newValue)) {
                                    delete updated[fieldId!];
                                }
                                else {
                                    updated[fieldId!] = newValue;
                                }
                                onChange(updated);
                            }}
                            isExampleOnly={false}
                            isDisabled={isDisabled}
                            controlNamePrefix={controlNamePrefix}
                        />
                    </div>);
            })}
        </div>);
}