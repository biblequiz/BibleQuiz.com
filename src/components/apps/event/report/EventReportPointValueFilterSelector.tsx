import { useState } from "react";
import { EventReportPointValueFilter } from "types/services/DatabaseReportsService";

interface Props {
    label: string;
    filter: EventReportPointValueFilter | null;
    setFilter: (filter: EventReportPointValueFilter | null) => void;
    isAllowed: boolean;
    isDisabled: boolean;
}

export default function EventReportPointValueFilterSelector({
    label,
    filter,
    setFilter,
    isAllowed,
    isDisabled }: Props) {

    const [isChecked, setIsChecked] = useState(filter !== null);
    const [minCorrect, setMinCorrect] = useState<number | undefined>(filter?.MinCorrect ?? undefined);
    const [maxCorrect, setMaxCorrect] = useState<number | undefined>(filter?.MaxCorrect ?? undefined);

    const updateFilter = (
        newIsChecked: boolean,
        newMin: number | undefined,
        newMax: number | undefined) => {

        if (newIsChecked) {
            setFilter({
                MinCorrect: newMin ?? null,
                MaxCorrect: newMax ?? null
            });
        }
        else {
            setFilter(null);
        }
    };

    return (
        <div className="p-2 mt-0 mb-2 border border-base-500 rounded-lg">
            <div className="w-full mt-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={isChecked}
                        onChange={e => {
                            const newChecked = e.target.checked;
                            setIsChecked(newChecked);
                            updateFilter(newChecked, minCorrect, maxCorrect);
                        }}
                        disabled={!isAllowed || isDisabled}
                    />
                    <span className="text-sm font-bold">
                        {label}
                    </span>
                </label>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-0">
                <div className="w-full mt-0">
                    <label className="label mr-2">
                        <span className="label-text font-medium text-sm">Min Correct (inclusive)</span>
                    </label>
                    <input
                        type="number"
                        className="input input-info w-full mt-0"
                        value={minCorrect}
                        onChange={e => setMinCorrect(parseFloat(e.target.value))}
                        onBlur={e => {
                            e.preventDefault();
                            updateFilter(isChecked, minCorrect, maxCorrect);
                        }}
                        min={0.1}
                        max={maxCorrect ?? 50}
                        step={0.1}
                        disabled={isDisabled || !isAllowed || !isChecked}
                    />
                </div>
                <div className="w-full mt-0">
                    <label className="label mr-2">
                        <span className="label-text font-medium text-sm">Max Correct (inclusive)</span>
                    </label>
                    <input
                        type="number"
                        className="input input-info w-full mt-0"
                        value={maxCorrect}
                        onChange={e => setMaxCorrect(parseFloat(e.target.value))}
                        onBlur={e => {
                            e.preventDefault();
                            updateFilter(isChecked, minCorrect, maxCorrect);
                        }}
                        min={minCorrect ?? 0.1}
                        max={50}
                        step={0.1}
                        disabled={isDisabled || !isAllowed || !isChecked}
                    />
                </div>
            </div>
        </div>);
}