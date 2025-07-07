import { ExcelDialogModalId } from "./ExcelDialogContent";
import FontAwesomeIcon from "@components/FontAwesomeIcon";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

function handleClick(dialog: HTMLElement) {
    (dialog as any).showModal();
}

export default function ExcelDialogButton() {

    const dialogElement = document.getElementById(ExcelDialogModalId);
    if (!dialogElement) {
        throw new Error(`ExcelDialog isn't present on page.`);
    }

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState || !reportState.report) {
        return null;
    }

    return (
        <button type="button" className="btn btn-warning btn-square" onClick={() => handleClick(dialogElement)}>
            <FontAwesomeIcon icon="fas faFileExcel" />
        </button>);
}