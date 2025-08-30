import { QuestionLanguage } from 'types/services/QuestionGeneratorService';
import settings from 'data/generated/questionGenerator.json';
import type { JbqQuestionGeneratorSettings } from 'types/QuestionGeneratorSettings';
import { useEffect, useState } from "react";

interface Props {
    criteria: GeneralCriteria;
    setCriteria: (criteria: GeneralCriteria) => void;
}

export interface GeneralCriteria {
    title?: string;
    rounds: number;
    season: number;
    language: QuestionLanguage;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

export default function GeneralCriteriaSelector({
    criteria,
    setCriteria }: Props) {

    const [title, setTitle] = useState<string>(criteria.title || "");
    const [rounds, setRounds] = useState<number>(criteria.rounds);

    useEffect(() => {
        setTitle(criteria.title || "");
        setRounds(criteria.rounds);
    }, [criteria]);

    return (
        <>
            <div className="w-full">
                <label className="label">
                    <span className="label-text font-medium">Title</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="text"
                    name="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={() => setCriteria({ ...criteria, title: title.trim() })}
                    placeholder="Enter title for the set"
                    className="input input-bordered w-full"
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
                        onChange={e => setRounds(Number(e.target.value))}
                        onBlur={() => setCriteria({ ...criteria, rounds: rounds })}
                        placeholder="Enter number of rounds"
                        className="input input-bordered w-full"
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
                        onChange={e => setCriteria({ ...criteria, language: Number(e.target.value) as QuestionLanguage })}
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