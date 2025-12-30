import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { EventSummaryProviderContext } from "./EventSummaryProvider";
import { useNavigate, useOutletContext } from "react-router-dom";
import type { EventChurchSummary, EventInfo } from "types/services/EventsService";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { useState } from "react";
import EventPaymentsReceiptDialog from "./EventPaymentsReceiptDialog";

interface Props {
}

const getChurchCard = (
    info: EventInfo,
    summary: EventChurchSummary,
    setSelectedChurch: (church: EventChurchSummary) => void,
    isDisabled: boolean) => {

    return (
        <button
            key={`church-${summary.Id}`}
            className="card live-events-card w-full md:w-64 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
            onClick={() => setSelectedChurch(summary)}
            disabled={isDisabled}
        >
            <div className="card-body p-2 pl-4">
                <div className="flex items-start gap-4">
                    <div className="flex-1 mt-2 text-left">
                        <h2 className="card-title mb-0 mt-0">
                            <FontAwesomeIcon icon="fas faChurch" /> {summary.ChurchName}
                        </h2>
                        <p className="subtitle mt-0">
                            {summary.ChurchLocation.City}, {summary.ChurchLocation.State}
                        </p>
                        {info.TrackPayments && (
                            <div className="p-0 m-1 text-center space-y-0 gap-0">
                                <p className="text-lg font-bold m-0">
                                    ${DataTypeHelpers.formatNumber(Math.max(summary.CalculatedPayment - summary.PaymentBalance, 0), 2)}{summary.PendingPayments > 0 ? "*" : ""}
                                </p>
                                {summary.PendingPayments > 0 && (
                                    <p className="text-sm italic m-0">
                                        * Additional ${DataTypeHelpers.formatNumber(summary.PendingPayments, 2)} credit card payments are pending.
                                    </p>)}
                                <p className="text-md italic m-0">Amount Owed</p>
                            </div>)}
                        {!info.TrackPayments && (
                            <div className="p-0 m-1 text-center space-y-0 gap-0">
                                <p className="text-lg font-bold m-0">
                                    ${DataTypeHelpers.formatNumber(summary.CalculatedPayment, 2)}
                                </p>
                                <p className="text-md italic m-0">Amount Owed</p>
                            </div>)}
                    </div>
                </div>
            </div>
        </button>);
}

export default function EventPaymentsPage({ }: Props) {
    const {
        context,
        summary
    } = useOutletContext<EventSummaryProviderContext>();

    const { auth, info, rootUrl } = context;
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState<string | undefined>(undefined);
    const [includeOnlyNonZeroChurches, setIncludeOnlyNonZeroChurches] = useState<boolean>(false);
    const [displayChurch, setDisplayChurch] = useState<EventChurchSummary | undefined>(undefined);

    if (!info!.CalculatePayment) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faSackDollar" />
                            <span className="ml-4">No Fees Collected</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            This event isn't setup to calculate or collect fees during registration.
                        </p>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => navigate(`${rootUrl}/registration/money`)}>
                            <FontAwesomeIcon icon="fas faGear" />
                            <span className="ml-2">Change Money Settings</span>
                        </button>
                    </div>
                </div>
            </div>);
    }

    if (!summary || summary.Churches.length === 0) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faUserPen" />
                            <span className="ml-4">No Churches Registered</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            No churches have registered for this event yet. Once they do,
                            their payment information will appear here.
                        </p>
                    </div>
                </div>
            </div>);
    }

    let filteredChurches = includeOnlyNonZeroChurches && info!.TrackPayments
        ? summary.Churches.filter(church => church.CalculatedPayment > church.PaymentBalance)
        : summary.Churches;

    if (!DataTypeHelpers.isNullOrEmpty(searchText)) {
        filteredChurches = filteredChurches.filter(church =>
            church.ChurchName.toLowerCase().includes(searchText!.toLowerCase()) ||
            church.ChurchLocation.City.toLowerCase().includes(searchText!.toLowerCase()) ||
            church.ChurchLocation.State.toLowerCase().includes(searchText!.toLowerCase()));
    }

    return (
        <>
            <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-2 pt-0">
                <legend className="fieldset-legend ml-2">
                    <FontAwesomeIcon icon="fas faSearch" />
                    Filter Churches
                </legend>
                <div className="flex flex-wrap gap-2 mt-0 mb-0">
                    <label className="input input-sm mt-0 max-w-4xl">
                        <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
                        <input
                            type="text"
                            className="grow"
                            placeholder="Name or Location"
                            value={searchText ?? ""}
                            onChange={e => setSearchText(e.target.value)}
                            disabled={!!displayChurch}
                        />
                        {(searchText?.length ?? 0) > 0 && (
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => setSearchText(undefined)}
                            >
                                <FontAwesomeIcon icon="fas faCircleXmark" />
                            </button>)}
                    </label>
                    {info?.TrackPayments && (
                        <div className="flex items-center gap-2 p-0 pl-2 mb-0 mt-0">
                            <label className="label">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={includeOnlyNonZeroChurches}
                                    onChange={e => setIncludeOnlyNonZeroChurches(e.target.checked)}
                                    disabled={!!displayChurch}
                                />
                                <span className="mt-0 mb-0 text-base-content">
                                    Show only churches owing money
                                </span>
                            </label>
                        </div>)}
                </div>
            </fieldset>
            <div className="flex flex-wrap gap-2">
                {filteredChurches.map(church => getChurchCard(
                    info!,
                    church,
                    setDisplayChurch,
                    !!displayChurch))}
                {filteredChurches.length === 0 && (
                    <p className="mt-4 italic w-full text-center">
                        No churches match the specified criteria.
                    </p>
                )}
            </div>
            {displayChurch && (
                <EventPaymentsReceiptDialog
                    eventSummary={summary}
                    churchSummary={displayChurch}
                    onClose={() => setDisplayChurch(undefined)}
                />)}
        </>);
}