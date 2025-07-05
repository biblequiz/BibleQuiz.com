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

    const handleClick = () => {
        alert(`Show the Room: ${label}\nEvent ID: ${eventId}\nDatabase ID: ${databaseId}\nMeet ID: ${meetId}\nMatch ID: ${matchId}\nRoom ID: ${roomId}`);
    };

    return (
        <a style={{ cursor: "pointer" }} onClick={handleClick}>
            {children}
        </a>
    );
};

