import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { NEW_ID_PLACEHOLDER, type EventProviderContext } from "./EventProvider";
import { DatabaseReportsService, type EventReport, type SeasonReport } from "types/services/DatabaseReportsService";
import type { AuthManager } from "types/AuthManager";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
}

export interface LoadedReport<T extends EventReport | SeasonReport> {
    report: T;
    isLoaded: boolean;
}

export interface EventReportsProviderContext {
    auth: AuthManager;
    eventId: string | null;
    eventRegionId?: string;
    eventDistrictId?: string;
    type: "event" | "season";
    reportId: string | null;
    eventName: string | null;
    season: number;
    competitionTypeId: string;
    competitionTypeLabel: string;

    setReportTitle: (title: string, isReport: boolean) => void;
    setReportHidden: (isHidden: boolean) => void;

    parentUrl: string;
    useNavigateForParent: boolean;
    getDatabaseUrl: (eventId: string, databaseId: string) => { url: string, useNavigate: boolean };
    getItemUrl: (type: "event" | "season", reportId: string | null) => string;

    eventReports: LoadedReport<EventReport>[];
    setLoadedEventReport: (report: EventReport | string) => void;

    seasonReports: LoadedReport<SeasonReport>[];
    setLoadedSeasonReport: (report: SeasonReport | string) => void;

    forceEventListRefresh?: () => void;
}

export default function EventReportsProvider({ }: Props) {
    const context = useOutletContext<EventProviderContext>();

    const urlParameters = useParams();
    const type = urlParameters.type === "event" ? "event" : "season";
    const reportId = urlParameters.reportId === NEW_ID_PLACEHOLDER
        ? null
        : (urlParameters.reportId || null);

    const [isLoading, setIsLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [eventReports, setEventReports] = useState<LoadedReport<EventReport>[] | null>(null);
    const [seasonReports, setSeasonReports] = useState<LoadedReport<SeasonReport>[] | null>(null);
    const [forceRefresh, setForceRefresh] = useState(false);

    useEffect(() => {
        if (!isLoading && (!eventReports || !seasonReports || forceRefresh)) {
            setIsLoading(true);
            setForceRefresh(false);

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
    }, [context, forceRefresh]);

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
            reportId: reportId,
            type: type,
            eventId: context.eventId,
            eventName: context.info!.Name,
            eventRegionId: context.info!.RegionId,
            eventDistrictId: context.info!.DistrictId,

            setReportTitle: (t, isReport) => context.setEventTitle(isReport ? `Report: ${t}` : t),
            setReportHidden: (isHidden) => context.setEventIsHidden(isHidden),

            season: DataTypeHelpers.getSeasonFromDate(context.info!.StartDate),
            competitionTypeId: context.info!.TypeId,
            competitionTypeLabel: context.info!.TypeLabel,

            parentUrl: `${context.rootUrl}/reports`,
            useNavigateForParent: true,
            getItemUrl: (type, reportId) => `${context.rootUrl}/reports/${type}/${reportId}`,
            getDatabaseUrl: (eventId, databaseId) => ({
                url: `/${eventId}/scoring/databases/${databaseId}/meets`,
                useNavigate: true
            }),

            eventReports: eventReports,
            setLoadedEventReport: report => {
                const updatedReports = [...eventReports];

                if (typeof report === "string") {
                    const index = updatedReports.findIndex(r => r.report.Id === report as string);
                    updatedReports.splice(index, 1);
                }
                else {
                    const index = updatedReports.findIndex(r => r.report.Id === (report as EventReport).Id);
                    updatedReports[index] = { report: report, isLoaded: true } as LoadedReport<EventReport>;
                }

                setEventReports(updatedReports);
            },
            seasonReports: seasonReports,
            setLoadedSeasonReport: report => {
                const updatedReports = [...seasonReports];

                if (typeof report === "string") {
                    const index = updatedReports.findIndex(r => r.report.Id === report as string);
                    updatedReports.splice(index, 1);
                }
                else {
                    const index = updatedReports.findIndex(r => r.report.Id === (report as SeasonReport).Id);
                    updatedReports[index] = { report: report, isLoaded: true } as LoadedReport<SeasonReport>;
                }

                setSeasonReports(updatedReports);
            },

            forceEventListRefresh: () => setForceRefresh(true),
        } as EventReportsProviderContext} />);
}