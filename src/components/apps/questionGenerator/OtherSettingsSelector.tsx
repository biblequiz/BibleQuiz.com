import { useEffect, useState } from "react";
import { DuplicateQuestionMode, QuestionPointValueRules } from 'types/services/QuestionGeneratorService';
import { PointValueOrdering, type PointValueCriteria } from './PointValueCountSelector';
import PointValueRulesSelector from './PointValueRulesSelector';

interface Props {
    criteria: OtherCriteria;
    regularQuestions: PointValueCriteria;
    setCriteria: (criteria: OtherCriteria) => void;
}

export interface OtherCriteria {
    duplicates: DuplicateQuestionMode;
    pointValueRules: Record<number, QuestionPointValueRules>;
}

export default function OtherSettingsSelector({ criteria, regularQuestions, setCriteria }: Props) {

    const [maxPerHalfMin10, setMaxPerHalfMin10] = useState<number>(5);
    const [maxPerHalfMin20, setMaxPerHalfMin20] = useState<number>(5);
    const [maxPerHalfMin30, setMaxPerHalfMin30] = useState<number>(5);

    useEffect(() => {
        let count10 = 0;
        let count20 = 0;
        let count30 = 0;

        switch (regularQuestions.type) {
            case PointValueOrdering.Manual:
                for (const pointValue of regularQuestions.manualOrder ?? []) {
                    switch (pointValue) {
                        case 10:
                            count10++;
                            break;
                        case 20:
                            count20++;
                            break;
                        case 30:
                            count30++;
                            break;
                        default:
                            throw new Error(`Unexpected point value: ${pointValue}`);
                    }
                }
                break;
            case PointValueOrdering.Random:
                count10 = regularQuestions.counts[10] || 0;
                count20 = regularQuestions.counts[20] || 0;
                count30 = regularQuestions.counts[30] || 0;
                break;
            default:
                throw new Error(`Unexpected point value ordering: ${regularQuestions.type}`);
        }

        // The minimum per half cannot exceed half of the total count (rounded down) as it
        // is impossible to have two halves with more than half the questions in each.
        setMaxPerHalfMin10(Math.floor(count10 / 2));
        setMaxPerHalfMin20(Math.floor(count20 / 2));
        setMaxPerHalfMin30(Math.floor(count30 / 2));
    }, [regularQuestions]);

    const handleDuplicateModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        const newValue = event.target.value as DuplicateQuestionMode;
        setCriteria({
            ...criteria,
            duplicates: newValue
        });
    };

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
            <legend className="fieldset-legend">Other Settings</legend>
            <div className="w-full mb-0">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="duplicate-question-mode"
                        className="radio radio-info"
                        value={DuplicateQuestionMode.NoDuplicates}
                        checked={criteria.duplicates === DuplicateQuestionMode.NoDuplicates}
                        onChange={handleDuplicateModeChange}
                    />
                    <span className="text-sm">
                        Use all questions before repeating any questions.
                    </span>
                </label>
            </div>
            <div className="w-full mt-0">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="duplicate-question-mode"
                        className="radio radio-info"
                        value={DuplicateQuestionMode.AllowDuplicatesInOtherMatches}
                        checked={criteria.duplicates === DuplicateQuestionMode.AllowDuplicatesInOtherMatches}
                        onChange={handleDuplicateModeChange}
                    />
                    <span className="text-sm">
                        Allow questions to repeat in different matches.
                    </span>
                </label>
            </div>
            {regularQuestions.type !== PointValueOrdering.Manual && (
                <>
                    <PointValueRulesSelector
                        pointValue={10}
                        maxPerHalfMin={maxPerHalfMin10}
                        rules={criteria.pointValueRules[10] || {}}
                        setRules={rules => setCriteria({ ...criteria, pointValueRules: { ...criteria.pointValueRules, 10: rules } })}
                    />
                    <PointValueRulesSelector
                        pointValue={20}
                        maxPerHalfMin={maxPerHalfMin20}
                        rules={criteria.pointValueRules[20] || {}}
                        setRules={rules => setCriteria({ ...criteria, pointValueRules: { ...criteria.pointValueRules, 20: rules } })}
                    />
                    <PointValueRulesSelector
                        pointValue={30}
                        maxPerHalfMin={maxPerHalfMin30}
                        rules={criteria.pointValueRules[30] || {}}
                        setRules={rules => setCriteria({ ...criteria, pointValueRules: { ...criteria.pointValueRules, 30: rules } })}
                    />
                </>)}
        </fieldset>);
}