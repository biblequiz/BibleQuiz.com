import { type EventField } from "types/services/EventsService";

interface Props {
    field: EventField;
    value?: string;
    setValue(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
}

export default function EventFieldMultiLineTextBox({
    field,
    value,
    setValue,
    isExampleOnly,
    isDisabled = false,
    controlNamePrefix = "" }: Props) {

    const control = (
        <textarea
            rows={3}
            name={`${controlNamePrefix}${field.Label}`}
            maxLength={4000}
            disabled={isDisabled}
            value={value}
            required={field.IsRequired && !isExampleOnly}
            onChange={e => setValue(e.target.value)}
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