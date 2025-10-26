import { EventField } from "types/services/EventsService";

interface Props {
    field: EventField;
    value?: string;
    setValue(newValue: string): void;
    isExampleOnly: boolean;
    isDisabled?: boolean;
    controlNamePrefix?: string;
}

export default function EventFieldMultiItemCheckbox({
    field,
    value,
    setValue,
    isDisabled = false,
    controlNamePrefix = "" }: Props) {

    const checkedItems = new Set<string>(value?.split(EventField.ListValueSeparator) || []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            if (checkedItems.has(e.target.value)) {
                return;
            }

            checkedItems.add(e.target.value);
        }
        else {
            if (!checkedItems.has(e.target.value)) {
                return;
            }

            checkedItems.delete(e.target.value);
        }

        setValue(Array.from(checkedItems).join(EventField.ListValueSeparator));
    };

    const control = (
        <>
            {field.Values!.map(fieldValue => {
                const isChecked = checkedItems.has(fieldValue);
                return (
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            name={`${controlNamePrefix}${field.Label}`}
                            className="radio radio-info"
                            disabled={isDisabled || (!isChecked && field.MaxCount != null && checkedItems.size >= field.MaxCount)}
                            checked={isChecked}
                            value={fieldValue}
                            onChange={handleChange}
                        />
                        <span className="text-sm">
                            {fieldValue}
                        </span>
                    </label>);
            })}
        </>);

    if (field.Caption?.length ?? 0 > 0) {
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