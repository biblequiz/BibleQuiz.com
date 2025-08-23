import React, { useEffect, useState } from "react";
import { QuestionGeneratorService, type PreviouslyGeneratedSet } from "../../../types/services/QuestionGeneratorService";
import LoadingPlaceholder from "../../LoadingPlaceholder";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import { AuthManager } from "../../../types/AuthManager";
import { useNavigate } from "react-router-dom";
import { ROUTE_GENERATE_SET } from "./QuestionGeneratorRoot";

interface Props {
    previousSets: PreviouslyGeneratedSet[] | null;
    setPreviousSets: (sets: PreviouslyGeneratedSet[] | null) => void;
    retrieveError: string | null;
    hasAutoRedirected: boolean;
    setAutoRedirected: (value: boolean) => void;
}

export default function PreviousSetsSection({
    previousSets,
    setPreviousSets,
    retrieveError,
    hasAutoRedirected,
    setAutoRedirected }: Props) {

    const authManager = AuthManager.useNanoStore();
    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    if (previousSets && previousSets.length === 0 && !hasAutoRedirected) {
        setAutoRedirected(true);
        navigate(ROUTE_GENERATE_SET);
    }

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>, setId: string) => {
        event.preventDefault();
        event.stopPropagation();

        setIsProcessing(true);

        QuestionGeneratorService.deletePreviousSet(authManager, setId)
            .then(() => {
                if (previousSets) {
                    setPreviousSets(previousSets.filter(set => set.Id !== setId));
                }
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };

    return (
        <>
            {!previousSets && !retrieveError && (
                <LoadingPlaceholder text="Loading previously generated sets ..." />)}
            {retrieveError && (
                <div className={`alert alert-error flex flex-col`}>
                    <p className="text-sm">
                        <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />&nbsp;
                        <b>Failed to Retrieve Sets: </b>{retrieveError}
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