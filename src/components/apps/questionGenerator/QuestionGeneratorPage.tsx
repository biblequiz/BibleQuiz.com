import { useEffect, useState } from "react";
import { sharedDirtyWindowState } from "../../../utils/SharedState";
import { getOptionalPermissionCheckAlert } from "../../auth/PermissionCheckAlert";
import CollapsibleSection from "../../CollapsibleSection";
import { QuestionLanguage, QuestionTypeFilter } from "../../../types/services/QuestionGeneratorService";
import settings from "../../../data/generated/questionGenerator.json";
import type { JbqQuestionGeneratorSettings } from "../../../types/QuestionGeneratorSettings";
import { AuthManager } from "../../../types/AuthManager";
import PreviousSetsSection from "./PreviousSetsSection";
import QuestionModeSelector, { QuestionMode } from "./QuestionModeSelector";
import GeneralCriteriaSelector, { type GeneralCriteria } from "./GeneralCriteriaSelector";
import TemplateSelector, { CriteriaTemplateType } from "./TemplateSelector";
import type { CustomRules } from "./CustomRulesSelector";
import CustomRulesSelector from "./CustomRulesSelector";
import { QuestionSelectionType } from "./QuestionSelector";

interface Props {
    loadingElementId: string;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

export default function QuestionGeneratorPage({ loadingElementId }: Props) {

    const authManager = AuthManager.useNanoStore();
    const permissionAlert = getOptionalPermissionCheckAlert(authManager);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    const [hasPreviousSets, setHasPreviousSets] = useState<boolean>(true);
    const [generalCriteria, setGeneralCriteria] = useState<GeneralCriteria>({
        rounds: 1,
        season: GENERATOR_SETTINGS.CurrentSeason,
        language: QuestionLanguage.English
    });

    const [mode, setMode] = useState<QuestionMode>(QuestionMode.Competition);
    const [templateType, setTemplateType] = useState<CriteriaTemplateType>(CriteriaTemplateType.Beginner);
    const [customRules, setCustomRules] = useState<CustomRules>({
        regularPointValueCounts: { 10: 10, 20: 7, 30: 3 },
        substitutePointValueCounts: { 10: 1, 20: 1, 30: 1 },
        overtimePointValueCounts: { 10: 1, 20: 1, 30: 1 },
        questionFilter: QuestionTypeFilter.All,
        questionCriteria: { type: QuestionSelectionType.Group },
    });

    if (permissionAlert) {
        return permissionAlert;
    }

    return (
        <>
            {hasPreviousSets && (<CollapsibleSection
                pageId="question-generator"
                title="Previously Generated Sets"
                titleClass="mt-4"
                allowMultipleOpen={false}
                defaultOpen={true}>
                <PreviousSetsSection onSetsLoaded={c => setHasPreviousSets(c > 0)} />
            </CollapsibleSection>)}
            <CollapsibleSection
                pageId="question-generator"
                title="Generate New Set"
                titleClass="mt-4"
                allowMultipleOpen={false}
                forceOpen={!hasPreviousSets}>

                <form id="generatorForm" className="space-y-6">

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
                </form>
            </CollapsibleSection >
        </>);
}