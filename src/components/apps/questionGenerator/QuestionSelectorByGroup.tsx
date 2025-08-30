import settings from 'data/generated/questionGenerator.json';
import type { JbqQuestionGeneratorSettings } from 'types/QuestionGeneratorSettings';

interface Props {
    groups: Set<number>;
    setGroups: (groups: Set<number>) => void;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;
const GROUP_LABELS: string[][] = [];
for (const groupCategories of GENERATOR_SETTINGS.GroupCategoryKeys) {
    const labels: string[] = [];
    for (const categoryKey of groupCategories) {
        labels.push(GENERATOR_SETTINGS.CategoryLabels[categoryKey]);
    }
    GROUP_LABELS.push(labels);
}

export default function QuestionSelectorByGroup({ groups, setGroups }: Props) {

    return GROUP_LABELS.map((groupCategoryLabels, index) => {
        const groupNumber = index + 1;

        return (
            <div key={`question-group-${groupNumber}`}>
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="question-group"
                        className="checkbox checkbox-sm checkbox-info"
                        value={groupNumber}
                        checked={groups.has(groupNumber) ?? true}
                        onChange={e => {
                            const newGroups = new Set(groups);
                            
                            if (e.target.checked) {
                                newGroups.add(groupNumber);
                            }
                            else {
                                newGroups.delete(groupNumber);
                            }

                            setGroups(newGroups);
                        }} />
                    <span className="text-sm">
                        <b>Group #{groupNumber}</b><br />
                        {groupCategoryLabels.join(", ")}
                    </span>
                </label>
            </div>);
    });
}