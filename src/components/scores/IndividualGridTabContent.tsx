import { useMemo } from "react";
import type { ScoringReportMeet, ScoringReportRoomMatch } from "types/EventScoringReport";
import BracketRoomNode from "./BracketRoomNode";
import type { TeamAndQuizzerFavorites } from "types/TeamAndQuizzerFavorites";

export interface IndividualBracketVisualizationProps {
    eventId: string;
    meet: ScoringReportMeet;
    isPrinting: boolean;
    highlightQuizzerId: string | null;
    favorites: TeamAndQuizzerFavorites | null;
    showOnlyFavorites: boolean;
}

interface BracketColumn {
    matchIndex: number;
    matchLabel: string;
    rooms: {
        roomIndex: number;
        roomName: string;
        roomMatch: ScoringReportRoomMatch | null;
    }[];
}

export default function IndividualGridTabContent({
    eventId,
    meet,
    isPrinting,
    favorites,
    highlightQuizzerId,
    showOnlyFavorites
}: IndividualBracketVisualizationProps) {

    // Build the bracket structure: group rooms by match
    const columns = useMemo<BracketColumn[]>(() => {
        if (!meet.Matches || !meet.Rooms) return [];

        const cols: BracketColumn[] = [];

        for (let matchIndex = 0; matchIndex < meet.Matches.length; matchIndex++) {
            const match = meet.Matches[matchIndex];
            const matchLabel = match.PlayoffIndex != null
                ? `Playoff ${match.PlayoffIndex}`
                : `Round ${match.Id}`;

            // Find all rooms that have matches for this match index
            const roomsInMatch: BracketColumn["rooms"] = [];

            for (let roomIndex = 0; roomIndex < meet.Rooms.length; roomIndex++) {
                const room = meet.Rooms[roomIndex];
                const roomMatch = room.Matches?.[matchIndex] ?? null;

                // Include room if it has participants or routing info for this match
                if (roomMatch && (
                    (roomMatch.Quizzers && roomMatch.Quizzers.length > 0) ||
                    (roomMatch.RankedTeamsOrQuizzers && roomMatch.RankedTeamsOrQuizzers.length > 0) ||
                    roomMatch.Team1 != null
                )) {
                    roomsInMatch.push({
                        roomIndex,
                        roomName: room.Name,
                        roomMatch
                    });
                }
            }

            if (roomsInMatch.length > 0) {
                cols.push({
                    matchIndex,
                    matchLabel,
                    rooms: roomsInMatch
                });
            }
        }

        return cols;
    }, [meet]);

    if (!meet.IsIndividualCompetition) {
        return null;
    }

    if (columns.length === 0) {
        return (
            <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <span>No bracket data available for this meet.</span>
            </div>);
    }

    return (
        <div className="bracket-visualization">
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 mt-0 mb-0">
                    <div className="w-4 h-4 border-2 border-info rounded"></div>
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2 mt-0 mb-0">
                    <div className="w-4 h-4 border border-success rounded"></div>
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-2 mt-0 mb-0">
                    <div className="w-4 h-4 border border-base-300 rounded"></div>
                    <span>Not Started</span>
                </div>
            </div>
            <div className="overflow-x-auto pb-4">
                <div className="flex gap-3 min-w-max pl-2 pr-2">
                    {columns.map((col, colIndex) => (
                        <div
                            key={`col-${col.matchIndex}`}
                            className={`flex flex-col gap-4 mt-0 mb-0 ${colIndex < columns.length - 1 ? 'border-r border-base-500 pr-3' : ''}`}
                        >
                            <div className="text-center">
                                <span className="badge badge-lg badge-primary mt-0 mb-0">
                                    {col.matchLabel}
                                </span>
                            </div>

                            <div className="flex flex-col gap-3 justify-center flex-1">
                                {col.rooms.map((room) => (
                                    <BracketRoomNode
                                        key={`room-${col.matchIndex}-${room.roomIndex}`}
                                        eventId={eventId}
                                        roomIndex={room.roomIndex}
                                        roomName={room.roomName}
                                        matchIndex={col.matchIndex}
                                        roomMatch={room.roomMatch}
                                        meet={meet}
                                        isPrinting={isPrinting}
                                        favorites={favorites}
                                        highlightQuizzerId={highlightQuizzerId}
                                        showOnlyFavorites={showOnlyFavorites}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}