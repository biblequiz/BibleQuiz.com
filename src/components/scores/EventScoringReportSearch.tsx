import type React from "react";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, sharedEventScoringReportFilterState } from "@utils/SharedState";
import type { SharedEventScoringReportFilterState, SharedEventScoringReportState, EventScoringReportSearchIndexItem } from "@utils/SharedState";

import FontAwesomeIcon from "../FontAwesomeIcon";
import type { FuseResult } from "fuse.js";
import type { ScoringReportMeet, ScoringReportQuizzer, ScoringReportTeam } from "@types/EventScoringReport";
import type { TeamAndQuizzerFavorites } from "../../types/TeamAndQuizzerFavorites";

interface Props {
    parentTabId: string;
}

export default function EventScoringReportSearch({ parentTabId }: Props) {

    const reportState: SharedEventScoringReportState = useStore(sharedEventScoringReportState as any);
    const eventFilters: SharedEventScoringReportFilterState = useStore(sharedEventScoringReportFilterState as any);

    // If there is no report, it is still loading.
    if (!reportState) {
        return null;
    }

    const favorites: TeamAndQuizzerFavorites = reportState.favorites;

    const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const searchText = e.target.value ?? null;

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
            favoritesVersion: favorites.version,
        });
    };

    const clearSearchText = (e: React.MouseEvent<HTMLButtonElement>) => {
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

    return (
        <>
            <div>
                <label className="input w-full mt-0 mb-4">
                    <FontAwesomeIcon icon="fas faSearch" classNames={["h-[1em]", "opacity-50"]} />
                    <input
                        type="text"
                        className="grow"
                        placeholder="Quizzer or Team Name/Church"
                        value={eventFilters?.searchText ?? ""}
                        onChange={handleSearchTextChange} />
                    <button className="btn btn-ghost btn-xs" onClick={clearSearchText}>
                        <FontAwesomeIcon icon="fas faCircleXmark" />
                    </button>
                </label>
            </div>
            {showResults && (
                <div>
                    {(eventFilters?.teamResults?.length ?? 0) > 0 && (
                        <div>
                            <p className="text-lg"><b>Teams</b></p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                                {eventFilters.teamResults.map((result: FuseResult<EventScoringReportSearchIndexItem<ScoringReportTeam>>) => {

                                    const indexItem = result.item;
                                    const team: ScoringReportTeam = indexItem.item;
                                    const key: string = `search_team_${team.Id}`;

                                    const isFavorite: boolean = favorites.teamIds.has(team.Id);
                                    const updateFavorites = isFavorite
                                        ? (f: TeamAndQuizzerFavorites) => f.teamIds.delete(team.Id)
                                        : (f: TeamAndQuizzerFavorites) => f.teamIds.add(team.Id);

                                    return (
                                        <div className="cardbg-base-100 card-sm shadow-sm" key={key}>
                                            <div className="card-body">
                                                <h2 className="card-title">{team.Name}</h2>
                                                <p className="mt-0 font-normal italic">
                                                    {team.ChurchName}
                                                </p>
                                                <div className="card-actions grid grid-cols-1 gap-2">
                                                    <button
                                                        className="btn btn-warning mt-0"
                                                        onClick={e => handleFavoritesButtonClick(updateFavorites)}>
                                                        <FontAwesomeIcon icon={isFavorite ? "fas faStar" : "far faStar"} />
                                                        {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                                    </button>
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

                                    const indexItem = result.item;
                                    const quizzer: ScoringReportQuizzer = indexItem.item;
                                    const key: string = `search_quizzer_${quizzer.Id}`;

                                    const isFavorite: boolean = favorites.quizzerIds.has(quizzer.Id);
                                    const updateFavorites = isFavorite
                                        ? (f: TeamAndQuizzerFavorites) => f.quizzerIds.delete(quizzer.Id)
                                        : (f: TeamAndQuizzerFavorites) => f.quizzerIds.add(quizzer.Id);

                                    return (
                                        <div className="cardbg-base-100 card-sm shadow-sm" key={key}>
                                            <div className="card-body">
                                                <h2 className="card-title">{quizzer.Name}</h2>
                                                <p className="mt-0 font-normal italic">
                                                    {quizzer.TeamName}<br />
                                                    <span className="font-normal italic">{quizzer.ChurchName}</span>
                                                </p>
                                                <div className="card-actions grid grid-cols-1 gap-2">
                                                    <button
                                                        className="btn btn-warning mt-0"
                                                        onClick={e => handleFavoritesButtonClick(updateFavorites)}>
                                                        <FontAwesomeIcon icon={isFavorite ? "fas faStar" : "far faStar"} />
                                                        {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                                                    </button>
                                                    {indexItem.meets.map((meet: ScoringReportMeet) => (
                                                        <button
                                                            className="btn btn-primary mt-0"
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
                </div >)
            }
        </>);
};
