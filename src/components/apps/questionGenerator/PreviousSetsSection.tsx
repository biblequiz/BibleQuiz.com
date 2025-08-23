import React, { useEffect, useState } from "react";
import { QuestionGeneratorService, type PreviouslyGeneratedSet } from "../../../types/services/QuestionGeneratorService";
import LoadingPlaceholder from "../../LoadingPlaceholder";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import { AuthManager } from "../../../types/AuthManager";

interface Props {
    onSetsLoaded: (count: number) => void;
}

export default function PreviousSetsSection({ onSetsLoaded }: Props) {

    const authManager = AuthManager.useNanoStore();

    const [previousSets, setPreviousSets] = useState<PreviouslyGeneratedSet[] | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [latestError, setLatestError] = useState<string | null>(null);

    useEffect(
        () => {
            if (!previousSets) {
                QuestionGeneratorService.getPreviousSets(authManager)
                    .then(
                        (newSets) => {
                            setPreviousSets(newSets);
                            onSetsLoaded(newSets ? newSets.length : 0);
                        })
                    .catch(error => {
                        setLatestError(error.message);
                        setIsProcessing(false);
                    });
            }
        }, [authManager]);

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>, setId: string) => {
        event.preventDefault();
        event.stopPropagation();

        setIsProcessing(true);

        QuestionGeneratorService.deletePreviousSet(authManager, setId)
            .then(() => {
                setPreviousSets((prev) => prev ? prev.filter(set => set.Id !== setId) : null);
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };

    return (
        <>
            {!previousSets && !latestError && (
                <LoadingPlaceholder text="Loading previously generated sets ..." />)}
            {latestError && (
                <div className={`alert alert-error flex flex-col`}>
                    <p className="text-sm">
                        <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />&nbsp;
                        <b>Failed to Retrieve Sets: </b>{latestError}
                    </p>
                </div>)}
            {previousSets && (
                <table className="table table-s table-nowrap table-zebra">
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th className="text-right">Questions</th>
                            <th className="text-right">Matches</th>
                            <th className="text-right">Generated</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {previousSets.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center">
                                    <i>No previous sets found.</i>
                                </td>
                            </tr>
                        )}
                        {previousSets.map((set) => (
                            <tr key={`previous_${set.Id}`}>
                                <td>{set.Title}</td>
                                <td className="text-right">{set.Questions}</td>
                                <td className="text-right">{set.Matches}</td>
                                <td className="text-right">{set.Generated}</td>
                                <td className="text-right">
                                    <button
                                        type="button"
                                        disabled={isProcessing}
                                        className="btn btn-success btn-sm mt-0 mr-2">
                                        <FontAwesomeIcon icon="fas faPrint" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isProcessing}
                                        className="btn btn-info btn-sm mt-0 mr-2">
                                        <FontAwesomeIcon icon="fas faFileDownload" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isProcessing}
                                        className="btn btn-primary btn-sm mt-0 mr-2">
                                        <FontAwesomeIcon icon="fas faRedo" />
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isProcessing}
                                        onClick={e => handleDelete(e, set.Id)}
                                        className="btn btn-error btn-sm mt-0">
                                        <FontAwesomeIcon icon="fas faTrashAlt" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>);
}