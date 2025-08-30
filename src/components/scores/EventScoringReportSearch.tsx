import type React from "react";
import { useStore } from "@nanostores/react";

import FontAwesomeIcon from "../FontAwesomeIcon";
import type { FuseResult } from "fuse.js";
import ToggleTeamOrQuizzerFavoriteButton from "./ToggleTeamOrQuizzerFavoriteButton";
import type { ScoringReportTeam, ScoringReportQuizzer, ScoringReportMeet } from "../../types/EventScoringReport";
import type { TeamAndQuizzerFavorites } from "../../types/TeamAndQuizzerFavorites";
import { type SharedEventScoringReportState, sharedEventScoringReportState, type SharedEventScoringReportFilterState, sharedEventScoringReportFilterState, showFavoritesOnlyToggle, EventScoringReportSearchIndexItem } from "../../utils/SharedState";

interface Props {
    parentTabId: string;
}

export default function EventScoringReportSearch({ parentTabId }: Props) {

    const reportState: SharedEventScoringReportState = useStore(sharedEventScoringReportState as any);
    const eventFilters: SharedEventScoringReportFilterState = useStore(sharedEventScoringReportFilterState as any);
    const showOnlyFavorites: boolean = useStore(showFavoritesOnlyToggle);

    // If there is no report, it is still loading.
    if (!reportState || !reportState.report) {
        return null;
    }

    const favorites: TeamAndQuizzerFavorites = reportState.favorites;

    const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearchClick(e as any);
        }
    };

    const inputTextBoxId = "event-search";
    const handleSearchClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        e.preventDefault();

        const searchText: string | null = (document.getElementById(inputTextBoxId) as HTMLInputElement)?.value ?? null;
        if (!searchText || searchText.length === 0) {
            return;
        }

        const teamResults: FuseResult<ScoringReportTeam>[] | null = reportState?.teamIndex?.search(searchText) ?? null;
        const quizzerResults: FuseResult<ScoringReportQuizzer>[] | null = reportState?.quizzerIndex?.search(searchText) ?? null;

        function sortSearchResults(a: any, b: any) {
            if (a.score < b.score) {
                return -1;
            }
            else if (a.score > b.score) {
                return 1;
            }
            else {
                return 0;
            }
        }

        if (teamResults) {
            (teamResults as any).sort(sortSearchResults);
        }

        if (quizzerResults) {
            (quizzerResults as any).sort(sortSearchResults);
        }

        sharedEventScoringReportFilterState.set({
            searchText: searchText,
            teamResults: teamResults,
            quizzerResults: quizzerResults,
            openMeetDatabaseId: null,
            openMeetMeetId: null,
            highlightTeamId: null,
            highlightQuizzerId: null,
            favoritesVersion: eventFilters?.favoritesVersion ?? favorites.version,
        });
    };

    const clearSearchText = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        const searchBox = document.getElementById(inputTextBoxId) as HTMLInputElement;
        if (searchBox) {
            searchBox.value = "";
        }

        sharedEventScoringReportFilterState.set(null);
    };

    const handleFavoritesButtonClick = (updateFavorites: (f: TeamAndQuizzerFavorites) => void) => {

        // Update the favorites object.
        updateFavorites(favorites);
        favorites.save();

        // Update the state.
        sharedEventScoringReportFilterState.set({
            searchText: eventFilters?.searchText ?? null,
            teamResults: eventFilters?.teamResults ?? null,
            quizzerResults: eventFilters?.quizzerResults ?? null,
            openMeetDatabaseId: null,
            openMeetMeetId: null,
            highlightTeamId: null,
            highlightQuizzerId: null,
            favoritesVersion: favorites.version,
        });
    };

    const handleHighlightButtonClick = (meet: ScoringReportMeet, highlightTeamId: string | null, highlightQuizzerId: string | null) => {
        sharedEventScoringReportFilterState.set({
            searchText: null,
            teamResults: null,
            quizzerResults: null,
            openMeetDatabaseId: meet.DatabaseId,
            openMeetMeetId: meet.MeetId,
            highlightTeamId: highlightTeamId,
            highlightQuizzerId: highlightQuizzerId,
            favoritesVersion: favorites.version,
        });
    };

    // Hide the parent tab if there the search results.
    const showResults = eventFilters?.searchText && eventFilters.searchText.length > 0;
    (document.getElementById(parentTabId) as HTMLDivElement).style.display = showResults ? "none" : "";
    let hasAnyResults = false;

    return (
        <>
            <div className="flex w-full">
                <label className="input w-full mt-0 mb-4">
                    <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
                    <input
                        id={inputTextBoxId}
                        type="text"
                        className="grow"
                        placeholder="Quizzer or Team Name/Church"
                        onKeyDown={handleEnterPress} />
                    <button className="btn btn-ghost btn-xs" onClick={clearSearchText}>
                        <FontAwesomeIcon icon="fas faCircleXmark" />
                    </button>
                </label>
                <button className="btn btn-info ml-4 mt-0" onClick={handleSearchClick}>
                    <FontAwesomeIcon icon="fas faSearch" />
                    Search
                </button>
            </div>
            {showResults && (
                <div>
                    {(eventFilters?.teamResults?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-lg"><b>Teams</b></p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                {eventFilters.teamResults.map((result: FuseResult<EventScoringReportSearchIndexItem<ScoringReportTeam>>) => {
                                    hasAnyResults = true;

                                    const indexItem = result.item;
                                    const team: ScoringReportTeam = indexItem.item;
                                    const key: string = `search_team_${team.Id}`;

                                    const isFavorite: boolean = favorites.teamIds.has(team.Id);
                                    const updateFavorites = isFavorite
                                        ? (f: TeamAndQuizzerFavorites) => f.teamIds.delete(team.Id)
                                        : (f: TeamAndQuizzerFavorites) => f.teamIds.add(team.Id);

                                    return (
                                        <div className="cardbg-base-100 card-sm shadow-sm mt-4" key={key}>
                                            <div className="card-body">
                                                <h2 className="card-title">{team.Name}</h2>
                                                <p className="mt-0 font-normal italic">
                                                    {team.ChurchName}
                                                </p>
                                                <div className="card-actions grid grid-cols-1 gap-2">
                                                    <ToggleTeamOrQuizzerFavoriteButton type="team" id={team.Id} showText={true} buttonSize="md" />
                                                    {indexItem.meets.map((meet: ScoringReportMeet) => (
                                                        <button
                                                            className="btn btn-primary mt-0"
                                                            onClick={e => handleHighlightButtonClick(meet, team.Id, null)}
                                                            key={`${key}_meet_${meet.DatabaseId}_${meet.MeetId}`}>
                                                            {meet.IsCombinedReport && <FontAwesomeIcon icon="fas faBook" classNames={["mr-1"]} />}
                                                            {meet.Name}
                                                        </button>))}
                                                </div>
                                            </div>
                                        </div>);
                                })}
                            </div>
                        </div>)}
                    {(eventFilters?.quizzerResults?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-lg"><b>Quizzers</b></p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                {eventFilters.quizzerResults.map((result: FuseResult<EventScoringReportSearchIndexItem<ScoringReportQuizzer>>) => {

                                    hasAnyResults = true;

                                    const indexItem = result.item;
                                    const quizzer: ScoringReportQuizzer = indexItem.item;
                                    const key: string = `search_quizzer_${quizzer.Id}`;

                                    const isFavorite: boolean = favorites.quizzerIds.has(quizzer.Id);
                                    const updateFavorites = isFavorite
                                        ? (f: TeamAndQuizzerFavorites) => f.quizzerIds.delete(quizzer.Id)
                                        : (f: TeamAndQuizzerFavorites) => f.quizzerIds.add(quizzer.Id);

                                    return (
                                        <div className="cardbg-base-100 card-sm shadow-sm mt-4" key={key}>
                                            <div className="card-body">
                                                <h2 className="card-title">{quizzer.Name}</h2>
                                                <p className="mt-0 font-normal italic">
                                                    {quizzer.TeamName}<br />
                                                    <span className="font-normal italic">{quizzer.ChurchName}</span>
                                                </p>
                                                <div className="card-actions grid grid-cols-1 gap-2">
                                                    <ToggleTeamOrQuizzerFavoriteButton type="quizzer" id={quizzer.Id} showText={true} buttonSize="md" />
                                                    {indexItem.meets.map((meet: ScoringReportMeet) => (
                                                        <button
                                                            className="btn btn-primary mt-0 btn-md"
                                                            onClick={e => handleHighlightButtonClick(meet, null, quizzer.Id)}
                                                            key={`${key}_meet_${meet.DatabaseId}_${meet.MeetId}`}>
                                                            {meet.IsCombinedReport && <FontAwesomeIcon icon="fas faBook" classNames={["mr-1"]} />}
                                                            {meet.Name}
                                                        </button>))}
                                                </div>
                                            </div>
                                        </div>);
                                })}
                            </div>
                        </div>)}
                    {!hasAnyResults && (
                        <div className="text-center text-gray-500 italic">
                            <p>No results found for "{eventFilters?.searchText}".</p>
                        </div>
                    )}
                </div>)
            }
            {showOnlyFavorites && (
                <div
                    role="alert"
                    className="alert alert-warning"
                >
                    <span>
                        Only favorites are being displayed. If you want to remove this, click
                        the&nbsp;<FontAwesomeIcon icon="fas faStar" />&nbsp;button in the top-right.
                    </span>
                </div>)}
        </>);
};
