import { useRef, useState, useEffect } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import type { OnlineDatabaseSummary } from "types/services/AstroDatabasesService";
import {
    AstroMeetPlayoffsService,
    type OnlinePlayoffMeet,
    type OnlinePlayoffMatch
} from "types/services/AstroMeetPlayoffsService";
import PlayoffMatchCard from "./PlayoffMatchCard";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    meetId: number;
    meetName: string;
    isReadOnly: boolean;
    onSave: (updatedDatabase: OnlineDatabaseSummary) => void;
    onClose: () => void;
}

export default function DivisionPlayoffsDialog({
    auth,
    eventId,
    databaseId,
    meetId,
    meetName,
    isReadOnly,
    onSave,
    onClose
}: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [playoffs, setPlayoffs] = useState<OnlinePlayoffMeet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Load playoffs data on mount
    useEffect(() => {
        setIsLoading(true);
        setError(null);

        AstroMeetPlayoffsService.getPlayoffs(auth, eventId, databaseId, meetId)
            .then(data => {
                setPlayoffs(data);
                setIsLoading(false);
            })
            .catch(err => {
                setError(err.message || "Failed to load playoff configuration.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId, meetId]);

    const handleMatchTimeChange = (matchIndex: number, time: string) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        updatedMatches[matchIndex] = {
            ...updatedMatches[matchIndex],
            MatchTime: time || null
        };

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
    };

    const handleRoomTeamChange = (matchIndex: number, roomIndex: number, teamIndex: number, teamId: number | null) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        const match = { ...updatedMatches[matchIndex] };
        const roomSchedule = [...match.RoomSchedule];
        const room = { ...roomSchedule[roomIndex] };
        const teamIds = [...room.TeamIds];

        if (teamId === null) {
            // Remove team
            teamIds.splice(teamIndex, 1);
        } else {
            teamIds[teamIndex] = teamId;
        }

        room.TeamIds = teamIds;
        roomSchedule[roomIndex] = room;
        match.RoomSchedule = roomSchedule;
        updatedMatches[matchIndex] = match;

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
    };

    const handleAddTeamToRoom = (matchIndex: number, roomIndex: number) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        const match = { ...updatedMatches[matchIndex] };
        const roomSchedule = [...match.RoomSchedule];
        const room = { ...roomSchedule[roomIndex] };

        // Add first available team
        const availableTeams = Object.keys(playoffs.Teams).map(Number);
        const firstTeam = availableTeams[0] || 0;

        room.TeamIds = [...room.TeamIds, firstTeam];
        roomSchedule[roomIndex] = room;
        match.RoomSchedule = roomSchedule;
        updatedMatches[matchIndex] = match;

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
    };

    const handleAddMatch = () => {
        if (!playoffs) return;

        const newMatchId = playoffs.Matches.length > 0
            ? Math.max(...playoffs.Matches.map(m => m.Id)) + 1
            : 1;

        const availableRooms = Object.keys(playoffs.Rooms).map(Number);
        const newMatch: OnlinePlayoffMatch = {
            Id: newMatchId,
            RoomSchedule: availableRooms.slice(0, 1).map(roomId => ({
                Id: roomId,
                TeamIds: []
            })),
            AvailableRooms: availableRooms,
            MatchTime: null
        };

        setPlayoffs({
            ...playoffs,
            Matches: [...playoffs.Matches, newMatch]
        });
    };

    const handleRemoveMatch = (matchIndex: number) => {
        if (!playoffs) return;

        const updatedMatches = playoffs.Matches.filter((_, i) => i !== matchIndex);
        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
    };

    const handleSave = async () => {
        if (!playoffs) return;

        setIsSaving(true);
        setSaveError(null);

        try {
            const result = await AstroMeetPlayoffsService.updatePlayoffs(
                auth,
                eventId,
                databaseId,
                meetId,
                playoffs
            );

            onSave(result);
            dialogRef.current?.close();
        } catch (err: any) {
            setSaveError(err.message || "Failed to save playoff configuration.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <dialog ref={dialogRef} className="modal" open>
            <div className="modal-box w-full max-w-4xl max-h-[90vh]">
                <h3 className="font-bold text-lg">
                    <FontAwesomeIcon icon="fas faTrophy" />
                    <span className="ml-2">Playoff Configuration - {meetName}</span>
                </h3>
                <button
                    type="button"
                    className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                    onClick={onClose}
                    disabled={isSaving}
                >✕</button>

                <div className="mt-4 overflow-y-auto max-h-[60vh]">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading playoff configuration...</span>
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="alert alert-error">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <div>
                                <b>Error: </b>{error}
                            </div>
                        </div>
                    )}

                    {saveError && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <div>
                                <b>Save Error: </b>{saveError}
                            </div>
                        </div>
                    )}

                    {playoffs && !isLoading && (
                        <div className="space-y-4">
                            {playoffs.Matches.length === 0 ? (
                                <div className="text-center py-8 text-base-content/60">
                                    <FontAwesomeIcon icon="fas faTrophy" classNames={["text-4xl", "mb-4"]} />
                                    <p>No playoff matches configured yet.</p>
                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            className="btn btn-primary btn-sm mt-4"
                                            onClick={handleAddMatch}
                                        >
                                            <FontAwesomeIcon icon="fas faPlus" />
                                            Add First Playoff Match
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    {playoffs.Matches.map((match, matchIndex) => (
                                        <PlayoffMatchCard
                                            key={match.Id}
                                            match={match}
                                            matchIndex={matchIndex}
                                            rooms={playoffs.Rooms}
                                            teams={playoffs.Teams}
                                            isSaving={isSaving}
                                            isReadOnly={isReadOnly}
                                            onMatchTimeChange={handleMatchTimeChange}
                                            onRoomTeamChange={handleRoomTeamChange}
                                            onAddTeamToRoom={handleAddTeamToRoom}
                                            onRemoveMatch={handleRemoveMatch}
                                        />
                                    ))}

                                    {!isReadOnly && (
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm w-full"
                                            onClick={handleAddMatch}
                                            disabled={isSaving}
                                        >
                                            <FontAwesomeIcon icon="fas faPlus" />
                                            Add Playoff Match
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 text-right gap-2 flex justify-end">
                    {!isReadOnly && playoffs && (
                        <button
                            className="btn btn-sm btn-primary"
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving || isLoading}
                        >
                            {isSaving ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon="fas faSave" />
                                    Save Playoffs
                                </>
                            )}
                        </button>
                    )}
                    <button
                        className="btn btn-sm btn-secondary"
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        {isReadOnly ? "Close" : "Cancel"}
                    </button>
                </div>
            </div>
        </dialog>
    );
}