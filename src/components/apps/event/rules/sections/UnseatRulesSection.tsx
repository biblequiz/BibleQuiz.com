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
                            checked={state.endMatchIfAllNextRoomsGuaranteed}
                            onChange={e => onChange({ endMatchIfAllNextRoomsGuaranteed: e.target.checked })}
                            disabled={disabled}
                        />
                        <span className="label-text text-base-content">
                            End match if top position(s) guaranteed
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
            </div>
        </CollapsibleSection>
    );
}