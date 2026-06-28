import { ScoringReportMeet } from "types/EventScoringReport";
import { sharedEventScoringReportState, type MeetReference } from "utils/SharedState";
import CollapsableMeetSection from './CollapsableMeetSection';
import { EventScoringReport } from "types/EventScoringReport";
import { useStore } from "@nanostores/react";

export interface Props {
    event?: EventScoringReport;
    isPrinting?: boolean;
    selectedMeets?: MeetReference[];
};

export default function IndividualInitialRoomsTabContent({
    event,
    isPrinting,
    selectedMeets }: Props) {

    const reportState = useStore(sharedEventScoringReportState);
    event ??= reportState?.report || undefined;

    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    let sectionIndex = 0;

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                const key = `schedulegrid_${meet.DatabaseId}_${meet.MeetId}`;
                if (meet.IsCombinedReport || !meet.Matches || !meet.IsIndividualCompetition || !meet.Quizzers) {
                    return null;
                }
                else if (selectedMeets && selectedMeets.length > 0) {
                    const selectedMeetRef = selectedMeets.find(
                        m => m.databaseId === meet.DatabaseId && m.meetId === meet.MeetId);
                    if (!selectedMeetRef) {
                        return null;
                    }
                }

                const quizzers = meet.Quizzers
                    .map(q => {
                        if (!q.Matches || q.Matches.length === 0 || !q.Matches[0]) {
                            return null;
                        }

                        return {
                            name: q.Name,
                            churchName: q.ChurchName,
                            roomName: q.Matches[0].Room
                        }
                    })
                    .filter(q => !!q)
                    .sort((a, b) => a!.name.localeCompare(b!.name));

                const sectionBadges = [
                    {
                        className: "badge-lg badge-soft badge-primary",
                        icon: "fas faPeopleGroup",
                        text: quizzers.length.toString()
                    }];

                return (
                    <CollapsableMeetSection
                        meet={meet}
                        showCombinedName={false}
                        showMeetStatus={false}
                        pageId="schedulegrid"
                        isPrinting={isPrinting}
                        printSectionIndex={sectionIndex++}
                        forceOpen={false}
                        badges={sectionBadges}
                        key={key}>
                        <div className="grid grid-cols-2 gap-4">
                            {(() => {
                                const midpoint = Math.ceil(quizzers.length / 2);
                                const leftColumn = quizzers.slice(0, midpoint);
                                const rightColumn = quizzers.slice(midpoint);
                                return (
                                    <>
                                        <table className="table table-s table-nowrap mt-0">
                                            <thead>
                                                <tr>
                                                    <th className="pl-0">Name</th>
                                                    <th className="pl-0">Room</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leftColumn.map((q, index) => (
                                                    <tr key={`quizzer_left_${index}`} className="mt-0 mb-0">
                                                        <td className="mt-0 mb-0">
                                                            <b>{q.name}</b><br />
                                                            {q.churchName}
                                                        </td>
                                                        <td className="mt-0 mb-0">
                                                            {q.roomName}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <table className="table table-s table-nowrap mt-0">
                                            <thead>
                                                <tr>
                                                    <th className="pl-0">Name</th>
                                                    <th className="pl-0">Room</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rightColumn.map((q, index) => (
                                                    <tr key={`quizzer_right_${index}`} className="mt-0 mb-0">
                                                        <td className="mt-0 mb-0">
                                                            <b>{q.name}</b><br />
                                                            {q.churchName}
                                                        </td>
                                                        <td className="mt-0 mb-0">
                                                            {q.roomName}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </>
                                );
                            })()}
                        </div>
                    </CollapsableMeetSection>);
            })}
        </>);
};

