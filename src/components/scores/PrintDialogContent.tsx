import { useState } from "react";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedPrintConfiguration } from "@utils/SharedState";

import { ScoringReportMeet } from "@types/EventScoringReport";
import FontAwesomeIcon from "@components/FontAwesomeIcon";
import { OutputType, StatsFormat } from "@utils/SharedState";
import type { MeetReference, PrintConfiguration } from "@utils/SharedState";

export const PrintDialogModalId = "print-dialog";

interface Props {
    eventId: string;
    eventName: string;
    meets: MeetReference[] | null;
}

export default function PrintDialogContent({ eventId, eventName, meets }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    useStore(sharedPrintConfiguration); // Registering the hooks.

    const [outputType, setOutputType] = useState(OutputType.Stats);
    const handleOutputTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setOutputType(Number(event.target.value) as OutputType);
    };

    const [statsFormat, setStatsFormat] = useState<StatsFormat>(StatsFormat.TeamsAndQuizzers);
    const handleStatsFormatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = Number(event.target.value) as StatsFormat;
        if (!event.target.checked) {
            if (value === StatsFormat.TeamsAndQuizzers) {
                value = StatsFormat.TeamsOnly;
            }
            else {
                value = StatsFormat.QuizzersOnly;
            }
        }

        setStatsFormat(value);
    };

    const [showSinglePerPage, setShowSinglePerPage] = useState(true);
    const handleShowSinglePerPageChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowSinglePerPage(event.target.checked);
    };

    const [includeStats, setIncludeStats] = useState(true);
    const handleIncludeStatsChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIncludeStats(event.target.checked);
    };

    const [selectedMeets, setSelectedMeets] = useState<Set<string> | null>(null);
    const handleMeetSelectionChange = (databaseId: string, meetId: number, isChecked: boolean) => {

        let updatedSet: Set<string> | null = null;

        if (selectedMeets === null) {
            updatedSet = new Set<string>();

            for (const meet of resolvedMeets as MeetReference[]) {
                updatedSet.add(`${meet.databaseId}_${meet.meetId}`);
            }
        }
        else {
            updatedSet = new Set(selectedMeets);
        }

        const key = `${databaseId}_${meetId}`;
        if (isChecked) {
            updatedSet.add(key);
        } else {
            updatedSet.delete(key);
        }

        setSelectedMeets(updatedSet);
    };

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

    let hasRanking: boolean = false;
    const resolvedMeetFields = resolvedMeets.map((meet: ScoringReportMeet, index: number) => {
        const isChecked = selectedMeets == null || selectedMeets.has(`${meet.databaseId}_${meet.meetId}`);

        if (meet.hasRanking) {
            hasRanking = true;
        }

        return (
            <label key={`print-meet-${index}`} className="label text-sm cursor-pointer mt-0">
                <input
                    type="checkbox"
                    name="meet"
                    className="checkbox checkbox-sm checkbox-info"
                    checked={isChecked}
                    onChange={(e) => handleMeetSelectionChange(meet.databaseId, meet.meetId, e.target.checked)} />
                {meet.IsCombinedReport && (<><FontAwesomeIcon icon="fas faBook" />&nbsp;</>)}
                {meet.label}
            </label>);
    });

    let singleOrMultipleLabel: string | null = null;
    if (outputType !== OutputType.Stats) {
        switch (outputType) {
            case OutputType.TeamSchedule:
                singleOrMultipleLabel = showSinglePerPage ? "Single Team" : "Multiple Teams";
                break;
            case OutputType.RoomSchedule:
                singleOrMultipleLabel = showSinglePerPage ? "Single Room" : "Multiple Rooms";
                break;
            default:
                singleOrMultipleLabel = null;
                break;
        }
    }

    const handlePrintClick = () => {

        // Update the print configuration so the main window triggers a print.
        const printConfig: PrintConfiguration = {
            outputType: outputType,
            statsFormat: statsFormat,
            showSinglePerPage: showSinglePerPage,
            includeStats: includeStats,
            selectedMeets: resolvedMeets.filter(meet => selectedMeets == null || selectedMeets.has(`${meet.databaseId}_${meet.meetId}`)),
        };

        sharedPrintConfiguration.set(printConfig);

        // Close the dialog.
        (document.getElementById(PrintDialogModalId) as any).close();
    };

    return (
        <div className="overflow-x-auto overflow-y-auto pl-4">
            <p className="text-2xl font-bold mb-4">
                <FontAwesomeIcon icon="fas faPrint" />&nbsp;Print {eventName}
            </p>
            <form method="dialog">
                <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <legend className="fieldset-legend">Type</legend>
                    {hasRanking && (
                        <label className="label">
                            <input
                                type="radio"
                                name="output-type"
                                className="radio radio-info"
                                value={OutputType.Stats}
                                checked={outputType === OutputType.Stats}
                                onChange={handleOutputTypeChange} />
                            <span className="text-sm">
                                <FontAwesomeIcon icon="fas faTrophy" />&nbsp;Stats
                            </span>
                        </label>)}
                    <label className="label">
                        <input
                            type="radio"
                            name="output-type"
                            className="radio radio-info"
                            value={OutputType.TeamSchedule}
                            checked={outputType === OutputType.TeamSchedule}
                            onChange={handleOutputTypeChange} />
                        <span className="text-sm">
                            <FontAwesomeIcon icon="fas faUsers" />&nbsp;Team Schedule
                        </span>
                    </label>
                    <label className="label">
                        <input
                            type="radio"
                            name="output-type"
                            className="radio radio-info"
                            value={OutputType.RoomSchedule}
                            checked={outputType === OutputType.RoomSchedule}
                            onChange={handleOutputTypeChange} />
                        <span className="text-sm">
                            <FontAwesomeIcon icon="fas faDoorOpen" />&nbsp;Room Schedule
                        </span>
                    </label>
                    <label className="label">
                        <input
                            type="radio"
                            name="output-type"
                            className="radio radio-info"
                            value={OutputType.ScheduleGrid}
                            checked={outputType === OutputType.ScheduleGrid}
                            onChange={handleOutputTypeChange} />
                        <span className="text-sm">
                            <FontAwesomeIcon icon="fas faBorderAll" />&nbsp;Schedule Grid
                        </span>
                    </label>
                </fieldset>
                <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <legend className="fieldset-legend">Format</legend>
                    {outputType === OutputType.Stats && (
                        <>
                            <label className="label">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-info"
                                    value={StatsFormat.TeamsAndQuizzers}
                                    checked={statsFormat === StatsFormat.TeamsAndQuizzers}
                                    onChange={handleStatsFormatChange} />
                                Teams and Quizzers
                            </label>
                            {statsFormat !== StatsFormat.TeamsAndQuizzers && (
                                <label className="label">
                                    <input
                                        type="checkbox"
                                        name="stats-format"
                                        className="toggle text-base-content"
                                        value={StatsFormat.TeamsOnly}
                                        checked={statsFormat === StatsFormat.TeamsOnly}
                                        onChange={handleStatsFormatChange} />
                                    {statsFormat === StatsFormat.QuizzersOnly ? "Quizzers" : "Teams"} Only
                                </label>)}
                        </>)}
                    {singleOrMultipleLabel && (
                        <label className="label">
                            <input
                                type="checkbox"
                                className="toggle text-base-content"
                                checked={showSinglePerPage}
                                onChange={handleShowSinglePerPageChanged} />
                            {singleOrMultipleLabel} per Page
                        </label>)}
                    {outputType !== OutputType.Stats && outputType !== OutputType.RoomSchedule && (
                        <label className="label">
                            <input
                                type="checkbox"
                                className="toggle text-base-content"
                                checked={includeStats}
                                onChange={handleIncludeStatsChanged} />
                            {includeStats ? "Stats and Schedule" : "Schedule Only"}
                        </label>)}
                </fieldset>
                <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-4">
                    <legend className="fieldset-legend">Meets</legend>
                    {resolvedMeetFields}
                </fieldset>
            </form>
            <div className="modal-action">
                <button
                    type="submit"
                    className="btn btn-primary mt-4"
                    disabled={selectedMeets && selectedMeets.size === 0}
                    onClick={handlePrintClick}>
                    <FontAwesomeIcon icon="fas faPrint" />&nbsp;Print
                </button>
                <button type="button" className="btn">Close</button>
            </div>
        </div>);
}