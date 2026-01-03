import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useNavigate, useOutletContext, type NavigateFunction } from "react-router-dom";
import type { EventProviderContext } from "./EventProvider";
import { ReportType, type EventReport, type SeasonReport } from "types/services/DatabaseReportsService";
import type { EventReportsProviderContext } from "./EventReportsProvider";

interface Props {
}

const getReportCard = (
    getItemUrl: (type: "event" | "season", reportId: string | null) => string,
    report: EventReport | SeasonReport,
    type: "event" | "season",
    navigate: NavigateFunction) => {

    return (
        <button
            key={`report-${report.Id}`}
            className="card live-events-card w-full md:w-128 card-sm shadow-sm border-2 border-solid mt-0 relative cursor-pointer"
            onClick={() => navigate(getItemUrl(type, report.Id))}
        >
            <div className="card-body p-2 pl-4">
                <div className="flex items-start gap-4">
                    <div className="flex-1 mt-2 text-left">
                        <h2 className="card-title mb-0 mt-0">
                            <FontAwesomeIcon icon="fas faBook" /> {report.Name}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            <div
                                className="card live-events-card w-16 card-sm shadow-sm border-2 border-solid mt-0 relative tooltip" data-tip="Divisions">
                                <div className="card-body p-1 m-1 text-center text-lg">
                                    <span className="font-bold">{report.Meets.length}</span>
                                    <FontAwesomeIcon icon="fas faLayerGroup" classNames={["fa-sw", "text-2xl"]} />
                                </div>
                            </div>
                            <div
                                className="card live-events-card w-16 card-sm shadow-sm border-2 border-solid mt-0 relative tooltip" data-tip="Teams">
                                <div className="card-body p-1 m-1 text-center text-lg">
                                    <span className="font-bold">
                                        {report.Type !== ReportType.Quizzers && <FontAwesomeIcon icon="fas faCircleCheck" classNames={["text-success"]} />}
                                        {report.Type === ReportType.Quizzers && <FontAwesomeIcon icon="fas faCircleXmark" classNames={["text-error"]} />}
                                    </span>
                                    <FontAwesomeIcon icon="fas faPeopleGroup" classNames={["fa-sw", "text-2xl"]} />
                                </div>
                            </div>
                            <div
                                className="card live-events-card w-16 card-sm shadow-sm border-2 border-solid mt-0 relative tooltip" data-tip="Quizzers">
                                <div className="card-body p-1 m-1 text-center text-lg">
                                    <span className="font-bold">
                                        {report.Type !== ReportType.Teams && <FontAwesomeIcon icon="fas faCircleCheck" classNames={["text-success"]} />}
                                        {report.Type === ReportType.Teams && <FontAwesomeIcon icon="fas faCircleXmark" classNames={["text-error"]} />}
                                    </span>
                                    <FontAwesomeIcon icon="fas faPersonRunning" classNames={["fa-sw", "text-2xl"]} />
                                </div>
                            </div>
                        </div>
                        <FontAwesomeIcon
                            icon="fas faArrowRight"
                            classNames={["icon text-lg rtl:flip absolute top-4 right-4"]} />
                    </div>
                </div>
            </div>
        </button>);
}

export default function EventReportsPage({ }: Props) {
    const {
        getItemUrl,
        eventReports,
        seasonReports
    } = useOutletContext<EventReportsProviderContext>();

    const navigate = useNavigate();

    return (
        <>
            <div className="mt-4">
                <div className={`badge badge-success text-md p-4 mt-0`}>
                    <FontAwesomeIcon icon="fas faCalendarDay" />
                    <span className="font-bold">EVENT REPORTS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {eventReports.map(report => getReportCard(getItemUrl, report.report, "event", navigate))}
                    {eventReports.length === 0 && (
                        <p className="mt-0 italic w-full">
                            No event reports have been created for this event.
                        </p>)}
                </div>
            </div>
            <div className="mt-4">
                <div className={`badge badge-warning text-md p-4 mt-0`}>
                    <FontAwesomeIcon icon="fas faCalendarDays" />
                    <span className="font-bold">SEASON REPORTS</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {seasonReports.map(report => getReportCard(getItemUrl, report.report, "season", navigate))}
                    {seasonReports.length === 0 && (
                        <p className="mt-0 italic w-full">
                            No season reports have been created for this event.
                        </p>)}
                </div>
            </div>
        </>);
}