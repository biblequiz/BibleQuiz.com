import CollapsibleSection from "components/CollapsibleSection";
import type { OtherRulesState } from "../hooks/useMatchRulesForm";

interface Props {
    state: OtherRulesState;
    onChange: (updates: Partial<OtherRulesState>) => void;
    disabled?: boolean;
}

export default function OtherRulesSection({ state, onChange, disabled = false }: Props) {
    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="otherRules"
            icon="fas faSliders"
            title="Other Rules"
            titleClass="mt-4"
            allowMultipleOpen={true}
        >
            <div className="p-2 space-y-4">
                <div className="form-control w-full max-w-xs">
                    <label className="label">
                        <span className="label-text font-medium">Negative Points per Foul</span>
                    </label>
                    <input
                        type="number"
                        className="input w-full"
                        value={state.foulPoints}
                        onChange={e => onChange({ foulPoints: parseInt(e.target.value) || 0 })}
                        disabled={disabled}
                        min={0}
                        max={50}
                        step={1}
                    />
                </div>
                <div className="form-control w-full">
                    <label className="label cursor-pointer gap-2 mt-0">
                        <input
                            type="radio"
                            name="incorrectMultiplier"
                            className="radio radio-sm radio-info"
                            checked={state.incorrectMultiplier === "half"}
                            onChange={() => onChange({ incorrectMultiplier: "half" })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">Half Negative Point Value when Incorrect (e.g., -5 for incorrect 10-point question)</span>
                    </label>
                </div>
                <div className="form-control w-full">
                    <label className="label cursor-pointer gap-2 mt-0">
                        <input
                            type="radio"
                            name="incorrectMultiplier"
                            className="radio radio-sm radio-info"
                            checked={state.incorrectMultiplier === "full"}
                            onChange={() => onChange({ incorrectMultiplier: "full" })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">Negative Point Value when Incorrect (e.g., -10 for incorrect 10-point question)</span>
                    </label>
                </div>
            </div>
        </CollapsibleSection>
    );
}