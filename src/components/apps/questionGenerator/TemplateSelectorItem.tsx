import { CriteriaTemplateType } from "./TemplateSelector";

interface Props {
    template: CriteriaTemplateType;
    isSelected: boolean;
    onChange: (template: CriteriaTemplateType) => void;

    title: string;
    children: React.ReactNode;
}

export default function TemplateSelectorItem({ template, isSelected, onChange, title, children: descriptionChildren }: Props) {

    return (
        <div>
            <label className="label text-wrap">
                <input
                    type="radio"
                    name="question-rules"
                    className="radio radio-info"
                    value={template}
                    checked={isSelected}
                    onChange={e => onChange(CriteriaTemplateType[e.target.value as keyof typeof CriteriaTemplateType])} />
                <span className="text-sm">
                    <b>{title}</b><br />
                    {descriptionChildren}
                </span>
            </label>
        </div>);
}