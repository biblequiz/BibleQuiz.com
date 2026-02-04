import CollapsibleSection from "components/CollapsibleSection";
import type { QuestionCountsState } from "../hooks/useMatchRulesForm";

interface Props {
    state: QuestionCountsState;
    onChange: (updates: Partial<QuestionCountsState>) => void;
    disabled?: boolean;
}

export default function QuestionCountsSection({ state, onChange, disabled = false }: Props) {
    const totalQuestions = state.count10s + state.count20s + state.count30s;

    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="questionCounts"
            icon="fas faListOl"
            title="Question Counts"
            allowMultipleOpen={true}
        >
            <div className="p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">10 point Questions</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full"
                            value={state.count10s}
                            onChange={e => onChange({ count10s: parseInt(e.target.value) || 0 })}
                            disabled={disabled}
                            min={0}
                            max={20}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">20 point Questions</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full"
                            value={state.count20s}
                            onChange={e => onChange({ count20s: parseInt(e.target.value) || 0 })}
                            disabled={disabled}
                            min={0}
                            max={20}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">30 point Questions</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full"
                            value={state.count30s}
                            onChange={e => onChange({ count30s: parseInt(e.target.value) || 0 })}
                            disabled={disabled}
                            min={0}
                            max={20}
                        />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">Total Questions</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full bg-base-200"
                            value={totalQuestions}
                            disabled
                            readOnly
                        />
                    </div>
                </div>
            </div>
        </CollapsibleSection>
    );
}