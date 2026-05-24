import CoordinatorTabContent from "components/scores/CoordinatorTabContent";
import ScheduleGridTabContent from "components/scores/ScheduleGridTabContent";
import StatsTabContent from "components/scores/StatsTabContent";
import TeamOrRoomScheduleTabContent from "components/scores/TeamOrRoomScheduleTabContent";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { DatabasesService } from "types/services/DatabasesService";
import { sharedEventScoringReportState } from "utils/SharedState";
import { TeamAndQuizzerFavorites } from "types/TeamAndQuizzerFavorites";

interface Props {
}

const teamScheduleTabId = "team_schedule_tab";
const roomScheduleTabId = "room_schedule_tab";
const scheduleGridTabId = "schedule_grid_tab";
const coordinatorTabId = "coordinator_grid_tab";
const statsTabId = "stats_tab";

export default function ScoringDatabaseLiveScoresPage({ }: Props) {
    const {
        auth,
        eventId,
        databaseId } = useOutletContext<ScoringDatabaseProviderContext>();

    const [selectedTab, setSelectedTab] = useState<string>(coordinatorTabId);
    const [isReloading, setIsReloading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (!eventId || !databaseId) return;
        if (!isReloading && sharedEventScoringReportState.get()) return;

        setIsLoading(true);
        setLoadError(null);
        sharedEventScoringReportState.set(null);

        DatabasesService.getEventScoringReport(auth, eventId, databaseId)
            .then(report => {

                sharedEventScoringReportState.set({
                    report: report,
                    favorites: TeamAndQuizzerFavorites.load(),
                    teamIndex: null,
                    quizzerIndex: null,
                    error: null
                });

                setIsLoading(false);
                setLoadError(null);;
            })
            .catch(err => {
                sharedEventScoringReportState.set(null);
                setLoadError(err.message || "Failed to load live scores.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, isReloading]);

    // Loading state
    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Live Scores ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The live scores are being downloaded from the server. This should only take a few seconds.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">{loadError}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div>
                <button type="button" className="btn btn-primary" onClick={() => {
                    setIsReloading(true);
                    setIsLoading(true);
                    setLoadError(null);
                }}>
                    <FontAwesomeIcon icon="fas faArrowsRotate" /> Refresh Scores
                </button>
            </div>
            <div className="tabs tabs-border">
                <input
                    type="radio"
                    name="live_score_tabs"
                    className="tab"
                    aria-label="Stats"
                    checked={selectedTab === statsTabId}
                    onChange={() => setSelectedTab(statsTabId)} />
                <div className="tab-content p-0" id={statsTabId}>
                    <StatsTabContent eventId={eventId} />
                </div>

                <input
                    type="radio"
                    name="live_score_tabs"
                    className="tab"
                    aria-label="Teams/Quizzers"
                    checked={selectedTab === teamScheduleTabId}
                    onChange={() => setSelectedTab(teamScheduleTabId)} />
                <div className="tab-content p-0" id={teamScheduleTabId}>
                    <TeamOrRoomScheduleTabContent
                        type="Team"
                        eventId={eventId}
                        schedulesTabId={teamScheduleTabId}
                    />
                </div>

                <input
                    type="radio"
                    name="live_score_tabs"
                    className="tab"
                    aria-label="Room"
                    checked={selectedTab === roomScheduleTabId}
                    onChange={() => setSelectedTab(roomScheduleTabId)} />
                <div className="tab-content p-0" id={roomScheduleTabId}>
                    <TeamOrRoomScheduleTabContent
                        type="Room"
                        eventId={eventId}
                        schedulesTabId={roomScheduleTabId}
                    />
                </div>

                <input
                    type="radio"
                    name="live_score_tabs"
                    className="tab"
                    aria-label="Grid"
                    checked={selectedTab === scheduleGridTabId}
                    onChange={() => setSelectedTab(scheduleGridTabId)} />
                <div className="tab-content p-0" id={scheduleGridTabId}>
                    <ScheduleGridTabContent
                        eventId={eventId}
                        schedulesTabId={scheduleGridTabId}
                    />
                </div>

                <input
                    type="radio"
                    name="live_score_tabs"
                    className="tab"
                    aria-label="Coordinator"
                    checked={selectedTab === coordinatorTabId}
                    onChange={() => setSelectedTab(coordinatorTabId)} />
                <div className="tab-content p-0">
                    <CoordinatorTabContent eventId={eventId} />
                </div>
            </div>
        </>);
}