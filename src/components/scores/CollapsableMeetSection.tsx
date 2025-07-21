import CollapsibleSection from "../CollapsibleSection";
import MeetProgressNotification, { hasMeetNotification } from "./MeetProgressNotification";
import { ScoringReportMeet } from "@types/EventScoringReport";
import { formatLastUpdated } from "@utils/Scores";

interface Props {
    meet: ScoringReportMeet;
    showCombinedName: boolean;
    showMeetStatus: boolean;
    pageId: string;
    isPrinting?: boolean;
    printSectionIndex?: number;
    children?: React.ReactNode;
};

export default function CollapsableMeetSection({ pageId, meet, showCombinedName, showMeetStatus, isPrinting, printSectionIndex, children }: Props) {

    const icon = meet.IsCombinedReport
        ? "fas faBook"
        : undefined;

    const hasNotification = showMeetStatus && hasMeetNotification(meet, showCombinedName);
    const iconChildren = icon || !hasNotification
        ? undefined
        : (<MeetProgressNotification meet={meet} showCombinedState={showCombinedName} noAlert={true} hideText={true} />);

    const titleChildren = (
        <div className="subtitle italic text-sm mt-0">
            {!meet.IsCombinedReport && hasNotification && (
                <span>
                    <b>Status:</b> <MeetProgressNotification meet={meet} showCombinedState={showCombinedName} noAlert={true} hideIcon={true} /><br />
                </span>)}
            <span>
                <b>Last Updated:</b> {formatLastUpdated(meet)}</span>
        </div>);

    return (
        <CollapsibleSection
            pageId={pageId}
            icon={icon}
            iconChildren={iconChildren}
            title={showCombinedName ? (meet.CombinedName || meet.Name) : meet.Name}
            titleClass="text-xl"
            titleChildren={titleChildren}
            isPrinting={isPrinting}
            printSectionIndex={printSectionIndex}>
            {children}
        </CollapsibleSection>);
};

