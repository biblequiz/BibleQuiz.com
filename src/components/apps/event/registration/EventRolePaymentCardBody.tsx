import { EventFieldPaymentOverride } from "types/services/EventsService";
import { useState } from "react";
import EventFieldPaymentOverrideSelector from "./EventFieldPaymentOverrideSelector";

interface Props {
    currentCost: number;
    setValue: (cost: number,overrides: EventFieldPaymentOverride[]) => void;
    currentOverrides?: EventFieldPaymentOverride[];
}

export default function EventRolePaymentCardBody({
    currentCost,
    setValue,
    currentOverrides }: Props) {

    const [cost, setCost] = useState<number>(currentCost);

    return (
        <>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Cost</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="number"
                    step={0.01}
                    min={0}
                    max={10000}
                    className="input input-info w-full mt-0"
                    value={cost}
                    onChange={e => setCost(parseFloat(e.target.value))}
                    onBlur={() => setValue(cost, currentOverrides ?? [])}
                    required
                />
            </div>
            {currentOverrides && (
                <EventFieldPaymentOverrideSelector
                    overrides={currentOverrides || []}
                    setOverrides={newOverrides => {
                        setValue(cost, newOverrides);
                    }}
                    addLabel="Add Age Override"
                />
            )}
        </>);
}