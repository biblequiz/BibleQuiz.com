import { useNavigate, useOutletContext } from "react-router-dom";
import type { EventProviderContext } from "./EventProvider";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
}

const getIconCountCard = (tip: string, icon: string, count: number) => {
    return (
        <div
            className="card live-events-card w-16 card-sm shadow-sm border-2 border-solid mt-0 relative tooltip" data-tip={tip}>
            <div className="card-body p-1 m-1 text-center text-lg">
                <span className="font-bold">{count}</span>
                <FontAwesomeIcon icon={icon} classNames={["fa-sw", "text-2xl"]} />
            </div>
        </div>);
}

export default function EventDashboardPage({ }: Props) {
    const {
        info,
        databases,
        rootUrl,
        eventResultsUrl,
        registrations,
        payments } = useOutletContext<EventProviderContext>();

    const navigate = useNavigate();

    return (
        <div className="flex flex-wrap gap-2">
            <button
                className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                onClick={() => navigate(`${rootUrl}/sumary/reports`)}
            >
                <div className="card-body p-2 pl-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 mt-2 pr-6 text-left">
                            <h2 className="card-title mb-0 mt-0">
                                <FontAwesomeIcon icon="fas faUserPen" /> Registrations
                            </h2>
                            <p className="text-base mt-1">
                                Manage the registration settings.
                            </p>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                        />
                    </div>
                </div>
            </button>
            <a
                className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                href={`/${eventResultsUrl}`}
            >
                <div className="card-body p-2 pl-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 mt-2 pr-6 text-left">
                            <h2 className="card-title mb-0 mt-0">
                                <FontAwesomeIcon icon="fas faChartLine" /> Live Scores
                            </h2>
                            <p className="text-base mt-1">
                                View the live scores observed by other users.
                            </p>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                        />
                    </div>
                </div>
            </a>
            <button
                className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                onClick={() => navigate(`${rootUrl}/summary/reports`)}
            >
                <div className="card-body p-2 pl-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 mt-2 pr-6 text-left">
                            <h2 className="card-title mb-0 mt-0">
                                <FontAwesomeIcon icon="fas faFileImport" /> Reports
                            </h2>
                            <p className="text-base mt-1">
                                Manage the registrations associated with this event and download
                                reports (e.g., ScoreKeep).
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {getIconCountCard("Churches", "fas faChurch", registrations.Churches)}
                                {getIconCountCard("Teams", "fas faPeopleGroup", registrations.Teams)}
                                {getIconCountCard("Quizzers", "fas faPersonRunning", registrations.Quizzers)}
                                {getIconCountCard("Coaches", "fas faUserTie", registrations.Coaches)}
                                {getIconCountCard("Officials", "fas faGavel", registrations.Officials)}
                                {info!.AllowAttendees && getIconCountCard("Attendees", "fas faPerson", registrations.Attendees)}
                            </div>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                        />
                    </div>
                </div>
            </button>
            {payments && (
                <button
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/summary/payments`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faSackDollar" /> Money
                                </h2>
                                <p className="text-base mt-1">
                                    View the state of payments for this event.
                                </p>
                                <div
                                    className="card live-events-card w-full card-sm shadow-sm border-2 border-solid mt-2 relative">
                                    <div className="card-body p-0 m-1 text-center space-y-0 gap-0">
                                        <p className="text-lg font-bold m-0">
                                            ${DataTypeHelpers.formatNumber(payments.AmountDue, 2)}
                                        </p>
                                        <p className="text-md italic m-0">Total Registration Fees</p>
                                    </div>
                                </div>
                                {info!.TrackPayments && (
                                    <>
                                        <div
                                            className="card live-events-card w-full card-sm shadow-sm border-2 border-solid mt-2 relative">
                                            <div className="card-body p-0 m-1 text-center space-y-0 gap-0">
                                                <p className="text-lg font-bold m-0">
                                                    ${DataTypeHelpers.formatNumber(Math.max(payments.AmountDue - payments.AmountPaid, 0), 2)}{payments.AmountPending > 0 ? "*" : ""}
                                                </p>
                                                {payments.AmountPending > 0 && (
                                                    <p className="text-sm italic m-0">
                                                        * Additional ${DataTypeHelpers.formatNumber(payments.AmountPending, 2)} credit card payments are pending.
                                                    </p>)}
                                                <p className="text-md italic m-0">Unpaid Registration Fees</p>
                                            </div>
                                        </div>
                                        {info!.AutomatedFeeType !== null && (
                                            <div
                                                className="card live-events-card w-full card-sm shadow-sm border-2 border-solid mt-2 relative">
                                                <div className="card-body p-0 m-1 text-center space-y-0 gap-0">
                                                    <p className="text-lg font-bold m-0">
                                                        ${DataTypeHelpers.formatNumber(Math.max(payments.PayoutDue - payments.PayoutPaid, 0), 2)}
                                                    </p>
                                                    <p className="text-md italic m-0">Ready to Pay Out</p>
                                                </div>
                                            </div>)}
                                    </>)}
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>)}
            {databases.map(d => (
                <button
                    key={`database_${d.DatabaseId}`}
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/scoring/databases/${d.DatabaseId}/meets`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faDatabase" /> Database: {d.DatabaseName.replaceAll('_', ' ')}
                                </h2>
                                <p className="text-base mt-1">
                                    Manage the settings for this database.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {getIconCountCard("Divisions", "fas faLayerGroup", d.ActiveMeetCount + d.InactiveMeetCount)}
                                    {getIconCountCard("Teams", "fas faPeopleGroup", d.TeamCount)}
                                    {getIconCountCard("Quizzers", "fas faPersonRunning", d.QuizzerCount)}
                                </div>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>))}
            <button
                className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                onClick={() => navigate(`${rootUrl}/scoring/addDatabase`)}
            >
                <div className="card-body p-2 pl-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 mt-2 pr-6 text-left">
                            <h2 className="card-title mb-0 mt-0">
                                <FontAwesomeIcon icon="fas faPlus" /> Add Database
                            </h2>
                            <p className="text-base mt-1">
                                Create a new scoring database.
                            </p>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                        />
                    </div>
                </div>
            </button>
        </div>);
}