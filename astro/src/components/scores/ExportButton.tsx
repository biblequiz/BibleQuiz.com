import { ExportDialogModalIdPrefix } from "./ExportDialogContent";
import FontAwesomeIcon from "@components/FontAwesomeIcon";

import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState } from "@utils/SharedState";

interface Props {
    type: "Print" | "Export";
}

function handleClick(dialog: HTMLElement) {
    (dialog as any).showModal();
}

export default function ExportButton({ type }: Props) {

    const dialogElement = document.getElementById(`${ExportDialogModalIdPrefix}-${type}`);
    if (!dialogElement) {
        throw new Error(`ExportDialog isn't present on page.`);
    }

    const reportState = useStore(sharedEventScoringReportState);
    if (!reportState || !reportState.report) {
        return null;
    }

    let buttonCss = "";
    let icon = "";
    switch (type) {
        case "Print":
            icon = "fas faPrint";
            buttonCss = "btn-primary";
            break;
        case "Export":
            icon = "fas faFileExcel";
            buttonCss = "btn-warning";
            break;
    }

    return (
        <button type="button" className={`btn ${buttonCss} btn-square`} onClick={() => handleClick(dialogElement)}>
            <FontAwesomeIcon icon={icon} />
        </button>);
}