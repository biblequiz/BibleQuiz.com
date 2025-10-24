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

    return (
        <a
            style={{ cursor: "pointer", color: "var(--accent-content)", textDecoration: "text-decorationl-color" }}
            id={id}
            data-label={label}
            data-event-id={eventId}
            data-database-id={databaseId}
            data-meet-id={meetId}
            data-match-id={matchId}
            data-room-id={roomId}
            onClick={e => window.openRoomDialog(e)}
            onMouseOver={e => (e.currentTarget.style.textDecoration = "underline")}
            onMouseOut={e => (e.currentTarget.style.textDecoration = "none")}
        >
            {children}
        </a>);
};