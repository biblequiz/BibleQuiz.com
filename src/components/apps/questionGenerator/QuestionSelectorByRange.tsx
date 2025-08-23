import { useEffect, useRef, useState } from "react";
import type { QuestionRangeFilter } from "../../../types/services/QuestionGeneratorService";
import settings from "../../../data/generated/questionGenerator.json";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import type { JbqQuestionGeneratorSettings } from "../../../types/QuestionGeneratorSettings";

interface Props {
    ranges: QuestionRangeFilter[];
    setRanges: (ranges: QuestionRangeFilter[]) => void;
}

interface AddRangeState {
    min: number | null;
    max: number | null;
    isFocused: boolean;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

export default function QuestionSelectorByRange({
    ranges,
    setRanges }: Props) {

    const [addState, setAddState] = useState<AddRangeState | null>(null);
    const minInputRef = useRef<HTMLInputElement>(null);
    const maxInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (addState && !addState.isFocused) {
            if (minInputRef.current) {
                minInputRef.current.focus();
            }

            setAddState({ ...addState, isFocused: true });
        }
    }, [addState]);

    const startAddRange = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setAddState({ min: null, max: null, isFocused: false });
    };

    const completeAddRange = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        // Check the range before the other validity checks to ensure the check doesn't detect
        // an old failure.
        const firstQuestion = addState!.min as number;
        const lastQuestion = addState!.max as number;
        if (firstQuestion && lastQuestion) {
            if (firstQuestion > lastQuestion) {
                minInputRef.current!.setCustomValidity("Cannot be greater than the last question.");
            }
            else {
                minInputRef.current!.setCustomValidity("");
            }

            for (const existingRange of ranges) {
                if (!(lastQuestion < existingRange.Start || firstQuestion > existingRange.End)) {
                    minInputRef.current!.setCustomValidity(`Overlaps with the range ${existingRange.Start}-${existingRange.End}.`);
                    break;
                }
            }
        }

        const isMinValid = minInputRef.current!.checkValidity();
        minInputRef.current!.reportValidity();

        const isMaxValid = maxInputRef.current!.checkValidity();
        maxInputRef.current!.reportValidity();

        if (!isMinValid || !isMaxValid) {
            return;
        }

        setRanges([
            ...ranges,
            { Start: firstQuestion, End: lastQuestion }]
            .sort((a, b) => a.Start - b.Start));
        setAddState(null);
    };

    const cancelAddRange = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setAddState(null);
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
            {addState && (
                <div className="bg-base-200 border-base-400 rounded-box border p-4 mt-0">
                    <input
                        type="number"
                        ref={minInputRef}
                        value={addState?.min ?? ""}
                        onChange={e => {
                            e.target.setCustomValidity("");
                            setAddState({ ...addState, min: Number(e.target.value) });
                        }}
                        className="input input-bordered w-16 input-sm"
                        min={GENERATOR_SETTINGS.AllowedRange.Start}
                        max={GENERATOR_SETTINGS.AllowedRange.End}
                        step={1}
                        required
                    />
                    <FontAwesomeIcon icon="fas faMinus" classNames={["ml-2", "mr-2"]} />
                    <input
                        type="number"
                        ref={maxInputRef}
                        value={addState?.max ?? ""}
                        onChange={e => {
                            e.target.setCustomValidity("");
                            setAddState({ ...addState, max: Number(e.target.value) });
                        }}
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
                    <button
                        className="btn btn-warning btn-sm mt-0 ml-2 cursor-pointer"
                        type="button"
                        aria-label="Cancel"
                        onClick={cancelAddRange}>
                        <FontAwesomeIcon icon="far faCircleXmark" />
                    </button>
                </div>)}
            {!addState && (
                <button
                    className="badge badge-secondary mt-0 text-secondary-content hover:bg-secondary-focus cursor-pointer"
                    type="button"
                    aria-label="Add Range"
                    onClick={startAddRange}
                >
                    <FontAwesomeIcon icon="fas faPlus" />
                    <span>Add</span>
                </button>)}
        </div>);
};
