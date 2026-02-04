import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useNavigate, useOutletContext } from "react-router-dom";
import DatabaseSettingsSection from "./DatabaseSettingsSection";

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

export default function ScoringDashboardPage({ }: Props) {

    const {
        auth,
        eventId,
        currentDatabase,
        setCurrentDatabase,
        rootUrl } = useOutletContext<ScoringDatabaseProviderContext>();

    const navigate = useNavigate();

    return (
        <>
            <DatabaseSettingsSection
                auth={auth}
                eventId={eventId}
                settings={JSON.parse(JSON.stringify(currentDatabase!.Settings))}
                defaultRules={currentDatabase!.DefaultRules || undefined}
                onSaved={setCurrentDatabase}
                setIsProcessing={()=> {}}
            />
            <div className="divider mt-0 mb-2" />
            <div className="flex flex-wrap gap-2 mt-2">
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/meets`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faLayerGroup" /> Divisions
                                </h2>
                                <p className="text-base mt-1">
                                    Manage the divisions (previously called meets) for this database.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {getIconCountCard("Active", "fas faLayerGroup", currentDatabase!.ActiveMeetCount)}
                                    {getIconCountCard("Inactive", "fas faBan", currentDatabase!.InactiveMeetCount)}
                                </div>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/teamsAndQuizzers`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faUserGroup" /> Teams & Quizzers
                                </h2>
                                <p className="text-base mt-1">
                                    Manage the teams and quizzers configured in this database and available
                                    for assignment to divisions.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {getIconCountCard("Teams", "fas faPeopleGroup", currentDatabase!.TeamCount)}
                                    {getIconCountCard("Quizzers", "fas faPersonRunning", currentDatabase!.QuizzerCount)}
                                </div>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/liveScores`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faChartLine" /> Live Scores
                                </h2>
                                <p className="text-base mt-1">
                                    View the live scores for the events in this database, even if they aren't
                                    visible to regular users.
                                </p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/playoffs`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faPeopleArrows" /> Playoffs
                                </h2>
                                <p className="text-base mt-1">
                                    Manage playoffs for the divisions in this database.
                                </p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/apps`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faTabletAlt" /> Devices & Apps
                                </h2>
                                <p className="text-base mt-1">
                                    View the devices and apps connected to this event.
                                </p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/awards`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faTrophy" /> Awards
                                </h2>
                                <p className="text-base mt-1">
                                    Create awards for this database and print certificates.
                                </p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/manualEntry`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faPenToSquare" /> Manual Entry
                                </h2>
                                <p className="text-base mt-1">
                                    Manually edit the scores for divisions in this database.
                                </p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
                <button
                    type="button"
                    className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
                    onClick={() => navigate(`${rootUrl}/delete`)}
                >
                    <div className="card-body p-2 pl-4">
                        <div className="flex items-start gap-4">
                            <div className="flex-1 mt-2 pr-6 text-left">
                                <h2 className="card-title mb-0 mt-0">
                                    <FontAwesomeIcon icon="fas faTrash" /> Delete Database
                                </h2>
                                <p className="text-base mt-1">
                                    Permanently delete this database and all associated data.
                                </p>
                            </div>
                            <FontAwesomeIcon
                                icon="fas faArrowRight"
                                classNames={["icon text-lg rtl:flip absolute top-4 right-4"]}
                            />
                        </div>
                    </div>
                </button>
            </div>
        </>);
}