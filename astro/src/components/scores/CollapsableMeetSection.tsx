import CollapsibleSection from "@components/CollapsibleSection";
import { ScoringReportMeet } from "@types/EventScoringReport";
import { formatLastUpdated } from "@utils/Scores";

interface Props {
    meet: ScoringReportMeet;
    pageId: string;
    children?: React.ReactNode;
};

export default function CollapsableMeetSection({ pageId, meet, children }: Props) {

    const icon = meet.IsCombinedReport 
        ? "fas faBook"
        : "fas faFutbol";

    return (
        <CollapsibleSection
            key={`${pageId}_${meet.DatabaseId}_${meet.MeetId}`}
            pageId={pageId}
            icon={icon}
            title={meet.Name}
            titleClass="text-xl"
            subtitle={`Last Updated: ${formatLastUpdated(meet)}`}>
            {children}
        </CollapsibleSection>);
};

