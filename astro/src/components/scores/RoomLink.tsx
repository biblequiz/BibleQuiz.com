interface Props {
    label: string;
    eventId: string;
    databaseId: string;
    meetId: number;
    matchId: number;
    roomId: number;
    children: React.ReactNode;
};

export default function RoomLink({ label, eventId, databaseId, meetId, matchId, roomId, children }: Props) {
    return (
        <a style={{ cursor: "pointer" }}>
            {children}
        </a>
    );
};

