import { EventFieldDataType, type EventField } from "types/services/EventsService";

interface Props {
    field: EventField;
    value?: string;
    setValue(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
}

export default function EventFieldSingleLineTextBox({
    field,
    value,
    setValue,
    isExampleOnly,
    isDisabled = false,
    controlNamePrefix = "" }: Props) {

    let type: string = "text";
    let min: string | number | undefined = undefined;
    let max: string | number | undefined = undefined;
    let maxLength: number | undefined = undefined;
    switch (field.DataType) {
        case EventFieldDataType.Date:
            type = "date";
            break;
        case EventFieldDataType.Number:
            type = "number";
            min = field.MinNumberValue ?? undefined;
            max = field.MaxNumberValue ?? undefined;
            break;
        case EventFieldDataType.Text:
            maxLength = 60;
            break;
        default:
            throw Error("Not Implemented (Data Type): " + type);
    }

    const control = (
        <input
            type={type}
            min={min}
            max={max}
            maxLength={maxLength}
            placeholder={field.Label}
            autoComplete="off"
            name={`${controlNamePrefix}${field.Label}`}
            disabled={isDisabled}
            required={field.IsRequired && !isExampleOnly}
            value={value}
            onChange={e=>setValue(e.target.value)}
        />);

    if (field.Caption?.length > 0) {
        return (
            <div>
                {control}
                <h6>
                    <small>
                        {field.Caption}
                        {field.MaxCount != null && ` (Max ${field.MaxCount})`}
                    </small>
                </h6>
            </div>);
    }

    return control;
}