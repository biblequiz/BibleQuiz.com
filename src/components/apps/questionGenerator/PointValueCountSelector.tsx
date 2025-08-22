import { useState } from 'react';

interface Props {
    label: string;
    initialPoints: Record<number, number>;
    onPointsChange: (records: Record<number, number>) => void;
    disabled?: boolean;
}

export default function PointValueCountSelector({
    label,
    initialPoints,
    onPointsChange,
    disabled = false }: Props) {

    const [pointValueCounts, setPointValueCounts] = useState<Record<number, number>>(initialPoints);

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
            <legend className="fieldset-legend">{label}</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium"># of 10-point questions</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="number"
                        name="point-10s"
                        value={pointValueCounts[10] || 0}
                        onChange={e => {
                            setPointValueCounts({
                                ...pointValueCounts,
                                10: Number(e.target.value),
                            });
                            onPointsChange(pointValueCounts);
                        }}
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
                        name="point-20s"
                        value={pointValueCounts[20] || 0}
                        onChange={e => {
                            setPointValueCounts({
                                ...pointValueCounts,
                                20: Number(e.target.value),
                            });
                            onPointsChange(pointValueCounts);
                        }}
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
                        name="point-30s"
                        value={pointValueCounts[30] || 0}
                        onChange={e => {
                            setPointValueCounts({
                                ...pointValueCounts,
                                30: Number(e.target.value),
                            });
                            onPointsChange(pointValueCounts);
                        }}
                        placeholder="# of 30-point questions"
                        className="input input-bordered w-full"
                        disabled={disabled}
                        min={0}
                        max={30}
                        step={1}
                        required
                    />
                </div>
            </div>
        </fieldset>
    );
};
