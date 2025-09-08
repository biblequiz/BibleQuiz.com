import React, { } from "react";
import FontAwesomeIcon from "../../FontAwesomeIcon";

interface Props {
    mode: QuestionMode;
    setMode: (mode: QuestionMode) => void;
    isLoadingTemplates: boolean;
}

export enum QuestionMode {
    Competition = "Competition",
    BibleMaster = "BibleMaster",
    MyTemplates = "MyTemplates",
}

export default function QuestionModeSelector({ mode, setMode, isLoadingTemplates }: Props) {

    const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMode(QuestionMode[event.target.value as keyof typeof QuestionMode]);
    };

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0 mt-0 mb-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <legend className="fieldset-legend">Question Mode</legend>
            <label className="label text-wrap">
                <input
                    type="radio"
                    name="question-mode"
                    className="radio radio-info"
                    value={QuestionMode[QuestionMode.Competition]}
                    checked={mode === QuestionMode.Competition}
                    onChange={handleModeChange}
                    disabled={isLoadingTemplates} />
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
                    onChange={handleModeChange}
                    disabled={isLoadingTemplates} />
                <span className="text-sm">
                    <FontAwesomeIcon icon="fas faTrophy" />&nbsp;Bible Master Awards
                </span>
            </label>
            <label className="label text-wrap">
                <input
                    type="radio"
                    name="question-mode"
                    className="radio radio-info"
                    value={QuestionMode[QuestionMode.MyTemplates]}
                    checked={mode === QuestionMode.MyTemplates}
                    onChange={handleModeChange}
                    disabled={isLoadingTemplates} />
                <span className="text-sm">
                    <FontAwesomeIcon icon="fas faFolderOpen" />&nbsp;My Templates
                </span>
            </label>
        </fieldset>);
}