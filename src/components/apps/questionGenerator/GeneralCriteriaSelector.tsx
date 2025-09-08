import { QuestionLanguage } from 'types/services/QuestionGeneratorService';
import settings from 'data/generated/questionGenerator.json';
import type { JbqQuestionGeneratorSettings } from 'types/QuestionGeneratorSettings';
import { useEffect, useState } from "react";

interface Props {
    criteria: GeneralCriteria;
    setCriteria: (criteria: GeneralCriteria) => void;
}

export interface GeneralCriteria {
    rounds: number;
    season: number;
    language: QuestionLanguage;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

export default function GeneralCriteriaSelector({
    criteria,
    setCriteria }: Props) {

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Rounds</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <select
                        name="rounds"
                        className="select select-bordered w-full mt-0"
                        value={criteria.rounds}
                        onChange={e => setCriteria({ ...criteria, rounds: Number(e.target.value) })}
                        required
                    >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                        <option value={7}>7</option>
                        <option value={8}>8</option>
                        <option value={9}>9</option>
                        <option value={10}>10</option>
                        <option value={11}>11</option>
                        <option value={12}>12</option>
                        <option value={13}>13</option>
                        <option value={14}>14</option>
                        <option value={15}>15</option>
                        <option value={16}>16</option>
                        <option value={17}>17</option>
                        <option value={18}>18</option>
                    </select>
                </div>
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Season</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <select
                        name="season"
                        className="select select-bordered w-full mt-0"
                        value={criteria.season}
                        onChange={e => setCriteria({ ...criteria, season: Number(e.target.value) })}
                        required
                    >
                        {GENERATOR_SETTINGS.Seasons.map((s) => (
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
                        value={criteria.language}
                        onChange={e => setCriteria({ ...criteria, language: e.target.value as QuestionLanguage })}
                        required
                    >
                        {Object.values(QuestionLanguage).map((lang) => (
                            <option key={`language_${lang}`} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>
            </div>
        </>);
}