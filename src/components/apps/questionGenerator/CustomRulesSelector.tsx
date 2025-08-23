import { QuestionTypeFilter } from "../../../types/services/QuestionGeneratorService";
import PointValueCountSelector from "./PointValueCountSelector";
import QuestionSelector, { type QuestionCriteria } from "./QuestionSelector";

interface Props {
    criteria: CustomRules;
    setCriteria: (criteria: CustomRules) => void;
}

export interface CustomRules {
    regularPointValueCounts: Record<number, number>;
    substitutePointValueCounts: Record<number, number>;
    overtimePointValueCounts: Record<number, number>;

    questionFilter: QuestionTypeFilter;
    questionCriteria: QuestionCriteria;
}

export default function CustomRulesSelector({ criteria, setCriteria }: Props) {

    return (
        <div>
            <PointValueCountSelector
                label="Regular Questions"
                initialPoints={criteria.regularPointValueCounts}
                onPointsChange={c => setCriteria({ ...criteria, regularPointValueCounts: c })}
            />
            <PointValueCountSelector
                label="Substitute Questions"
                initialPoints={criteria.substitutePointValueCounts}
                onPointsChange={c => setCriteria({ ...criteria, substitutePointValueCounts: c })}
            />
            <PointValueCountSelector
                label="Overtime Questions"
                initialPoints={criteria.overtimePointValueCounts}
                onPointsChange={c => setCriteria({ ...criteria, overtimePointValueCounts: c })}
            />

            <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
                <legend className="fieldset-legend">Questions</legend>
                <div className="w-full mt-0">
                    <select
                        name="question-type"
                        className="select select-bordered w-full mt-0"
                        value={criteria.questionFilter}
                        onChange={e => setCriteria({ ...criteria, questionFilter: QuestionTypeFilter[e.target.value as keyof typeof QuestionTypeFilter] })}
                        required
                    >
                        <option value={QuestionTypeFilter.All}>Quotations and Non-Quotations</option>
                        <option value={QuestionTypeFilter.QuotationOnly}>Quotations Only</option>
                        <option value={QuestionTypeFilter.NonQuotation}>No Quotation Questions</option>
                    </select>
                </div>
                <QuestionSelector
                    criteria={criteria.questionCriteria}
                    setCriteria={c => setCriteria({ ...criteria, questionCriteria: c })} />
            </fieldset>
        </div>);
}