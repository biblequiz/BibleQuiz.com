import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "utils/SharedState";

/**
 * Optional plain text a season report's author put at the top of the report. React escapes the text and
 * whitespace-pre-line keeps the line breaks. Renders nothing while the report is loading or has no description.
 */
export default function ReportDescription() {
    const state = useStore(sharedEventScoringReportState);

    const description = state?.report?.Description;
    if (!description) {
        return null;
    }

    return (
        <p className="whitespace-pre-line mt-0 mb-4">{description}</p>
    );
}
