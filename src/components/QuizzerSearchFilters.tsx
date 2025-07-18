import { useStore } from "@nanostores/react";
import { sharedQuizzerSearchState } from "@utils/SharedState";

import quizzerIndexJson from "../data/generated/quizzerIndex.json";
import type { QuizzerIndex } from "../types/QuizzerSearch";

import FontAwesomeIcon from "./FontAwesomeIcon";
import type React from "react";

export const DefaultTabsContainerId = "quizzer-search-default-tabs";
export const FilteredContainerId = "quizzer-search-filtered-tabs";

export default function QuizzerSearchFilters() {

    useStore(sharedQuizzerSearchState);

    const inputId = "search-input";

    const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearchClick();
        }
    };

    const handleSearchClick = () => {

        const defaultTabsContainer = document.getElementById(DefaultTabsContainerId) as HTMLDivElement;
        const filteredResultsContainer = document.getElementById(FilteredContainerId) as HTMLDivElement;

        const text = (document.getElementById(inputId) as HTMLInputElement).value;
        defaultTabsContainer.style.display = text ? "none" : "";
        filteredResultsContainer.style.display = text ? "" : "none";

        sharedQuizzerSearchState.set({
            searchText: text,
            index: (quizzerIndexJson as any) as QuizzerIndex,
            quizzerIndex: null
        });

        return false;
    };

    return (
        <fieldset className="fieldset bg-base-100 border-base-300 rounded-box border p-4 pt-0">
            <legend className="fieldset-legend">Search by Name</legend>
            <div className="flex justify-left">
                <input
                    id={inputId}
                    className="input"
                    type="text"
                    placeholder="Search All Quizzers ..."
                    onKeyDown={handleEnterPress}
                />
                <a id="search-button" className="btn btn-info ml-4" onClick={handleSearchClick}>
                    <FontAwesomeIcon icon="fas faSearch" />
                    Search
                </a>
            </div>
        </fieldset>);
};
