import { useRef, useState } from "react";
import { EventReport, EventReportPointValueFilter, ReportType, SeasonReport } from "types/services/DatabaseReportsService";
import EventReportSettingsGeneralSection from "./EventReportSettingsGeneralSection";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { sharedDirtyWindowState } from "utils/SharedState";
import { useStore } from "@nanostores/react";
import type { AuthManager } from "types/AuthManager";
import EventReportSettingsQuizzerRankSection from "./EventReportSettingsQuizzerRankSection";
import EventReportSettingsQuizzerPointFilterSection from "./EventReportSettingsQuizzerPointFilterSection";
import EventReportSettingsMeetSelector from "./EventReportSettingsMeetSelector";
import EventReportViewDialog from "../EventReportViewDialog";

interface Props {
    auth: AuthManager;
    report: EventReport | SeasonReport | null;
    eventId: string | null;
    eventName: string | null;
    eventType: string;
    eventRegionId?: string;
    eventDistrictId?: string;
    season: number;
    setReportTitle: (title: string, isReport: boolean) => void;
    setReportHidden: (isHidden: boolean) => void;
    type: "event" | "season";
    getDatabaseUrl: (eventId: string, databaseId: string) => { url: string, useNavigate: boolean };
    saveReport: (report: EventReport | SeasonReport, force?: boolean) => Promise<void>;
    deleteReport: () => void;
    backToAllReports: () => void;
}

export interface EventReportGeneralInfo {
    name: string;
    eventType: string;
    regionId: string | null;
    districtId: string | null;
    reportType: ReportType;
    isVisible: boolean;
}

export interface EventReportQuizzerRankInfo {
    rankByAverageCorrectPointValue: number | null;
    matchesOverride: number | null;
}

export interface EventReportQuizzerPointFilterInfo {
    averagePoints: EventReportPointValueFilter | null;
    p10: EventReportPointValueFilter | null;
    p20: EventReportPointValueFilter | null;
    p30: EventReportPointValueFilter | null;
}

export default function EventReportSettingsSection({
    auth,
    report,
    season,
    eventId,
    eventName,
    eventType,
    eventRegionId,
    eventDistrictId,
    setReportTitle,
    setReportHidden,
    type,
    getDatabaseUrl,
    saveReport,
    deleteReport,
    backToAllReports }: Props) {

    const [isViewing, setIsViewing] = useState(false);

    const [meets, setMeets] = useState(report?.Meets ?? []);
    const [general, setGeneral] = useState<EventReportGeneralInfo>(() => ({
        name: report?.Name ?? "",
        eventType: eventType,
        regionId: (report as SeasonReport)?.RegionId ?? eventRegionId ?? null,
        districtId: (report as SeasonReport)?.DistrictId ?? eventDistrictId ?? null,
        isVisible: report?.IsVisible ?? true,
        reportType: report?.Type ?? ReportType.Teams
    }));
    const [quizzerRank, setQuizzerRank] = useState(() => ({
        rankByAverageCorrectPointValue: report?.QuizzersRankByAverageCorrectPointValue ?? null,
        matchesOverride: report?.MatchesOverride ?? null
    } as EventReportQuizzerRankInfo));
    const [quizzerPointFilter, setQuizzerPointFilter] = useState(() => ({
        averagePoints: report?.QuizzerAveragePoints ?? null,
        p10: report?.Quizzer10Pointers ?? {},
        p20: report?.Quizzer20Pointers ?? {},
        p30: report?.Quizzer30Pointers ?? {}
    } as EventReportQuizzerPointFilterInfo));

    const formRef = useRef<HTMLFormElement>(null);
    const hasChanges = useStore(sharedDirtyWindowState);

    const handleSave = async (e: React.MouseEvent | React.FormEvent) => {
        e.preventDefault();

        const isValid = formRef.current!.reportValidity();
        if (!isValid) {
            return;
        }

        let newReport: EventReport | SeasonReport;
        if (type === "event") {
            const eventReport: EventReport = new EventReport();
            eventReport.EventId = eventId!;

            newReport = eventReport;
        }
        else {
            const seasonReport: SeasonReport = new SeasonReport();
            if (general.districtId) {
                seasonReport.DistrictId = general.districtId;
            }
            else if (general.regionId) {
                seasonReport.RegionId = general.regionId;
            }

            newReport = seasonReport;
        }

        newReport.Id = report?.Id ?? null;
        newReport.Name = general.name;
        newReport.Type = general.reportType;
        newReport.IsVisible = general.isVisible;
        newReport.Meets = meets;

        newReport.QuizzersRankByAverageCorrectPointValue = quizzerRank.rankByAverageCorrectPointValue;
        newReport.MatchesOverride = quizzerRank.matchesOverride;

        newReport.QuizzerAveragePoints = quizzerPointFilter.averagePoints;
        newReport.Quizzer10Pointers = quizzerPointFilter.p10;
        newReport.Quizzer20Pointers = quizzerPointFilter.p20;
        newReport.Quizzer30Pointers = quizzerPointFilter.p30;

        await saveReport(newReport);
    };

    const hasRequiredFilters = general.reportType === ReportType.Teams ||
        (quizzerPointFilter.averagePoints || quizzerPointFilter.p10 || quizzerPointFilter.p20 || quizzerPointFilter.p30);

    const buttons = (
        <div className="m-0 hide-on-print flex flex-wrap gap-2">
            <button
                type="submit"
                className="btn btn-sm btn-success m-0"
                onClick={handleSave}
                disabled={!hasChanges || isViewing || !hasRequiredFilters || meets.length === 0}>
                <FontAwesomeIcon icon="fas faFloppyDisk" />
                Save Changes
            </button>

            {report?.Id && (
                <>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary m-0"
                        onClick={() => setIsViewing(true)}
                        disabled={!report?.Id || isViewing}>
                        <FontAwesomeIcon icon="fas faEye" />
                        View Report
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm btn-error m-0"
                        onClick={() => deleteReport()}
                        disabled={!report?.Id || isViewing}>
                        <FontAwesomeIcon icon="fas faTrash" />
                        Delete Report
                    </button>
                </>)}

            <button
                type="button"
                className="btn btn-sm btn-primary m-0"
                onClick={() => backToAllReports()}>
                <FontAwesomeIcon icon="fas faArrowLeft" />
                Back to All Reports
            </button>
        </div>);

    return (
        <>
            <form ref={formRef} className="space-y-6 mt-0" onSubmit={handleSave}>
                <div className="w-full mt-0 mb-0 flex flex-wrap justify-end gap-2">
                    {buttons}
                </div>

                <div className="divider mt-0" />

                <EventReportSettingsGeneralSection
                    auth={auth}
                    eventType={eventType}
                    info={general}
                    allowScope={type === "season"}
                    setReportTitle={setReportTitle}
                    isDisabled={false}
                    setInfo={newInfo => {
                        setGeneral(newInfo);
                        setReportHidden(!newInfo.isVisible);
                        sharedDirtyWindowState.set(true);
                    }}
                />

                {general.reportType !== ReportType.Teams && (
                    <>
                        <EventReportSettingsQuizzerRankSection
                            info={quizzerRank}
                            setInfo={newInfo => {
                                setQuizzerRank(newInfo);
                                sharedDirtyWindowState.set(true);
                            }}
                            isDisabled={false}
                        />
                        <EventReportSettingsQuizzerPointFilterSection
                            info={quizzerPointFilter}
                            setInfo={newInfo => {
                                setQuizzerPointFilter(newInfo);
                                sharedDirtyWindowState.set(true);
                            }}
                            isDisabled={false}
                        />
                    </>)}

                <EventReportSettingsMeetSelector
                    isNewReport={!report || !report.Id}
                    regionId={general.regionId}
                    districtId={general.districtId}
                    type={type}
                    season={season}
                    eventId={eventId}
                    eventName={eventName}
                    eventType={eventType}
                    meets={meets}
                    hasTeams={general.reportType !== ReportType.Quizzers}
                    hasQuizzers={general.reportType !== ReportType.Teams}
                    getDatabaseUrl={getDatabaseUrl}
                    setMeets={newMeets => {
                        setMeets(newMeets);
                        sharedDirtyWindowState.set(true);
                    }}
                    setReportTitle={setReportTitle}
                    isDisabled={false}
                />

                <div className="divider mb-0" />

                <div className="w-full mt-0 flex flex-wrap justify-end gap-2">
                    {buttons}
                </div>
            </form>
            {isViewing && (
                <EventReportViewDialog
                    auth={auth}
                    eventId={eventId ?? report!.Meets[0].EventId}
                    reportId={report!.Id!}
                    onClose={() => setIsViewing(false)}
                    isEventReport={type === "event"}
                />)}
        </>);
}