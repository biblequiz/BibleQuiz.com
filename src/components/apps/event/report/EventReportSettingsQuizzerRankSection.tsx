import React, { useState } from "react";
import type { EventReportQuizzerRankInfo } from "./EventReportSettingsSection";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { MeetRankingSortType } from "types/Meets";

interface Props {
    info: EventReportQuizzerRankInfo;
    setInfo: (info: EventReportQuizzerRankInfo) => void;
    isDisabled: boolean;
}

const YEARS_IN_QUIZ_PREFIX = "years_";

export default function EventReportSettingsQuizzerRankSection({
    info,
    setInfo,
    isDisabled }: Props) {

    const [rankByAverageCorrectPoint, setRankByAverageCorrectPoint] = useState<number | null>(info.rankByAverageCorrectPointValue);
    const [isMatchOverridesChecked, setMatchesOverridesChecked] = useState(info.matchesOverride !== null);
    const [matchesOverride, setMatchesOverride] = useState<number | null>(info.matchesOverride);
    const [yearsInQuiz, setYearsInQuiz] = useState<MeetRankingSortType | null>(info.yearsInQuiz);

    const handleAveragePointValueChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const rawValue = e.target.value;
            const newYearsInQuizValue = rawValue.startsWith(YEARS_IN_QUIZ_PREFIX)
                ? parseInt(rawValue.substring(YEARS_IN_QUIZ_PREFIX.length)) as MeetRankingSortType
                : null;
            const parsedValue = newYearsInQuizValue === null ? parseInt(rawValue) : null;
            const newValue = newYearsInQuizValue === null ? (parsedValue ? parsedValue : null) : null;

            setRankByAverageCorrectPoint(newValue);
            setYearsInQuiz(newYearsInQuizValue);

            setInfo({
                ...info,
                rankByAverageCorrectPointValue: newValue,
                yearsInQuiz: newYearsInQuizValue
            })
        }
    }

    const getAveragePointRadio = (
        value: number | null,
        label: string,
        yearsInQuizValue: MeetRankingSortType | null = null) => (
        <div className="w-full mb-0 mt-0">
            <label className="label text-wrap">
                <input
                    type="radio"
                    name="averagePointValue"
                    className="radio radio-sm radio-info"
                    checked={(yearsInQuiz !== null && yearsInQuizValue === yearsInQuiz) || (yearsInQuiz === null && yearsInQuizValue === null && rankByAverageCorrectPoint === value)}
                    value={yearsInQuizValue === null ? (value ?? 0) : YEARS_IN_QUIZ_PREFIX + yearsInQuizValue}
                    onChange={handleAveragePointValueChanged}
                />
                <span className="text-sm">
                    {label}
                </span>
            </label>
        </div>);

    return (
        <div className="mt-0 ml-2">

            <div className="divider mt-0 mb-0" />

            <h5 className="mt-2 mb-4">
                <FontAwesomeIcon icon="fas faRandom" />&nbsp;Quizzer Ranking
            </h5>

            {getAveragePointRadio(null, "Rank by average points, then by total quiz outs.")}
            {getAveragePointRadio(10, "Rank by 10-point questions answered correctly, then by average points, then by total quiz outs.")}
            {getAveragePointRadio(20, "Rank by 20-point questions answered correctly, then by average points, then by total quiz outs.")}
            {getAveragePointRadio(30, "Rank by 30-point questions answered correctly, then by average points, then by total quiz outs.")}
            {getAveragePointRadio(
                null,
                "Group by years in quiz (descending), then rank by average points, then by total quiz outs.",
                MeetRankingSortType.Descending)}
            {getAveragePointRadio(
                null,
                "Group by years in quiz (ascending), then rank by average points, then by total quiz outs.",
                MeetRankingSortType.Ascending)}

            <div className="mt-2 p-3 border border-base-500 bg-base-300 rounded-lg">
                <div className="w-full mt-0">
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={isMatchOverridesChecked}
                            onChange={e => {
                                const newChecked = e.target.checked;
                                setMatchesOverridesChecked(newChecked);
                                setInfo({
                                    ...info,
                                    matchesOverride: newChecked ? matchesOverride : null
                                });
                            }}
                            disabled={isDisabled}
                        />
                        <span className="text-sm font-bold">
                            Override Number of Matches?
                        </span>
                    </label>
                    <p className="mt-0 mb-2 text-sm">
                        By default, the average is calculated based on the number of matches each team or quizzer competed in. In certain unusual circumstances, you may want to use a set number of matches
                        instead to adjust for teams or quizzers with a high average who only competed at a single competition, which may force them higher in the averages.
                    </p>
                </div>
                <div className="w-full mt-0">
                    <label className="label mr-2">
                        <span className="label-text font-medium text-sm">Number of Matches</span>
                        {isMatchOverridesChecked && <span className="label-text-alt text-error">*</span>}
                    </label>
                    <input
                        type="number"
                        className="input input-info w-auto mt-0"
                        value={matchesOverride ?? undefined}
                        onChange={e => setMatchesOverride(parseInt(e.target.value))}
                        onBlur={e => {
                            e.preventDefault();
                            setInfo({
                                ...info,
                                matchesOverride: matchesOverride
                            });
                        }}
                        min={1}
                        max={99}
                        maxLength={2}
                        disabled={isDisabled || !isMatchOverridesChecked}
                        step={1}
                        required={isMatchOverridesChecked}
                    />
                </div>
            </div>
        </div>);
}