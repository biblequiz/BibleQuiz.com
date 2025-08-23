import { QuestionTypeFilter } from "../../../types/services/QuestionGeneratorService";
import PointValueCountSelector, { type PointValueCriteria } from "./PointValueCountSelector";
import QuestionSelector, { type QuestionCriteria } from "./QuestionSelector";

interface Props {
    criteria: CustomRules;
    setCriteria: (criteria: CustomRules) => void;
}

export interface CustomRules {
    regularQuestions: PointValueCriteria;
    substituteQuestions: PointValueCriteria;
    overtimeQuestions: PointValueCriteria;

    questionFilter: QuestionTypeFilter;
    questionCriteria: QuestionCriteria;
}

export default function CustomRulesSelector({ criteria, setCriteria }: Props) {

    return (
        <div>
            <PointValueCountSelector
                id="regular"
                label="Regular Questions"
                criteria={criteria.regularQuestions}
                setCriteria={c => setCriteria({ ...criteria, regularQuestions: c })}
                allowManual={true}
            />
            <PointValueCountSelector
                id="substitute"
                label="Substitute Questions"
                criteria={criteria.substituteQuestions}
                setCriteria={c => setCriteria({ ...criteria, substituteQuestions: c })}
                allowManual={false}
            />
            <PointValueCountSelector
                id="overtime"
                label="Overtime Questions"
                criteria={criteria.overtimeQuestions}
                setCriteria={c => setCriteria({ ...criteria, overtimeQuestions: c })}
                allowManual={false}
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