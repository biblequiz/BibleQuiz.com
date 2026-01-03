import { EventReport, SeasonReport } from "types/services/DatabaseReportsService";

interface Props {
    report: EventReport | SeasonReport;
    setReportTitle: (title: string) => void;
    type: "event" | "season";
}

export default function EventReportSettingsSection({
    report,
    setReportTitle,
    type }: Props) {

    return (
        <>
            <div>control</div>
        </>);
}