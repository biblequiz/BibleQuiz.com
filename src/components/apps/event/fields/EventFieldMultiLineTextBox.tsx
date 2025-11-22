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
            className="textarea w-full"
            rows={3}
            name={`${controlNamePrefix}${field.Label}`}
            maxLength={4000}
            disabled={isDisabled}
            value={value}
            required={field.IsRequired && !isExampleOnly}
            onChange={e => setValue(e.target.value)}
        />);

    if (field.Caption?.length ?? 0 > 0) {
        return (
            <div>
                {control}
                <div className="mt-0 font-bold text-xs">
                    {field.Caption}
                </div>
            </div>);
    }

    return control;
}