import { useState } from "react";
import { EventFieldControlType, type EventField } from "types/services/EventsService";
import EventFieldCheckbox from "./EventFieldCheckbox";
import EventFieldDropdownList from "./EventFieldDropdownList";
import { sharedDirtyWindowState } from "utils/SharedState";
import EventFieldRadioButton from "./EventFieldRadioButton";
import EventFieldMultiLineTextBox from "./EventFieldMultiLineTextBox";
import EventFieldSingleLineTextBox from "./EventFieldSingleLineTextBox";
import EventFieldMultiItemCheckbox from "./EventFieldMultiItemCheckbox";

interface Props {
    field: EventField;
    value?: string;
    setValue?(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
    recalculateCostHandler?: () => void;
}

export default function EventFieldControl({
    field,
    value,
    setValue,
    isExampleOnly,
    isDisabled = false,
    controlNamePrefix = "",
    recalculateCostHandler }: Props) {

    const [controlValue, setControlValue] = useState<string | undefined>(value);
    const updateControlValue = (newValue: string) => {
        setControlValue(newValue);
        if (!isExampleOnly && setValue) {
            setValue(newValue);
            sharedDirtyWindowState.set(true);

            if (recalculateCostHandler) {
                recalculateCostHandler();
            }
        }
    };

    // Configure the control per data type.
    switch (field.ControlType) {

        case EventFieldControlType.Checkbox:
        case EventFieldControlType.HtmlCheckbox:

            return (
                <EventFieldCheckbox
                    field={field}
                    value={controlValue}
                    setValue={updateControlValue}
                    isExampleOnly={isExampleOnly}
                    isDisabled={isDisabled}
                    controlNamePrefix={controlNamePrefix}
                />);

        case EventFieldControlType.DropdownList:
        case EventFieldControlType.GradeList:
            return (
                <EventFieldDropdownList
                    field={field}
                    value={controlValue}
                    setValue={updateControlValue}
                    isExampleOnly={isExampleOnly}
                    isDisabled={isDisabled}
                    controlNamePrefix={controlNamePrefix}
                />);

        case EventFieldControlType.RadioButton:
            return (
                <EventFieldRadioButton
                    field={field}
                    value={controlValue}
                    setValue={updateControlValue}
                    isExampleOnly={isExampleOnly}
                    isDisabled={isDisabled}
                    controlNamePrefix={controlNamePrefix}
                />);

        case EventFieldControlType.MultilineTextbox:
            return (
                <EventFieldMultiLineTextBox
                    field={field}
                    value={controlValue}
                    setValue={updateControlValue}
                    isExampleOnly={isExampleOnly}
                    isDisabled={isDisabled}
                    controlNamePrefix={controlNamePrefix}
                />);

        case EventFieldControlType.Textbox:
            return (
                <EventFieldSingleLineTextBox
                    field={field}
                    value={controlValue}
                    setValue={updateControlValue}
                    isExampleOnly={isExampleOnly}
                    isDisabled={isDisabled}
                    controlNamePrefix={controlNamePrefix}
                />);

        case EventFieldControlType.MultiItemCheckbox:
            return (
                <EventFieldMultiItemCheckbox
                    field={field}
                    value={controlValue}
                    setValue={updateControlValue}
                    isExampleOnly={isExampleOnly}
                    isDisabled={isDisabled}
                    controlNamePrefix={controlNamePrefix}
                />);

        default:
            throw Error(`Not Implemented (Control Type): ${field.ControlType}`);
    }
}