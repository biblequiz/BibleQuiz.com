import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import type { EventProviderContext } from "./EventProvider";
import { DatabaseReportsService, type EventReport, type SeasonReport } from "types/services/DatabaseReportsService";
import type { AuthManager } from "types/AuthManager";

interface Props {
}

export interface LoadedReport<T extends EventReport | SeasonReport> {
    report: T;
    isLoaded: boolean;
}

export interface EventReportsProviderContext {
    auth: AuthManager;
    eventId: string | null;
    setReportTitle: (title: string) => void;

    parentUrl: string;
    useNavigateForParent: boolean;
    getItemUrl: (type: "event" | "season", reportId: string | null) => string;

    eventReports: LoadedReport<EventReport>[];
    setLoadedEventReport: (report: EventReport) => void;

    seasonReports: LoadedReport<SeasonReport>[];
    setLoadedSeasonReport: (report: SeasonReport) => void;
}

export default function EventReportsProvider({ }: Props) {
    const context = useOutletContext<EventProviderContext>();

    const [isLoading, setIsLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [eventReports, setEventReports] = useState<LoadedReport<EventReport>[] | null>(null);
    const [seasonReports, setSeasonReports] = useState<LoadedReport<SeasonReport>[] | null>(null);

    useEffect(() => {
        if (!isLoading && (!eventReports || !seasonReports)) {
            setIsLoading(true);

            DatabaseReportsService.getAllReportsForEvent(
                context.auth,
                context.eventId)
                .then(summary => {
                    setEventReports(summary.EventReports
                        .map(r => ({ report: r, isLoaded: false } as LoadedReport<EventReport>)));
                    setSeasonReports(summary.SeasonReports
                        .map(r => ({ report: r, isLoaded: false } as LoadedReport<SeasonReport>)));
                    setIsLoading(false);
                    setLoadingError(null);
                })
                .catch(error => {
                    setIsLoading(false);
                    if (error.statusCode === 404) {
                        setLoadingError("Cannot find the specified event.");
                    }
                    else {
                        setLoadingError(error.message || "An error occured while retrieving this event's reports.");
                    }
                });
        }
    }, [context]);

    if (isLoading || !eventReports || !seasonReports) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Reports ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            Downloading the event and season reports for this event. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }
    else if (loadingError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {loadingError}
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <Outlet context={{
            auth: context.auth,
            eventId: context.eventId,
            setReportTitle: context.setEventTitle,

            parentUrl: `${context.rootUrl}/reports`,
            useNavigateForParent:true,
            getItemUrl: (type, reportId) => `${context.rootUrl}/reports/${type}/${reportId}`,
            
            eventReports: eventReports,
            setLoadedEventReport: report => {
                const updatedReports = [...eventReports];
                const index = updatedReports.findIndex(r => r.report.Id === report.Id);
                updatedReports[index] = { report: report, isLoaded: true } as LoadedReport<EventReport>;
                setEventReports(updatedReports);
            },
            seasonReports: seasonReports,
            setLoadedSeasonReport: report => {
                const updatedReports = [...seasonReports];
                const index = updatedReports.findIndex(r => r.report.Id === report.Id);
                updatedReports[index] = { report: report, isLoaded: true } as LoadedReport<SeasonReport>;
                setSeasonReports(updatedReports);
            }
        } as EventReportsProviderContext} />);
}