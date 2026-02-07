import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import EventLookupDialog from "../EventLookupDialog";
import { AstroEventsService } from "types/services/AstroEventsService";
import type { OnlineTeamsAndQuizzersImportManifest } from "types/services/AstroTeamsAndQuizzersService";

interface Props {
    auth: AuthManager;
    season: number,
    eventId: string;
    eventRegionId: string | null;
    eventDistrictId: string | null;
    eventType: string;
    databaseId: string;
    setDownloadedManifest: (manifest: OnlineTeamsAndQuizzersImportManifest) => void;
    setIsDownloading: (isDownloading: boolean) => void;
    disabled: boolean;
}

export default function ScoringDatabaseTeamsAndQuizzerImportButtons({
    auth,
    season,
    eventId,
    eventRegionId,
    eventDistrictId,
    eventType,
    databaseId,
    setDownloadedManifest,
    setIsDownloading,
    disabled
}: Props) {

    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isSelectingEvent, setIsSelectingEvent] = useState(false);

    const importFromRegistrations = () => {

    };

    const importFromReport = () => {

    };

    return (
        <>
            {downloadError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b> {downloadError}
                    </div>
                </div>)}
            <div className="w-full mt-0 mb-0 flex flex-wrap gap-2">
                <button
                    type="button"
                    className="btn btn-success m-0"
                    onClick={importFromRegistrations}
                    disabled={disabled}>
                    <FontAwesomeIcon icon="fas faUserPen" />
                    Import from Event's Registration
                </button>
                <button
                    type="button"
                    className="btn btn-primary m-0"
                    onClick={importFromReport}
                    disabled={disabled}>
                    <FontAwesomeIcon icon="fas faBook" />
                    Import from ScoreKeep Report
                </button>
                <button
                    type="button"
                    className="btn btn-secondary m-0"
                    onClick={() => {
                        setIsSelectingEvent(true);
                        setIsDownloading(true);
                        setDownloadError(null);
                    }}
                    disabled={disabled}>
                    <FontAwesomeIcon icon="fas faList" />
                    Import from Other Event's Registration
                </button>
            </div>
            {isSelectingEvent && (
                <EventLookupDialog
                    season={season}
                    typeId={eventType}
                    regionId={eventRegionId ?? undefined}
                    districtId={eventDistrictId ?? undefined}
                    excludeEventIds={[eventId]}
                    allowBroaderScopes={true}
                    onSelect={e => {
                        if (e) {
                            AstroEventsService.getTeamsAndQuizzersManifest(
                                auth,
                                e.id)
                                .then(manifest => {
                                    setDownloadedManifest(manifest);
                                    setIsSelectingEvent(false);
                                    setIsDownloading(false);
                                    setDownloadError(null);
                                })
                                .catch(error => {
                                    setIsSelectingEvent(false);
                                    setIsDownloading(false);
                                    setDownloadError(error.message || "An error occured while downloading the teams and quizzers data for this event.");
                                });
                        }
                        else {
                            setIsSelectingEvent(false);
                            setIsDownloading(false);
                        }
                    }}
                />)}
        </>);
}