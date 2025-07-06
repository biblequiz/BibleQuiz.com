import { sharedRoomScoringReportState } from "@utils/SharedState";

interface Props {
    label: string;
    eventId: string;
    databaseId: string;
    meetId: number;
    matchId: number;
    roomId: number;
    children: React.ReactNode;
};

export const RoomDialogModalId = "room-dialog";

export default function RoomDialogLink({ label, eventId, databaseId, meetId, matchId, roomId, children }: Props) {

    const dialogElement = document.getElementById(RoomDialogModalId);
    if (!dialogElement) {
        throw new Error(`RoomDialog isn't present on page.`);
    }

    const handleClick = () => {

        // Update the state to be the current room.
        sharedRoomScoringReportState.set(
            {
                criteria: {
                    label: label,
                    eventId: eventId,
                    databaseId: databaseId,
                    meetId: meetId,
                    matchId: matchId,
                    roomId: roomId
                },
                report: null,
                error: null
            });

        // Show the modal dialog.
        (dialogElement as any).showModal();
    };

    return (
        <a style={{ cursor: "pointer" }} onClick={handleClick}>
            {children}
        </a>
    );
};

