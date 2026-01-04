import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { DatabaseReportsService, EventReport, SeasonReport } from "types/services/DatabaseReportsService";
import type { EventReportsProviderContext } from "../EventReportsProvider";
import EventReportSettingsSection from "./EventReportSettingsSection";
import ConfirmationDialog from "components/ConfirmationDialog";
import { sharedDirtyWindowState } from "utils/SharedState";
import { set } from "date-fns";

interface Props {
}

export default function EventReportSettingsPage({ }: Props) {

    const {
        auth,
        type,
        reportId,
        eventId,
        eventName,
        eventRegionId,
        eventDistrictId,
        season,
        competitionTypeId,
        competitionTypeLabel,
        setReportTitle,
        setReportHidden,
        parentUrl,
        useNavigateForParent,
        getDatabaseUrl,
        eventReports,
        setLoadedEventReport,
        seasonReports,
        setLoadedSeasonReport,
        forceEventListRefresh } = useOutletContext<EventReportsProviderContext>();

    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [missingCurrentEventReport, setMissingCurrentEventReport] = useState<EventReport | SeasonReport | undefined>();
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    const [savingError, setSavingError] = useState<string | null>(null);
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
                setReportTitle(existingReport.report.Name, true);
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
                        setReportTitle(newReportSettings.Name, true);
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
                        setReportTitle(newReportSettings.Name, true);
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
        else if (reportSettings) {
            setReportTitle(reportSettings.Name, true);
        }
    }, [reportId]);

    const backToAllReports = () => {
        setReportTitle(eventName || "Event", false);

        if (useNavigateForParent) {
            navigate(parentUrl);
        }
        else {
            window.location.href = parentUrl;
        }
    };

    const saveReport = (report: EventReport | SeasonReport, force?: boolean): Promise<void> => {

        return new Promise(
            resolve => {
                let hasCurrentEvent: boolean = !eventId || !!force;
                if (!hasCurrentEvent) {
                    for (let filter of report.Meets) {
                        if (filter.EventId == eventId) {
                            hasCurrentEvent = true;
                            break;
                        }
                    }
                }

                if (hasCurrentEvent) {
                    setMissingCurrentEventReport(undefined);
                    setIsSaving(true);
                }
                else {
                    setMissingCurrentEventReport(report);
                    setIsSaving(false);
                    resolve();
                    return;
                }

                const reportEventId = eventId ?? report.Meets[0].EventId;

                DatabaseReportsService.putEventOrSeasonReport(
                    auth,
                    reportEventId,
                    type === "event",
                    report)
                    .then(() => {

                        setIsSaving(false);
                        resolve();

                        if (!report.Id && forceEventListRefresh) {
                            forceEventListRefresh();
                        }
                        else if (type === "event") {
                            setLoadedEventReport(report as EventReport);
                        }
                        else {
                            setLoadedSeasonReport(report as SeasonReport);
                        }

                        sharedDirtyWindowState.set(false);
                        backToAllReports();
                    })
                    .catch(err => {
                        setSavingError(err.message || "An error occurred while saving the report.");
                        setIsSaving(false);
                        resolve();
                    });
            });
    };

    const deleteReport = (): Promise<void> => {

        setIsSaving(true);

        const reportEventId = eventId ?? reportSettings!.Meets[0].EventId;
        return DatabaseReportsService.deleteEventOrSeasonReport(
            auth,
            reportEventId,
            reportId!,
            type === "event")
            .then(() => {
                if (type === "event") {
                    setLoadedEventReport(reportId!);
                }
                else {
                    setLoadedSeasonReport(reportId!);
                }

                sharedDirtyWindowState.set(false);
                setIsDeleting(false);
                setIsSaving(false);
                backToAllReports();
            })
            .catch(err => {
                setSavingError(err.message || "An error occurred while deleting the report.");
                setIsDeleting(false);
                setIsDeleting(false);
            });
    };

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
    else if (isSaving) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">{isDeleting ? "Deleting Report" : "Saving Changes"} ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            Your changes are being {isDeleting ? "deleted" : "saved"}. It may take a few hours for the changes to be live
                            on BibleQuiz.com.
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <>
            <div className="mt-2 mb-0">
                <FontAwesomeIcon
                    icon={type === "event" ? "fas faCalendarDay" : "fas faCalendarDays"}
                />&nbsp;<span className="font-bold">{type.toUpperCase()} REPORT</span><br />
                {type === "event" && <span>Events in {eventName}</span>}
                {type === "season" && <span>Events in {season} {competitionTypeLabel} Season</span>}
            </div>
            {savingError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b> {savingError}
                    </div>
                </div>)}
            <EventReportSettingsSection
                auth={auth}
                report={reportSettings}
                eventId={eventId}
                eventName={eventName}
                eventType={competitionTypeId}
                eventRegionId={eventRegionId}
                eventDistrictId={eventDistrictId}
                season={season}
                type={type}
                getDatabaseUrl={getDatabaseUrl}
                setReportTitle={setReportTitle}
                setReportHidden={setReportHidden}
                saveReport={saveReport}
                deleteReport={() => setIsDeleting(true)}
                backToAllReports={backToAllReports} />
            {missingCurrentEventReport && (
                <ConfirmationDialog
                    title="Missing Event"
                    onYes={() => saveReport(missingCurrentEventReport, true)}
                    yesLabel="Continue"
                    onNo={() => {
                        setIsSaving(false);
                        setMissingCurrentEventReport(undefined);
                    }}
                    noLabel="Cancel">
                    This report doesn't include any meets from the {eventName} event. As a result, the report
                    won't show up in the list of reports for this event.
                    <br />&nbsp;<br />
                    To access the report, navigate to one of the events in the report.
                </ConfirmationDialog>)}
            {isDeleting && (
                <ConfirmationDialog
                    title="Delete Report"
                    onYes={() => deleteReport()}
                    yesLabel="Yes"
                    onNo={() => setIsDeleting(false)}
                    noLabel="No">
                    Are you sure you want to delete this report? This action <b>cannot</b> be undone.
                </ConfirmationDialog>)}
        </>);
}