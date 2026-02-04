import CollapsibleSection from "components/CollapsibleSection";
import type { QuizOutState } from "../hooks/useMatchRulesForm";
import CheckboxNumberInput from "../inputs/CheckboxNumberInput";

interface QuizOutCardProps {
    title: string;
    questionLabel: string;
    idPrefix: string;
    state: QuizOutState;
    onChange: (updates: Partial<QuizOutState>) => void;
    disabled: boolean;
}

function QuizOutCard({ title, questionLabel, idPrefix, state, onChange, disabled }: QuizOutCardProps) {
    return (
        <div className="border border-base-300 rounded-lg p-3">
            <h4 className="font-semibold mb-2">{title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label">
                        <span className="label-text">{questionLabel}</span>
                    </label>
                    <input
                        type="number"
                        className="input input-sm w-24"
                        value={state.questions}
                        onChange={e => onChange({ questions: parseInt(e.target.value) || 0 })}
                        disabled={disabled}
                        min={0}
                        max={20}
                    />
                </div>
                <CheckboxNumberInput
                    id={`${idPrefix}Fouls`}
                    checkboxLabel="or after"
                    suffixLabel="foul(s)"
                    checked={state.foulsEnabled}
                    value={state.fouls}
                    onCheckedChange={checked => onChange({ foulsEnabled: checked })}
                    onValueChange={value => onChange({ fouls: value })}
                    disabled={disabled}
                />
                <CheckboxNumberInput
                    id={`${idPrefix}Bonus`}
                    checkboxLabel="Award"
                    suffixLabel="bonus point(s)"
                    checked={state.bonusEnabled}
                    value={state.bonus}
                    onCheckedChange={checked => onChange({ bonusEnabled: checked })}
                    onValueChange={value => onChange({ bonus: value })}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

interface Props {
    forwardState: QuizOutState;
    backwardState: QuizOutState;
    onForwardChange: (updates: Partial<QuizOutState>) => void;
    onBackwardChange: (updates: Partial<QuizOutState>) => void;
    disabled?: boolean;
}

export default function QuizOutSection({
    forwardState,
    backwardState,
    onForwardChange,
    onBackwardChange,
    disabled = false
}: Props) {
    return (
        <CollapsibleSection
            pageId="matchRulesEditor"
            elementId="quizOuts"
            icon="fas faGraduationCap"
            title="Quiz Outs"
            allowMultipleOpen={true}
        >
            <div className="p-2 space-y-4">
                <QuizOutCard
                    title="Quiz Out Forward"
                    questionLabel="After correct question(s)"
                    idPrefix="qoForward"
                    state={forwardState}
                    onChange={onForwardChange}
                    disabled={disabled}
                />
                <QuizOutCard
                    title="Quiz Out Backward"
                    questionLabel="After incorrect question(s)"
                    idPrefix="qoBackward"
                    state={backwardState}
                    onChange={onBackwardChange}
                    disabled={disabled}
                />
            </div>
        </CollapsibleSection>
    );
}