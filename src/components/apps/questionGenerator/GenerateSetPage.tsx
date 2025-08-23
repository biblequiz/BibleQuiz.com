import { useState } from "react";
import { sharedDirtyWindowState } from "../../../utils/SharedState";
import { QuestionLanguage, QuestionTypeFilter } from "../../../types/services/QuestionGeneratorService";
import settings from "../../../data/generated/questionGenerator.json";
import type { JbqQuestionGeneratorSettings } from "../../../types/QuestionGeneratorSettings";
import QuestionModeSelector, { QuestionMode } from "./QuestionModeSelector";
import GeneralCriteriaSelector, { type GeneralCriteria } from "./GeneralCriteriaSelector";
import TemplateSelector, { CriteriaTemplateType } from "./TemplateSelector";
import type { CustomRules } from "./CustomRulesSelector";
import CustomRulesSelector from "./CustomRulesSelector";
import { QuestionSelectionType } from "./QuestionSelector";

interface Props {
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

export default function GenerateSetPage({ }: Props) {

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

    return (
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
        </form>);
}