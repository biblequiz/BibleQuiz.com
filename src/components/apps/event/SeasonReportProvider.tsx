import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import { DatabaseReportsService, SeasonReport } from "types/services/DatabaseReportsService";
import { NEW_ID_PLACEHOLDER } from "./EventProvider";
import type { EventReportsProviderContext, LoadedReport } from "./EventReportsProvider";

interface Props {
}

export default function SeasonReportProvider({ }: Props) {

    const auth = AuthManager.useNanoStore();
    const urlParameters = useParams();
    const reportId = urlParameters.reportId === NEW_ID_PLACEHOLDER
        ? null
        : (urlParameters.reportId || null);

    const [reportTitle, setReportTitle] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(reportId !== null);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [report, setReport] = useState<SeasonReport | null>(null);
    const [isHidden, setIsHidden] = useState<boolean>(false);

    useEffect(() => {
        if (!reportId || reportId == NEW_ID_PLACEHOLDER) {
            setReport(new SeasonReport());
        }
        else {
            setIsLoading(true);

            DatabaseReportsService.getEventOrSeasonReport(
                auth,
                null,
                reportId,
                false)
                .then(summary => {
                    if (summary.SeasonReports.length < 1) {
                        setLoadingError("Cannot find the specified report.");
                    }
                    else {
                        const newReport = summary.SeasonReports[0];
                        setReport(newReport);
                        setReportTitle(newReport.Name);
                        setLoadingError(null);
                    }

                    setIsLoading(false);
                })
                .catch(error => {
                    setReport(null);
                    setIsLoading(false);

                    if (error.statusCode === 404) {
                        setLoadingError("Cannot find the specified event.");
                    }
                    else {
                        setLoadingError(error.message || "An error occured while retrieving this event.");
                    }
                });
        }
    }, [reportId, auth]);

    useEffect(
        () => setIsHidden(report?.IsVisible ?? false),
        [report]);

    if (isLoading || !report) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Report ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The event information is being downloaded and prepared. This should just take a second or two ...
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

    const eventType = report.CompetitionTypeId.substring(2) || "jbq";

    return (
        <>
            <h1 className="page-title mt-0">
                {eventType && (
                    <img
                        src={`/assets/logos/${eventType}/${eventType}-logo.png`}
                        alt={eventType}
                        width="72"
                        height="72"
                        className="event-icon"
                    />
                )}
                <span className="event-title-text">{reportTitle || report.Name}</span>
                {!report.IsVisible && <span className="badge badge-error mr-1 text-nowrap">HIDDEN</span>}
            </h1>
            <Outlet context={{
                auth: auth,
                reportId: reportId,
                type: "season",
                eventId: null,
                eventName: null,

                setReportTitle: (t, isReport) => isReport ? `Report: ${t}` : t,
                setReportHidden: setIsHidden,

                season: report.Season,
                competitionTypeId: report.CompetitionTypeId,
                competitionTypeLabel: report.CompetitionTypeLabel,

                parentUrl: `/manage-events`,
                useNavigateForParent: false,
                getItemUrl: (type, reportId) => `/${reportId}`,
                getDatabaseUrl: (eventId, databaseId) => ({
                    url: `/manage-events/event/#/${eventId}/scoring/databases/${databaseId}/meets`,
                    useNavigate: false
                }),

                eventReports: [],
                setLoadedEventReport: () => { },

                seasonReports: [{ report: report, isLoaded: true } as LoadedReport<SeasonReport>],
                setLoadedSeasonReport: () => { }
            } as EventReportsProviderContext} />
        </>);
}