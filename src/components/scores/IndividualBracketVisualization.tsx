import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ScoringReportMeet, ScoringReportRoomMatch } from "types/EventScoringReport";
import BracketRoomNode from "./BracketRoomNode";
import BracketConnectors, { type BracketConnection } from "./BracketConnectors";

export interface IndividualBracketVisualizationProps {
    /** The meet data containing rooms, matches, and quizzers */
    meet: ScoringReportMeet;
    /** Callback when a room is clicked */
    onRoomClick?: (roomIndex: number, matchIndex: number) => void;
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

/**
 * Main bracket visualization component for individual competitions.
 * Displays rooms organized by match (round) with connector lines showing advancement paths.
 */
export default function IndividualBracketVisualization({
    meet,
    onRoomClick
}: IndividualBracketVisualizationProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const roomElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
    const [connectorsKey, setConnectorsKey] = useState(0);

    // Build the bracket structure: group rooms by match
    const columns = useMemo<BracketColumn[]>(() => {
        if (!meet.Matches || !meet.Rooms) return [];

        const cols: BracketColumn[] = [];

        for (let matchIndex = 0; matchIndex < meet.Matches.length; matchIndex++) {
            const match = meet.Matches[matchIndex];
            const matchLabel = match.PlayoffIndex != null 
                ? `Playoff ${match.PlayoffIndex}` 
                : `Match ${match.Id}`;

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

    // Build connections based on RankedTeamsOrQuizzers routing
    const connections = useMemo<BracketConnection[]>(() => {
        const conns: BracketConnection[] = [];

        for (const col of columns) {
            for (const room of col.rooms) {
                if (room.roomMatch?.RankedTeamsOrQuizzers) {
                    for (const route of room.roomMatch.RankedTeamsOrQuizzers) {
                        // Find the source match index - it should be the previous match
                        // where this room exists
                        const prevColIndex = columns.findIndex(c => c.matchIndex === col.matchIndex) - 1;
                        if (prevColIndex >= 0) {
                            const prevCol = columns[prevColIndex];
                            // Check if the source room exists in the previous column
                            const sourceRoomExists = prevCol.rooms.some(r => r.roomIndex === route.Room);
                            if (sourceRoomExists) {
                                conns.push({
                                    sourceRoomIndex: route.Room,
                                    sourceMatchIndex: prevCol.matchIndex,
                                    destRoomIndex: room.roomIndex,
                                    destMatchIndex: col.matchIndex,
                                    rank: route.Rank
                                });
                            }
                        }
                    }
                }
            }
        }

        return conns;
    }, [columns]);

    // Create ref callback for room elements - stores in ref, not state
    const createRoomRefCallback = useCallback((matchIndex: number, roomIndex: number) => {
        const key = `${matchIndex}-${roomIndex}`;
        return (element: HTMLDivElement | null) => {
            if (element) {
                roomElementsRef.current.set(key, element);
            } else {
                roomElementsRef.current.delete(key);
            }
        };
    }, []);

    // Force recalculation of connectors after initial render and when columns change
    useEffect(() => {
        // Small delay to ensure DOM elements are rendered
        const timer = setTimeout(() => {
            setConnectorsKey(k => k + 1);
        }, 50);
        return () => clearTimeout(timer);
    }, [columns]);

    if (!meet.IsIndividualCompetition) {
        return (
            <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>Bracket visualization is only available for individual competitions.</span>
            </div>
        );
    }

    if (columns.length === 0) {
        return (
            <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <span>No bracket data available for this meet.</span>
            </div>
        );
    }

    return (
        <div className="bracket-visualization">
            {/* Legend */}
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-info rounded"></div>
                    <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-success rounded"></div>
                    <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-base-300 rounded"></div>
                    <span>Not Started</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="badge badge-sm bg-base-200">1</div>
                    <span>Rank advancing</span>
                </div>
            </div>

            {/* Bracket container */}
            <div 
                ref={containerRef}
                className="relative overflow-x-auto overflow-y-visible pb-4"
            >
                <div className="flex gap-8 min-w-max">
                    {columns.map((col) => (
                        <div 
                            key={`col-${col.matchIndex}`}
                            className="flex flex-col gap-4"
                        >
                            {/* Column header */}
                            <div className="text-center">
                                <span className="badge badge-lg badge-primary">
                                    {col.matchLabel}
                                </span>
                            </div>

                            {/* Rooms in this column */}
                            <div className="flex flex-col gap-3 justify-center flex-1">
                                {col.rooms.map((room) => (
                                    <BracketRoomNode
                                        key={`room-${col.matchIndex}-${room.roomIndex}`}
                                        roomIndex={room.roomIndex}
                                        roomName={room.roomName}
                                        matchIndex={col.matchIndex}
                                        roomMatch={room.roomMatch}
                                        meet={meet}
                                        onClick={() => onRoomClick?.(room.roomIndex, col.matchIndex)}
                                        onRef={createRoomRefCallback(col.matchIndex, room.roomIndex)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Connector lines overlay */}
                <BracketConnectors
                    key={connectorsKey}
                    connections={connections}
                    containerRef={containerRef}
                    roomElements={roomElementsRef.current}
                />
            </div>
        </div>
    );
}