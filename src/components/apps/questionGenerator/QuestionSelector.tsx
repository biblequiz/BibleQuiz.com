import type { QuestionRangeFilter } from "../../../types/services/QuestionGeneratorService";
import QuestionSelectorByCategory from "./QuestionSelectorByCategory";
import QuestionSelectorByGroup from "./QuestionSelectorByGroup";
import QuestionSelectorByRange from "./QuestionSelectorByRange";

interface Props {
    criteria: QuestionCriteria;
    setCriteria: (criteria: QuestionCriteria) => void;
}

export enum QuestionSelectionType {
    Group = "Group",
    Category = "Category",
    Range = "Range",
}

export interface QuestionCriteria {
    type: QuestionSelectionType;
    groups?: Set<number>;
    categories?: Set<string>;
    ranges?: QuestionRangeFilter[];
}

export default function QuestionSelector({ criteria, setCriteria }: Props) {

    return (
        <>
            <div className="w-full mt-0">
                <select
                    name="question-selection-type"
                    className="select select-bordered w-full mt-0"
                    value={criteria.type}
                    onChange={e => setCriteria({ ...criteria, type: QuestionSelectionType[e.target.value as keyof typeof QuestionSelectionType] })}
                    required
                >
                    <option value={QuestionSelectionType.Group}>Select by Group</option>
                    <option value={QuestionSelectionType.Category}>Select by Category</option>
                    <option value={QuestionSelectionType.Range}>Select by Question Number Range</option>
                </select>
            </div>
            {criteria.type === QuestionSelectionType.Group && (
                <QuestionSelectorByGroup
                    groups={criteria.groups}
                    setGroups={groups => setCriteria({ ...criteria, groups })}
                />)}
            {criteria.type === QuestionSelectionType.Category && (
                <QuestionSelectorByCategory
                    categories={criteria.categories}
                    setCategories={categories => setCriteria({ ...criteria, categories })}
                />)}
            {criteria.type === QuestionSelectionType.Range && (
                <QuestionSelectorByRange
                    ranges={criteria.ranges || []}
                    setRanges={ranges => setCriteria({ ...criteria, ranges })}
                />)}
        </>
    );
}