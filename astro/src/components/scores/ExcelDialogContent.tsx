import { useState } from "react";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

import { ScoringReportMeet } from "@types/EventScoringReport";
import FontAwesomeIcon from "@components/FontAwesomeIcon";
import type { MeetReference } from "@utils/Scores";

export const ExcelDialogModalId = "excel-dialog";

interface Props {
    eventId: string;
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

export default function ExcelDialogContent({ eventId, eventName, meets }: Props) {

    const reportState = useStore(sharedEventScoringReportState);

    const [selectedMeet, setSelectedMeet] = useState<{ databaseId: string; meetId: number } | null>(null);

    let resolvedMeets: MeetReference[] | null = meets;
    if (!resolvedMeets && reportState && reportState.report) {
        resolvedMeets = reportState.report.Report.Meets.map((meet: ScoringReportMeet) => {
            return {
                eventId: eventId,
                databaseId: meet.DatabaseId,
                meetId: meet.MeetId,
                label: meet.Name,
                isCombinedReport: meet.IsCombinedReport,
                hasRanking: meet.RankedTeams || meet.RankedQuizzers ? true : false,
            } as MeetReference;
        });
    }

    if (!resolvedMeets) {
        return null;
    }

    const column1Count: number = Math.ceil(resolvedMeets.length / 2);
    const column2Count: number = resolvedMeets.length - column1Count;

    return (
        <div>
            <form method="dialog">
                <div className="overflow-x-auto overflow-y-auto">
                    <p className="text-2xl font-bold mb-4">{eventName}</p>
                    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="mt-0">
                            {Array.from({ length: column1Count }, (_, m) => {
                                const meet = resolvedMeets[m];
                                const isChecked =
                                    (selectedMeet && selectedMeet.databaseId === meet.DatabaseId && selectedMeet.meetId === meet.MeetId) ||
                                    (!selectedMeet && m === 0);

                                return (
                                    <span key={`excel-meet-col1-${m}`}>
                                        {m > 0 && (<br />)}
                                        <label className="cursor-pointer">
                                            <input type="radio" name="export-excel" defaultChecked={isChecked} className="radio radio-sm" onChange={() => setSelectedMeet({ databaseId: meet.DatabaseId, meetId: meet.MeetId })} />&nbsp;
                                            <FontAwesomeIcon icon={meet.isCombinedReport ? "fas faBook" : "fas faFutbol"} />&nbsp;
                                            {meet.label}
                                        </label>
                                    </span>);
                            })}
                        </div>
                        <div className="mt-0">
                            {Array.from({ length: column2Count }, (_, m) => {
                                const meet = resolvedMeets[m + column1Count];
                                const isChecked = selectedMeet && selectedMeet.databaseId === meet.DatabaseId && selectedMeet.meetId === meet.MeetId;

                                return (
                                    <span key={`excel-meet-col2-${m}`}>
                                        {m > 0 && (<br />)}
                                        <label className="cursor-pointer">
                                            <input type="radio" name="export-excel" defaultChecked={isChecked} className="radio radio-sm" onChange={() => setSelectedMeet({ databaseId: meet.DatabaseId, meetId: meet.MeetId })} />&nbsp;
                                            <FontAwesomeIcon icon={meet.isCombinedReport ? "fas faBook" : "fas faFutbol"} />&nbsp;
                                            {meet.label}
                                        </label>
                                    </span>);
                            })}
                        </div>
                    </div>
                </div>
                <div className="modal-action">
                    <a href={`https://scores.biblequiz.com/api/v1.0/reports/Events/${eventId}/Stats`} download={`Stats - ${eventName}.xlsx`} className="btn btn-primary">
                        <FontAwesomeIcon icon="fas faFileExcel" />&nbsp;Export Excel
                    </a>
                    <button type="submit" className="btn">Close</button>
                </div>
            </form>
        </div>);
}