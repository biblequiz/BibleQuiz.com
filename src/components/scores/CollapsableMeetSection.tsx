import CollapsibleSection from "@components/CollapsibleSection";
import { ScoringReportMeet } from "@types/EventScoringReport";
import { formatLastUpdated } from "@utils/Scores";

interface Props {
    meet: ScoringReportMeet;
    pageId: string;
    isPrinting?: boolean;
    printSectionIndex?: number;
    children?: React.ReactNode;
};

export default function CollapsableMeetSection({ pageId, meet, isPrinting, printSectionIndex, children }: Props) {

    const icon = meet.IsCombinedReport
        ? "fas faBook"
        : "fas faFutbol";

    return (
        <CollapsibleSection
            pageId={pageId}
            icon={icon}
            title={meet.Name}
            titleClass="text-xl"
            subtitle={`Last Updated: ${formatLastUpdated(meet)}`}
            isPrinting={isPrinting}
            printSectionIndex={printSectionIndex}>
            {children}
        </CollapsibleSection>);
};

