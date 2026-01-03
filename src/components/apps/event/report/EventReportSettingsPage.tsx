import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { DatabaseReportsService, EventReport, SeasonReport } from "types/services/DatabaseReportsService";
import type { EventReportsProviderContext } from "../EventReportsProvider";
import { NEW_ID_PLACEHOLDER } from "../EventProvider";
import EventReportSettingsSection from "./EventReportSettingsSection";

interface Props {
}

export default function EventReportSettingsPage({ }: Props) {

    const {
        auth,
        eventId,
        setReportTitle,
        parentUrl,
        useNavigateForParent,
        eventReports,
        setLoadedEventReport,
        seasonReports,
        setLoadedSeasonReport } = useOutletContext<EventReportsProviderContext>();

    const urlParameters = useParams();
    const type = urlParameters.type === "event" ? "event" : "season";
    const reportId = urlParameters.reportId === NEW_ID_PLACEHOLDER
        ? null
        : (urlParameters.reportId || null);
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [reportSettings, setReportSettings] = useState<EventReport | SeasonReport | null>(null);

    useEffect(() => {
        if (!isLoading && !loadingError && !reportSettings) {

            if (!reportId) {
                setReportSettings(
                    type === "event"
                        ? new EventReport()
                        : new SeasonReport());
                return;
            }

            const existingReport = type === "event"
                ? eventReports.find(r => r.report.Id === reportId) || null
                : seasonReports.find(r => r.report.Id === reportId) || null;
            if (!existingReport) {
                setLoadingError("Cannot find the specified report.");
                return;
            }
            else if (existingReport.isLoaded) {
                setReportSettings(existingReport.report);
                return;
            }

            setIsLoading(true);
            setReportSettings(null);

            DatabaseReportsService.getEventOrSeasonReport(
                auth,
                eventId,
                reportId,
                type === "event")
                .then(reports => {
                    if (type === "event") {
                        if (reports.EventReports.length < 1) {
                            setLoadingError("Cannot find the specified event report.");
                            setIsLoading(false);
                            return;
                        }

                        const newReportSettings = reports.EventReports[0];
                        setLoadedEventReport(newReportSettings);
                        setReportSettings(newReportSettings);
                    }
                    else {
                        if (reports.SeasonReports.length < 1) {
                            setLoadingError("Cannot find the specified season report.");
                            setIsLoading(false);
                            return;
                        }

                        const newReportSettings = reports.SeasonReports[0];
                        setLoadedSeasonReport(newReportSettings);
                        setReportSettings(newReportSettings);
                    }

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
    }, [reportId]);

    if (isLoading || !reportSettings) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading {type === "event" ? "Event" : "Season"} Report</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            Downloading the {type} report for this event. This should just take a second or two ...
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

    const backButton =
        <button
            type="button"
            className="btn btn-sm btn-primary mr-2 hide-on-print mb-4"
            onClick={() => {
                if (useNavigateForParent) {
                    navigate(parentUrl);
                }
                else {
                    window.location.href = parentUrl;
                }
            }}>
            <FontAwesomeIcon icon="fas faArrowLeft" />
            Back to All Reports
        </button>;

    return (
        <>
            {backButton}
            <EventReportSettingsSection
                report={reportSettings}
                type={type}
                setReportTitle={setReportTitle} />
        </>);
}