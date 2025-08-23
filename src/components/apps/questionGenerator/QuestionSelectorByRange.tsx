import { useState } from "react";
import type { QuestionRangeFilter } from "../../../types/services/QuestionGeneratorService";
import settings from "../../../data/generated/questionGenerator.json";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import type { JbqQuestionGeneratorSettings } from "../../../types/QuestionGeneratorSettings";

interface Props {
    ranges: QuestionRangeFilter[];
    setRanges: (ranges: QuestionRangeFilter[]) => void;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;
const MIN_ELEMENT_ID = "range-new-min";
const MAX_ELEMENT_ID = "range-new-max";

export default function QuestionSelectorByRange({
    ranges,
    setRanges }: Props) {

    const [isAdding, setIsAdding] = useState<boolean>(false);
    const [minValue, setMinValue] = useState<number | null>(null);
    const [maxValue, setMaxValue] = useState<number | null>(null);

    const startAddRange = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setIsAdding(true);
    };

    const completeAddRange = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const minElement = document.getElementById(MIN_ELEMENT_ID) as HTMLInputElement;
        const maxElement = document.getElementById(MAX_ELEMENT_ID) as HTMLInputElement;

        // Check the range before the other validity checks to ensure the check doesn't detect
        // an old failure.
        const firstQuestion = minValue as number;
        const lastQuestion = maxValue as number;
        if (firstQuestion && lastQuestion) {
            if (firstQuestion > lastQuestion) {
                minElement.setCustomValidity("Cannot be greater than the last question.");
            }
            else {
                minElement.setCustomValidity("");
            }
        }

        const isMinValid = minElement.checkValidity();
        minElement.reportValidity();

        const isMaxValid = maxElement.checkValidity();
        maxElement.reportValidity();

        if (!isMinValid || !isMaxValid) {
            return;
        }

        const newRange = { Start: firstQuestion, End: lastQuestion };
        setRanges([...ranges, newRange].sort((a, b) => a.Start - b.Start));
        setIsAdding(false);
    };

    const removeRange = (index: number) => {
        setRanges(ranges.filter((_, i) => i !== index));
    };

    return (
        <div className="flex flex-wrap gap-2">
            {ranges.map((range, index) => (
                <div className="badge badge-primary mt-0" key={`custom-range-${index}`}>
                    <span>{range.Start} - {range.End}</span>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-focus rounded-full w-4 h-4 min-h-0 p-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeRange(index);
                        }}
                        aria-label={`Remove ${range.Start}-${range.End}`}
                    >
                        <FontAwesomeIcon icon="fas faX" />
                    </button>
                </div>))}
            {isAdding && (
                <div className="bg-base-200 border-base-400 rounded-box border p-4 mt-0">
                    <input
                        type="number"
                        name={MIN_ELEMENT_ID}
                        id={MIN_ELEMENT_ID}
                        value={minValue ?? ""}
                        onChange={e => setMinValue(Number(e.target.value))}
                        className="input input-bordered w-16 input-sm"
                        min={GENERATOR_SETTINGS.AllowedRange.Start}
                        max={GENERATOR_SETTINGS.AllowedRange.End}
                        step={1}
                        required
                    />
                    <FontAwesomeIcon icon="fas faMinus" classNames={["ml-2", "mr-2"]} />
                    <input
                        type="number"
                        name={MAX_ELEMENT_ID}
                        id={MAX_ELEMENT_ID}
                        value={maxValue ?? ""}
                        onChange={e => setMaxValue(Number(e.target.value))}
                        className="input input-bordered w-16 input-sm"
                        min={GENERATOR_SETTINGS.AllowedRange.Start}
                        max={GENERATOR_SETTINGS.AllowedRange.End}
                        step={1}
                        required
                    />
                    <button
                        className="btn btn-secondary btn-sm mt-0 ml-2 cursor-pointer"
                        type="button"
                        aria-label="Add"
                        onClick={completeAddRange}>
                        <FontAwesomeIcon icon="far faCircleCheck" />
                    </button>
                </div>)}
            {!isAdding && (
                <button
                    className="badge badge-secondary mt-0 text-secondary-content hover:bg-secondary-focus cursor-pointer"
                    type="button"
                    aria-label="Add Range"
                    onClick={startAddRange}>
                    <FontAwesomeIcon icon="fas faPlus" />
                    <span>Add</span>
                </button>)}
        </div>);
};
