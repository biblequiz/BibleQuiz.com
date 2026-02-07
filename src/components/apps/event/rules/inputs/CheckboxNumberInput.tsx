interface Props {
    checkboxLabel: string;
    suffixLabel?: string;
    checked: boolean;
    value: number;
    onCheckedChange: (checked: boolean) => void;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
    leftIndent?: number;
}

/**
 * Helper component for checkbox + number input pattern.
 */
export default function CheckboxNumberInput({
    checkboxLabel,
    suffixLabel,
    checked,
    value,
    onCheckedChange,
    onValueChange,
    disabled = false,
    min = 0,
    max = 99,
    leftIndent
}: Props) {
    return (
        <div className={`flex items-center gap-2 flex-wrap mt-0 ${leftIndent ? `pl-${leftIndent}` : ""}`}>
            <label className="label cursor-pointer gap-2 p-0">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-info"
                    checked={checked}
                    onChange={e => onCheckedChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className="label-text text-base-content">{checkboxLabel}</span>
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
            {suffixLabel && <span className="label-text text-base-content">{suffixLabel}</span>}
        </div>
    );
}