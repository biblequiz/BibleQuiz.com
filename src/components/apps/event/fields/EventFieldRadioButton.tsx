import { type EventField } from "types/services/EventsService";

interface Props {
    field: EventField;
    value?: string;
    setValue(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
}

export default function EventFieldRadioButton({
    field,
    value,
    setValue,
    isExampleOnly,
    isDisabled = false,
    controlNamePrefix = "" }: Props) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.checked) {
            return;
        }

        setValue(e.target.value);
    };

    const control = (
        <div className="flex flex-wrap gap-2">
            {(field.Values ?? []).map(fieldValue => {
                return (
                    <label key={`${field.Id}_${field.Label}_${fieldValue}`} className="label text-wrap mt-0">
                        <input
                            type="radio"
                            name={`${controlNamePrefix}${field.Label ?? "NoLabel"}`}
                            className="radio radio-info radio-sm"
                            disabled={isDisabled}
                            checked={fieldValue == value}
                            value={fieldValue}
                            required={field.IsRequired && !isExampleOnly}
                            onChange={handleChange}
                        />
                        <span className="text-sm">
                            {fieldValue}
                        </span>
                    </label>);
            })}
        </div>);

    if (field.Caption?.length ?? 0 > 0) {
        return (
            <div>
                {control}
                <div
                    className="mt-1 font-bold text-base-content text-xs"
                >
                    {field.Caption}
                </div>
            </div>);
    }

    return control;
}