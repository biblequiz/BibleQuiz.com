import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useOutletContext } from "react-router-dom";
import ScoringDatabaseScoreKeepAlert from "./ScoringDatabaseScoreKeepAlert";
import { useState } from "react";
import ScoringDatabaseTeamsAndQuizzerImportButtons from "./ScoringDatabaseTeamsAndQuizzerImportButtons";
import type { OnlineTeamsAndQuizzersImportManifest } from "types/services/AstroTeamsAndQuizzersService";

interface Props {
}

export default function ScoringDatabaseTeamsAndQuizzersPage({ }: Props) {

    const {
        auth,
        eventId,
        eventType,
        eventSeason,
        databaseId,
        currentDatabase
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const [downloadedManifests, setDownloadedManifests] = useState<OnlineTeamsAndQuizzersImportManifest | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    return (
        <div className="space-y-6">
            <ScoringDatabaseScoreKeepAlert isScoreKeep={currentDatabase?.Settings.IsScoreKeep} />
            <ScoringDatabaseTeamsAndQuizzerImportButtons
                auth={auth}
                season={eventSeason}
                eventId={eventId}
                eventType={eventType}
                databaseId={databaseId!}
                setIsDownloading={setIsDownloading}
                disabled={isDownloading}
            />
            <div className="divider mt-0" />

            <div>
                <b>Teams & Quizzers Section</b>
            </div>
            <p>
                This page includes the following:
            </p>
            <ul>
                <li>Manage Teams & Quizzers (like ScoreKeep).</li>
                <li>Import Teams & Quizzers from the Registration (including updates). The user should be able to specify how teams should be named.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </div>);
}