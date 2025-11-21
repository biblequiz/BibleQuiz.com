import { useState } from "react";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useOutletContext } from "react-router-dom";
import RegistrationPageForm from "./RegistrationPageForm";
import { sharedDirtyWindowState } from "utils/SharedState";
import type { Address } from "types/services/models/Address";
import { EventPaymentFeeType, type EventRolePayment } from "types/services/EventsService";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import AddressSelector from "../AddressSelector";
import EventFieldCard from "./EventFieldCard";
import EventRolePaymentCardBody from "./EventRolePaymentCardBody";
import { PersonRole } from "types/services/PeopleService";

interface Props {
}

export interface RegistrationMoneyInfo {
    calculatePayment: boolean;
    trackPayments: boolean;
    automatedFeeType: EventPaymentFeeType | null;
    automatedPaymentDescriptor: string | null;
    payeeName: string | null;
    payeeEmail: string | null;
    payeeAddress: Address | null;
    perChurchCost: number | null;
    perTeamCost: number | null;
    rolePayment: EventRolePayment | null;
}

const PAYMENT_CARD_WIDTH = "md:w-70";

const getRolePaymentControl = (
    label: string,
    role: PersonRole,
    allRoles: EventRolePayment | null,
    setAllRoles: (value: EventRolePayment | null) => void) => {

    const current = allRoles ? allRoles[PersonRole[role]] ?? 0 : undefined;

    return (
        <EventFieldCard title={label} width={PAYMENT_CARD_WIDTH}>
            <EventRolePaymentCardBody
                currentCost={current?.Cost ?? 0}
                setValue={(cost, overrides) => {
                    const updated = { ...(allRoles ?? {}) };

                    if (cost <= 0) {
                        if (allRoles) {
                            delete updated[PersonRole[role]];
                        }
                    }
                    else {
                        updated[PersonRole[role]] = {
                            Cost: cost,
                            Overrides: overrides
                        };
                    }

                    setAllRoles(Object.keys(updated).length > 0 ? updated : null);
                    sharedDirtyWindowState.set(true);
                }}

                currentOverrides={current?.Overrides ?? []}
            />
        </EventFieldCard >);
};

export default function RegistrationMoneyPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        officialsAndAttendees,
        money,
        setMoney } = useOutletContext<RegistrationProviderContext>();

    const [calculatePayment, setCalculatePayment] = useState(money.calculatePayment);
    const [trackPayments, setTrackPayments] = useState(money.trackPayments);
    const [automatedFeeType, setAutomatedFeeType] = useState<EventPaymentFeeType | null>(money.automatedFeeType);
    const [automatedPaymentDescriptor, setAutomatedPaymentDescriptor] = useState<string | null>(money.automatedPaymentDescriptor);
    const [payeeName, setPayeeName] = useState<string | null>(money.payeeName);
    const [payeeEmail, setPayeeEmail] = useState<string | null>(money.payeeEmail);
    const [payeeAddress, setPayeeAddress] = useState<Address | null>(money.payeeAddress);
    const [perChurchCost, setPerChurchCost] = useState<number | null>(money.perChurchCost);
    const [perTeamCost, setPerTeamCost] = useState<number | null>(money.perTeamCost);
    const [rolePayment, setRolePayment] = useState<EventRolePayment | null>(money.rolePayment);

    const handleFeeTypeChange = (
        newCalculatePayment: boolean,
        newTrackPayment: boolean,
        newFeeType: EventPaymentFeeType | null) => {

        setCalculatePayment(newCalculatePayment);
        setTrackPayments(newTrackPayment);
        setAutomatedFeeType(newFeeType);
        sharedDirtyWindowState.set(true);
    };

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
            persistFormToEventInfo={() => {
                setMoney({
                    ...money,
                    calculatePayment,
                    trackPayments,
                    automatedFeeType,
                    automatedPaymentDescriptor,
                    payeeName,
                    payeeEmail,
                    payeeAddress,
                    perChurchCost,
                    perTeamCost,
                    rolePayment
                });
            }}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/forms`}
            nextPageLink={`${rootEventUrl}/registration/other`}>

            <h5 className="mb-2">How do you charge registration fees?</h5>
            {calculatePayment && automatedFeeType === null && (
                <div role="alert" className="alert alert-warning block mb-2 mt-0">
                    <div className="mb-0">
                        <FontAwesomeIcon icon="fas faCircleInfo" />&nbsp;
                        <span className="font-bold">
                            <b>Consider Credit Cards</b>
                        </span>
                    </div>
                    <div className="mt-0">
                        Although we are regularly trying to minimize costs, <b>operating BibleQuiz.com
                            costs money</b>. Accepting credit cards with the 5% fee helps us cover these costs,
                        including the credit card processing fees.<br />&nbsp;<br />
                        Credit card processing fees and donations are the sole source of support to keep BibleQuiz.com
                        operating.
                    </div>
                </div>)}
            {automatedFeeType === EventPaymentFeeType.PlusThree && (
                <div role="alert" className="alert alert-info alert-outline block mb-2 mt-0">
                    <div className="mb-0 text-base-content">
                        <FontAwesomeIcon icon="fas faCircleInfo" />&nbsp;
                        <span className="font-bold">
                            <b>Consider 5%</b>
                        </span>
                    </div>
                    <div className="mt-0 text-base-content">
                        3% barely covers our credit card process fees and won't contribute to any
                        costs of operating BibleQuiz.com. Consider increasing this to 5% to
                        help support this ministry as credit card processing fees and donations
                        are the sole source of support to keep BibleQuiz.com operating.
                    </div>
                </div>)}
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={!calculatePayment}
                        onChange={e => handleFeeTypeChange(false, false, null)}
                    />
                    <span className="text-sm">
                        <b>None</b><br />
                        No registration fees will be charged for this event.
                    </span>
                </label>
            </div>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={trackPayments && automatedFeeType === EventPaymentFeeType.PlusFive}
                        onChange={e => handleFeeTypeChange(true, true, EventPaymentFeeType.PlusFive)}
                    />
                    <span className="text-sm">
                        <b>Accept Credits Cards (5% + 30¢ per Transaction)</b><br />
                        Fees are charged for this event and payments can be made with a credit card
                        or Bank Transfer. If you accept a manual payment, you must update the registration
                        manually.
                    </span>
                </label>
            </div>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={trackPayments && automatedFeeType === EventPaymentFeeType.PlusThree}
                        onChange={e => handleFeeTypeChange(true, true, EventPaymentFeeType.PlusThree)}
                    />
                    <span className="text-sm">
                        <b>Accept Credits Cards (3% + 30¢ per Transaction)</b><br />
                        Fees are charged for this event and payments can be made with a credit card
                        or Bank Transfer. If you accept a manual payment, you must update the registration
                        manually.
                    </span>
                </label>
            </div>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={trackPayments && automatedFeeType === null}
                        onChange={e => handleFeeTypeChange(true, true, null)}
                    />
                    <span className="text-sm">
                        <b>Display & Track</b><br />
                        Fees <i>are</i> charged for this event and payment of fees will be tracked
                        with the registration. You are responsible for collecting the fees and
                        updating the registration to indicate they have paid.
                    </span>
                </label>
            </div>
            <div className="w-full mb-2">
                <label className="label text-wrap">
                    <input
                        type="radio"
                        name="feeType"
                        className="radio radio-info"
                        checked={calculatePayment && !trackPayments}
                        onChange={e => handleFeeTypeChange(true, false, null)}
                    />
                    <span className="text-sm">
                        <b>Display Only</b><br />
                        Fees <i>are</i> charged for this event, but they will be collected manually
                        (e.g., at the event). Payment of the fees <i>won't</i> be tracked with the
                        registration.
                    </span>
                </label>
            </div>
            {automatedFeeType !== null && (
                <div className="w-full p-2 border border-base-400 bg-base-300 rounded-lg mt-4">
                    <ul>
                        <li>
                            All registration costs will be increased by {automatedFeeType === EventPaymentFeeType.PlusFive ? "5%" : "3%"} plus 30¢.
                        </li>
                        <li>All refunds must be handled separately by the event coordinator.</li>
                        <li>Costs are paid out twice per month by check to the address below. It is possible to do an electronic fund transfer if coordinated separately.</li>
                    </ul>
                    <div className="divider" />
                    <div className="w-full mt-0 ml-2 pr-4">
                        <label className="label">
                            <span className="label-text font-medium">Description for charges on Credit Card statements (prefixed with "BQ* ")</span>
                        </label>
                        <input
                            type="email"
                            className="input w-full"
                            value={automatedPaymentDescriptor || undefined}
                            maxLength={150}
                            placeholder="Description for charges on Credit Card statements"
                            onChange={e => {
                                setAutomatedPaymentDescriptor(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            required
                        />
                    </div>
                    <div className="w-full mt-0 ml-2 pr-4">
                        <label className="label">
                            <span className="label-text font-medium">Person or organization's e-mail address to be notified when funds are sent.</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="email"
                            className="input w-full"
                            value={payeeEmail || undefined}
                            maxLength={150}
                            placeholder="Payee E-mail Address"
                            onChange={e => {
                                setPayeeEmail(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            required
                        />
                    </div>
                    <AddressSelector
                        id="location"
                        label="Person or organization to receive funds"
                        name={payeeName || undefined}
                        setName={n => {
                            setPayeeName(n);
                            sharedDirtyWindowState.set(true);
                        }}
                        address={payeeAddress || undefined}
                        setAddress={a => {
                            setPayeeAddress(a);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                </div>)}

            <h5 className="mb-2 mt-4">What are the fees?</h5>
            <div className="flex flex-wrap gap-4">
                <EventFieldCard title="Church" width={PAYMENT_CARD_WIDTH}>
                    <EventRolePaymentCardBody
                        currentCost={perChurchCost ?? 0}
                        setValue={cost => {
                            setPerChurchCost(cost);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                </EventFieldCard>
                <EventFieldCard title="Team" width={PAYMENT_CARD_WIDTH}>
                    <EventRolePaymentCardBody
                        currentCost={perTeamCost ?? 0}
                        setValue={cost => {
                            setPerTeamCost(cost);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                </EventFieldCard>
                {getRolePaymentControl("Quizzer", PersonRole.Quizzer, rolePayment, setRolePayment)}
                {getRolePaymentControl("Coach", PersonRole.Coach, rolePayment, setRolePayment)}
                {getRolePaymentControl("Official", PersonRole.Official, rolePayment, setRolePayment)}
                {officialsAndAttendees.allowAttendees && getRolePaymentControl("Attendee", PersonRole.Attendee, rolePayment, setRolePayment)}
            </div>
        </RegistrationPageForm>);
}