import CollapsibleSection from "components/CollapsibleSection";
import type { UnseatRulesState } from "../hooks/useMatchRulesForm";
import CheckboxNumberInput from "../inputs/CheckboxNumberInput";

interface Props {
    state: UnseatRulesState;
    onChange: (updates: Partial<UnseatRulesState>) => void;
    disabled?: boolean;
}

export default function UnseatRulesSection({ state, onChange, disabled = false }: Props) {
    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="unseat"
            icon="fas faChair"
            title="Unseat Rules (Individual Competition Only)"
            titleClass="mt-4"
            allowMultipleOpen={true}
        >
            <div className="p-2 space-y-4">
                <p className="text-sm text-base-content/70">
                    These rules apply only to individual competitions and control when quizzers are removed from the table.
                </p>

                {/* Unseat if position is guaranteed */}
                <div className="flex items-center gap-2">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={state.unseatIfPositionGuaranteed}
                            onChange={e => onChange({ unseatIfPositionGuaranteed: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">Unseat if position is guaranteed</span>
                    </label>
                </div>

                {/* Top positions settings */}
                <CheckboxNumberInput
                    checkboxLabel="Unseat if guaranteed top"
                    suffixLabel="position(s)"
                    checked={state.topPositionsEnabled}
                    value={state.topPositions}
                    onCheckedChange={checked => onChange({ topPositionsEnabled: checked })}
                    onValueChange={value => onChange({ topPositions: value })}
                    disabled={disabled}
                    min={1}
                    max={10}
                />

                {/* Nested options when top positions is enabled */}
                {state.topPositionsEnabled && (
                    <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-2">
                            <label className="label cursor-pointer gap-2 p-0">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={state.unseatIfAnyTop}
                                    onChange={e => onChange({ unseatIfAnyTop: e.target.checked })}
                                    disabled={disabled}
                                />
                                <span className="label-text text-base-content">
                                    Any top {state.topPositions} position (vs. specific order)
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="label cursor-pointer gap-2 p-0">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={state.endMatchIfTopPositionsKnown}
                                    onChange={e => onChange({ endMatchIfTopPositionsKnown: e.target.checked })}
                                    disabled={disabled}
                                />
                                <span className="label-text text-base-content">
                                    End match early if top {state.topPositions} positions are known
                                </span>
                            </label>
                        </div>
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
}