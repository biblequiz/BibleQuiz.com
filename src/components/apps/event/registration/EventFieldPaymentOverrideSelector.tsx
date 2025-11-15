import { useEffect, useRef, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventFieldPaymentOverride } from "types/services/EventsService";

interface Props {
    overrides: EventFieldPaymentOverride[];
    setOverrides: (values: EventFieldPaymentOverride[]) => void;
}

export default function EventFieldPaymentOverrideSelector({ overrides, setOverrides }: Props) {

    const [overrideCost, setOverrideCost] = useState<number | undefined>(undefined);
    const [overrideMinAge, setOverrideMinAge] = useState<number | null | undefined>(undefined);
    const [overrideMaxAge, setOverrideMaxAge] = useState<number | null | undefined>(undefined);
    const [isEditFocused, setIsEditFocused] = useState<boolean | undefined>(undefined);
    const [editingIndex, setEditingIndex] = useState<number | undefined>(undefined);

    const costRef = useRef<HTMLInputElement>(null);
    const minAgeRef = useRef<HTMLSelectElement>(null);
    const maxAgeRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (isEditFocused === false) {
            if (minAgeRef.current) {
                minAgeRef.current.focus();
            }

            setIsEditFocused(true);
        }
    }, [isEditFocused]);

    const getOverrideValueControl = () => {

        const maxAgeOffset = (overrideMinAge ?? 1);

        return (
            <div className="bg-base-200 border-base-400 rounded-box border p-4 mt-0">
                <label className="input w-auto">
                    <FontAwesomeIcon icon="fas faDollarSign" />
                    <input
                        ref={costRef}
                        type="number"
                        value={overrideCost ?? ""}
                        onChange={e => setOverrideCost(e.target.valueAsNumber)}
                        min={-10000}
                        max={10000}
                        step={0.01}
                        placeholder="Cost"
                        required
                    />
                </label>
                <select
                    ref={minAgeRef}
                    value={overrideMinAge ?? ""}
                    onChange={e => {
                        const minAge = Number(e.target.value) ?? null;
                        e.target.setCustomValidity("");
                        setOverrideMinAge(minAge);
                    }}
                    className="select select-info w-auto mt-0"
                    required
                >
                    <option value="" disabled>Min</option>
                    {Array.from({ length: (overrideMaxAge ?? 120) + 1 }, (_, age) => (
                        <option key={`min_age_${age}`} value={age}>{age}</option>
                    ))}
                </select>
                <span> - </span>
                <select
                    ref={maxAgeRef}
                    value={overrideMaxAge ?? ""}
                    onChange={e => {
                        const maxAge = Number(e.target.value) ?? null;
                        e.target.setCustomValidity("");
                        setOverrideMaxAge(maxAge);
                    }}
                    className="select select-info w-auto mt-0"
                    required
                >
                    <option value="" disabled>Max</option>
                    {Array.from({ length: 120 - maxAgeOffset + 1 }, (_, age) => (
                        <option key={`max_age_${age}`} value={age + maxAgeOffset}>{age >= 119 ? "Any" : age + maxAgeOffset}</option>
                    ))}
                </select>
                <button
                    className="btn btn-secondary btn-sm mt-0 ml-2 cursor-pointer"
                    type="button"
                    aria-label="Add"
                    onClick={() => {
                        const newCost = overrideCost ?? 0;
                        const newMinAge = overrideMinAge ?? null;
                        const newMaxAge = overrideMaxAge == 120
                            ? null
                            : (overrideMaxAge ?? null);

                        if (!overrideCost) {
                            costRef.current?.setCustomValidity("Cost is required.");
                            costRef.current?.reportValidity();
                            return;
                        }
                        else {
                            costRef.current?.setCustomValidity("");
                        }

                        if (!overrideMinAge && overrideMinAge !== 0) {
                            minAgeRef.current?.setCustomValidity("Minimum age is required.");
                            minAgeRef.current?.reportValidity();
                            return;
                        }
                        else {
                            minAgeRef.current?.setCustomValidity("");
                        }

                        if (!overrideMaxAge && overrideMaxAge !== 0) {
                            maxAgeRef.current?.setCustomValidity("Maximum age is required.");
                            maxAgeRef.current?.reportValidity();
                            return;
                        }
                        else {
                            maxAgeRef.current?.setCustomValidity("");
                        }


                        const newArray = [...overrides];
                        for (let i = 0; i < newArray.length; i++) {
                            const existing = newArray[i];
                            if (i === editingIndex) {
                                continue;
                            }

                            if (newMaxAge == null || newMaxAge >= (existing.MinAge ?? 0)) {
                                if ((newMinAge ?? 0) <= (existing.MaxAge ?? 120)) {
                                    maxAgeRef.current?.setCustomValidity("Age ranges cannot overlap existing values.");
                                    maxAgeRef.current?.reportValidity();
                                    return;
                                }
                            }
                        }

                        const newRecord: EventFieldPaymentOverride = {
                            Cost: newCost,
                            MinAge: newMinAge,
                            MaxAge: newMaxAge
                        };
                        if (editingIndex !== undefined) {
                            newArray[editingIndex] = newRecord;
                        }
                        else {
                            newArray.push(newRecord);
                        }

                        setOverrides(newArray);
                        setOverrideCost(undefined);
                        setOverrideMinAge(undefined);
                        setOverrideMaxAge(undefined);
                        setIsEditFocused(undefined);
                        setEditingIndex(undefined);
                    }}>
                    <FontAwesomeIcon icon="far faCircleCheck" />
                </button>
                <button
                    className="btn btn-warning btn-sm mt-0 ml-2 cursor-pointer"
                    type="button"
                    aria-label="Cancel"
                    onClick={() => {
                        setOverrideCost(undefined);
                        setOverrideMinAge(undefined);
                        setOverrideMaxAge(undefined);
                        setIsEditFocused(undefined);
                        setEditingIndex(undefined);
                    }}
                >
                    <FontAwesomeIcon icon="far faCircleXmark" />
                </button>
            </div>);
    };

    return (
        <div className="rounded-md border-primary border-1 border-dashed mt-0 relative p-2 flex flex-wrap gap-2">
            {overrides.map((value, index) => {
                const key = `value-${index}`;

                if (editingIndex === index) {
                    return (<div key={key}>{getOverrideValueControl()}</div>);
                }

                return (
                    <div className="badge badge-primary mt-0" key={key}>
                        <span onClick={() => {
                            setEditingIndex(index);
                            setOverrideCost(value.Cost);
                            setOverrideMinAge(value.MinAge);
                            setOverrideMaxAge(value.MaxAge);
                            setIsEditFocused(false);
                        }}>
                            ${value.Cost.toFixed(2)} for {value.MinAge ?? "Any"} - {value.MaxAge ?? "Any"}
                        </span>
                        <button
                            type="button"
                            className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-focus rounded-full w-4 h-4 min-h-0 p-0 mt-0"
                            onClick={() => {
                                setOverrides(overrides.filter((_, i) => i !== index));
                                setOverrideCost(undefined);
                                setOverrideMinAge(undefined);
                                setOverrideMaxAge(undefined);
                                setIsEditFocused(undefined);
                                setEditingIndex(undefined);
                            }}
                            aria-label={`Remove ${value}`}
                        >
                            <FontAwesomeIcon icon="fas faX" />
                        </button>
                    </div>);
            })}
            {isEditFocused !== undefined && editingIndex === undefined && getOverrideValueControl()}
            {isEditFocused === undefined && (
                <button
                    className="badge badge-success mt-0 text-success-content hover:bg-success-focus cursor-pointer"
                    type="button"
                    aria-label="Add Override"
                    onClick={() => {
                        setOverrideCost(undefined);
                        setOverrideMinAge(undefined);
                        setOverrideMaxAge(undefined);
                        setIsEditFocused(false);
                        setEditingIndex(undefined);
                    }}
                >
                    <FontAwesomeIcon icon="fas faPlus" />
                    <span>Add</span>
                </button>)}
        </div>);
};
