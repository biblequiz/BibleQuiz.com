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
                        <table className="table table-s table-nowrap">
                            <thead>
                                <tr>
                                    <th className="pl-0">Name</th>
                                    <th className="pl-0">Church</th>
                                    <th className="pl-0">Room</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzers.map((q, index) => {
                                    return (
                                        <tr key={`quizzer_${index}`}>
                                            <td>{q.name}</td>
                                            <td>{q.churchName}</td>
                                            <td>{q.roomName}</td>
                                        </tr>);
                                })}
                            </tbody>
                        </table>
                    </CollapsableMeetSection>);
            })}
        </>);
};

