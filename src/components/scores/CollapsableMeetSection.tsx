import { sharedEventScoringReportFilterState } from "utils/SharedState";
import CollapsibleSection from "../CollapsibleSection";
import MeetProgressNotification, { hasMeetNotification } from './MeetProgressNotification';
import { ScoringReportMeet } from "types/EventScoringReport";
import { formatLastUpdated } from "utils/Scores";

interface SectionBadge {
    id?: string;
    className: string;
    icon?: string;
    text: string;
}

interface Props {
    meet: ScoringReportMeet;
    showCombinedName: boolean;
    showMeetStatus: boolean;
    pageId: string;
    elementId?: string;
    isPrinting?: boolean;
    printSectionIndex?: number;
    forceOpen?: boolean;
    children?: React.ReactNode;
    badges?: SectionBadge[];
};

export default function CollapsableMeetSection({
    pageId,
    elementId,
    meet,
    showCombinedName,
    showMeetStatus,
    isPrinting,
    printSectionIndex,
    forceOpen,
    children,
    badges }: Props) {

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
            elementId={elementId ?? meet.MeetId.toString()}
            icon={icon}
            iconChildren={iconChildren}
            title={showCombinedName ? (meet.CombinedName || meet.Name) : meet.Name}
            titleClass="text-xl"
            titleChildren={titleChildren}
            isPrinting={isPrinting}
            printSectionIndex={printSectionIndex}
            badges={badges}
            forceOpen={forceOpen}
            persistState={true}
            onClose={() => {
                const currentFilters = sharedEventScoringReportFilterState.get();
                if (forceOpen && currentFilters) {
                    const newState = { ...currentFilters };
                    newState.openMeetDatabaseId = null;
                    newState.openMeetMeetId = null;
                    sharedEventScoringReportFilterState.set(newState);
                }
            }}>
            {children}
        </CollapsibleSection>);
};

