import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

import { ScoringReportMeet } from "@types/EventScoringReport";
import FontAwesomeIcon from "@components/FontAwesomeIcon";
import { MeetReference } from "@utils/Scores";

export const ExcelDialogModalId = "excel-dialog";

interface Props {
    eventName: string;
    meets: MeetReference[] | null;
}

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const checkboxes = e.currentTarget.querySelectorAll<HTMLInputElement>("input[type='checkbox'][name='export-excel']");
    const selectedMeets = Array.from(checkboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => ({
            databaseId: checkbox.dataset.database,
            meetId: checkbox.dataset.meet
        }));

    if (selectedMeets.length === 0) {
        alert("Please select at least one meet to export.");
        return;
    }

    // Here you would typically send the selected meets to the server for processing.
    alert("Selected meets for export:" + JSON.stringify(selectedMeets));

    return true;
};

const handleReset = (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    (document.getElementById(ExcelDialogModalId) as any)?.close();

    return true;
};

export default function ExcelDialogContent({ eventName }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState || !reportState.report) {
        return null;
    }

    const meets: ScoringReportMeet[] = reportState.report.Report.Meets;
    const column1Count: number = Math.ceil(meets.length / 2);
    const column2Count: number = meets.length - column1Count;

    return (
        <div>
            <form method="dialog" onSubmit={handleSubmit} onReset={handleReset}>
                <div className="overflow-x-auto overflow-y-auto">
                    <p className="text-2xl font-bold mb-4">{eventName}</p>
                    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                            {Array.from({ length: column1Count }, (_, m) => {
                                const meet = meets[m];
                                return (
                                    <>
                                        {m > 0 && (<br />)}
                                        <label className="cursor-pointer" key={`excel-meet-col1-${m}`}>
                                            <input type="checkbox" name="export-excel" defaultChecked className="checkbox checkbox-md" data-database={meet.DatabaseId} data-meet={meet.MeetId} />&nbsp;
                                            <FontAwesomeIcon icon={meet.IsCombinedReport ? "fas faBook" : "fas faFutbol"} />&nbsp;
                                            {meet.Name}
                                        </label>
                                    </>);
                            })}
                        </div>
                        <div>
                            {Array.from({ length: column2Count }, (_, m) => {
                                const meet = meets[m + column1Count];

                                return (
                                    <>
                                        {m > 0 && (<br />)}
                                        <label className="cursor-pointer" key={`excel-meet-col2-${m}`}>
                                            <input type="checkbox" name="export-excel" defaultChecked className="checkbox checkbox-md" data-database={meet.DatabaseId} data-meet={meet.MeetId} />&nbsp;
                                            <FontAwesomeIcon icon={meet.IsCombinedReport ? "fas faBook" : "fas faFutbol"} />&nbsp;
                                            {meet.Name}
                                        </label>
                                    </>);
                            })}
                        </div>
                    </div>
                </div>
                <div className="modal-action">
                    <button type="submit" className="btn btn-primary">
                        <FontAwesomeIcon icon="fas faFileExcel" />&nbsp;Export Excel
                    </button>
                    <button type="reset" className="btn">Close</button>
                </div>
            </form>
        </div>);
}