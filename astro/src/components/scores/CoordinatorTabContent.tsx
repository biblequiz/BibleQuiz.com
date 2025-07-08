
import { ScoringReportMeet, ScoringReportRoom } from "@types/EventScoringReport";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";
import CollapsableMeetSection from "@components/scores/CollapsableMeetSection";
import RoomDialogLink from "@components/scores/RoomDialogLink";
import type { EventScoresProps } from "@utils/Scores";
import FontAwesomeIcon from "../FontAwesomeIcon";

export default function CoordinatorTabContent({ eventId, event }: EventScoresProps) {

    event ??= useStore(sharedEventScoringReportState)?.report;
    if (!event) {
        return (<span>Event is Loading ...</span>);
    }

    return (
        <>
            {event.Report.Meets.map((meet: ScoringReportMeet) => {

                const key = `coordinator_${meet.DatabaseId}_${meet.MeetId}`;
                if (meet.IsCombinedReport || !meet.Rooms) {
                    return null;
                }

                // Determine the maximum number of matches.
                let maxMatchId = 0;
                for (let room of meet.Rooms) {
                    maxMatchId = Math.max(maxMatchId, room.Matches.length);
                }

                return (
                    <CollapsableMeetSection meet={meet} pageId="coodinator" key={key}>
                        <table className="table table-s table-nowrap">
                            <thead>
                                <tr>
                                    <th className="text-right">Room</th>
                                    {Array.from({ length: maxMatchId }, (_, m) => (
                                        <th className="text-center min-w-48" key={`${key}_matchheader_${m + 1}`}>
                                            {m + 1}
                                        </th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: meet.Rooms.length }, (_, r) => {
                                    const room: ScoringReportRoom = meet.Rooms[r];
                                    const roomKey = `${key}_room_${r}`;
                                    return (
                                        <tr key={roomKey} className="hover:bg-base-300">
                                            <td className="text-right">{room.Name}</td>
                                            {Array.from({ length: maxMatchId }, (_, m) => {
                                                const matchKey = `${roomKey}_match_${m + 1}`;
                                                if (m >= room.Matches.length) {
                                                    // This meet doesn't have more matches.
                                                    return (
                                                        <td key={matchKey}>
                                                            &nbsp;
                                                        </td>);
                                                }

                                                const match = room.Matches[m];
                                                if (null == match) {
                                                    // This is a bye.
                                                    return (
                                                        <td key={matchKey}>
                                                            --
                                                        </td>);
                                                }

                                                const resolvedMeet = !meet.HasLinkedMeets || null == match.LinkedMeet
                                                    ? meet
                                                    : event.Report.Meets[match.LinkedMeet];

                                                const matchId = resolvedMeet.Matches[m].Id;
                                                const roomId = resolvedMeet.Teams[match.Team1].Matches[m].RoomId;

                                                let iconName: string;
                                                let iconClasses: string[] = [];
                                                switch (match.State) {
                                                    case "InProgress":
                                                        iconName = "fas faHourglassStart";
                                                        iconClasses = [];
                                                        break;
                                                    case "Completed":
                                                        iconName = "fas faCheckCircle";
                                                        iconClasses = ["completed-match-icon"];
                                                        break;
                                                    default: // Not Started
                                                        iconName = "fas faSatelliteDish";
                                                        iconClasses = [];
                                                        break;
                                                }

                                                return (
                                                    <td key={matchKey} className="text-center">
                                                        <RoomDialogLink id={matchKey} label={`Match ${matchId} in ${room.Name} @ ${resolvedMeet.Name}`} eventId={eventId} databaseId={resolvedMeet.DatabaseId} meetId={resolvedMeet.MeetId} matchId={matchId} roomId={roomId}>
                                                            <FontAwesomeIcon icon={iconName} classNames={iconClasses} />
                                                            {meet.HasLinkedMeets && (
                                                                <>
                                                                    <br />
                                                                    <i>{resolvedMeet.Name}</i>
                                                                </>)}
                                                        </RoomDialogLink>
                                                    </td>);
                                            })}
                                        </tr>);
                                })}
                            </tbody>
                        </table>
                    </CollapsableMeetSection>);
            })}
        </>);
}

