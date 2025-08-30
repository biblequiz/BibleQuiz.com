import settings from 'data/generated/questionGenerator.json';
import type { JbqQuestionGeneratorSettings } from 'types/QuestionGeneratorSettings';

interface Props {
    categories: Set<string>;
    setCategories: (categories: Set<string>) => void;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

export default function QuestionSelectorByCategory({ categories, setCategories }: Props) {

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {GENERATOR_SETTINGS.OrderedCategoryKeys.map((categoryKey) => {
                const categoryLabel: string = GENERATOR_SETTINGS.CategoryLabels[categoryKey];

                return (
                    <label key={`question-category-${categoryKey}`} className="label text-sm cursor-pointer mt-0">
                        <input
                            type="checkbox"
                            name="question-category"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={categories.has(categoryKey)}
                            onChange={e => {
                                const newCategories = new Set(categories);
                                
                                if (e.target.checked) {
                                    newCategories.add(categoryKey);
                                }
                                else {
                                    newCategories.delete(categoryKey);
                                }

                                setCategories(newCategories);
                            }} />
                        {categoryLabel}
                    </label>);
            })}
        </div>);
}