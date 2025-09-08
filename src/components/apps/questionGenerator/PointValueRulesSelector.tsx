import { QuestionPositionRequirement, type QuestionPointValueRules } from 'types/services/QuestionGeneratorService';

interface Props {
    pointValue: number;
    rules: QuestionPointValueRules;
    maxPerHalfMin: number;
    disableFirstRequirement: boolean;
    disableLastRequirement: boolean;
    setRules: (criteria: QuestionPointValueRules) => void;
}

export default function PointValueRulesSelector({
    pointValue,
    rules,
    maxPerHalfMin,
    disableFirstRequirement,
    disableLastRequirement,
    setRules }: Props) {

    const minPerHalfKey = `min-per-half-${pointValue}`;

    return (
        <div className="bg-base-100 border-base-300 rounded-box border p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="w-full mt-0">
                <label className="label">
                    <span className="label-text font-medium">{pointValue}-point as first question</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    name={`first-question-${pointValue}`}
                    className="select select-bordered w-full mt-0"
                    value={rules.First}
                    onChange={e => setRules({ ...rules, First: e.target.value as QuestionPositionRequirement })}
                    disabled={disableFirstRequirement}
                    required
                >
                    <option value={QuestionPositionRequirement.Required}>Required</option>
                    <option value={QuestionPositionRequirement.Allowed}>Allowed</option>
                    <option value={QuestionPositionRequirement.NotAllowed}>Not Allowed</option>
                </select>
            </div>
            <div className="w-full mt-0">
                <label className="label">
                    <span className="label-text font-medium">{pointValue}-point as last question</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    name={`last-question-${pointValue}`}
                    className="select select-bordered w-full mt-0"
                    value={rules.Last}
                    onChange={e => setRules({ ...rules, Last: e.target.value as QuestionPositionRequirement })}
                    disabled={disableLastRequirement}
                    required
                >
                    <option value={QuestionPositionRequirement.Required}>Required</option>
                    <option value={QuestionPositionRequirement.Allowed}>Allowed</option>
                    <option value={QuestionPositionRequirement.NotAllowed}>Not Allowed</option>
                </select>
            </div>
            <div className="w-full mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name={`allow-consecutive-${pointValue}`}
                        className="checkbox checkbox-sm checkbox-info"
                        checked={rules.AllowConsecutive}
                        onChange={e => setRules({ ...rules, AllowConsecutive: e.target.checked })}
                    />
                    <span className="text-sm">
                        Allow consecutive {pointValue}-point questions
                    </span>
                </label>
            </div>
            <div className="w-full mt-0">
                <label className="label">
                    <span className="label-text font-medium">Min {pointValue}-point per Half</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    name={minPerHalfKey}
                    className="select select-bordered w-full mt-0"
                    value={rules.PerHalfCount ?? 0}
                    onChange={e => setRules({ ...rules, PerHalfCount: Number(e.target.value) })}
                    required
                >
                    {Array.from({ length: maxPerHalfMin + 1 }, (_, i) => (
                        <option key={`minPerHalfKey-${i}`} value={i}>
                            {i}
                        </option>))}
                </select>
            </div>
        </div>);
};
