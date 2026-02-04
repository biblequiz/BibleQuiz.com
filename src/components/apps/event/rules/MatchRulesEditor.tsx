import { useState, useEffect, useRef } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import CollapsibleSection from "components/CollapsibleSection";
import { 
    MatchRules, 
    QuizOutRule, 
    ContestRules, 
    TimingRules,
    type CompetitionType 
} from "types/MatchRules";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    rules: MatchRules;
    defaultType: CompetitionType;
    defaultRules: MatchRules;
    onChange: (newRules: MatchRules) => void;
    disabled?: boolean;
}

/**
 * Helper component for checkbox + number input pattern.
 */
function CheckboxNumberInput({
    id,
    checkboxLabel,
    suffixLabel,
    checked,
    value,
    onCheckedChange,
    onValueChange,
    disabled = false,
    min = 0,
    max = 99
}: {
    id: string;
    checkboxLabel: string;
    suffixLabel?: string;
    checked: boolean;
    value: number;
    onCheckedChange: (checked: boolean) => void;
    onValueChange: (value: number) => void;
    disabled?: boolean;
    min?: number;
    max?: number;
}) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <label className="label cursor-pointer gap-2 p-0">
                <input
                    type="checkbox"
                    id={id}
                    className="checkbox checkbox-sm checkbox-info"
                    checked={checked}
                    onChange={e => onCheckedChange(e.target.checked)}
                    disabled={disabled}
                />
                <span className="label-text">{checkboxLabel}</span>
            </label>
            <input
                type="number"
                className="input input-sm w-16"
                value={value}
                onChange={e => onValueChange(parseInt(e.target.value) || 0)}
                disabled={disabled || !checked}
                min={min}
                max={max}
            />
            {suffixLabel && <span className="label-text">{suffixLabel}</span>}
        </div>
    );
}

/**
 * Editor for match rules configuration.
 */
export default function MatchRulesEditor({ 
    rules,
    defaultType,
    defaultRules,
    onChange,
    disabled = false
}: Props) {

    const formRef = useRef<HTMLFormElement>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // General Rules
    const [competitionName, setCompetitionName] = useState(rules.CompetitionName);
    const [competitionFullName, setCompetitionFullName] = useState(rules.CompetitionFullName || "");
    const [quizzersPerTeam, setQuizzersPerTeam] = useState(rules.QuizzersPerTeam);
    const [maxTimeouts, setMaxTimeouts] = useState(rules.MaxTimeouts);

    // Quiz Out Forward
    const [qoForwardQuestions, setQoForwardQuestions] = useState(rules.QuizOutForward.QuestionCount);
    const [qoForwardFoulsEnabled, setQoForwardFoulsEnabled] = useState(rules.QuizOutForward.FoulCount !== undefined);
    const [qoForwardFouls, setQoForwardFouls] = useState(rules.QuizOutForward.FoulCount ?? 3);
    const [qoForwardBonusEnabled, setQoForwardBonusEnabled] = useState(rules.QuizOutForward.BonusPoints > 0);
    const [qoForwardBonus, setQoForwardBonus] = useState(rules.QuizOutForward.BonusPoints || 10);

    // Quiz Out Backward
    const [qoBackwardQuestions, setQoBackwardQuestions] = useState(rules.QuizOutBackward.QuestionCount);
    const [qoBackwardFoulsEnabled, setQoBackwardFoulsEnabled] = useState(rules.QuizOutBackward.FoulCount !== undefined);
    const [qoBackwardFouls, setQoBackwardFouls] = useState(rules.QuizOutBackward.FoulCount ?? 3);
    const [qoBackwardBonusEnabled, setQoBackwardBonusEnabled] = useState(rules.QuizOutBackward.BonusPoints > 0);
    const [qoBackwardBonus, setQoBackwardBonus] = useState(rules.QuizOutBackward.BonusPoints || 10);

    // Contests
    const [contestLabel, setContestLabel] = useState(rules.ContestRules.ContestLabel);
    const [maxSuccessfulEnabled, setMaxSuccessfulEnabled] = useState(rules.ContestRules.MaxSuccessfulContests !== undefined);
    const [maxSuccessful, setMaxSuccessful] = useState(rules.ContestRules.MaxSuccessfulContests ?? 2);
    const [maxUnsuccessfulEnabled, setMaxUnsuccessfulEnabled] = useState(rules.ContestRules.MaxUnsuccessfulContests !== undefined);
    const [maxUnsuccessful, setMaxUnsuccessful] = useState(rules.ContestRules.MaxUnsuccessfulContests ?? 3);
    const [unsuccessfulFoulsEnabled, setUnsuccessfulFoulsEnabled] = useState(rules.ContestRules.UnsuccessfulContestsWithoutFouls !== undefined);
    const [unsuccessfulFouls, setUnsuccessfulFouls] = useState(rules.ContestRules.UnsuccessfulContestsWithoutFouls ?? 2);

    // Question Counts
    const [count10s, setCount10s] = useState(rules.PointValueCounts[10] ?? 0);
    const [count20s, setCount20s] = useState(rules.PointValueCounts[20] ?? 0);
    const [count30s, setCount30s] = useState(rules.PointValueCounts[30] ?? 0);
    const totalQuestions = count10s + count20s + count30s;

    // Other Rules
    const [foulPoints, setFoulPoints] = useState(rules.FoulPoints);
    const [incorrectMultiplier, setIncorrectMultiplier] = useState<"half" | "full">(
        rules.IncorrectPointMultiplier < -0.6 ? "full" : "half"
    );

    // Timer
    const [timerEnabled, setTimerEnabled] = useState(rules.TimingRules?.InitialRemainingTime !== undefined);
    const [timerInitial, setTimerInitial] = useState(
        rules.TimingRules?.InitialRemainingTime 
            ? DataTypeHelpers.parseTimeSpanMinutes(rules.TimingRules.InitialRemainingTime) 
            : 30
    );
    const [timerWarnEnabled, setTimerWarnEnabled] = useState(rules.TimingRules?.WarnIfRemaining !== undefined);
    const [timerWarn, setTimerWarn] = useState(
        rules.TimingRules?.WarnIfRemaining 
            ? DataTypeHelpers.parseTimeSpanMinutes(rules.TimingRules.WarnIfRemaining) 
            : 5
    );
    const [timerAlertEnabled, setTimerAlertEnabled] = useState(rules.TimingRules?.AlertIfRemaining !== undefined);
    const [timerAlert, setTimerAlert] = useState(
        rules.TimingRules?.AlertIfRemaining 
            ? DataTypeHelpers.parseTimeSpanMinutes(rules.TimingRules.AlertIfRemaining) 
            : 0
    );

    // Track changes
    useEffect(() => {
        setHasChanges(true);
    }, [
        competitionName, competitionFullName, quizzersPerTeam, maxTimeouts,
        qoForwardQuestions, qoForwardFoulsEnabled, qoForwardFouls, qoForwardBonusEnabled, qoForwardBonus,
        qoBackwardQuestions, qoBackwardFoulsEnabled, qoBackwardFouls, qoBackwardBonusEnabled, qoBackwardBonus,
        contestLabel, maxSuccessfulEnabled, maxSuccessful, maxUnsuccessfulEnabled, maxUnsuccessful,
        unsuccessfulFoulsEnabled, unsuccessfulFouls,
        count10s, count20s, count30s, foulPoints, incorrectMultiplier,
        timerEnabled, timerInitial, timerWarnEnabled, timerWarn, timerAlertEnabled, timerAlert
    ]);

    const loadRulesIntoState = (r: MatchRules) => {
        setCompetitionName(r.CompetitionName);
        setCompetitionFullName(r.CompetitionFullName || "");
        setQuizzersPerTeam(r.QuizzersPerTeam);
        setMaxTimeouts(r.MaxTimeouts);

        setQoForwardQuestions(r.QuizOutForward.QuestionCount);
        setQoForwardFoulsEnabled(r.QuizOutForward.FoulCount !== undefined);
        setQoForwardFouls(r.QuizOutForward.FoulCount ?? 3);
        setQoForwardBonusEnabled(r.QuizOutForward.BonusPoints > 0);
        setQoForwardBonus(r.QuizOutForward.BonusPoints || 10);

        setQoBackwardQuestions(r.QuizOutBackward.QuestionCount);
        setQoBackwardFoulsEnabled(r.QuizOutBackward.FoulCount !== undefined);
        setQoBackwardFouls(r.QuizOutBackward.FoulCount ?? 3);
        setQoBackwardBonusEnabled(r.QuizOutBackward.BonusPoints > 0);
        setQoBackwardBonus(r.QuizOutBackward.BonusPoints || 10);

        setContestLabel(r.ContestRules.ContestLabel);
        setMaxSuccessfulEnabled(r.ContestRules.MaxSuccessfulContests !== undefined);
        setMaxSuccessful(r.ContestRules.MaxSuccessfulContests ?? 2);
        setMaxUnsuccessfulEnabled(r.ContestRules.MaxUnsuccessfulContests !== undefined);
        setMaxUnsuccessful(r.ContestRules.MaxUnsuccessfulContests ?? 3);
        setUnsuccessfulFoulsEnabled(r.ContestRules.UnsuccessfulContestsWithoutFouls !== undefined);
        setUnsuccessfulFouls(r.ContestRules.UnsuccessfulContestsWithoutFouls ?? 2);

        setCount10s(r.PointValueCounts[10] ?? 0);
        setCount20s(r.PointValueCounts[20] ?? 0);
        setCount30s(r.PointValueCounts[30] ?? 0);

        setFoulPoints(r.FoulPoints);
        setIncorrectMultiplier(r.IncorrectPointMultiplier < -0.6 ? "full" : "half");

        setTimerEnabled(r.TimingRules?.InitialRemainingTime !== undefined);
        setTimerInitial(
            r.TimingRules?.InitialRemainingTime 
                ? DataTypeHelpers.parseTimeSpanMinutes(r.TimingRules.InitialRemainingTime) 
                : 30
        );
        setTimerWarnEnabled(r.TimingRules?.WarnIfRemaining !== undefined);
        setTimerWarn(
            r.TimingRules?.WarnIfRemaining 
                ? DataTypeHelpers.parseTimeSpanMinutes(r.TimingRules.WarnIfRemaining) 
                : 5
        );
        setTimerAlertEnabled(r.TimingRules?.AlertIfRemaining !== undefined);
        setTimerAlert(
            r.TimingRules?.AlertIfRemaining 
                ? DataTypeHelpers.parseTimeSpanMinutes(r.TimingRules.AlertIfRemaining) 
                : 0
        );

        setHasChanges(false);
        setValidationError(null);
    };

    const buildMatchRules = (): MatchRules => {
        const newRules = new MatchRules();
        newRules.CompetitionName = competitionName;
        newRules.CompetitionFullName = competitionFullName || undefined;
        newRules.Type = defaultType;
        newRules.QuizzersPerTeam = quizzersPerTeam;
        newRules.MaxTimeouts = maxTimeouts;

        const qoForward = new QuizOutRule();
        qoForward.QuestionCount = qoForwardQuestions;
        qoForward.FoulCount = qoForwardFoulsEnabled ? qoForwardFouls : undefined;
        qoForward.BonusPoints = qoForwardBonusEnabled ? qoForwardBonus : 0;
        newRules.QuizOutForward = qoForward;

        const qoBackward = new QuizOutRule();
        qoBackward.QuestionCount = qoBackwardQuestions;
        qoBackward.FoulCount = qoBackwardFoulsEnabled ? qoBackwardFouls : undefined;
        qoBackward.BonusPoints = qoBackwardBonusEnabled ? qoBackwardBonus : 0;
        newRules.QuizOutBackward = qoBackward;

        const contests = new ContestRules();
        contests.ContestLabel = contestLabel;
        contests.MaxSuccessfulContests = maxSuccessfulEnabled ? maxSuccessful : undefined;
        contests.MaxUnsuccessfulContests = maxUnsuccessfulEnabled ? maxUnsuccessful : undefined;
        contests.UnsuccessfulContestsWithoutFouls = unsuccessfulFoulsEnabled ? unsuccessfulFouls : undefined;
        contests.AreContestsRulings = rules.ContestRules.AreContestsRulings;
        newRules.ContestRules = contests;

        newRules.PointValueCounts = { 10: count10s, 20: count20s, 30: count30s };
        newRules.FoulPoints = foulPoints;
        newRules.IncorrectPointMultiplier = incorrectMultiplier === "full" ? -1 : -0.5;

        if (timerEnabled) {
            const timing = new TimingRules();
            timing.InitialRemainingTime = DataTypeHelpers.formatTimeSpan(0, timerInitial);
            timing.WarnIfRemaining = timerWarnEnabled ? DataTypeHelpers.formatTimeSpan(0, timerWarn) : undefined;
            timing.AlertIfRemaining = timerAlertEnabled ? DataTypeHelpers.formatTimeSpan(0, timerAlert) : undefined;
            newRules.TimingRules = timing;
        }

        newRules.IsIndividualCompetition = rules.IsIndividualCompetition;
        newRules.PointValueRules = rules.PointValueRules;
        newRules.RequiredScoreReading = rules.RequiredScoreReading;

        return newRules;
    };

    const validateRules = (): string | null => {
        if (qoForwardQuestions > totalQuestions) {
            return `Quiz Out Forward after ${qoForwardQuestions} question(s) exceeds the ${totalQuestions} question(s) in the match.`;
        }
        if (qoBackwardQuestions > totalQuestions) {
            return `Quiz Out Backward after ${qoBackwardQuestions} question(s) exceeds the ${totalQuestions} question(s) in the match.`;
        }
        if (totalQuestions > 20) {
            return "Scoring software doesn't currently support more than 20 questions.";
        }
        if (timerEnabled) {
            if (timerWarnEnabled && timerInitial < timerWarn) {
                return "If a countdown timer warning is set, it cannot be a larger number than the initial timer.";
            }
            if (timerAlertEnabled && timerInitial < timerAlert) {
                return "If a countdown timer alert is set, it cannot be a larger number than the initial timer.";
            }
            if (timerWarnEnabled && timerAlertEnabled && timerWarn < timerAlert) {
                return "If both countdown timer warning and alert are set, the warning must be a larger number than the alert.";
            }
        }
        return null;
    };

    const handleSave = (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        if (!formRef.current!.reportValidity()) {
            return;
        }

        const error = validateRules();
        if (error) {
            setValidationError(error);
            return;
        }

        setValidationError(null);
        const newRules = buildMatchRules();
        onChange(newRules);
        setHasChanges(false);
    };

    const handleCancel = () => {
        loadRulesIntoState(rules);
    };

    const handleResetToDefaults = () => {
        loadRulesIntoState(defaultRules);
        setHasChanges(true);
    };

    const competitionTypeLabel = defaultType === 0 ? "JBQ" : "TBQ";

    return (
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

            {/* General Match Rules */}
            <CollapsibleSection
                pageId="matchRulesEditor"
                elementId="generalRules"
                icon="fas faCog"
                title="General Match Rules"
                defaultOpen={true}
                allowMultipleOpen={true}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-medium">Competition Abbreviation</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            value={competitionName}
                            onChange={e => setCompetitionName(e.target.value)}
                            disabled={disabled}
                            maxLength={20}
                            required
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-medium">Full Competition Name</span>
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            value={competitionFullName}
                            onChange={e => setCompetitionFullName(e.target.value)}
                            disabled={disabled}
                            maxLength={50}
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-medium">Max Quizzers at Table</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full"
                            value={quizzersPerTeam}
                            onChange={e => setQuizzersPerTeam(parseInt(e.target.value) || 3)}
                            disabled={disabled}
                            min={1}
                            max={10}
                            required
                        />
                    </div>
                    <div className="form-control w-full">
                        <label className="label">
                            <span className="label-text font-medium">Max Timeouts per Match</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="number"
                            className="input w-full"
                            value={maxTimeouts}
                            onChange={e => setMaxTimeouts(parseInt(e.target.value) || 0)}
                            disabled={disabled}
                            min={0}
                            max={10}
                            required
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Quiz Outs */}
            <CollapsibleSection
                pageId="matchRulesEditor"
                elementId="quizOuts"
                icon="fas faGraduationCap"
                title="Quiz Outs"
                allowMultipleOpen={true}
            >
                <div className="p-2 space-y-4">
                    {/* Quiz Out Forward */}
                    <div className="border border-base-300 rounded-lg p-3">
                        <h4 className="font-semibold mb-2">Quiz Out Forward</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">After correct question(s)</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-sm w-24"
                                    value={qoForwardQuestions}
                                    onChange={e => setQoForwardQuestions(parseInt(e.target.value) || 0)}
                                    disabled={disabled}
                                    min={0}
                                    max={20}
                                />
                            </div>
                            <CheckboxNumberInput
                                id="qoForwardFouls"
                                checkboxLabel="or after"
                                suffixLabel="foul(s)"
                                checked={qoForwardFoulsEnabled}
                                value={qoForwardFouls}
                                onCheckedChange={setQoForwardFoulsEnabled}
                                onValueChange={setQoForwardFouls}
                                disabled={disabled}
                            />
                            <CheckboxNumberInput
                                id="qoForwardBonus"
                                checkboxLabel="Award"
                                suffixLabel="bonus point(s)"
                                checked={qoForwardBonusEnabled}
                                value={qoForwardBonus}
                                onCheckedChange={setQoForwardBonusEnabled}
                                onValueChange={setQoForwardBonus}
                                disabled={disabled}
                            />
                        </div>
                    </div>

                    {/* Quiz Out Backward */}
                    <div className="border border-base-300 rounded-lg p-3">
                        <h4 className="font-semibold mb-2">Quiz Out Backward</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">After incorrect question(s)</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-sm w-24"
                                    value={qoBackwardQuestions}
                                    onChange={e => setQoBackwardQuestions(parseInt(e.target.value) || 0)}
                                    disabled={disabled}
                                    min={0}
                                    max={20}
                                />
                            </div>
                            <CheckboxNumberInput
                                id="qoBackwardFouls"
                                checkboxLabel="or after"
                                suffixLabel="foul(s)"
                                checked={qoBackwardFoulsEnabled}
                                value={qoBackwardFouls}
                                onCheckedChange={setQoBackwardFoulsEnabled}
                                onValueChange={setQoBackwardFouls}
                                disabled={disabled}
                            />
                            <CheckboxNumberInput
                                id="qoBackwardBonus"
                                checkboxLabel="Award"
                                suffixLabel="bonus point(s)"
                                checked={qoBackwardBonusEnabled}
                                value={qoBackwardBonus}
                                onCheckedChange={setQoBackwardBonusEnabled}
                                onValueChange={setQoBackwardBonus}
                                disabled={disabled}
                            />
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Contests */}
            <CollapsibleSection
                pageId="matchRulesEditor"
                elementId="contests"
                icon="fas faGavel"
                title="Contests"
                allowMultipleOpen={true}
            >
                <div className="p-2 space-y-4">
                    <div className="form-control w-full max-w-xs">
                        <label className="label">
                            <span className="label-text font-medium">Plural Label</span>
                        </label>
                        <input
                            type="text"
                            className="input w-full"
                            value={contestLabel}
                            onChange={e => setContestLabel(e.target.value)}
                            disabled={disabled}
                            maxLength={40}
                            placeholder="e.g., Contests, Coach's Appeals"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CheckboxNumberInput
                            id="maxSuccessful"
                            checkboxLabel="Allow up to"
                            suffixLabel={`successful ${contestLabel.toLowerCase()}`}
                            checked={maxSuccessfulEnabled}
                            value={maxSuccessful}
                            onCheckedChange={setMaxSuccessfulEnabled}
                            onValueChange={setMaxSuccessful}
                            disabled={disabled}
                        />
                        <CheckboxNumberInput
                            id="maxUnsuccessful"
                            checkboxLabel="Allow up to"
                            suffixLabel={`unsuccessful ${contestLabel.toLowerCase()}`}
                            checked={maxUnsuccessfulEnabled}
                            value={maxUnsuccessful}
                            onCheckedChange={setMaxUnsuccessfulEnabled}
                            onValueChange={setMaxUnsuccessful}
                            disabled={disabled}
                        />
                        <CheckboxNumberInput
                            id="unsuccessfulFouls"
                            checkboxLabel="Award foul after"
                            suffixLabel={`unsuccessful ${contestLabel.toLowerCase()}`}
                            checked={unsuccessfulFoulsEnabled}
                            value={unsuccessfulFouls}
                            onCheckedChange={setUnsuccessfulFoulsEnabled}
                            onValueChange={setUnsuccessfulFouls}
                            disabled={disabled}
                        />
                    </div>
                </div>
            </CollapsibleSection>

            {/* Question Counts */}
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
                                value={count10s}
                                onChange={e => setCount10s(parseInt(e.target.value) || 0)}
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
                                value={count20s}
                                onChange={e => setCount20s(parseInt(e.target.value) || 0)}
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
                                value={count30s}
                                onChange={e => setCount30s(parseInt(e.target.value) || 0)}
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

            {/* Other Rules */}
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
                            value={foulPoints}
                            onChange={e => setFoulPoints(parseInt(e.target.value) || 0)}
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
                                    checked={incorrectMultiplier === "half"}
                                    onChange={() => setIncorrectMultiplier("half")}
                                    disabled={disabled}
                                />
                                <span className="label-text">Half Point Value</span>
                            </label>
                            <label className="label cursor-pointer gap-2">
                                <input
                                    type="radio"
                                    name="incorrectMultiplier"
                                    className="radio radio-sm radio-info"
                                    checked={incorrectMultiplier === "full"}
                                    onChange={() => setIncorrectMultiplier("full")}
                                    disabled={disabled}
                                />
                                <span className="label-text">Full Point Value</span>
                            </label>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Countdown Match Timer */}
            <CollapsibleSection
                pageId="matchRulesEditor"
                elementId="timer"
                icon="fas faStopwatch"
                title="Countdown Match Timer"
                allowMultipleOpen={true}
            >
                <div className="p-2 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <label className="label cursor-pointer gap-2 p-0">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={timerEnabled}
                                onChange={e => setTimerEnabled(e.target.checked)}
                                disabled={disabled}
                            />
                            <span className="label-text">Start Timer in EZScore at</span>
                        </label>
                        <input
                            type="number"
                            className="input input-sm w-20"
                            value={timerInitial}
                            onChange={e => setTimerInitial(parseInt(e.target.value) || 0)}
                            disabled={disabled || !timerEnabled}
                            min={1}
                            max={180}
                        />
                        <span className="label-text">minutes</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="label cursor-pointer gap-2 p-0">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={timerWarnEnabled}
                                    onChange={e => setTimerWarnEnabled(e.target.checked)}
                                    disabled={disabled || !timerEnabled}
                                />
                                <span className="label-text">Warn at</span>
                            </label>
                            <input
                                type="number"
                                className="input input-sm w-20"
                                value={timerWarn}
                                onChange={e => setTimerWarn(parseInt(e.target.value) || 0)}
                                disabled={disabled || !timerEnabled || !timerWarnEnabled}
                                min={0}
                                max={180}
                            />
                            <span className="label-text">minutes</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <label className="label cursor-pointer gap-2 p-0">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={timerAlertEnabled}
                                    onChange={e => setTimerAlertEnabled(e.target.checked)}
                                    disabled={disabled || !timerEnabled}
                                />
                                <span className="label-text">Alert at</span>
                            </label>
                            <input
                                type="number"
                                className="input input-sm w-20"
                                value={timerAlert}
                                onChange={e => setTimerAlert(parseInt(e.target.value) || 0)}
                                disabled={disabled || !timerEnabled || !timerAlertEnabled}
                                min={0}
                                max={180}
                            />
                            <span className="label-text">minutes</span>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4">
                <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    onClick={handleResetToDefaults}
                    disabled={disabled}
                >
                    <FontAwesomeIcon icon="fas faRotateLeft" />
                    Default {competitionTypeLabel} Rules
                </button>
                <button
                    type="submit"
                    className="btn btn-sm btn-success"
                    onClick={handleSave}
                    disabled={disabled || !hasChanges}
                >
                    <FontAwesomeIcon icon="fas faFloppyDisk" />
                    Save Changes
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={handleCancel}
                    disabled={disabled || !hasChanges}
                >
                    <FontAwesomeIcon icon="fas faXmark" />
                    Cancel
                </button>
            </div>
        </form>
    );
}