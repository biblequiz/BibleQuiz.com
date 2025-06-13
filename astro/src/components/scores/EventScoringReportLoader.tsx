import type { EventInfo } from "@types/EventTypes";

import { useStore } from '@nanostores/react';
import { sharedEventScoringReportState } from "@utils/SharedState";

interface Props {
    parentTabId: string;
    eventInfo: EventInfo;
};

export default function EventScoringReportLoader({ parentTabId, eventInfo }: Props) {

    const report = useStore(sharedEventScoringReportState);

    const parentTab = document.getElementById(parentTabId) as HTMLDivElement;

    if (report) {

        // TODO: Determine which tabs to display. Remove the tabs that are not supported by the report.

        // The report is known, so the tabs can be displayed.
        if (parentTab) {
            parentTab.style.display = "";
        }

        return (<div />);
    }
    else {

        // If the report is loading, the tabs should be hidden.
        if (parentTab) {
            parentTab.style.display = "none";
        }

        // TODO: Trigger the loading of the report.

        // Show a loading indicator for the event.
        return (
            <div>
                <span className="loading loading-dots loading-xl"></span>
                &nbsp;
                <span className="text-lg"><i>Loading Stats and Schedules for Event ...</i></span>
            </div>);
    }
};