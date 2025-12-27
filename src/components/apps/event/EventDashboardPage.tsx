import { useNavigate, useOutletContext } from "react-router-dom";
import type { EventProviderContext } from "./EventProvider";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
}

export default function EventDashboardPage({ }: Props) {
    const {
        info,
        databases,
        rootUrl,
        eventResultsUrl,
        registrations    } = useOutletContext<EventProviderContext>();

    const navigate = useNavigate();

    return (
        <div className="flex flex-wrap gap-2">
            <button
                className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                onClick={() => navigate(`${rootUrl}/reports`)}
            >
                <div className="card-body p-2 pl-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 mt-2 pr-6 text-left">
                            <h2 className="card-title mb-0 mt-1">
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
                            <h2 className="card-title mb-0 mt-1">
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
                onClick={() => navigate(`${rootUrl}/reports`)}
            >
                <div className="card-body p-2 pl-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1 mt-2 pr-6 text-left">
                            <h2 className="card-title mb-0 mt-1">
                                <FontAwesomeIcon icon="fas faFileImport" /> Reports
                            </h2>
                            <p className="text-base mt-1">
                                Manage the registrations associated with this event and download
                                reports (e.g., ScoreKeep).
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(registrations).map(key => {
                                    if (key === "Attendees" && !info?.AllowAttendees) {
                                        return null;
                                    }

                                    const count: number = (registrations as any)[key];
                                    return (
                                        <div
                                            key={`registrations_${key}`}
                                            className="card live-events-card w-24 card-sm shadow-sm border-2 border-solid mt-0 relative">
                                            <div className="card-body p-1 m-1 text-center">
                                                <span className="text-md font-bold">{count}</span>
                                                <i className="subtitle">{key}</i>
                                            </div>
                                        </div>);
                                })}
                            </div>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                        />
                    </div>
                </div>
            </button>
            {databases.map(d => (
                <button
                    key={`database_${d.DatabaseId}`}
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/scoring/databases/${d.DatabaseId}/meets`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-1">
                                    <FontAwesomeIcon icon="fas faDatabase" /> {d.DatabaseName.replaceAll('_', ' ')}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <div
                                        className="card live-events-card w-24 card-sm shadow-sm border-2 border-solid mt-0 relative">
                                        <div className="card-body p-1 m-1 text-center">
                                            <span className="text-md font-bold">{d.ActiveMeetCount}</span>
                                            <i className="subtitle">Active Divisions</i>
                                        </div>
                                    </div>
                                    <div
                                        className="card live-events-card w-24 card-sm shadow-sm border-2 border-solid mt-0 relative">
                                        <div className="card-body p-1 m-1 text-center">
                                            <span className="text-md font-bold">{d.InactiveMeetCount}</span>
                                            <i className="subtitle">Inactive Divisions</i>
                                        </div>
                                    </div>
                                    <div
                                        className="card live-events-card w-24 card-sm shadow-sm border-2 border-solid mt-0 relative">
                                        <div className="card-body p-1 m-1 text-center">
                                            <span className="text-md font-bold">{d.TeamCount}</span>
                                            <i className="subtitle">Teams</i>
                                        </div>
                                    </div>
                                    <div
                                        className="card live-events-card w-24 card-sm shadow-sm border-2 border-solid mt-0 relative">
                                        <div className="card-body p-1 m-1 text-center">
                                            <span className="text-md font-bold">{d.QuizzerCount}</span>
                                            <i className="subtitle">Quizzers</i>
                                        </div>
                                    </div>
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
                            <h2 className="card-title mb-0 mt-1">
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