import { EventFieldPaymentOverride, EventFieldScopes } from "types/services/EventsService";
import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import EventFieldPaymentOverrideSelector from "./EventFieldPaymentOverrideSelector";

interface Props {
    fieldLabel: string;

    paymentScopes: EventFieldScopes;
    setPaymentScopes: (scopes: EventFieldScopes) => void;

    paymentInfo: FieldPaymentInfo;
    setPaymentInfo: (info: FieldPaymentInfo) => void;
    possibleValues: string[];
    allowedScopes: EventFieldScopes;
}

export interface FieldPaymentInfo {
    paymentIfSelected: number;
    paymentUnselectValue: string | null;
    paymentOverrides: EventFieldPaymentOverride[];
}

export default function EventFieldPaymentSelector({
    fieldLabel,
    paymentScopes,
    setPaymentScopes,
    paymentInfo,
    setPaymentInfo,
    possibleValues,
    allowedScopes }: Props) {

    const [cost, setCost] = useState<number>(paymentInfo.paymentIfSelected);
    const [overrides, setOverrides] = useState<EventFieldPaymentOverride[]>(paymentInfo.paymentOverrides);
    const [unselectValue, setUnselectValue] = useState<string | undefined>(paymentInfo.paymentUnselectValue ?? undefined);

    const getScopeCheckbox = (scope: EventFieldScopes, labelText: string) => {

        if ((allowedScopes & scope) != scope) {
            return null;
        }

        return (
            <label className="label ml-2 mt-0">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-info"
                    checked={(paymentScopes & scope) == scope}
                    onChange={e => {
                        const newScopes = e.target.checked
                            ? (paymentScopes | scope)
                            : (paymentScopes & ~scope);
                        setPaymentScopes(newScopes);
                    }}
                />
                <span>
                    {labelText}
                </span>
            </label>);
    };

    return (
        <div className="rounded-md border-primary border-1 border-dashed mt-0 relative p-2">
            <div className="w-full mt-0">
                <label className="input w-1/3">
                    <FontAwesomeIcon icon="fas faDollarSign" />
                    <input
                        type="number"
                        value={cost}
                        onChange={e => setCost(parseFloat(e.target.value))}
                        onBlur={e => {
                            e.preventDefault();
                            setPaymentInfo({ ...paymentInfo, paymentIfSelected: cost });
                        }}
                        min={-10000}
                        max={10000}
                        step={0.01}
                        placeholder="Cost"
                        required
                    />
                </label>
                <span className="pl-2"> for each</span>
            </div>
            <div className="w-full mt-2">
                {getScopeCheckbox(EventFieldScopes.Team, "Team")}
                {getScopeCheckbox(EventFieldScopes.Quizzer, "Quizzer")}
                {getScopeCheckbox(EventFieldScopes.Coach, "Coach")}
                {getScopeCheckbox(EventFieldScopes.Official, "Official")}
                {getScopeCheckbox(EventFieldScopes.Attendee, "Attendee")}
            </div>
            <div className="w-full mt-2">
                <span className="italic text-sm">except when</span>&nbsp;
                <select
                    name={`paymentexceptions_${fieldLabel}`}
                    className="select select-bordered w-1/2 mt-0"
                    value={unselectValue}
                    onChange={e => setPaymentInfo({ ...paymentInfo, paymentUnselectValue: e.target.value })}
                >
                    {possibleValues.map((value) => (
                        <option
                            key={`possible_${fieldLabel}_${value}`}
                            value={value}>
                            {value}
                        </option>))}
                </select>
            </div>
            <div className="w-full mt-2">
                <span className="italic text-sm">or ages</span>&nbsp;
                <EventFieldPaymentOverrideSelector
                    overrides={overrides}
                    setOverrides={newOverrides => {
                        setOverrides(newOverrides);
                        setPaymentInfo({ ...paymentInfo, paymentOverrides: newOverrides });
                    }}
                />
            </div>
        </div>);
}