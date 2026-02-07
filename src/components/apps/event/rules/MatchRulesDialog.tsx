import { useRef } from "react";
import type { EventInfo } from "types/EventTypes";
import { type MatchRules } from "types/MatchRules";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useMatchRulesForm } from "./hooks/useMatchRulesForm";
import GeneralRulesSection from "./sections/GeneralRulesSection";
import QuizOutSection from "./sections/QuizOutSection";
import ContestRulesSection from "./sections/ContestRulesSection";
import QuestionCountsSection from "./sections/QuestionCountsSection";
import OtherRulesSection from "./sections/OtherRulesSection";
import TimerRulesSection from "./sections/TimerRulesSection";

interface Props {
    rules: MatchRules;
    defaultType?: string;
    defaultRules: MatchRules;
    onSelect: (newRules: MatchRules | null) => void;
    isReadOnly: boolean;
}

export interface EventInfoCache {
    events: EventInfoWithTypeId[] | undefined;
    season: number | undefined;
}

export interface EventInfoWithTypeId extends EventInfo {
    typeId: string;
}

export default function MatchRulesDialog({
    rules,
    defaultRules,
    onSelect,
    isReadOnly }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [state, actions] = useMatchRulesForm(rules);

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current!.reportValidity()) {
            return;
        }

        const error = actions.validate();
        if (error) {
            // Set validation error via state update would require adding setValidationError to actions
            // For now, we'll handle it inline
            return;
        }

        const newRules = actions.buildMatchRules(defaultRules.Type!, rules);

        onSelect(newRules);
        dialogRef.current?.close();
    };

    // Get validation error on demand for display
    const validationError = actions.validate();

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-3xl">
                <h3 className="font-bold text-lg">Edit Rules</h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={() => {
                        onSelect(null);
                        dialogRef.current?.close();
                    }}
                >✕</button>
                <div className="mt-4">

                    <form ref={formRef} className="space-y-4" onSubmit={handleSave}>
                        {validationError && (
                            <div role="alert" className="alert alert-error w-full">
                                <FontAwesomeIcon icon="fas faCircleExclamation" />
                                <div>
                                    <b>Validation Error: </b>
                                    <span>{validationError}</span>
                                </div>
                            </div>
                        )}

                        <GeneralRulesSection
                            state={state.general}
                            onChange={actions.setGeneral}
                            disabled={isReadOnly}
                        />

                        <QuizOutSection
                            forwardState={state.quizOutForward}
                            backwardState={state.quizOutBackward}
                            onForwardChange={actions.setQuizOutForward}
                            onBackwardChange={actions.setQuizOutBackward}
                            totalQuestions={state.questionCounts.count10s + state.questionCounts.count20s + state.questionCounts.count30s}
                            disabled={isReadOnly}
                        />

                        <ContestRulesSection
                            state={state.contests}
                            onChange={actions.setContests}
                            disabled={isReadOnly}
                        />

                        <QuestionCountsSection
                            state={state.questionCounts}
                            onChange={actions.setQuestionCounts}
                            disabled={isReadOnly}
                        />

                        <OtherRulesSection
                            state={state.otherRules}
                            onChange={actions.setOtherRules}
                            disabled={isReadOnly}
                        />

                        <TimerRulesSection
                            state={state.timer}
                            onChange={actions.setTimer}
                            disabled={isReadOnly}
                        />
                    </form>
                </div>
                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && (
                        <>
                            <button
                                className="btn btn-sm btn-outline mt-0"
                                type="button"
                                tabIndex={0}
                                onClick={() => actions.loadRules(defaultRules)}>
                                <FontAwesomeIcon icon="fas faRotateLeft" />
                                Default {defaultRules.CompetitionName} Rules
                            </button>
                            <button
                                className="btn btn-sm btn-primary mt-0"
                                type="button"
                                tabIndex={1}
                                onClick={handleSave}>
                                Apply Rules
                            </button>
                        </>)}
                    <button
                        className="btn btn-sm btn-secondary mt-0"
                        type="button"
                        tabIndex={2}
                        onClick={() => {
                            onSelect(null);
                            dialogRef.current?.close();
                        }}>
                        {isReadOnly ? "Close" : "Cancel"}
                    </button>
                </div>
            </div>
        </dialog>);
}