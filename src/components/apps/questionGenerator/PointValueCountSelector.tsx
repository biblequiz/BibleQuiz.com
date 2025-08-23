import { useState } from "react";

interface Props {
    id: string;
    label: string;
    criteria: PointValueCriteria;
    setCriteria: (criteria: PointValueCriteria) => void;
    allowManual: boolean;
    disabled?: boolean;
}

export interface PointValueCriteria {
    counts: Record<number, number>;
    manualOrder?: number[];
    type?: PointValueOrdering;
}

export enum PointValueOrdering {
    Random = "Random",
    Manual = "Manual",
}

export default function PointValueCountSelector({
    id,
    label,
    criteria,
    setCriteria,
    allowManual,
    disabled = false }: Props) {

    const counts = criteria.counts || {};
    const [random10Count, setRandom10Count] = useState<number>(counts[10] || 0);
    const [random20Count, setRandom20Count] = useState<number>(counts[20] || 0);
    const [random30Count, setRandom30Count] = useState<number>(counts[30] || 0);
    const [manualOrderText, setManualOrderText] = useState<string>((criteria.manualOrder ?? []).join(", "));

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newType = PointValueOrdering[e.target.value as keyof typeof PointValueOrdering];
        setCriteria({
            ...criteria,
            type: newType
        });
    };

    const currentType = criteria.type ?? PointValueOrdering.Random;

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
            <legend className="fieldset-legend">{label}</legend>
            {allowManual && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="label text-wrap">
                        <input
                            type="radio"
                            name={`point-value-ordering-${id}`}
                            className="radio radio-info"
                            value={PointValueOrdering.Random}
                            checked={currentType === PointValueOrdering.Random}
                            onChange={handleTypeChange}
                        />
                        <span className="text-sm">
                            Random Ordering
                        </span>
                    </label>
                    <label className="label text-wrap">
                        <input
                            type="radio"
                            name={`point-value-ordering-${id}`}
                            className="radio radio-info"
                            value={PointValueOrdering.Manual}
                            checked={currentType === PointValueOrdering.Manual}
                            onChange={handleTypeChange}
                        />
                        <span className="text-sm">
                            Manually Specify Order
                        </span>
                    </label>
                </div>)}
            {currentType === PointValueOrdering.Random && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium"># of 10-point questions</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="number"
                            name={`point-10s-${id}`}
                            value={random10Count}
                            onChange={e => setRandom10Count(Number(e.target.value))}
                            onBlur={e => setCriteria({ ...criteria, counts: { ...criteria.counts, 10: random10Count } })}
                            placeholder="# of 10-point questions"
                            className="input input-bordered w-full"
                            disabled={disabled}
                            min={0}
                            max={30}
                            step={1}
                            required
                        />
                    </div>
                    <div className="w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium"># of 20-point questions</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="number"
                            name={`point-20s-${id}`}
                            value={random20Count}
                            onChange={e => setRandom20Count(Number(e.target.value))}
                            onBlur={e => setCriteria({ ...criteria, counts: { ...criteria.counts, 20: random20Count } })}
                            placeholder="# of 20-point questions"
                            className="input input-bordered w-full"
                            disabled={disabled}
                            min={0}
                            max={30}
                            step={1}
                            required
                        />
                    </div>
                    <div className="w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium"># of 30-point questions</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="number"
                            name={`point-30s-${id}`}
                            value={random30Count}
                            onChange={e => setRandom30Count(Number(e.target.value))}
                            onBlur={e => setCriteria({ ...criteria, counts: { ...criteria.counts, 30: random30Count } })}
                            placeholder="# of 30-point questions"
                            className="input input-bordered w-full"
                            disabled={disabled}
                            min={0}
                            max={30}
                            step={1}
                            required
                        />
                    </div>
                </div>)}
            {currentType === PointValueOrdering.Manual && (
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Ordered list of point values (separated by commas)</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="text"
                        name={`manual-order-${id}`}
                        value={manualOrderText}
                        onChange={e => setManualOrderText(e.target.value)}
                        onBlur={e => {
                            const newOrder: number[] = [];

                            const parts = (e.target.value ?? "").split(",");;
                            for (const part of parts) {
                                const trimmed = part.trim();
                                if (trimmed.length === 0) {
                                    continue;
                                }

                                const value = Number(trimmed);
                                if (value === 10 || value === 20 || value === 30) {
                                    newOrder.push(value);
                                }
                                else {
                                    e.target.setCustomValidity("Must be valid comma-separated list of point values of 10, 20, or 30.");
                                    e.target.reportValidity(); // Shows browser validation popup
                                    return;
                                }
                            }

                            const formattedText = newOrder.join(", ");
                            if (formattedText !== manualOrderText) {
                                setManualOrderText(formattedText);
                            }

                            e.target.setCustomValidity(""); // Clear error
                            setCriteria({
                                ...criteria,
                                manualOrder: newOrder
                            });
                        }}
                        placeholder="Example: 10, 20, 20, 30, 10"
                        className="input input-bordered w-full"
                        disabled={disabled}
                        min={0}
                        max={30}
                        step={1}
                        required
                    />
                </div>)}
        </fieldset>
    );
};
