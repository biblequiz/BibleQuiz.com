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

function QuizOutCard({
    title,
    questionLabel,
    state,
    onChange,
    disabled }: QuizOutCardProps) {
    return (
        <div className="border border-base-300 rounded-lg p-3">
            <h4 className="font-semibold mb-2">{title}</h4>
            <div className="grid gap-4">
                <div className="flex flex-wrap items-center gap-2 mt-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="label">
                            <span className="label-text text-base-content">After</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm w-auto"
                            value={state.questions}
                            onChange={e => onChange({ questions: parseInt(e.target.value) || 0 })}
                            disabled={disabled}
                            min={0}
                            max={20}
                            step={1}
                        />
                        <label className="label">
                            <span className="label-text text-base-content">{questionLabel} question(s) or</span>
                        </label>
                    </div>
                    <CheckboxNumberInput
                        checkboxLabel="after"
                        suffixLabel="foul(s)"
                        checked={state.foulsEnabled}
                        value={state.fouls}
                        onCheckedChange={checked => onChange({ foulsEnabled: checked })}
                        onValueChange={value => onChange({ fouls: value })}
                        disabled={disabled}
                    />
                </div>
                <CheckboxNumberInput
                    checkboxLabel="Award"
                    suffixLabel="bonus point(s)"
                    checked={state.bonusEnabled}
                    value={state.bonus}
                    leftIndent={6}
                    onCheckedChange={checked => onChange({ bonusEnabled: checked })}
                    onValueChange={value => onChange({ bonus: value })}
                    disabled={disabled}
                />
            </div>
        </div>);
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
            titleClass="mt-4"
            allowMultipleOpen={true}
        >
            <div className="p-2 space-y-4 mt-0">
                <QuizOutCard
                    title="Quiz Out"
                    questionLabel="correct"
                    idPrefix="qoForward"
                    state={forwardState}
                    allowBonusPoints={true}
                    onChange={onForwardChange}
                    disabled={disabled}
                />
                <QuizOutCard
                    title="Strike Out"
                    questionLabel="incorrect"
                    idPrefix="qoBackward"
                    state={backwardState}
                    allowBonusPoints={false}
                    onChange={onBackwardChange}
                    disabled={disabled}
                />
            </div>
        </CollapsibleSection>
    );
}