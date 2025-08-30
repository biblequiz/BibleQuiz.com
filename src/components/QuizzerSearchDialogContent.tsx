import { useStore } from "@nanostores/react";
import FontAwesomeIcon from './FontAwesomeIcon.tsx';
import { sharedQuizzerSearchState } from "utils/SharedState";
import type { QuizzerIndex } from 'types/QuizzerSearch';

export const QuizzerSearchDialogId = "quizzer-search-dialog";

export default function QuizzerSearchDialogContent() {

    const searchState = useStore(sharedQuizzerSearchState);
    if (!searchState || searchState.quizzerIndex == null) {
        return (
            <div className="text-center">
                <span className="loading loading-dots loading-xl"></span>
                &nbsp;
                <span className="text-lg">
                    <i>Loading Quizzer History ...</i>
                </span>
            </div>);
    }

    const { index, quizzerIndex } = searchState;
    const quizzer = (index as QuizzerIndex).quizzers[quizzerIndex];

    let name = quizzer.n;
    if (quizzer.on) {
        name += ` (${quizzer.on.join(', ')})`;
    }

    const allPages: { season: string | null, type: string, page: number }[] = [];
    let pageCount: number = 0;

    const addPageGroup = (season: string | null, type: string, pages: number[]) => {
        for (const page of pages) {
            allPages.push({ season: season, type: type, page });
        }

        pageCount += pages.length;
    };

    if (quizzer.t) {
        if (quizzer.t.s) {
            for (const season in quizzer.t.s) {
                addPageGroup(season, "TBQ", quizzer.t.s[season]);
            }
        }

        if (quizzer.t.n) {
            addPageGroup(null, "TBQ", quizzer.t.n);
        }
    }

    if (quizzer.j) {
        if (quizzer.j.s) {
            for (const season in quizzer.j.s) {
                addPageGroup(season, "JBQ", quizzer.j.s[season]);
            }
        }

        if (quizzer.j.n) {
            addPageGroup(null, "JBQ", quizzer.j.n);
        }
    }

    return (
        <>
            <p className="text-xl font-bold">
                {name} - {pageCount} Page(s)
            </p>
            <table className="table table-s table-nowrap">
                <thead>
                    <tr>
                        <th>Page</th>
                        <th>Type</th>
                        <th className="text-right">Season</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: allPages.length }, (_, p) => {

                        const pageInfo = allPages[p];
                        const page = (index as QuizzerIndex).pages[pageInfo.page];

                        return (
                            <tr key={`page_${p}`}>
                                <td>
                                    <a href={page.u} target="_blank">{page.t}</a>&nbsp;<FontAwesomeIcon icon="fas faExternalLinkAlt" />
                                </td>
                                <td>{pageInfo.type}</td>
                                <td className="text-right">{pageInfo.season}{!pageInfo.season && (<>&nbsp;</>)}</td>
                            </tr>);
                    })}
                </tbody>
            </table >
        </>);
}