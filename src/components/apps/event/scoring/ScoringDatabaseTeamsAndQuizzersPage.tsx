import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import { useState, useEffect } from "react";
import ScoringDatabaseTeamsAndQuizzerImportButtons from "./ScoringDatabaseTeamsAndQuizzerImportButtons";
import {
    AstroTeamsAndQuizzersService,
    type OnlineTeamsAndQuizzersImportManifest,
    type OnlineTeamsAndQuizzers
} from "types/services/AstroTeamsAndQuizzersService";
import ImportManifestDialog from "./ImportManifestDialog";
import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
}

export default function ScoringDatabaseTeamsAndQuizzersPage({ }: Props) {

    const {
        auth,
        eventId,
        eventRegionId,
        eventDistrictId,
        eventType,
        eventSeason,
        databaseId,
        currentDatabase
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const [isPreparingManifest, setIsPreparingManifest] = useState(false);
    const [downloadedManifest, setDownloadedManifest] = useState<OnlineTeamsAndQuizzersImportManifest | null>(null);
    const [currentTeamsAndQuizzers, setCurrentTeamsAndQuizzers] = useState<OnlineTeamsAndQuizzers | null>(null);
    const [isLoadingTeamsAndQuizzers, setIsLoadingTeamsAndQuizzers] = useState(false);
    const [teamsAndQuizzersError, setTeamsAndQuizzersError] = useState<string | null>(null);

    // Fetch current teams and quizzers when component mounts or when databaseId changes
    useEffect(() => {
        if (databaseId && !currentTeamsAndQuizzers && !isLoadingTeamsAndQuizzers) {
            setIsLoadingTeamsAndQuizzers(true);
            setTeamsAndQuizzersError(null);

            AstroTeamsAndQuizzersService.getTeamsAndQuizzers(auth, eventId, databaseId)
                .then(data => {
                    setCurrentTeamsAndQuizzers(data);
                    setIsLoadingTeamsAndQuizzers(false);
                })
                .catch(error => {
                    setTeamsAndQuizzersError(error.message || "Failed to load teams and quizzers.");
                    setIsLoadingTeamsAndQuizzers(false);
                });
        }
    }, [auth, eventId, databaseId, isLoadingTeamsAndQuizzers]);

    const handleImportComplete = (updated: OnlineTeamsAndQuizzers | null) => {
        setDownloadedManifest(null);
        if (updated) {
            // Refresh the teams and quizzers data after successful import
            setCurrentTeamsAndQuizzers(updated);
        }
    };

    if (isLoadingTeamsAndQuizzers || !currentTeamsAndQuizzers) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Teams and Quizzers ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The teams and quizzers data is being downloaded and prepared. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }

    return (
        <div className="space-y-6">
            <ScoringDatabaseScoreKeepAlert isScoreKeep={currentDatabase?.Settings.IsScoreKeep} />
            <ScoringDatabaseTeamsAndQuizzerImportButtons
                auth={auth}
                season={eventSeason}
                eventId={eventId}
                eventRegionId={eventRegionId}
                eventDistrictId={eventDistrictId}
                eventType={eventType}
                databaseId={databaseId!}
                setDownloadedManifest={m => {
                    setDownloadedManifest(m);
                    setIsPreparingManifest(true);
                }}
            />
            {isLoadingTeamsAndQuizzers && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="loading loading-spinner loading-md"></span>
                    <span>Loading current teams and quizzers ...</span>
                </div>
            )}
            {isPreparingManifest && (
                <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="loading loading-spinner loading-md"></span>
                    <span>Preparing teams and quizzers for import ...</span>
                </div>)}
            {teamsAndQuizzersError && (
                <div role="alert" className="alert alert-error mt-0 w-full">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <div>
                        <b>Error: </b> {teamsAndQuizzersError}
                    </div>
                </div>
            )}
            {downloadedManifest && (
                <ImportManifestDialog
                    manifest={downloadedManifest}
                    currentTeamsAndQuizzers={currentTeamsAndQuizzers}
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId!}
                    setIsPreparing={setIsPreparingManifest}
                    onComplete={updated => {
                        setIsPreparingManifest(false);
                        handleImportComplete(updated);
                    }}
                />
            )}
            <div className="divider mt-0" />
            TODO -- add control for the teams.
        </div>);
}