import { ScoringReportMeet } from "@types/EventScoringReport";

interface Props {
    meet: ScoringReportMeet;
}

export default function MeetProgressNotification({ meet }: Props) {

    if (!meet.RankedTeams || !meet.ScoringProgressMessage) {
        return null;
    }

    if (meet.HasScoringCompleted) {
        return (
            <div role="alert" className="alert alert-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{meet.ScoringProgressMessage}</span>
            </div>);
    }
    else if (meet.HasRoomCompletionMismatch) {
        return (<div role="alert" className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{meet.ScoringProgressMessage}</span>
          </div>);
    }

    return null;
}