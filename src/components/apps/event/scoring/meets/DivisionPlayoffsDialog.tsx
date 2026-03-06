import { useRef, useState, useEffect, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ConfirmationDialog from "components/ConfirmationDialog";
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
    const [isDirty, setIsDirty] = useState(false);
    const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

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
        setIsDirty(true);
    };

    const handleRoomTeamChange = (matchIndex: number, roomIndex: number, teamIndex: number, teamId: number | null) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        const match = { ...updatedMatches[matchIndex] };
        const roomSchedule = [...match.RoomSchedule];
        const room = { ...roomSchedule[roomIndex] };

        // Ensure TeamIds array has at least teamIndex + 1 elements
        const teamIds = [...room.TeamIds];
        while (teamIds.length <= teamIndex) {
            teamIds.push(undefined as any); // Placeholder to expand array
        }

        if (teamId === null) {
            // Remove team at this index (set to undefined, then filter out)
            teamIds[teamIndex] = undefined as any;
        } else {
            teamIds[teamIndex] = teamId;
        }

        // Filter out undefined/null values but keep valid team IDs
        room.TeamIds = teamIds.filter(id => id !== undefined && id !== null);
        roomSchedule[roomIndex] = room;
        match.RoomSchedule = roomSchedule;
        updatedMatches[matchIndex] = match;

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
        setIsDirty(true);
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
                TeamIds: [],
                HasScoringStarted: false
            })),
            AvailableRooms: availableRooms,
            MatchTime: null
        };

        setPlayoffs({
            ...playoffs,
            Matches: [...playoffs.Matches, newMatch]
        });
        setIsDirty(true);
    };

    const handleAddRoomToMatch = (matchIndex: number) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        const match = { ...updatedMatches[matchIndex] };
        const roomSchedule = [...match.RoomSchedule];

        // Get rooms already used in this match
        const usedRoomIds = roomSchedule.map(r => r.Id);

        // Find first available room not already used
        const availableRoomId = match.AvailableRooms.find(roomId => !usedRoomIds.includes(roomId));
        if (availableRoomId === undefined) return; // No more rooms available

        roomSchedule.push({
            Id: availableRoomId,
            TeamIds: [],
            HasScoringStarted: false
        });

        match.RoomSchedule = roomSchedule;
        updatedMatches[matchIndex] = match;

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
        setIsDirty(true);
    };

    const handleRoomChange = (matchIndex: number, roomIndex: number, newRoomId: number) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        const match = { ...updatedMatches[matchIndex] };
        const roomSchedule = [...match.RoomSchedule];
        const room = { ...roomSchedule[roomIndex] };

        room.Id = newRoomId;
        roomSchedule[roomIndex] = room;
        match.RoomSchedule = roomSchedule;
        updatedMatches[matchIndex] = match;

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
        setIsDirty(true);
    };

    const handleRemoveRoom = (matchIndex: number, roomIndex: number) => {
        if (!playoffs) return;

        const updatedMatches = [...playoffs.Matches];
        const match = { ...updatedMatches[matchIndex] };
        const roomSchedule = match.RoomSchedule.filter((_, i) => i !== roomIndex);

        match.RoomSchedule = roomSchedule;
        updatedMatches[matchIndex] = match;

        setPlayoffs({
            ...playoffs,
            Matches: updatedMatches
        });
        setIsDirty(true);
    };

    // Handle close with unsaved changes check
    const handleClose = useCallback(() => {
        if (isDirty && !isReadOnly) {
            setShowCloseConfirmation(true);
        } else {
            onClose();
        }
    }, [isDirty, isReadOnly, onClose]);

    // Handle Escape key to close dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSaving) {
                e.preventDefault();
                handleClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleClose, isSaving]);

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
                    onClick={handleClose}
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
                    {!playoffs.HasScoringStarted && (
                        <div role="alert" className="alert alert-info mb-4">
                            <FontAwesomeIcon icon="fas faInfoCircle" />
                            <span>Playoffs cannot be configured until at least one match is in progress.</span>
                        </div>
                    )}

                    {playoffs.Matches.length === 0 ? (
                                <div className="text-center py-8 text-base-content/60">
                                    <FontAwesomeIcon icon="fas faTrophy" classNames={["text-4xl", "mb-4"]} />
                                    <p>No playoff matches configured yet.</p>
                                    {!isReadOnly && playoffs.HasScoringStarted && (
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
                                            onAddRoomToMatch={handleAddRoomToMatch}
                                            onRoomChange={handleRoomChange}
                                            onRemoveRoom={handleRemoveRoom}
                                        />
                                    ))}

                                    {!isReadOnly && playoffs.HasScoringStarted && (
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
                    {!isReadOnly && playoffs && playoffs.HasScoringStarted && (
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
                        onClick={handleClose}
                        disabled={isSaving}
                    >
                        {isReadOnly || !playoffs?.HasScoringStarted ? "Close" : "Cancel"}
                    </button>
                </div>
            </div>

            {/* Close Confirmation Dialog */}
            {showCloseConfirmation && (
                <ConfirmationDialog
                    title="Unsaved Changes"
                    yesLabel="Discard Changes"
                    noLabel="Keep Editing"
                    onYes={onClose}
                    onNo={() => setShowCloseConfirmation(false)}
                    className="max-w-md"
                >
                    <p className="py-4">
                        You have unsaved changes. Are you sure you want to close without saving?
                    </p>
                </ConfirmationDialog>
            )}
        </dialog>
    );
}
