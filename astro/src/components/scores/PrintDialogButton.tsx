import { PrintDialogModalId } from "./PrintDialogContent";
import FontAwesomeIcon from "@components/FontAwesomeIcon";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

function handleClick(dialog: HTMLElement) {
    (dialog as any).showModal();
}

export default function PrintDialogButton() {

    const dialogElement = document.getElementById(PrintDialogModalId);
    if (!dialogElement) {
        throw new Error(`ExportDialog isn't present on page.`);
    }

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState || !reportState.report) {
        return null;
    }

    return (
        <button type="button" className={`btn btn-primary btn-square`} onClick={() => handleClick(dialogElement)}>
            <FontAwesomeIcon icon="fas faPrint" />
        </button>);
}