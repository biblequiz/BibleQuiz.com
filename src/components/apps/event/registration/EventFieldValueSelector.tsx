import { useEffect, useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { EventField } from "types/services/EventsService";

interface Props {
    values: string[];
    setValues: (values: string[]) => void;
}

interface PossibleValue {
    text: string | null;
    index?: number | undefined;
    isFocused: boolean;
}

export default function EventFieldValueSelector({ values, setValues }: Props) {

    const [possibleValue, setPossibleValue] = useState<PossibleValue | null>(null);
    const possibleValueRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (possibleValue && !possibleValue.isFocused) {
            if (possibleValueRef.current) {
                possibleValueRef.current.focus();
            }

            setPossibleValue({ ...possibleValue, isFocused: true });
        }
    }, [possibleValue]);

    const getPossibleValueControl = () => {
        return (
            <div className="bg-base-200 border-base-400 rounded-box border p-4 mt-0">
                <input
                    type="text"
                    ref={possibleValueRef}
                    value={possibleValue?.text ?? ""}
                    onChange={e => {
                        e.target.setCustomValidity("");
                        setPossibleValue({ ...possibleValue, text: e.target.value, isFocused: true });
                    }}
                    pattern={`^([^${EventField.ListValueSeparator}]*)$`}
                    className="input input-bordered w-32 input-sm"
                    maxLength={60}
                    required
                />
                <button
                    className="btn btn-secondary btn-sm mt-0 ml-2 cursor-pointer"
                    type="button"
                    aria-label="Add"
                    onClick={() => {
                        const newArray = [...values];

                        for (let i = 0; i < newArray.length; i++) {
                            if (possibleValue!.index !== i && newArray[i] == possibleValue!.text) {
                                possibleValueRef.current?.setCustomValidity("Must be a unique value.");
                                possibleValueRef.current?.reportValidity();
                                return;
                            }
                        }

                        possibleValueRef.current?.setCustomValidity("");

                        if (possibleValue?.index !== undefined) {
                            newArray[possibleValue.index] = possibleValue.text!;
                        }
                        else {
                            newArray.push(possibleValue!.text!);
                        }

                        setValues(newArray);
                        setPossibleValue(null);
                    }}>
                    <FontAwesomeIcon icon="far faCircleCheck" />
                </button>
                <button
                    className="btn btn-warning btn-sm mt-0 ml-2 cursor-pointer"
                    type="button"
                    aria-label="Cancel"
                    onClick={() => setPossibleValue(null)}
                >
                    <FontAwesomeIcon icon="far faCircleXmark" />
                </button>
            </div>);
    };

    return (
        <div className="rounded-md border-primary border-1 border-dashed mt-0 relative p-2 flex flex-wrap gap-2">
            {values.map((value, index) => {
                if (possibleValue && possibleValue.index === index) {
                    return getPossibleValueControl();
                }

                return (
                    <div className="badge badge-primary mt-0" key={`value-${value}`}>
                        {index > 0 && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-focus rounded-full w-4 h-4 min-h-0 p-0"
                                onClick={() => {
                                    const newArray = [...values];
                                    const currentItem = newArray[index];
                                    newArray[index] = newArray[index - 1];
                                    newArray[index - 1] = currentItem;

                                    setValues(newArray);
                                    setPossibleValue(null);
                                }}
                                aria-label={`Move ${value} Left`}
                            >
                                <FontAwesomeIcon icon="fas faArrowLeft" />
                            </button>)}
                        {index < values.length - 1 && (
                            <button
                                type="button"
                                className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-focus rounded-full w-4 h-4 min-h-0 p-0 mt-0"
                                onClick={() => {
                                    const newArray = [...values];
                                    const currentItem = newArray[index];
                                    newArray[index] = newArray[index + 1];
                                    newArray[index + 1] = currentItem;

                                    setValues(newArray);
                                    setPossibleValue(null);
                                }}
                                aria-label={`Move ${value} Right`}
                            >
                                <FontAwesomeIcon icon="fas faArrowRight" />
                            </button>)}
                        <span onClick={() => setPossibleValue({
                            text: value,
                            index: index,
                            isFocused: true
                        })}>{value}</span>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-focus rounded-full w-4 h-4 min-h-0 p-0 mt-0"
                            onClick={() => {
                                setValues(values.filter((_, i) => i !== index));
                                setPossibleValue(null);
                            }}
                            aria-label={`Remove ${value}`}
                        >
                            <FontAwesomeIcon icon="fas faX" />
                        </button>
                    </div>);
            })}
            {possibleValue && possibleValue.index === undefined && getPossibleValueControl()}
            {!possibleValue && (
                <button
                    className="badge badge-success mt-0 text-success-content hover:bg-success-focus cursor-pointer"
                    type="button"
                    aria-label="Add Range"
                    onClick={() => setPossibleValue({ text: null, isFocused: true })}
                >
                    <FontAwesomeIcon icon="fas faPlus" />
                    <span>Add</span>
                </button>)}
        </div>);
};
