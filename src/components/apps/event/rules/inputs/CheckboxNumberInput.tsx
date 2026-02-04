interface Props {
    id: string;
    checkboxLabel: string;
    suffixLabel?: string;
    checked: boolean;
    value: number;
    onCheckedChange: (checked: boolean) => void;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
}

/**
 * Helper component for checkbox + number input pattern.
 */
export default function CheckboxNumberInput({
    id,
    checkboxLabel,
    suffixLabel,
    checked,
    value,
    onCheckedChange,
    onValueChange,
    disabled = false,
    min = 0,
    max = 99
}: Props) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <label className="label cursor-pointer gap-2 p-0">
                <input
                    type="checkbox"
                    id={id}
                    className="checkbox checkbox-sm checkbox-info"
                    checked={checked}
                    onChange={e => onCheckedChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className="label-text">{checkboxLabel}</span>
            </label>
            <input
                type="number"
                className="input input-sm w-16"
                value={value}
                onChange={e => onValueChange(parseInt(e.target.value) || 0)}
                disabled={disabled || !checked}
                min={min}
                max={max}
            />
            {suffixLabel && <span className="label-text">{suffixLabel}</span>}
        </div>
    );
}