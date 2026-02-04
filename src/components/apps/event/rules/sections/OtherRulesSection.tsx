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
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">Negative Points per Incorrect</span>
                    </label>
                    <div className="flex gap-4">
                        <label className="label cursor-pointer gap-2">
                            <input
                                type="radio"
                                name="incorrectMultiplier"
                                className="radio radio-sm radio-info"
                                checked={state.incorrectMultiplier === "half"}
                                onChange={() => onChange({ incorrectMultiplier: "half" })}
                                disabled={disabled}
                            />
                            <span className="label-text">Half Point Value</span>
                        </label>
                        <label className="label cursor-pointer gap-2">
                            <input
                                type="radio"
                                name="incorrectMultiplier"
                                className="radio radio-sm radio-info"
                                checked={state.incorrectMultiplier === "full"}
                                onChange={() => onChange({ incorrectMultiplier: "full" })}
                                disabled={disabled}
                            />
                            <span className="label-text">Full Point Value</span>
                        </label>
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    );
}