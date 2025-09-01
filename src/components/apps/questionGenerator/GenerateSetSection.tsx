import { useEffect, useState } from "react";
import { sharedDirtyWindowState, sharedGlobalStatusToast } from 'utils/SharedState';
import { DuplicateQuestionMode, QuestionGeneratorService, QuestionLanguage, QuestionPositionRequirement, QuestionSelectionCriteria, QuestionTypeFilter } from 'types/services/QuestionGeneratorService';
import settings from 'data/generated/questionGenerator.json';
import type { JbqQuestionGeneratorSettings } from 'types/QuestionGeneratorSettings';
import QuestionModeSelector, { QuestionMode } from './QuestionModeSelector';
import GeneralCriteriaSelector, { type GeneralCriteria } from './GeneralCriteriaSelector';
import TemplateSelector, { CriteriaTemplateType } from './TemplateSelector';
import type { CustomRules } from './CustomRulesSelector';
import CustomRulesSelector from './CustomRulesSelector';
import { QuestionSelectionType } from './QuestionSelector';
import { PointValueOrdering } from './PointValueCountSelector';
import { AuthManager } from 'types/AuthManager';
import { useNavigate, useParams } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    generateSetElement: React.RefObject<HTMLDivElement | null>;
}

const getGeneratorCriteria = (
    general: GeneralCriteria,
    mode: QuestionMode,
    template: CriteriaTemplateType,
    custom: CustomRules): QuestionSelectionCriteria => {

    const criteria = new QuestionSelectionCriteria();
    criteria.Title = general.title!;
    criteria.Matches = general.rounds;
    criteria.Season = general.season;
    criteria.Language = general.language;

    criteria.Mode = mode;
    criteria.Rules = template;

    criteria.PointValueCounts ??= {};
    criteria.SubstituteQuestions ??= [];
    criteria.OvertimeQuestions ??= {};
    switch (template) {
        case CriteriaTemplateType.BibleDiscoverer:
            criteria.PointValueCounts[10] = 30;

            criteria.Duplicates = DuplicateQuestionMode.NoDuplicates;
            break;

        case CriteriaTemplateType.BibleSearcher:
            criteria.PointValueCounts[10] = 30;
            criteria.PointValueCounts[20] = 20;

            criteria.Duplicates = DuplicateQuestionMode.NoDuplicates;
            break;

        case CriteriaTemplateType.BibleAchiever:
        case CriteriaTemplateType.BibleMaster:
            criteria.PointValueCounts[10] = 30;
            criteria.PointValueCounts[20] = 20;
            criteria.PointValueCounts[30] = 10;

            criteria.Duplicates = DuplicateQuestionMode.NoDuplicates;
            break;

        case CriteriaTemplateType.BibleQuoter:
            criteria.PointValueCounts[10] = 11; // All 10-point quotation questions
            criteria.PointValueCounts[20] = 33; // All 20-point quotation questions
            criteria.PointValueCounts[30] = 51; // All 30-point quotation questions

            criteria.PointValueRules = {};
            criteria.PointValueRules[10] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: null };
            criteria.PointValueRules[20] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: null };
            criteria.PointValueRules[30] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: null };

            criteria.QuestionTypes = QuestionTypeFilter.QuotationOnly;
            criteria.Duplicates = DuplicateQuestionMode.NoDuplicates;
            break;

        case CriteriaTemplateType.Beginner:
            criteria.PointValueCounts[10] = 20;
            criteria.SubstituteQuestions = [10, 10, 10];
            criteria.OvertimeQuestions[10] = 3;

            criteria.Duplicates = DuplicateQuestionMode.AllowDuplicatesInOtherMatches;
            break;

        case CriteriaTemplateType.Intermediate:
            criteria.PointValueCounts[10] = 12;
            criteria.PointValueCounts[20] = 8;

            criteria.PointValueRules = {};
            criteria.PointValueRules[10] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: null };
            criteria.PointValueRules[20] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: 3 };

            criteria.SubstituteQuestions = [10, 20, 10];
            criteria.OvertimeQuestions[10] = 2;
            criteria.OvertimeQuestions[20] = 1;

            criteria.Duplicates = DuplicateQuestionMode.AllowDuplicatesInOtherMatches;
            break;

        case CriteriaTemplateType.Advanced:
            criteria.PointValueCounts[10] = 10;
            criteria.PointValueCounts[20] = 7;
            criteria.PointValueCounts[30] = 3;

            criteria.PointValueRules = {};
            criteria.PointValueRules[10] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: null };
            criteria.PointValueRules[20] = { AllowConsecutive: true, First: QuestionPositionRequirement.Allowed, Last: QuestionPositionRequirement.Allowed, PerHalfCount: 3 };
            criteria.PointValueRules[30] = { AllowConsecutive: false, First: QuestionPositionRequirement.NotAllowed, Last: QuestionPositionRequirement.NotAllowed, PerHalfCount: 1 };

            criteria.SubstituteQuestions = [10, 20, 30];
            criteria.OvertimeQuestions[10] = 1;
            criteria.OvertimeQuestions[20] = 1;
            criteria.OvertimeQuestions[30] = 1;

            criteria.Duplicates = DuplicateQuestionMode.AllowDuplicatesInOtherMatches;
            break;

        case CriteriaTemplateType.Custom:

            switch (custom.regularQuestions.type) {
                case PointValueOrdering.Manual:
                    criteria.PointValueCounts = null;
                    criteria.RegularPointOverride = custom.regularQuestions.manualOrder!;
                    break;
                default:
                    criteria.PointValueCounts = custom.regularQuestions.counts;
                    criteria.RegularPointOverride = null;
                    break;
            }

            for (const pointValue in custom.substituteQuestions.counts!) {
                const points = Number(pointValue);
                const count = custom.substituteQuestions.counts[points];
                for (let i = 0; i < count; i++) {
                    criteria.SubstituteQuestions.push(points);
                }
            }

            criteria.OvertimeQuestions = custom.overtimeQuestions.counts;

            criteria.QuestionTypes = custom.questionFilter;
            criteria.Duplicates = custom.other.duplicates;

            criteria.PointValueRules = custom.other.pointValueRules;

            switch (custom.questionCriteria.type) {
                case QuestionSelectionType.Group:
                    criteria.CategoryGroups = Array.from(custom.questionCriteria.groups!);
                    break;
                case QuestionSelectionType.Category:
                    criteria.Categories = Array.from(custom.questionCriteria.categories!);
                    break;
                case QuestionSelectionType.Range:
                    criteria.QuestionRanges = Array.from(custom.questionCriteria.ranges!);
                    break;
                default:
                    throw new Error(`Unknown mode ${custom.questionCriteria.type}`);
            }
    }

    return criteria;
}

const ensureAllPointValuesPresent = (counts: Record<number, number>): void => {
    if (counts[10] === undefined) {
        counts[10] = 0;
    }

    if (counts[20] === undefined) {
        counts[20] = 0;
    }

    if (counts[30] === undefined) {
        counts[30] = 0;
    }
};

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

const DEFAULT_QUESTION_MODE = QuestionMode.Competition;
const DEFAULT_TEMPLATE = CriteriaTemplateType.Beginner;

const DEFAULT_GENERAL_CRITERIA: GeneralCriteria = {
    title: "",
    rounds: 1,
    season: GENERATOR_SETTINGS.CurrentSeason,
    language: QuestionLanguage.English
};

const DEFAULT_CUSTOM_RULES: CustomRules = {
    regularQuestions: { counts: { 10: 10, 20: 7, 30: 3 }, manualOrder: [], type: PointValueOrdering.Random },
    substituteQuestions: { counts: { 10: 1, 20: 1, 30: 1 } },
    overtimeQuestions: { counts: { 10: 1, 20: 1, 30: 1 } },
    questionFilter: QuestionTypeFilter.All,
    questionCriteria: {
        type: QuestionSelectionType.Group,
        groups: new Set<number>(
            Array.from({ length: GENERATOR_SETTINGS.GroupCategoryKeys.length }, (_, i) => i + 1)),
        categories: new Set<string>(GENERATOR_SETTINGS.OrderedCategoryKeys),
        ranges: []
    },
    other: {
        duplicates: DuplicateQuestionMode.NoDuplicates,
        pointValueRules: {
            10: {
                First: QuestionPositionRequirement.Allowed,
                Last: QuestionPositionRequirement.Allowed,
                AllowConsecutive: true,
                PerHalfCount: 0
            },
            20: {
                First: QuestionPositionRequirement.Allowed,
                Last: QuestionPositionRequirement.Allowed,
                AllowConsecutive: true,
                PerHalfCount: 3
            },
            30: {
                First: QuestionPositionRequirement.NotAllowed,
                Last: QuestionPositionRequirement.NotAllowed,
                AllowConsecutive: false,
                PerHalfCount: 1
            }
        }
    }
};

export default function GenerateSetSection({ generateSetElement }: Props) {

    const auth = AuthManager.useNanoStore();
    const navigate = useNavigate();
    const { setId: previousSetId } = useParams<{ setId: string }>();

    const [isLoading, setIsLoading] = useState<boolean>(previousSetId ? true : false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [generalCriteria, setGeneralCriteria] = useState<GeneralCriteria>(DEFAULT_GENERAL_CRITERIA);
    const [mode, setMode] = useState<QuestionMode>(DEFAULT_QUESTION_MODE);
    const [templateType, setTemplateType] = useState<CriteriaTemplateType>(DEFAULT_TEMPLATE);
    const [customRules, setCustomRules] = useState<CustomRules>(DEFAULT_CUSTOM_RULES);

    useEffect(() => {
        if (previousSetId) {
            setIsLoading(true);
            setLoadingError(null);

            QuestionGeneratorService.getPreviousSetCriteria(auth, previousSetId)
                .then(previousSet => {
                    setGeneralCriteria({
                        title: previousSet.Title ?? undefined,
                        rounds: previousSet.Matches,
                        season: previousSet.Season,
                        language: previousSet.Language
                    });

                    setMode(QuestionMode[previousSet.Mode as keyof typeof QuestionMode] ?? QuestionMode.Competition);
                    setTemplateType(CriteriaTemplateType[previousSet.Rules as keyof typeof CriteriaTemplateType] ?? CriteriaTemplateType.Beginner);

                    if (previousSet.Rules === CriteriaTemplateType.Custom) {

                        const newSubstituteCounts: Record<number, number> = {};
                        for (const points of previousSet.SubstituteQuestions ?? []) {
                            newSubstituteCounts[points] = (newSubstituteCounts[points] || 0) + 1;
                        }

                        ensureAllPointValuesPresent(previousSet.PointValueCounts ??= DEFAULT_CUSTOM_RULES.regularQuestions.counts);
                        ensureAllPointValuesPresent(newSubstituteCounts);
                        ensureAllPointValuesPresent(previousSet.OvertimeQuestions ??= {});

                        const regularOrderingType = previousSet.RegularPointOverride
                            ? PointValueOrdering.Manual
                            : PointValueOrdering.Random;

                        const pointValueRules =
                            regularOrderingType === PointValueOrdering.Manual
                                ? DEFAULT_CUSTOM_RULES.other.pointValueRules
                                : {
                                    10: previousSet.PointValueRules?.[10] ?? DEFAULT_CUSTOM_RULES.other.pointValueRules[10],
                                    20: previousSet.PointValueRules?.[20] ?? DEFAULT_CUSTOM_RULES.other.pointValueRules[20],
                                    30: previousSet.PointValueRules?.[30] ?? DEFAULT_CUSTOM_RULES.other.pointValueRules[30]
                                };

                        setCustomRules({
                            regularQuestions: {
                                counts: previousSet.PointValueCounts,
                                manualOrder: previousSet.RegularPointOverride ?? DEFAULT_CUSTOM_RULES.regularQuestions.manualOrder,
                                type: regularOrderingType
                            },
                            substituteQuestions: { counts: newSubstituteCounts },
                            overtimeQuestions: { counts: previousSet.OvertimeQuestions },
                            questionFilter: previousSet.QuestionTypes,
                            questionCriteria: {
                                type: previousSet.Categories
                                    ? QuestionSelectionType.Category
                                    : (previousSet.QuestionRanges ? QuestionSelectionType.Range : QuestionSelectionType.Group),
                                groups: new Set<number>(previousSet.CategoryGroups ?? DEFAULT_CUSTOM_RULES.questionCriteria.groups),
                                categories: new Set<string>(previousSet.Categories ?? GENERATOR_SETTINGS.OrderedCategoryKeys),
                                ranges: previousSet.QuestionRanges ?? []
                            },
                            other: {
                                duplicates: previousSet.Duplicates,
                                pointValueRules: pointValueRules
                            }
                        });
                    }
                    else {
                        setCustomRules(DEFAULT_CUSTOM_RULES);
                    }
                })
                .catch(error => {
                    setLoadingError(error.message);
                })
                .finally(
                    () => setIsLoading(false));
        }
        else {
            setGeneralCriteria(DEFAULT_GENERAL_CRITERIA);
            setMode(DEFAULT_QUESTION_MODE);
            setTemplateType(DEFAULT_TEMPLATE);
            setCustomRules(DEFAULT_CUSTOM_RULES);
        }
    }, [previousSetId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const criteria = getGeneratorCriteria(generalCriteria, mode, templateType, customRules);

        setIsSubmitting(true);

        QuestionGeneratorService.selectQuestions(auth, criteria)
            .then((result) => {
                sharedDirtyWindowState.set(false);
                navigate(`/print/${result.Id}`);
            })
            .finally(() => setIsSubmitting(false));
    };

    return (
        <div className="overflow-x-auto" ref={generateSetElement}>
            <h4>Generate New Set</h4>
            {isLoading && (
                <div className="gap-2 flex justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <span className="italic">Loading configuration from previously generated set ...</span>
                </div>
            )}
            {loadingError && (
                <div className={`alert alert-error flex flex-col`}>
                    <div className="flex-1 gap-2">
                        <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />
                        <span>{loadingError}</span>
                    </div>
                </div>)}
            {!isLoading && !loadingError && (
                <form id="generatorForm" className="space-y-6" onSubmit={handleSubmit}>

                    <GeneralCriteriaSelector
                        criteria={generalCriteria}
                        setCriteria={c => {
                            setGeneralCriteria(c);
                            sharedDirtyWindowState.set(true);
                        }} />

                    <QuestionModeSelector
                        mode={mode}
                        setMode={m => {
                            setMode(m);

                            if (m === QuestionMode.Competition) {
                                setTemplateType(CriteriaTemplateType.Beginner);
                            }
                            else {
                                setTemplateType(CriteriaTemplateType.BibleDiscoverer);
                            }

                            sharedDirtyWindowState.set(true);
                        }} />

                    <TemplateSelector
                        mode={mode}
                        template={templateType}
                        setTemplate={t => {
                            setTemplateType(t);
                            sharedDirtyWindowState.set(true);
                        }} />

                    {templateType === CriteriaTemplateType.Custom && (
                        <CustomRulesSelector
                            criteria={customRules}
                            setCriteria={c => {
                                setCustomRules(c);
                                sharedDirtyWindowState.set(true);
                            }} />)}

                    <div className="w-full text-right flex justify-end gap-2">
                        <button
                            className="btn btn-primary mt-0"
                            type="submit"
                            form="generatorForm"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && (<span className="loading loading-spinner loading-md"></span>)}
                            <span>Generate New Set</span>
                        </button>
                    </div>
                </form>)}
        </div>);
}