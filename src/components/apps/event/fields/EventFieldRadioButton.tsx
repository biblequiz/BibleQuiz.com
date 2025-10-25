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
        <>
            {field.Values.map(fieldValue => {
                return (
                    <label className="label text-wrap">
                        <input
                            type="radio"
                            name={`${controlNamePrefix}${field.Label}`}
                            className="radio radio-info"
                            disabled={isDisabled}
                            checked={fieldValue == value}
                            required={field.IsRequired && !isExampleOnly}
                            onChange={handleChange}
                        />
                        <span className="text-sm">
                            {fieldValue}
                        </span>
                    </label>);
            })}
        </>);

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