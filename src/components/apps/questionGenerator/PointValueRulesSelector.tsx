import { useEffect, useState } from "react";
import { QuestionPositionRequirement, type QuestionPointValueRules } from 'types/services/QuestionGeneratorService';

interface Props {
    pointValue: number;
    rules: QuestionPointValueRules;
    maxPerHalfMin: number;
    setRules: (criteria: QuestionPointValueRules) => void;
}

export default function PointValueRulesSelector({
    pointValue,
    rules,
    maxPerHalfMin,
    setRules }: Props) {

    const [perHalfCount, setPerHalfCount] = useState<number>(rules.PerHalfCount ?? 0);

    useEffect(() => {
        setPerHalfCount(rules.PerHalfCount ?? 0);
    }, [rules]);

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
                <input
                    type="number"
                    name={`min-per-half-${pointValue}`}
                    value={perHalfCount}
                    onChange={e => setPerHalfCount(Number(e.target.value))}
                    onBlur={() => setRules({ ...rules, PerHalfCount: perHalfCount })}
                    className="input input-bordered w-full"
                    min={0}
                    max={maxPerHalfMin}
                    step={1}
                    required
                />
                <span>
                    Maximum {maxPerHalfMin} based on total questions.
                </span>
            </div>
        </div>);
};
