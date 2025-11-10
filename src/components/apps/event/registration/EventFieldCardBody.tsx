import { EventField, EventFieldControlType, EventFieldScopes, EventFieldVisibility } from "types/services/EventsService";
import EventFieldControl from "../fields/EventFieldControl";
import { useState } from "react";
import RichTextEditor from "components/RichTextEditor";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    allowAttendees: boolean;
    field: EventField;
}

function trimAndUpdateRequiredState(
    fieldValue: string | null | undefined,
    setFieldValue: (value: string) => void): string {

    const trimmed = DataTypeHelpers.trimToNull(fieldValue) ?? "";
    if (trimmed !== fieldValue) {
        setFieldValue(trimmed);
    }

    return trimmed;
}

function trimAndUpdateState(
    fieldValue: string | null | undefined,
    setFieldValue: (value: string | undefined) => void): string | null | undefined {

    const trimmed = DataTypeHelpers.trimToNull(fieldValue) ?? undefined;
    if (trimmed !== fieldValue) {
        setFieldValue(trimmed);
    }

    return trimmed;
}

class ControlTypeRestrictions {
    constructor(isTeamOnlyScope: boolean, allowRequired: boolean) {
        this.isTeamOnlyScope = isTeamOnlyScope;
        this.allowRequired = allowRequired;
    }

    public readonly isTeamOnlyScope: boolean;

    public readonly allowRequired: boolean;
}

const controlTypeRestrictions: Record<EventFieldControlType, ControlTypeRestrictions> = {
    [EventFieldControlType.Checkbox]: new ControlTypeRestrictions(false, true),
    [EventFieldControlType.DropdownList]: new ControlTypeRestrictions(false, true),
    [EventFieldControlType.GradeList]: new ControlTypeRestrictions(false, true),
    [EventFieldControlType.HtmlCheckbox]: new ControlTypeRestrictions(true, true),
    [EventFieldControlType.MultilineTextbox]: new ControlTypeRestrictions(true, true),
    [EventFieldControlType.MultiItemCheckbox]: new ControlTypeRestrictions(false, false),
    [EventFieldControlType.RadioButton]: new ControlTypeRestrictions(false, true),
    [EventFieldControlType.Textbox]: new ControlTypeRestrictions(false, true),
};

export default function EventFieldCardBody({ allowAttendees, field }: Props) {

    const [label, setLabel] = useState<string>(field.Label);
    const [visibility, setVisibility] = useState<EventFieldVisibility>(field.Visibility);
    const [controlType, setControlType] = useState(field.ControlType);
    const [scopes, setScopes] = useState<EventFieldScopes>(field.Scopes);
    const [caption, setCaption] = useState<string | undefined>(field.Caption ?? undefined);
    const [isRequired, setIsRequired] = useState<boolean>(field.IsRequired);

    const getScopeCheckbox = (
        scope: EventFieldScopes,
        labelText: string,
        disabled: boolean) => {

        return (
            <label className="label ml-2 mt-0">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-info"
                    checked={(scopes & scope) == scope}
                    onChange={e => {
                        const newScopes = e.target.checked
                            ? (scopes | scope)
                            : (scopes & ~scope);
                        setScopes(newScopes);
                        field.Scopes = newScopes;

                        sharedDirtyWindowState.set(true);
                    }}
                    disabled={disabled}
                />
                <span>
                    {labelText}
                </span>
            </label>);
    };

    const controlRestrictions = controlTypeRestrictions[controlType];
    const disableScopeSelection = controlRestrictions.isTeamOnlyScope;

    return (
        <>
            <EventFieldControl field={field} isExampleOnly={true} />
            <div className="divider mb-2 mt-2" />
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Label</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="text"
                    className="input input-info w-full mt-0"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    onBlur={e => {
                        e.preventDefault();
                        field.Label = trimAndUpdateRequiredState(label, setLabel);
                        sharedDirtyWindowState.set(true);
                    }}
                    maxLength={60}
                    required
                />
            </div>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Visibility</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    className="select select-info w-full mt-0"
                    value={visibility}
                    onChange={e => {
                        const newVisibility: EventFieldVisibility = parseInt(e.target.value);
                        setVisibility(newVisibility);

                        field.Visibility = newVisibility;
                        sharedDirtyWindowState.set(true);
                    }}
                    required>
                    <option value={EventFieldVisibility.ReadWrite}>Changeable by Registrants</option>
                    <option value={EventFieldVisibility.ReadOnly}>Visible to Registrants</option>
                    <option value={EventFieldVisibility.AdminOnly}>Event Coordinator Only</option>
                </select>
            </div>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Control</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    className="select select-info w-full mt-0"
                    value={controlType}
                    onChange={e => {
                        const newControlType: EventFieldControlType = parseInt(e.target.value);
                        setControlType(newControlType);

                        if (controlTypeRestrictions[newControlType].isTeamOnlyScope) {
                            setScopes(EventFieldScopes.Team);
                            field.Scopes = EventFieldScopes.Team;
                        }

                        field.ControlType = newControlType;
                        sharedDirtyWindowState.set(true);
                    }}
                    required>
                    <option value={EventFieldControlType.Checkbox}>Checkbox</option>
                    <option value={EventFieldControlType.DropdownList}>Drop-down</option>
                    <option value={EventFieldControlType.GradeList}>Grade drop-down</option>
                    <option value={EventFieldControlType.HtmlCheckbox}>Checkbox with Description (e.g. Waiver)</option>
                    <option value={EventFieldControlType.MultilineTextbox}>Multiline Text</option>
                    <option value={EventFieldControlType.MultiItemCheckbox}>Multiple Checkboxes</option>
                    <option value={EventFieldControlType.RadioButton}>Radio Button</option>
                    <option value={EventFieldControlType.Textbox}>Text</option>
                </select>
            </div>
            {controlRestrictions.allowRequired && (
                <div className="w-full mt-0">
                    <div className="mt-0 ml-2">
                        <label className="label">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={isRequired}
                                onChange={e => {
                                    setIsRequired(e.target.checked);
                                    field.IsRequired = e.target.checked;
                                    sharedDirtyWindowState.set(true);
                                }}
                            />
                            <span>
                                Field must be completed.
                            </span>
                        </label>
                    </div>
                </div>)}
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Show For</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <div className="mt-0">
                    {getScopeCheckbox(EventFieldScopes.Team, "Team", disableScopeSelection)}
                    {getScopeCheckbox(EventFieldScopes.Quizzer, "Quizzer", disableScopeSelection)}
                    {getScopeCheckbox(EventFieldScopes.Coach, "Coach", disableScopeSelection)}
                    {getScopeCheckbox(EventFieldScopes.Official, "Official", disableScopeSelection)}
                    {allowAttendees && getScopeCheckbox(EventFieldScopes.Attendee, "Attendee", disableScopeSelection)}
                </div>
            </div>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Caption</span>
                </label>
                {controlType == EventFieldControlType.HtmlCheckbox && (
                    <RichTextEditor
                        text={caption ?? ""}
                        setText={setCaption}
                    />
                )}
                {controlType != EventFieldControlType.HtmlCheckbox && (
                    <input
                        name="name"
                        type="text"
                        className="input w-full"
                        value={caption}
                        maxLength={60}
                        placeholder="Caption"
                        onChange={e => setCaption(e.target.value)}
                        onBlur={e => {
                            e.preventDefault();
                            field.Caption = trimAndUpdateState(caption, setCaption);
                            sharedDirtyWindowState.set(true);
                        }}
                    />)}
            </div>
        </>);
}