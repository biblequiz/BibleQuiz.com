import { CriteriaTemplateType } from './TemplateSelector';

interface Props {
    template: CriteriaTemplateType | string;
    isSelected: boolean;
    onChange?: (template: CriteriaTemplateType) => void;
    onChangeWithCustom?: (template: string) => void;

    title: string;
    children: React.ReactNode;
}

export default function TemplateSelectorItem({
    template,
    isSelected,
    onChange,
    onChangeWithCustom,
    title,
    children: descriptionChildren }: Props) {

    return (
        <div>
            <label className="label text-wrap">
                <input
                    type="radio"
                    name="question-rules"
                    className="radio radio-info"
                    value={template}
                    checked={isSelected}
                    onChange={e => {
                        const value = e.target.value;
                        if (onChangeWithCustom) {
                            onChangeWithCustom(value);
                        }
                        else if (onChange) {
                            onChange(CriteriaTemplateType[e.target.value as keyof typeof CriteriaTemplateType]);
                        }
                    }} />
                <span className="text-sm">
                    <b>{title}</b><br />
                    {descriptionChildren}
                </span>
            </label>
        </div>);
}