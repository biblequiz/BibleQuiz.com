import React, { useEffect, useState } from "react";
import { sharedDirtyWindowState } from "../../../utils/SharedState";
import { getOptionalPermissionCheckAlert } from "../../auth/PermissionCheckAlert";
import CollapsibleSection from "../../CollapsibleSection";
import { QuestionGeneratorService, QuestionLanguage, type PreviouslyGeneratedSet } from "../../../types/services/QuestionGeneratorService";
import LoadingPlaceholder from "../../LoadingPlaceholder";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import settings from "../../../data/generated/questionGenerator.json";
import type { JbqQuestionGeneratorSettings } from "../../../types/QuestionGeneratorSettings";
import PointValueCountSelector from "./PointValueCountSelector";
import { AuthManager } from "../../../types/AuthManager";

interface Props {
    loadingElementId: string;
}

enum QuestionMode {
    Competition = "Competition",
    BibleMaster = "BibleMaster",
}

enum QuestionRuleType {

    BibleDiscoverer = "BibleDiscoverer",
    BibleSearcher = "BibleSearcher",
    BibleAchiever = "BibleAchiever",
    BibleMaster = "BibleMaster",
    BibleQuoter = "BibleQuoter",
    Beginner = "Beginner",
    Intermediate = "Intermediate",
    Advanced = "Advanced",
    Custom = "Custom",
}

export default function QuestionGeneratorPage({ loadingElementId }: Props) {

    const authManager = AuthManager.useNanoStore();
    const permissionAlert = getOptionalPermissionCheckAlert(authManager);

    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) fallback.style.display = "none";
    }, [loadingElementId]);

    useEffect(() => {
        if (!permissionAlert) {
            QuestionGeneratorService.getPreviousSets(authManager)
                .then(setPreviousSets)
                .catch(error => {
                    setPreviousSetError(error.message);
                    setIsProcessing(false);
                })
        }
    }, [authManager]);

    const generatorSettings = settings as JbqQuestionGeneratorSettings;

    const [previousSets, setPreviousSets] = useState<PreviouslyGeneratedSet[] | null>(null);
    const [previousSetError, setPreviousSetError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [rounds, setRounds] = useState<number>(1);
    const [season, setSeason] = useState<number>(generatorSettings.CurrentSeason);
    const [language, setLanguage] = useState<QuestionLanguage>(QuestionLanguage.English);
    const [mode, setMode] = useState<QuestionMode>(QuestionMode.Competition);
    const [ruleType, setRuleType] = useState<QuestionRuleType>(QuestionRuleType.Beginner);
    const [regularPointValueCounts, setRegularPointValueCounts] = useState<Record<number, number>>({ 10: 10, 20: 7, 30: 3 });
    const [substitutePointValueCounts, setSubstitutePointValueCounts] = useState<Record<number, number>>({ 10: 1, 20: 1, 30: 1 });
    const [overtimePointValueCounts, setOvertimePointValueCounts] = useState<Record<number, number>>({ 10: 1, 20: 1, 30: 1 });

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
                    {!previousSets && !previousSetError && (
                        <LoadingPlaceholder text="Loading previously generated sets ..." />)}
                    {previousSetError && (
                        <div className={`alert alert-error flex flex-col`}>
                            <p className="text-sm">
                                <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />&nbsp;
                                <b>Failed to Retrieve Sets: </b>{previousSetError}
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
                </CollapsibleSection >)
            }
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

                    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <legend className="fieldset-legend">Question Mode</legend>
                        <label className="label text-wrap">
                            <input
                                type="radio"
                                name="question-mode"
                                className="radio radio-info"
                                value={QuestionMode[QuestionMode.Competition]}
                                checked={mode === QuestionMode.Competition}
                                onChange={e => {
                                    setMode(QuestionMode[e.target.value as keyof typeof QuestionMode]);
                                    setRuleType(QuestionRuleType.Beginner);
                                }} />
                            <span className="text-sm">
                                <FontAwesomeIcon icon="fas faFutbol" />&nbsp;Competition or Practice
                            </span>
                        </label>
                        <label className="label text-wrap">
                            <input
                                type="radio"
                                name="question-mode"
                                className="radio radio-info"
                                value={QuestionMode[QuestionMode.BibleMaster]}
                                checked={mode === QuestionMode.BibleMaster}
                                onChange={e => {
                                    setMode(QuestionMode[e.target.value as keyof typeof QuestionMode]);
                                    setRuleType(QuestionRuleType.BibleDiscoverer);
                                }} />
                            <span className="text-sm">
                                <FontAwesomeIcon icon="fas faTrophy" />&nbsp;Bible Master Awards
                            </span>
                        </label>
                    </fieldset>

                    <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
                        <legend className="fieldset-legend">Question Rules</legend>
                        {mode === QuestionMode.Competition && (
                            <>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.Beginner]}
                                            checked={ruleType === QuestionRuleType.Beginner}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Beginner</b><br />
                                            Random set of 20 questions (10 points each).
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.Intermediate]}
                                            checked={ruleType === QuestionRuleType.Intermediate}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Intermediate</b><br />
                                            Random set of 20 questions (12 x 10-point and 8 x 20-point questions).
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.Advanced]}
                                            checked={ruleType === QuestionRuleType.Advanced}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Advanced</b><br />
                                            Random set of 20 questions (10 x 10-point, 7 x 20-point, and 3 x 30-point questions).
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.Custom]}
                                            checked={ruleType === QuestionRuleType.Custom}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Custom Rules</b><br />
                                            Manually configure the rules.
                                        </span>
                                    </label>
                                </div>
                            </>)}
                        {mode === QuestionMode.BibleMaster && (
                            <>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.BibleDiscoverer]}
                                            checked={ruleType === QuestionRuleType.BibleDiscoverer}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Bible Discoverer</b><br />
                                            Random set of 30 questions (10 points each). To earn the seal, an individual must correctly answer 20 x 10-point questions.
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.BibleSearcher]}
                                            checked={ruleType === QuestionRuleType.BibleSearcher}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Bible Searcher</b><br />
                                            Random set of 50 questions (30 x 10-point and 20 x 20-point questions). To earn the seal, an individual must correctly answer 25 10-point questions and 15 20-point questions.
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.BibleAchiever]}
                                            checked={ruleType === QuestionRuleType.BibleAchiever}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Bible Achiever</b><br />
                                            Random set of 60 questions (30 x 10-point, 20 x 20-point, and 10 x 30-point questions). To earn the seal, an individual must correctly answer 28 10-point questions, 18 20-point questions,
                                            and 6 30-point questions.
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.BibleMaster]}
                                            checked={ruleType === QuestionRuleType.BibleMaster}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Bible Master</b><br />
                                            Random set of 60 questions (30 x 10-point, 20 x 20-point, and 10 x 30-point questions). To earn the seal, an individual
                                            must <strong>correctly answer 59 of the 60 questions correctly</strong>.
                                        </span>
                                    </label>
                                </div>
                                <div>
                                    <label className="label text-wrap">
                                        <input
                                            type="radio"
                                            name="question-rules"
                                            className="radio radio-info"
                                            value={QuestionRuleType[QuestionRuleType.BibleQuoter]}
                                            checked={ruleType === QuestionRuleType.BibleQuoter}
                                            onChange={e => setRuleType(QuestionRuleType[e.target.value as keyof typeof QuestionRuleType])} />
                                        <span className="text-sm">
                                            <b>Bible Quoter</b><br />
                                            Random set of 95 questions from 107 verses.
                                        </span>
                                    </label>
                                </div>
                            </>)}
                    </fieldset>

                    {ruleType === QuestionRuleType.Custom && (
                        <div>
                            <PointValueCountSelector
                                label="Regular Questions"
                                initialPoints={regularPointValueCounts}
                                onPointsChange={c => {
                                    setRegularPointValueCounts(c);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={isProcessing}
                            />
                            <PointValueCountSelector
                                label="Substitute Questions"
                                initialPoints={substitutePointValueCounts}
                                onPointsChange={c => {
                                    setSubstitutePointValueCounts(c);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={isProcessing}
                            />
                            <PointValueCountSelector
                                label="Overtime Questions"
                                initialPoints={overtimePointValueCounts}
                                onPointsChange={c => {
                                    setOvertimePointValueCounts(c);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={isProcessing}
                            />
                            <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0">
                                <legend className="fieldset-legend">Questions</legend>
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
                            </fieldset>
                        </div>)}
                </form>
            </CollapsibleSection >
        </>
    )
}