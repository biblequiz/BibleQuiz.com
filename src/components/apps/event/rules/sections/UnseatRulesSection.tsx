import CollapsibleSection from "components/CollapsibleSection";
import type { UnseatRulesState } from "../hooks/useMatchRulesForm";

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
            <div className="p-2 space-y-3">
                <p className="text-sm text-base-content/70">
                    These rules apply only to individual competitions and control when quizzers are removed from the table.
                </p>

                <div className="flex items-center gap-2 mt-0">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={state.unseatIfNextRoomGuaranteed}
                            onChange={e => onChange({ unseatIfNextRoomGuaranteed: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">
                            Unseat if Quizzer's next room guaranteed
                        </span>
                    </label>
                </div>

                <div className="flex items-center gap-2 mt-0">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={state.unseatIfPositionGuaranteed}
                            onChange={e => onChange({ unseatIfPositionGuaranteed: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">
                            Unseat Quizzer if position guaranteed
                        </span>
                    </label>
                </div>

                <div className="flex items-center gap-2 mt-0">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={state.endMatchIfTopPositionsGuaranteed}
                            onChange={e => onChange({ endMatchIfTopPositionsGuaranteed: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">
                            End match if top 2 guaranteed (except final). Ties for other positions broken arbitrarily.
                        </span>
                    </label>
                </div>

                <div className="flex items-center gap-2 mt-0">
                    <label className="label cursor-pointer gap-2 p-0">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={state.unseatIfCannotAdvance}
                            onChange={e => onChange({ unseatIfCannotAdvance: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">
                            Unseat Quizzer if they cannot advance to next room
                        </span>
                    </label>
                </div>

                <div className="form-control w-full max-w-xs mt-2">
                    <label className="label">
                        <span className="label-text font-medium">Unseat if score:</span>
                    </label>
                    <input
                        type="number"
                        className="input w-full"
                        value={state.unseatIfMaxScore ?? ""}
                        onChange={e => {
                            const value = e.target.value;
                            onChange({ unseatIfMaxScore: value === "" ? null : parseInt(value) });
                        }}
                        disabled={disabled}
                        placeholder="Optional Number of Points"
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
}