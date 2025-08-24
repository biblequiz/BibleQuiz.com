import React, { useEffect, useState } from "react";
import { QuestionGeneratorService, type PreviouslyGeneratedSet } from "../../../types/services/QuestionGeneratorService";
import LoadingPlaceholder from "../../LoadingPlaceholder";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import { AuthManager } from "../../../types/AuthManager";
import { useNavigate } from "react-router-dom";

interface Props {
    generateSetElement: React.RefObject<HTMLDivElement | null>;
}

export default function PreviousSetsSection({ generateSetElement }: Props) {

    const authManager = AuthManager.useNanoStore();
    const navigate = useNavigate();

    const [previousSets, setPreviousSets] = useState<PreviouslyGeneratedSet[] | null>(null);
    const [latestError, setLatestError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    useEffect(
        () => {
            if (!previousSets) {
                QuestionGeneratorService.getPreviousSets(authManager)
                    .then(s => {
                        setPreviousSets(s);

                        if (s && s.length === 0) {
                            if (generateSetElement.current) {
                                generateSetElement.current.scrollIntoView({ behavior: "smooth" });
                            }
                        }
                    })
                    .catch(error => {
                        setLatestError(error.message);
                    });
            }
        }, [authManager]);

    const handleRegenerate = async (event: React.MouseEvent<HTMLButtonElement>, setId: string) => {
        event.preventDefault();
        event.stopPropagation();

        setIsProcessing(true);

        await navigate(`/${setId}`);

        setIsProcessing(false);
    };

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
        <div className="overflow-x-auto">
            <h4>Previous Sets</h4>
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
                                    <i>You haven't generated any question sets yet. Create a new one below.</i>
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
                                        className="btn btn-primary btn-sm mt-0 mr-2"
                                        onClick={e => handleRegenerate(e, set.Id)}>
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
        </div>);
}