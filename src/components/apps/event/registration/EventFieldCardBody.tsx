import { EventField, EventFieldControlType, EventFieldDataType, EventFieldScopes, EventFieldVisibility } from "types/services/EventsService";
import EventFieldControl from "../fields/EventFieldControl";
import { useState } from "react";
import RichTextEditor from "components/RichTextEditor";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import EventFieldValueSelector from "./EventFieldValueSelector";

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
    constructor(
        isTeamOnlyScope: boolean,
        allowRequired: boolean,
        hasValues: boolean,
        hasMaxCount: boolean,
        dataType?: EventFieldDataType) {

        this.isTeamOnlyScope = isTeamOnlyScope;
        this.allowRequired = allowRequired;
        this.hasValues = hasValues;
        this.hasMaxCount = hasMaxCount
        this.dataType = dataType;
    }

    public readonly isTeamOnlyScope: boolean;

    public readonly allowRequired: boolean;

    public readonly hasValues: boolean;

    public readonly hasMaxCount: boolean;

    public readonly dataType?: EventFieldDataType;
}

const controlTypeRestrictions: Record<EventFieldControlType, ControlTypeRestrictions> = {
    [EventFieldControlType.Checkbox]: new ControlTypeRestrictions(false, true, false, false, EventFieldDataType.Boolean),
    [EventFieldControlType.DropdownList]: new ControlTypeRestrictions(false, true, true, false, EventFieldDataType.Text),
    [EventFieldControlType.GradeList]: new ControlTypeRestrictions(false, true, false, false, EventFieldDataType.Number),
    [EventFieldControlType.HtmlCheckbox]: new ControlTypeRestrictions(true, true, false, false, EventFieldDataType.Boolean),
    [EventFieldControlType.MultilineTextbox]: new ControlTypeRestrictions(true, true, false, false, EventFieldDataType.Text),
    [EventFieldControlType.MultiItemCheckbox]: new ControlTypeRestrictions(false, false, true, true, EventFieldDataType.TextList),
    [EventFieldControlType.RadioButton]: new ControlTypeRestrictions(false, true, true, false, EventFieldDataType.Text),
    [EventFieldControlType.Textbox]: new ControlTypeRestrictions(false, true, false, false),
};

export default function EventFieldCardBody({ allowAttendees, field }: Props) {

    const [label, setLabel] = useState<string>(field.Label);
    const [visibility, setVisibility] = useState<EventFieldVisibility>(field.Visibility);
    const [controlType, setControlType] = useState(field.ControlType);
    const [scopes, setScopes] = useState<EventFieldScopes>(field.Scopes);
    const [caption, setCaption] = useState<string | undefined>(field.Caption ?? undefined);
    const [isRequired, setIsRequired] = useState<boolean>(field.IsRequired);
    const [dataType, setDataType] = useState(field.DataType);
    const [minNumber, setMinNumber] = useState<number | null>(field.MinNumberValue ?? null);
    const [maxNumber, setMaxNumber] = useState<number | null>(field.MaxNumberValue ?? null);
    const [maxCount, setMaxCount] = useState<number>(0);
    const [values, setValues] = useState<string[]>(field.Values ?? []);

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

                        const restriction = controlTypeRestrictions[newControlType];
                        if (restriction.isTeamOnlyScope) {
                            setScopes(EventFieldScopes.Team);
                            field.Scopes = EventFieldScopes.Team;
                        }

                        if (restriction.dataType !== undefined) {
                            setDataType(restriction.dataType);
                            field.DataType = restriction.dataType;
                        }
                        else if (controlType !== newControlType &&
                            dataType !== EventFieldDataType.Text) {
                            setDataType(EventFieldDataType.Text);
                            field.DataType = EventFieldDataType.Text;
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
            {controlType === EventFieldControlType.Textbox && (
                <div className="w-full mt-0">
                    <label className="label mb-0">
                        <span className="label-text font-medium text-sm">Type</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <select
                        className="select select-info w-full mt-0"
                        value={dataType}
                        onChange={e => {
                            const newDataType: EventFieldDataType = parseInt(e.target.value);
                            setDataType(newDataType);

                            field.DataType = newDataType;
                            sharedDirtyWindowState.set(true);
                        }}
                        required>
                        <option value={EventFieldDataType.Date}>Date</option>
                        <option value={EventFieldDataType.Number}>Number</option>
                        <option value={EventFieldDataType.Text}>Text</option>
                    </select>
                </div>)}
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
                {dataType === EventFieldDataType.Number && (
                    <div className="w-full mt-2">
                        <label className="label mb-0">
                            <span className="label-text font-medium text-sm">Range</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        {controlType === EventFieldControlType.GradeList && (
                            <div className="mt-0">
                                <select
                                    className="select select-info w-auto mt-0"
                                    value={minNumber ?? 0}
                                    onChange={e => {
                                        const newMinValue: EventFieldDataType = parseInt(e.target.value);
                                        setMinNumber(newMinValue);

                                        field.MinNumberValue = newMinValue;
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    required>
                                    {Array.from({ length: 13 }, (_, i) => (
                                        <option key={`min_${i}`} value={i} disabled={maxNumber !== null && i > maxNumber}>
                                            {i == 0 ? "K" : i}
                                        </option>))}
                                </select>
                                <span> - </span>
                                <select
                                    className="select select-info w-auto mt-0"
                                    value={maxNumber ?? 12}
                                    onChange={e => {
                                        const newMaxValue: EventFieldDataType = parseInt(e.target.value);
                                        setMaxNumber(newMaxValue);

                                        field.MaxNumberValue = newMaxValue;
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    required>
                                    {Array.from({ length: 13 }, (_, i) => (
                                        <option key={`max_${i}`} value={i} disabled={minNumber !== null && i < minNumber}>
                                            {i == 0 ? "K" : i}
                                        </option>))}
                                </select>
                            </div>)}
                        {controlType !== EventFieldControlType.GradeList && (
                            <div className="mt-0">
                                <input
                                    type="number"
                                    className="input input-info w-1/4 mt-0"
                                    value={minNumber ?? undefined}
                                    onChange={e => setMinNumber(parseInt(e.target.value))}
                                    onBlur={e => {
                                        e.preventDefault();
                                        field.MinNumberValue = minNumber;
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    min={-2147483648}
                                    max={maxNumber ?? 2147483647}
                                />
                                <span> - </span>
                                <input
                                    type="number"
                                    className="input input-info w-1/4 mt-0"
                                    value={maxNumber ?? undefined}
                                    onChange={e => setMaxNumber(parseInt(e.target.value))}
                                    onBlur={e => {
                                        e.preventDefault();
                                        field.MaxNumberValue = maxNumber;
                                        sharedDirtyWindowState.set(true);
                                    }}
                                    min={-2147483648}
                                    max={maxNumber ?? 2147483647}
                                />
                            </div>)}
                    </div>)}
                {controlRestrictions.hasValues && (
                    <div className="w-full mt-2">
                        <label className="label mb-0">
                            <span className="label-text font-medium text-sm">Values</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <div className="mt-0">
                            <EventFieldValueSelector
                                values={values}
                                setValues={(newValues: string[]) => {
                                    setValues(newValues);
                                    field.Values = newValues;
                                    sharedDirtyWindowState.set(true);
                                }} />
                        </div>
                    </div>)}
                {controlRestrictions.hasMaxCount && (
                    <div className="w-full mt-2">
                        <label className="label mb-0">
                            <span className="label-text font-medium text-sm">Max Selections</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <select
                            className="select select-info w-full mt-0"
                            value={maxCount}
                            onChange={e => {
                                const newMaxCount: number = parseInt(e.target.value);
                                setMaxCount(newMaxCount);

                                field.MaxCount = newMaxCount;
                                sharedDirtyWindowState.set(true);
                            }}
                            required>
                            <option value={0}>No Limit</option>
                            {Array.from({ length: values.length }, (_, i) => (
                                <option key={`maxCount_${i + 1}`}>{i + 1}</option>))}
                        </select>
                    </div>)}
            </div>
        </>);
}