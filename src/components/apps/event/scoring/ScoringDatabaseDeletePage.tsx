import { useState } from "react";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import { useNavigate, useOutletContext } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { AstroDatabasesService } from "types/services/AstroDatabasesService";
import { useStore } from "@nanostores/react";
import { currentDatabaseSummaries } from "../EventRoot";

interface Props {
}

export default function ScoringDatabaseDeletePage({ }: Props) {
    const {
        auth,
        rootEventUrl,
        eventId,
        databaseId,
        currentDatabase,
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const navigate = useNavigate();
    const [confirmedIntent, setConfirmedIntent] = useState<boolean>(false);
    const [confirmedImpact, setConfirmedImpact] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const currentSummaries = useStore(currentDatabaseSummaries);

    const handleSave = (e: React.MouseEvent) => {
        e.preventDefault();

        if (!confirmedIntent || !confirmedImpact) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        AstroDatabasesService.deleteDatabase(
            auth,
            eventId,
            databaseId!)
            .then(() => {
                if (currentSummaries) {
                    const currentIndex = currentSummaries.findIndex(
                        d => d.Settings.DatabaseId === databaseId);
                    if (currentIndex >= 0) {
                        currentSummaries.splice(currentIndex, 1);
                        currentDatabaseSummaries.set([...currentSummaries]);
                    }
                }

                setIsProcessing(false);
                setErrorMessage(null);

                navigate(`${rootEventUrl}/dashboard`);
            })
            .catch(err => {
                setIsProcessing(false);
                setErrorMessage(err.message || "An error occurred while deleting the database.");
            });
    };

    if (isProcessing) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Deleting Database ...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The database is being deleted. This should just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>);
    }
    else if (errorMessage) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            {errorMessage}
                        </p>
                    </div>
                </div>
            </div>);
    }

    const databaseName = currentDatabase?.Settings.DatabaseNameOverride || currentDatabase?.Settings.DatabaseName;

    return (
        <form className="space-y-6 mt-0">
            <h5 className="mb-2 mt-2">Permanently Delete Database</h5>
            <p className="subtitle mb-2 mt-2">
                <FontAwesomeIcon icon="fas faDatabase" />
                <span className="ml-2">{databaseName}</span>
            </p>
            <div className="w-full ml-2 mt-4 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={confirmedIntent}
                        onChange={e => setConfirmedIntent(e.target.checked)}
                    />
                    <span>
                        I want to delete the {databaseName} database.
                    </span>
                </label>
            </div>
            <div className="w-full ml-2 mt-4 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={confirmedImpact}
                        onChange={e => setConfirmedImpact(e.target.checked)}
                    />
                    <span>
                        I understand that deleting the {databaseName} database is permanent and cannot be undone.
                    </span>
                </label>
            </div>
            <button
                type="button"
                className="btn btn-sm btn-error mt-4"
                onClick={handleSave}
                disabled={isProcessing || !confirmedIntent || !confirmedImpact}>
                <FontAwesomeIcon icon="fas faTrash" />
                Permanently Delete Database
            </button>
        </form>);
}