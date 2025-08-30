import { QuestionMode } from "./QuestionModeSelector";
import TemplateSelectorItem from "./TemplateSelectorItem";

interface Props {
    mode: QuestionMode;
    template: CriteriaTemplateType;
    setTemplate: (template: CriteriaTemplateType) => void;
}

export enum CriteriaTemplateType {
    BibleDiscoverer = "BibleDiscoverer",
    BibleSearcher = "BibleSearcher",
    BibleAchiever = "BibleAchiever",
    BibleMaster = "BibleMaster",
    BibleQuoter = "BibleQuoter",
    Beginner = "Beginner",
    Intermediate = "Intermediate",
    Advanced = "Advanced",
    Custom = "Custom",
}

export default function TemplateSelector({ mode, template, setTemplate }: Props) {

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
            <legend className="fieldset-legend">Template</legend>
            {mode === QuestionMode.Competition && (
                <>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.Beginner}
                        isSelected={template === CriteriaTemplateType.Beginner}
                        onChange={setTemplate}
                        title="Beginner">
                        Random set of 20 questions (10 points each).
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.Intermediate}
                        isSelected={template === CriteriaTemplateType.Intermediate}
                        onChange={setTemplate}
                        title="Intermediate">
                        Random set of 20 questions (12 x 10-point and 8 x 20-point questions).
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.Advanced}
                        isSelected={template === CriteriaTemplateType.Advanced}
                        onChange={setTemplate}
                        title="Advanced">
                        Random set of 20 questions (10 x 10-point, 7 x 20-point, and 3 x 30-point questions).
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.Custom}
                        isSelected={template === CriteriaTemplateType.Custom}
                        onChange={setTemplate}
                        title="Custom">
                        Manually configure the rules.
                    </TemplateSelectorItem>
                </>)}
            {mode === QuestionMode.BibleMaster && (
                <>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.BibleDiscoverer}
                        isSelected={template === CriteriaTemplateType.BibleDiscoverer}
                        onChange={setTemplate}
                        title="Bible Discoverer">
                        Random set of 30 questions (10 points each). To earn the seal, an individual must correctly answer 20 x 10-point questions.
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.BibleSearcher}
                        isSelected={template === CriteriaTemplateType.BibleSearcher}
                        onChange={setTemplate}
                        title="Bible Searcher">
                        Random set of 50 questions (30 x 10-point and 20 x 20-point questions). To earn the seal, an individual must correctly answer 25 10-point questions and 15 20-point questions.
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.BibleAchiever}
                        isSelected={template === CriteriaTemplateType.BibleAchiever}
                        onChange={setTemplate}
                        title="Bible Achiever">
                        Random set of 60 questions (30 x 10-point, 20 x 20-point, and 10 x 30-point questions). To earn the seal, an individual must correctly answer 28 10-point questions, 18 20-point questions,
                        and 6 30-point questions.
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.BibleMaster}
                        isSelected={template === CriteriaTemplateType.BibleMaster}
                        onChange={setTemplate}
                        title="Bible Master">
                        Random set of 60 questions (30 x 10-point, 20 x 20-point, and 10 x 30-point questions). To earn the seal, an individual
                        must <strong>correctly answer 59 of the 60 questions correctly</strong>.
                    </TemplateSelectorItem>
                    <TemplateSelectorItem
                        template={CriteriaTemplateType.BibleQuoter}
                        isSelected={template === CriteriaTemplateType.BibleQuoter}
                        onChange={setTemplate}
                        title="Bible Quoter">
                        Random set of 95 questions from 107 verses.
                    </TemplateSelectorItem>
                </>)}
        </fieldset>);
}