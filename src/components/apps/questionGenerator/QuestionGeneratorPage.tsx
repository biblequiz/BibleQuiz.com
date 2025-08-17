import { useStore } from "@nanostores/react";
import React, { useEffect, useState } from "react";
import { sharedAuthManager, sharedDirtyWindowState, sharedGlobalStatusToast } from "../../../utils/SharedState";
import { getOptionalPermissionCheckAlert } from "../../auth/PermissionCheckAlert";
import CollapsibleSection from "../../CollapsibleSection";
import { QuestionGeneratorService, QuestionLanguage, type PreviouslyGeneratedSet } from "../../../types/services/QuestionGeneratorService";
import LoadingPlaceholder from "../../LoadingPlaceholder";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import settings from "../../../data/generated/questionGenerator.json";
import type { JbqQuestionGeneratorSettings } from "../../../types/QuestionGeneratorSettings";

interface Props {
    loadingElementId: string;
}

export default function QuestionGeneratorPage({ loadingElementId }: Props) {

    const authManager = useStore(sharedAuthManager);
    const permissionAlert = getOptionalPermissionCheckAlert(authManager, true);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    useEffect(() => {
        if (!permissionAlert) {
            QuestionGeneratorService.getPreviousSets(authManager)
                .then(setPreviousSets);
        }
    }, [authManager]);

    const generatorSettings = settings as JbqQuestionGeneratorSettings;

    const [previousSets, setPreviousSets] = useState<PreviouslyGeneratedSet[] | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [rounds, setRounds] = useState<number>(1);
    const [season, setSeason] = useState<number>(generatorSettings.CurrentSeason);
    const [language, setLanguage] = useState<QuestionLanguage>(QuestionLanguage.English);

    if (permissionAlert) {
        return permissionAlert;
    }

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
            {(!previousSets || previousSets.length > 0) && (
                <CollapsibleSection
                    pageId="question-generator"
                    title="Previously Generated Sets"
                    titleClass="mt-4"
                    allowMultipleOpen={false}
                    defaultOpen={true}>
                    {!previousSets && (
                        <LoadingPlaceholder text="Loading previously generated sets ..." />)}
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
                </CollapsibleSection>)}
            <CollapsibleSection
                pageId="question-generator"
                title="Generate New Set"
                titleClass="mt-4"
                forceOpen={(previousSets && previousSets.length === 0) ?? false}
                allowMultipleOpen={false}>

                <form id="generatorForm" className="space-y-6">
                    <div className="w-full">
                        <label className="label">
                            <span className="label-text font-medium">Title</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={title}
                            onChange={e => {
                                setTitle(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            placeholder="Enter title for the set"
                            className="input input-bordered w-full"
                            disabled={isProcessing}
                            maxLength={80}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Rounds</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                type="number"
                                name="rounds"
                                value={rounds}
                                onChange={e => {
                                    setRounds(Number(e.target.value));
                                    sharedDirtyWindowState.set(true);
                                }}
                                placeholder="Enter number of rounds"
                                className="input input-bordered w-full"
                                disabled={isProcessing}
                                min={1}
                                max={18}
                                step={1}
                                required
                            />
                        </div>
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Season</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <select
                                name="season"
                                className="select select-bordered w-full mt-0"
                                value={season}
                                onChange={e => {
                                    setSeason(Number(e.target.value));
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={isProcessing}
                                required
                            >
                                {generatorSettings.Seasons.map((s) => (
                                    <option key={`season_${s}`} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Language</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <select
                                name="language"
                                className="select select-bordered w-full mt-0"
                                value={QuestionLanguage[language]}
                                onChange={e => {
                                    setLanguage(QuestionLanguage[e.target.value as keyof typeof QuestionLanguage]);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={isProcessing}
                                required
                            >
                                {Object.values(QuestionLanguage).map((lang) => (
                                    <option key={`language_${lang}`} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>
            </CollapsibleSection>
        </>
    )
}