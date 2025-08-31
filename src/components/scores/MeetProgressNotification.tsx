import { ScoringReportMeet } from "types/EventScoringReport";
import FontAwesomeIcon from "../FontAwesomeIcon";

interface Props {
    meet: ScoringReportMeet;
    showCombinedState?: boolean;
    noAlert?: boolean;
    hideIcon?: boolean;
    hideText?: boolean;
}

function getAlertInfo(
    meet: ScoringReportMeet,
    showCombinedState: boolean | undefined): { icon: string | null, alertClassName: string | null, message: string } | null {

    const progressMessage = showCombinedState && meet.CombinedName
        ? meet.ScoringProgressMessageForCombined
        : meet.ScoringProgressMessage;

    if (!meet.RankedTeams || !progressMessage || progressMessage.length === 0) {
        return null;
    }

    const hasScoringCompleted = showCombinedState && meet.CombinedName
        ? meet.HasScoringCompletedForCombined
        : meet.HasScoringCompleted;
    const hasRoomCompletionMismatch = showCombinedState && meet.CombinedName
        ? meet.HasRoomCompletionMismatchForCombined
        : meet.HasRoomCompletionMismatch;

    if (hasScoringCompleted || !hasRoomCompletionMismatch) {
        return {
            message: progressMessage,
            icon: "far faCheckCircle",
            alertClassName: "alert alert-success hide-on-print"
        };
    }
    else if (hasRoomCompletionMismatch) {
        return {
            message: progressMessage,
            icon: "fas faTriangleExclamation",
            alertClassName: "alert alert-warning hide-on-print"
        };
    }

    return null;
}

export function hasMeetNotification(meet: ScoringReportMeet, showCombinedState: boolean): boolean {
    return getAlertInfo(meet, showCombinedState) !== null;
}

export default function MeetProgressNotification({ meet, showCombinedState, noAlert, hideIcon, hideText }: Props) {

    const alertInfo = getAlertInfo(meet, showCombinedState);
    if (!alertInfo) {
        return null;
    }

    const { icon, alertClassName } = alertInfo;
    if (alertClassName) {

        const alertContents = (
            <>
                {!hideIcon && icon && (<FontAwesomeIcon icon={icon} classNames={["text-xl"]} />)}
                {noAlert && <span>&nbsp;</span>}
                {!hideText && (<span>{alertInfo.message}</span>)}
            </>);
        if (noAlert) {
            return alertContents;
        }

        return (
            <div role="alert" className={alertClassName}>
                {alertContents}
            </div>);
    }

    return null;
}