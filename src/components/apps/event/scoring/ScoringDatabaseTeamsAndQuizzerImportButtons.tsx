import { useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import EventLookupDialog from "../EventLookupDialog";
import { AstroEventsService } from "types/services/AstroEventsService";
import { AstroTeamsAndQuizzersService, type OnlineTeamsAndQuizzersImportManifest } from "types/services/AstroTeamsAndQuizzersService";
import FileUploadDialog from "../FileUploadDialog";

interface Props {
    auth: AuthManager;
    season: number,
    eventId: string;
    eventRegionId: string | null;
    eventDistrictId: string | null;
    eventType: string;
    databaseId: string;
    setDownloadedManifest: (manifest: OnlineTeamsAndQuizzersImportManifest) => void;
}

export default function ScoringDatabaseTeamsAndQuizzerImportButtons({
    auth,
    season,
    eventId,
    eventRegionId,
    eventDistrictId,
    eventType,
    databaseId,
    setDownloadedManifest
}: Props) {

    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isImportingFile, setIsImportingFile] = useState(false);
    const [isSelectingEvent, setIsSelectingEvent] = useState(false);

    const importFromRegistrations = () => {
        setIsDownloading(true);
        setDownloadError(null);

        AstroEventsService.getTeamsAndQuizzersManifest(
            auth,
            eventId)
            .then(manifest => {
                setDownloadedManifest(manifest);
                setIsDownloading(false);
            })
            .catch(error => {
                setDownloadError(error.message || "An error occured while downloading the teams and quizzers data for this event.");
                setIsDownloading(false);
            });
    };

    return (
        <>
            <div className="w-full mt-0 mb-0 flex flex-wrap gap-2">
                <button
                    type="button"
                    className="btn btn-success btn-sm m-0"
                    onClick={importFromRegistrations}
                    disabled={isDownloading || isImportingFile || isSelectingEvent}>
                    <FontAwesomeIcon icon="fas faUserPen" />
                    Import from Event's Registration
                </button>
                <button
                    type="button"
                    className="btn btn-primary btn-sm m-0"
                    onClick={() => {
                        setIsImportingFile(true);
                        setDownloadError(null);
                    }}
                    disabled={isDownloading || isImportingFile || isSelectingEvent}>
                    <FontAwesomeIcon icon="fas faBook" />
                    Import from ScoreKeep Report
                </button>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm m-0"
                    onClick={() => {
                        setIsSelectingEvent(true);
                        setDownloadError(null);
                    }}
                    disabled={isDownloading || isImportingFile || isSelectingEvent}>
                    <FontAwesomeIcon icon="fas faList" />
                    Import from Other Event's Registration
                </button>
            </div>
            {isDownloading && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="loading loading-spinner loading-md"></span>
                    <span>Downloading registrations ...</span>
                </div>)}
            {downloadError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b> {downloadError}
                    </div>
                </div>)}
            {isImportingFile && (
                <FileUploadDialog
                    title="Select ScoreKeep Report"
                    extensions={[".xlsx", ".txt"]}
                    onReadyForUpload={async formData => {
                        if (formData) {

                            const manifest = await AstroTeamsAndQuizzersService.processReportForImport(
                                auth,
                                eventId,
                                databaseId,
                                formData);

                            setDownloadedManifest(manifest);
                            setIsImportingFile(false);

                        } else {
                            setIsImportingFile(false);
                        }
                    }}
                />)}
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
                                    setDownloadError(null);
                                })
                                .catch(error => {
                                    setIsSelectingEvent(false);
                                    setDownloadError(error.message || "An error occured while downloading the teams and quizzers data for this event.");
                                });
                        }
                        else {
                            setIsSelectingEvent(false);
                        }
                    }}
                />)}
        </>);
}