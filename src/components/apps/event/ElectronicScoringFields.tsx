interface Props {
    enabled: boolean;
    code: string | undefined;
    disabled: boolean;
    onChange: (enabled: boolean, code: string | undefined) => void;
}

/**
 * Checkbox and scoring code that turn on electronic scoring (EZScore) for an event. Shared by the
 * Scoring/General and Registration/Other pages so both edit the same setting.
 */
export default function ElectronicScoringFields({ enabled, code, disabled, onChange }: Props) {
    return (
        <>
            <div className="w-full ml-2 mt-1 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="allowElectronicScoring"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={enabled}
                        disabled={disabled}
                        onChange={e => onChange(e.target.checked, code)}
                    />
                    <span>
                        Enable Electronic Scoring via EZScore?
                    </span>
                </label>
            </div>

            <div className="form-control w-full mt-2 mb-0">
                <label className="label">
                    <span className="label-text font-medium text-sm">Scoring Code</span>
                    {enabled && <span className="label-text-alt text-error">*</span>}
                </label>
                <input
                    type="text"
                    className="input w-full"
                    placeholder="Scoring Code"
                    value={code ?? ""}
                    onChange={e => onChange(enabled, e.target.value)}
                    disabled={disabled || !enabled}
                    maxLength={50}
                    required={enabled}
                />
            </div>
        </>);
}
