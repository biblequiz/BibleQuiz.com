import { DuplicateQuestionMode, QuestionPointValueRules } from "../../../types/services/QuestionGeneratorService";
import PointValueRulesSelector from "./PointValueRulesSelector";

interface Props {
    criteria: OtherCriteria;
    setCriteria: (criteria: OtherCriteria) => void;
}

export interface OtherCriteria {
    duplicates: DuplicateQuestionMode;
    pointValueRules: Record<number, QuestionPointValueRules>;
}

export default function OtherSettingsSelector({ criteria, setCriteria }: Props) {

    const handleDuplicateModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        const newValue = DuplicateQuestionMode[event.target.value as keyof typeof DuplicateQuestionMode];
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

            <PointValueRulesSelector
                pointValue={10}
                rules={criteria.pointValueRules[10] || {}}
                setRules={rules => setCriteria({ ...criteria, pointValueRules: { ...criteria.pointValueRules, 10: rules } })}
            />
            <PointValueRulesSelector
                pointValue={20}
                rules={criteria.pointValueRules[20] || {}}
                setRules={rules => setCriteria({ ...criteria, pointValueRules: { ...criteria.pointValueRules, 20: rules } })}
            />
            <PointValueRulesSelector
                pointValue={30}
                rules={criteria.pointValueRules[30] || {}}
                setRules={rules => setCriteria({ ...criteria, pointValueRules: { ...criteria.pointValueRules, 30: rules } })}
            />
        </fieldset>);
}