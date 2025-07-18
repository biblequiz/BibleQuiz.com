import { useStore } from "@nanostores/react";
import { sharedQuizzerSearchState } from "@utils/SharedState";

import Fuse from 'fuse.js';

import type { QuizzerIndex, QuizzerIndexEntry } from "../types/QuizzerSearch";

interface Props {
    id: string;
    quizzers?: { entry: QuizzerIndexEntry, index: number }[] | null;
}

function getSeasonInfo(urls: Record<number, number[]>) {
    const seasons = Object.keys(urls);

    let text = "";
    let initialSeason = -1;
    let lastSeason = -1;
    let pageCount = 0;
    for (let i = 0; i < seasons.length; i++) {
        const season = Number.parseInt(seasons[i]);
        pageCount += urls[season].length;

        if (-1 == initialSeason) {
            initialSeason = season;
            lastSeason = season;
        }
        else if (season == lastSeason + 1) {
            lastSeason++;
        }
        else {
            let rangeText = initialSeason == lastSeason
                ? initialSeason.toString()
                : `${initialSeason} - ${lastSeason}`;

            if (text.length > 0) {
                text += ", ";
            }

            text += rangeText;

            initialSeason = season;
            lastSeason = season;
        }
    }

    let remainingRangeText = initialSeason == lastSeason
        ? initialSeason.toString()
        : `${initialSeason} - ${lastSeason}`;

    if (text.length > 0) {
        text += ", ";
    }

    text += remainingRangeText;

    return { pages: pageCount, text: text };
}

declare global {
    interface Window {
        quizzerIndex: QuizzerIndex;
        quizzerSearchFuseIndex: Fuse<QuizzerIndexEntry>;
        openQuizzerDialog: (event: any) => void;
    }
}

export default function QuizzerSearchTabContent({ id, quizzers }: Props) {

    const searchState = useStore(sharedQuizzerSearchState);
    let resolvedQuizzers = quizzers;
    let onClickHandler: ((event: any) => void) | null = null;
    if (!resolvedQuizzers) {
            resolvedQuizzers = [];

        if (searchState?.searchText) {
            const searchResults = window.quizzerSearchFuseIndex.search(searchState.searchText);
            if (searchResults.length > 0) {

                searchResults.sort((a: any, b: any) => {
                    if (a.score < b.score) {
                        return -1;
                    }
                    else if (a.score > b.score) {
                        return 1;
                    }
                    else {
                        return 0;
                    }
                });
            }

            for (const item of searchResults) {
                resolvedQuizzers.push({ entry: item.item, index: item.refIndex });
            }

            onClickHandler = window.openQuizzerDialog;
        }
    }

    return (
        <table id={id} className="table table-s table-nowrap">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Seasons</th>
                    <th className="text-right">Pages</th>
                </tr>
            </thead>
            <tbody>
                {resolvedQuizzers && resolvedQuizzers.map((item: { entry: QuizzerIndexEntry, index: number }) => {
                    const quizzer = item.entry;
                    const key = `quizzer_${item.index}`;

                    let pageCount = 0;

                    let jbqSeasonText: string | null = null;
                    if (quizzer.j) {
                        if (quizzer.j.s) {
                            const seasonInfo = getSeasonInfo(quizzer.j.s);
                            jbqSeasonText = seasonInfo.text;
                            pageCount += seasonInfo.pages;
                        }

                        if (quizzer.j.n) {
                            pageCount += quizzer.j.n.length;
                        }
                    }

                    let tbqSeasonText: string | null = null;
                    if (quizzer.t) {
                        if (quizzer.t.s) {
                            const seasonInfo = getSeasonInfo(quizzer.t.s);
                            tbqSeasonText = seasonInfo.text;
                            pageCount += seasonInfo.pages;
                        }

                        if (quizzer.t.n) {
                            pageCount += quizzer.t.n.length;
                        }
                    }

                    return (
                        <tr className="hover:bg-base-300 cursor-pointer" key={key} data-index={item.index} onClick={onClickHandler}>
                            <td>
                                <span>{quizzer.n}</span>
                                {quizzer.on && quizzer.on.length > 0 && quizzer.on.map((name, nameIndex) => (
                                    <span key={`${key}_${nameIndex}`} className="italic">
                                        <br />
                                        {name}
                                    </span>
                                ))}
                            </td>
                            <td>
                                {jbqSeasonText && (
                                    <div className="mt-0">
                                        <span className="italic">JBQ:</span> {jbqSeasonText}
                                    </div>)}
                                {tbqSeasonText && (
                                    <div className="mt-0">
                                        <span className="italic">TBQ:</span> {tbqSeasonText}
                                    </div>)}
                            </td>
                            <td className="text-right">{pageCount}</td>
                        </tr>);
                })}
                {(!resolvedQuizzers || resolvedQuizzers.length == 0) && (
                    <tr>
                        <td colSpan={3} className="italic text-center">No quizzers match the specified name.</td>
                    </tr>)}
            </tbody>
        </table >);
};
