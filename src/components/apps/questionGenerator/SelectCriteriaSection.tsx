import { useRef, useState } from "react";
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
import FontAwesomeIcon from "components/FontAwesomeIcon";
import CriteriaSummaryDialog from "./CriteriaSummaryDialog";
import SaveAsTemplateDialog from "./SaveAsTemplateDialog";

interface Props {
    generateSetElement: React.RefObject<HTMLDivElement | null>;
    isGeneratingSet: boolean;
    onGenerateSet: (criteria: QuestionSelectionCriteria) => void;
}

const getGeneratorCriteria = (
    general: GeneralCriteria,
    mode: QuestionMode,
    template: CriteriaTemplateType | string,
    custom: CustomRules): QuestionSelectionCriteria => {

    const criteria = new QuestionSelectionCriteria();
    criteria.Matches = general.rounds;
    criteria.Season = general.season;
    criteria.Language = general.language;

    criteria.Mode = mode;
    criteria.Rules = template;

    criteria.PointValueCounts ??= {};
    criteria.SubstituteQuestions ??= [];
    criteria.OvertimeQuestions ??= {};

    if (mode === QuestionMode.MyTemplates) {
        template = CriteriaTemplateType.Custom;
    }

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
        ranges: [{ Start: 1, End: 288 }, { Start: 289, End: 480 }, { Start: 481, End: 576 }]
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

export default function SelectCriteriaSection({
    generateSetElement,
    isGeneratingSet,
    onGenerateSet }: Props) {

    const auth = AuthManager.useNanoStore();

    const [isValidatingSet, setIsValidatingSet] = useState<boolean>(false);
    const [savingAsTemplate, setSavingAsTemplate] = useState<QuestionSelectionCriteria | null>(null);
    const [generalCriteria, setGeneralCriteria] = useState<GeneralCriteria>(DEFAULT_GENERAL_CRITERIA);
    const [customTemplates, setCustomTemplates] = useState<Record<string, QuestionSelectionCriteria> | null>(null);
    const [mode, setMode] = useState<QuestionMode>(DEFAULT_QUESTION_MODE);
    const [templateType, setTemplateType] = useState<CriteriaTemplateType | string | null>(DEFAULT_TEMPLATE);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [customRules, setCustomRules] = useState<CustomRules>(DEFAULT_CUSTOM_RULES);
    const [dialogTemplateId, setDialogTemplateId] = useState<string | null>(null);

    const setCustomTemplateType = (
        allTemplates: Record<string, QuestionSelectionCriteria> | null,
        templateId: string | null) => {

        // Resolve the template ID.
        if (!allTemplates) {
            return;
        }

        if (!templateId) {
            templateId = Object.keys(allTemplates)[0] ?? null;

            if (!templateId) {
                setTemplateType(null);
                return;
            }
        }

        setTemplateType(templateId);

        const criteria = allTemplates[templateId];

        // Apply the criteria from the template.
        const newSubstituteCounts: Record<number, number> = {};
        for (const points of criteria.SubstituteQuestions ?? []) {
            newSubstituteCounts[points] = (newSubstituteCounts[points] || 0) + 1;
        }

        ensureAllPointValuesPresent(criteria.PointValueCounts ??= DEFAULT_CUSTOM_RULES.regularQuestions.counts);
        ensureAllPointValuesPresent(newSubstituteCounts);
        ensureAllPointValuesPresent(criteria.OvertimeQuestions ??= {});

        const regularOrderingType = criteria.RegularPointOverride
            ? PointValueOrdering.Manual
            : PointValueOrdering.Random;

        const pointValueRules =
            regularOrderingType === PointValueOrdering.Manual
                ? DEFAULT_CUSTOM_RULES.other.pointValueRules
                : {
                    10: criteria.PointValueRules?.[10] ?? DEFAULT_CUSTOM_RULES.other.pointValueRules[10],
                    20: criteria.PointValueRules?.[20] ?? DEFAULT_CUSTOM_RULES.other.pointValueRules[20],
                    30: criteria.PointValueRules?.[30] ?? DEFAULT_CUSTOM_RULES.other.pointValueRules[30]
                };

        setCustomRules({
            regularQuestions: {
                counts: criteria.PointValueCounts,
                manualOrder: criteria.RegularPointOverride ?? DEFAULT_CUSTOM_RULES.regularQuestions.manualOrder,
                type: regularOrderingType
            },
            substituteQuestions: { counts: newSubstituteCounts },
            overtimeQuestions: { counts: criteria.OvertimeQuestions },
            questionFilter: criteria.QuestionTypes,
            questionCriteria: {
                type: criteria.Categories
                    ? QuestionSelectionType.Category
                    : (criteria.QuestionRanges ? QuestionSelectionType.Range : QuestionSelectionType.Group),
                groups: new Set<number>(criteria.CategoryGroups ?? DEFAULT_CUSTOM_RULES.questionCriteria.groups),
                categories: new Set<string>(criteria.Categories ?? GENERATOR_SETTINGS.OrderedCategoryKeys),
                ranges: criteria.QuestionRanges ?? []
            },
            other: {
                duplicates: criteria.Duplicates,
                pointValueRules: pointValueRules
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const criteria = getGeneratorCriteria(generalCriteria, mode, templateType!, customRules);
        criteria.Title = "PlaceholderTitle";

        setIsValidatingSet(true);

        sharedGlobalStatusToast.set({
            type: "success",
            title: "Validating",
            message: "We are validating your set now ...",
            showLoading: true,
            keepOpen: true,
        });

        QuestionGeneratorService.validateCriteria(auth, criteria)
            .then((result) => {
                sharedDirtyWindowState.set(false);
                sharedGlobalStatusToast.set(null);

                result.Title = "";
                onGenerateSet(result);

                setIsValidatingSet(false);
            })
            .finally(() => {
                setIsValidatingSet(false);
            });
    };

    const handleSaveAsTemplate = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        // Validate the form before proceeding
        if (formRef.current && !formRef.current.checkValidity()) {
            // This will show the browser's default validation messages
            formRef.current.reportValidity();
            return;
        }

        const criteria = getGeneratorCriteria(generalCriteria, mode, templateType!, customRules);
        criteria.Title = "PlaceholderTitle";

        setIsValidatingSet(true);

        sharedGlobalStatusToast.set({
            type: "success",
            title: "Validating",
            message: "We are validating your set now ...",
            showLoading: true,
            keepOpen: true,
        });

        QuestionGeneratorService.validateCriteria(auth, criteria)
            .then((result) => {
                sharedGlobalStatusToast.set(null);

                result.Title = "";

                if (customTemplates && templateType) {
                    const customTemplate = customTemplates[templateType];
                    if (customTemplate) {
                        result.Title = `${customTemplate.Title} (1)`;
                    }
                }

                result.Mode = QuestionMode.BibleMaster;
                result.Rules = CriteriaTemplateType.Custom;
                result.Seed = null;

                setSavingAsTemplate(result);

                setIsValidatingSet(false);
            })
            .finally(() => {
                setIsValidatingSet(false);
            });
    };

    const formRef = useRef<HTMLFormElement>(null);

    return (
        <div className="overflow-x-auto" ref={generateSetElement}>
            <h4>Generate New Set</h4>
            <form ref={formRef} id="generatorForm" className="space-y-6" onSubmit={handleSubmit}>

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

                        switch (m) {
                            case QuestionMode.Competition:
                                setTemplateType(CriteriaTemplateType.Beginner);
                                break;
                            case QuestionMode.MyTemplates:
                                setCustomTemplateType(customTemplates, null);
                                break;
                            default:
                                setTemplateType(CriteriaTemplateType.BibleDiscoverer);
                                break;
                        }

                        sharedDirtyWindowState.set(true);
                    }}
                    isLoadingTemplates={isLoadingTemplates}
                />

                <TemplateSelector
                    mode={mode}
                    template={templateType}
                    setTemplate={t => {

                        if (mode === QuestionMode.MyTemplates) {
                            setCustomTemplateType(customTemplates, t as string);
                        }
                        else {
                            setTemplateType(t as CriteriaTemplateType);
                        }

                        sharedDirtyWindowState.set(true);
                    }}
                    customTemplates={customTemplates}
                    setCustomTemplates={templates => {
                        setCustomTemplates(templates);

                        if (mode === QuestionMode.MyTemplates) {
                            setCustomTemplateType(templates, null);
                        }
                    }}
                    setIsLoadingTemplates={setIsLoadingTemplates}
                    setDialogTemplateId={setDialogTemplateId} />

                {templateType && (templateType === CriteriaTemplateType.Custom || (customTemplates && mode === QuestionMode.MyTemplates)) && (
                    <CustomRulesSelector
                        criteria={customRules}
                        setCriteria={c => {
                            setCustomRules(c);
                            sharedDirtyWindowState.set(true);
                        }} />)}

                <div className="w-full text-right flex justify-end gap-2">
                    <button
                        className="btn btn-success mt-0"
                        type="submit"
                        form="generatorForm"
                        disabled={isGeneratingSet || isValidatingSet || !!savingAsTemplate || isLoadingTemplates || !templateType}
                    >
                        {isGeneratingSet && (<span className="loading loading-spinner loading-md"></span>)}
                        <span>Generate</span>
                    </button>
                    <button
                        className="btn btn-primary mt-0"
                        type="button"
                        disabled={isGeneratingSet || isValidatingSet || !!savingAsTemplate || isLoadingTemplates || !templateType || (mode !== QuestionMode.MyTemplates && templateType !== CriteriaTemplateType.Custom)}
                        onClick={handleSaveAsTemplate}
                    >
                        {savingAsTemplate && (<span className="loading loading-spinner loading-md"></span>)}
                        <span>Save as Template</span>
                    </button>
                    <button
                        className="btn btn-secondary mt-0"
                        type="button"
                        onClick={() => {
                            setGeneralCriteria(DEFAULT_GENERAL_CRITERIA);
                            setMode(DEFAULT_QUESTION_MODE);
                            setTemplateType(DEFAULT_TEMPLATE);
                            setCustomRules(DEFAULT_CUSTOM_RULES);
                        }}
                        disabled={isGeneratingSet || isValidatingSet || !!savingAsTemplate || isLoadingTemplates || !templateType}
                    >
                        <FontAwesomeIcon icon="fas faArrowRotateRight" />
                        <span>Reset</span>
                    </button>
                </div>
            </form>
            {savingAsTemplate && (
                <SaveAsTemplateDialog
                    templateId={mode === QuestionMode.MyTemplates ? templateType : null}
                    criteria={savingAsTemplate}
                    onClose={(newCriteria) => {
                        if (newCriteria) {
                            setCustomTemplates(templates => ({
                                ...templates,
                                [newCriteria.Id!]: newCriteria
                            }));
                        }

                        setSavingAsTemplate(null);
                    }}
                />
            )}
            {dialogTemplateId && customTemplates && customTemplates[dialogTemplateId] && (
                <CriteriaSummaryDialog
                    criteria={customTemplates[dialogTemplateId]}
                    onClose={() => setDialogTemplateId(null)}
                />
            )}
        </div>);
}