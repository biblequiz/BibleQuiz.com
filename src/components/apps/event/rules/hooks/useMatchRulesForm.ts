import { useState, useEffect, useCallback } from "react";
import {
    MatchRules,
    QuizOutRule,
    ContestRules,
    TimingRules,
    type CompetitionType
} from "types/MatchRules";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

export interface GeneralRulesState {
    competitionName: string;
    competitionFullName: string;
    quizzersPerTeam: number;
    maxTimeouts: number;
}

export interface QuizOutState {
    questions: number;
    foulsEnabled: boolean;
    fouls: number;
    bonusEnabled: boolean;
    bonus: number;
}

export interface ContestRulesState {
    contestLabel: string;
    maxSuccessfulEnabled: boolean;
    maxSuccessful: number;
    maxUnsuccessfulEnabled: boolean;
    maxUnsuccessful: number;
    unsuccessfulFoulsEnabled: boolean;
    unsuccessfulFouls: number;
}

export interface QuestionCountsState {
    count10s: number;
    count20s: number;
    count30s: number;
}

export interface OtherRulesState {
    foulPoints: number;
    incorrectMultiplier: "half" | "full";
}

export interface TimerRulesState {
    enabled: boolean;
    initial: number;
    warnEnabled: boolean;
    warn: number;
    alertEnabled: boolean;
    alert: number;
}

export interface MatchRulesFormState {
    general: GeneralRulesState;
    quizOutForward: QuizOutState;
    quizOutBackward: QuizOutState;
    contests: ContestRulesState;
    questionCounts: QuestionCountsState;
    otherRules: OtherRulesState;
    timer: TimerRulesState;
    validationError: string | null;
    hasChanges: boolean;
}

export interface MatchRulesFormActions {
    setGeneral: (updates: Partial<GeneralRulesState>) => void;
    setQuizOutForward: (updates: Partial<QuizOutState>) => void;
    setQuizOutBackward: (updates: Partial<QuizOutState>) => void;
    setContests: (updates: Partial<ContestRulesState>) => void;
    setQuestionCounts: (updates: Partial<QuestionCountsState>) => void;
    setOtherRules: (updates: Partial<OtherRulesState>) => void;
    setTimer: (updates: Partial<TimerRulesState>) => void;
    loadRules: (rules: MatchRules) => void;
    buildMatchRules: (defaultType: CompetitionType, originalRules: MatchRules) => MatchRules;
    validate: () => string | null;
}

function extractQuizOutState(rule: QuizOutRule): QuizOutState {
    return {
        questions: rule.QuestionCount,
        foulsEnabled: !!rule.FoulCount,
        fouls: rule.FoulCount ?? 3,
        bonusEnabled: rule.BonusPoints > 0,
        bonus: rule.BonusPoints || 10
    };
}

function extractTimerState(timing?: TimingRules): TimerRulesState {
    return {
        enabled: !!timing?.InitialRemainingTime,
        initial: DataTypeHelpers.parseTimeSpanAsMinutes(timing?.InitialRemainingTime) ?? 30,
        warnEnabled: !!timing?.WarnIfRemaining,
        warn: DataTypeHelpers.parseTimeSpanAsMinutes(timing?.WarnIfRemaining) ?? 5,
        alertEnabled: !!timing?.AlertIfRemaining,
        alert: DataTypeHelpers.parseTimeSpanAsMinutes(timing?.AlertIfRemaining) ?? 0
    };
}

export function useMatchRulesForm(initialRules: MatchRules): [MatchRulesFormState, MatchRulesFormActions] {
    // General Rules
    const [general, setGeneralState] = useState<GeneralRulesState>({
        competitionName: initialRules.CompetitionName,
        competitionFullName: initialRules.CompetitionFullName || "",
        quizzersPerTeam: initialRules.QuizzersPerTeam,
        maxTimeouts: initialRules.MaxTimeouts
    });

    // Quiz Out Forward
    const [quizOutForward, setQuizOutForwardState] = useState<QuizOutState>(
        extractQuizOutState(initialRules.QuizOutForward)
    );

    // Quiz Out Backward
    const [quizOutBackward, setQuizOutBackwardState] = useState<QuizOutState>(
        extractQuizOutState(initialRules.QuizOutBackward)
    );

    // Contest Rules
    const [contests, setContestsState] = useState<ContestRulesState>({
        contestLabel: initialRules.ContestRules.ContestLabel,
        maxSuccessfulEnabled: !!initialRules.ContestRules.MaxSuccessfulContests,
        maxSuccessful: initialRules.ContestRules.MaxSuccessfulContests ?? 2,
        maxUnsuccessfulEnabled: !!initialRules.ContestRules.MaxUnsuccessfulContests,
        maxUnsuccessful: initialRules.ContestRules.MaxUnsuccessfulContests ?? 3,
        unsuccessfulFoulsEnabled: !!initialRules.ContestRules.UnsuccessfulContestsWithoutFouls,
        unsuccessfulFouls: initialRules.ContestRules.UnsuccessfulContestsWithoutFouls ?? 2
    });

    // Question Counts
    const [questionCounts, setQuestionCountsState] = useState<QuestionCountsState>({
        count10s: initialRules.PointValueCounts[10] ?? 0,
        count20s: initialRules.PointValueCounts[20] ?? 0,
        count30s: initialRules.PointValueCounts[30] ?? 0
    });

    // Other Rules
    const [otherRules, setOtherRulesState] = useState<OtherRulesState>({
        foulPoints: initialRules.FoulPoints,
        incorrectMultiplier: initialRules.IncorrectPointMultiplier < -0.6 ? "full" : "half"
    });

    // Timer Rules
    const [timer, setTimerState] = useState<TimerRulesState>(
        extractTimerState(initialRules.TimingRules)
    );

    // Meta state
    const [validationError, setValidationError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        setHasChanges(true);
    }, [general, quizOutForward, quizOutBackward, contests, questionCounts, otherRules, timer]);

    // Partial update helpers
    const setGeneral = useCallback((updates: Partial<GeneralRulesState>) => {
        setGeneralState(prev => ({ ...prev, ...updates }));
    }, []);

    const setQuizOutForward = useCallback((updates: Partial<QuizOutState>) => {
        setQuizOutForwardState(prev => ({ ...prev, ...updates }));
    }, []);

    const setQuizOutBackward = useCallback((updates: Partial<QuizOutState>) => {
        setQuizOutBackwardState(prev => ({ ...prev, ...updates }));
    }, []);

    const setContests = useCallback((updates: Partial<ContestRulesState>) => {
        setContestsState(prev => ({ ...prev, ...updates }));
    }, []);

    const setQuestionCounts = useCallback((updates: Partial<QuestionCountsState>) => {
        setQuestionCountsState(prev => ({ ...prev, ...updates }));
    }, []);

    const setOtherRules = useCallback((updates: Partial<OtherRulesState>) => {
        setOtherRulesState(prev => ({ ...prev, ...updates }));
    }, []);

    const setTimer = useCallback((updates: Partial<TimerRulesState>) => {
        setTimerState(prev => ({ ...prev, ...updates }));
    }, []);

    // Load rules into state
    const loadRules = useCallback((rules: MatchRules) => {
        setGeneralState({
            competitionName: rules.CompetitionName,
            competitionFullName: rules.CompetitionFullName || "",
            quizzersPerTeam: rules.QuizzersPerTeam,
            maxTimeouts: rules.MaxTimeouts
        });

        setQuizOutForwardState(extractQuizOutState(rules.QuizOutForward));
        setQuizOutBackwardState(extractQuizOutState(rules.QuizOutBackward));

        setContestsState({
            contestLabel: rules.ContestRules.ContestLabel,
            maxSuccessfulEnabled: !!rules.ContestRules.MaxSuccessfulContests,
            maxSuccessful: rules.ContestRules.MaxSuccessfulContests ?? 2,
            maxUnsuccessfulEnabled: !!rules.ContestRules.MaxUnsuccessfulContests,
            maxUnsuccessful: rules.ContestRules.MaxUnsuccessfulContests ?? 3,
            unsuccessfulFoulsEnabled: !!rules.ContestRules.UnsuccessfulContestsWithoutFouls,
            unsuccessfulFouls: rules.ContestRules.UnsuccessfulContestsWithoutFouls ?? 2
        });

        setQuestionCountsState({
            count10s: rules.PointValueCounts[10] ?? 0,
            count20s: rules.PointValueCounts[20] ?? 0,
            count30s: rules.PointValueCounts[30] ?? 0
        });

        setOtherRulesState({
            foulPoints: rules.FoulPoints,
            incorrectMultiplier: rules.IncorrectPointMultiplier < -0.6 ? "full" : "half"
        });

        setTimerState(extractTimerState(rules.TimingRules));

        setHasChanges(false);
        setValidationError(null);
    }, []);

    // Build MatchRules from state
    const buildMatchRules = useCallback((defaultType: CompetitionType, originalRules: MatchRules): MatchRules => {
        const newRules = new MatchRules();
        newRules.CompetitionName = general.competitionName;
        newRules.CompetitionFullName = general.competitionFullName || undefined;
        newRules.Type = defaultType;
        newRules.QuizzersPerTeam = general.quizzersPerTeam;
        newRules.MaxTimeouts = general.maxTimeouts;

        const qoForward = new QuizOutRule();
        qoForward.QuestionCount = quizOutForward.questions;
        qoForward.FoulCount = quizOutForward.foulsEnabled ? quizOutForward.fouls : undefined;
        qoForward.BonusPoints = quizOutForward.bonusEnabled ? quizOutForward.bonus : 0;
        newRules.QuizOutForward = qoForward;

        const qoBackward = new QuizOutRule();
        qoBackward.QuestionCount = quizOutBackward.questions;
        qoBackward.FoulCount = quizOutBackward.foulsEnabled ? quizOutBackward.fouls : undefined;
        qoBackward.BonusPoints = quizOutBackward.bonusEnabled ? quizOutBackward.bonus : 0;
        newRules.QuizOutBackward = qoBackward;

        const contestRules = new ContestRules();
        contestRules.ContestLabel = contests.contestLabel;
        contestRules.MaxSuccessfulContests = contests.maxSuccessfulEnabled ? contests.maxSuccessful : undefined;
        contestRules.MaxUnsuccessfulContests = contests.maxUnsuccessfulEnabled ? contests.maxUnsuccessful : undefined;
        contestRules.UnsuccessfulContestsWithoutFouls = contests.unsuccessfulFoulsEnabled ? contests.unsuccessfulFouls : undefined;
        contestRules.AreContestsRulings = originalRules.ContestRules.AreContestsRulings;
        newRules.ContestRules = contestRules;

        newRules.PointValueCounts = {
            10: questionCounts.count10s,
            20: questionCounts.count20s,
            30: questionCounts.count30s
        };
        newRules.FoulPoints = otherRules.foulPoints;
        newRules.IncorrectPointMultiplier = otherRules.incorrectMultiplier === "full" ? -1 : -0.5;

        if (timer.enabled) {
            const timing = new TimingRules();
            timing.InitialRemainingTime = DataTypeHelpers.formatTimeSpan(0, timer.initial);
            timing.WarnIfRemaining = timer.warnEnabled ? DataTypeHelpers.formatTimeSpan(0, timer.warn) : undefined;
            timing.AlertIfRemaining = timer.alertEnabled ? DataTypeHelpers.formatTimeSpan(0, timer.alert) : undefined;
            newRules.TimingRules = timing;
        }

        newRules.IsIndividualCompetition = originalRules.IsIndividualCompetition;
        newRules.PointValueRules = originalRules.PointValueRules;
        newRules.RequiredScoreReading = originalRules.RequiredScoreReading;

        return newRules;
    }, [general, quizOutForward, quizOutBackward, contests, questionCounts, otherRules, timer]);

    // Validate rules
    const validate = useCallback((): string | null => {
        const totalQuestions = questionCounts.count10s + questionCounts.count20s + questionCounts.count30s;

        if (quizOutForward.questions > totalQuestions) {
            return `Quiz Out Forward after ${quizOutForward.questions} question(s) exceeds the ${totalQuestions} question(s) in the match.`;
        }
        if (quizOutBackward.questions > totalQuestions) {
            return `Quiz Out Backward after ${quizOutBackward.questions} question(s) exceeds the ${totalQuestions} question(s) in the match.`;
        }
        if (totalQuestions > 20) {
            return "Scoring software doesn't currently support more than 20 questions.";
        }
        if (timer.enabled) {
            if (timer.warnEnabled && timer.initial < timer.warn) {
                return "If a countdown timer warning is set, it cannot be a larger number than the initial timer.";
            }
            if (timer.alertEnabled && timer.initial < timer.alert) {
                return "If a countdown timer alert is set, it cannot be a larger number than the initial timer.";
            }
            if (timer.warnEnabled && timer.alertEnabled && timer.warn < timer.alert) {
                return "If both countdown timer warning and alert are set, the warning must be a larger number than the alert.";
            }
        }
        return null;
    }, [quizOutForward.questions, quizOutBackward.questions, questionCounts, timer]);

    const state: MatchRulesFormState = {
        general,
        quizOutForward,
        quizOutBackward,
        contests,
        questionCounts,
        otherRules,
        timer,
        validationError,
        hasChanges
    };

    const actions: MatchRulesFormActions = {
        setGeneral,
        setQuizOutForward,
        setQuizOutBackward,
        setContests,
        setQuestionCounts,
        setOtherRules,
        setTimer,
        loadRules,
        buildMatchRules,
        validate,
    };

    return [state, actions];
}