import type { JSX } from "astro/jsx-runtime";
import { useEffect } from "react";

interface Props {
    id: string;
    label: string;
    eventId: string;
    databaseId: string;
    meetId: number;
    matchId: number;
    roomId: number;
    children: React.ReactNode;
};

declare global {
    interface Window {
        openRoomDialog: (event: any) => void;
    }
}

export const RoomDialogModalId = "room-dialog";

export default function RoomDialogLink({ id, label, eventId, databaseId, meetId, matchId, roomId, children }: Props) {

    const link = (
        <a style={{ cursor: "pointer" }} id={id} data-label={label} data-event-id={eventId}
            data-database-id={databaseId} data-meet-id={meetId} data-match-id={matchId}
            data-room-id={roomId}>
            {children}
        </a>);

    useEffect(() => {
        document.getElementById(id)?.addEventListener("click", window.openRoomDialog);
    }, []);

    return link;
};