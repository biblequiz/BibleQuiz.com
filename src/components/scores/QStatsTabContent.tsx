import { ScoringReportMeet, ScoringReportMeetMatch } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import CollapsableMeetSection from "@components/scores/CollapsableMeetSection";
import type { EventScoresProps } from "@utils/Scores";

export default function QStatsTabContent({ event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                const key = `qstats_${meet.DatabaseId}_${meet.MeetId}`;
                if (meet.IsCombinedReport || !meet.HasQuestionStats || meet.Matches == null) {
                    return null;
                }

                // Determine the maximum number of questions.
                let maxQuestionId = 0;
                for (let match of meet.Matches) {
                    if (null == match.RegularQuestionStats) {
                        maxQuestionId = -1;
                        break;
                    }

                    maxQuestionId = Math.max(maxQuestionId, match.RegularQuestionStats.length);
                }

                if (-1 == maxQuestionId) {
                    return null;
                }

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        showCombinedName={false}
                        showMeetStatus={false}
                        pageId="qstats"
                        printSectionIndex={sectionIndex++}
                        key={key}>
                        <table className="table table-s table-nowrap">
                            <thead>
                                <tr>
                                    <th className="text-right">Room</th>
                                    {Array.from({ length: maxQuestionId }, (_, q) => (
                                        <th className="text-center" key={`${key}_questionheader_${q + 1}`}>
                                            {q + 1}
                                        </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: meet.Matches.length }, (_, m) => {
                                    const match: ScoringReportMeetMatch = meet.Matches[m];
                                    const matchKey = `${key}_match_${m}`;
                                    return (
                                        <tr key={matchKey}>
                                            <td className="text-right">{m + 1}</td>
                                            {Array.from({ length: maxQuestionId }, (_, q) => {
                                                const questionKey = `${matchKey}_question_${q + 1}`;

                                                if (q >= match.RegularQuestionStats.length) {
                                                    return (<td key={questionKey}>&nbsp;</td>);
                                                }

                                                const stats = match.RegularQuestionStats[q];
                                                if (null == stats || stats.PointValue == 0) {
                                                    return (<td key={questionKey}>--</td>);
                                                }

                                                return (
                                                    <td key={questionKey} className="text-center">
                                                        <span className="italic">P{stats.PointValue}</span>
                                                        <br />
                                                        <div>
                                                            {stats.Correct > 0 && (<span className="badge badge-soft badge-xs badge-primary">{stats.Correct}</span>)}
                                                            {stats.Incorrect > 0 && (<span className="badge badge-soft badge-xs badge-error">{stats.Incorrect}</span>)}
                                                            {stats.NoResponse > 0 && (<span className="badge badge-soft badge-xs badge-caution">{stats.NoResponse}</span>)}
                                                        </div>
                                                    </td>);
                                            })}
                                        </tr>);
                                })}
                            </tbody>
                        </table>
                    </CollapsableMeetSection>);
            })}
        </>);
};

