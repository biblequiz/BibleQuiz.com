import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportFilterState, sharedEventScoringReportState, type SharedEventScoringReportFilterState, type SharedEventScoringReportState } from 'utils/SharedState';
import type { TeamAndQuizzerFavorites } from "types/TeamAndQuizzerFavorites";

interface Props {
    id: string;
    type: "team" | "quizzer";
    showText: boolean;
    buttonSize?: string;
}

export default function ToggleTeamOrQuizzerFavoriteButton({ id, type, showText, buttonSize }: Props) {

    const reportState: SharedEventScoringReportState = useStore(sharedEventScoringReportState as any);
    const eventFilters: SharedEventScoringReportFilterState = useStore(sharedEventScoringReportFilterState as any);
    if (!reportState) {
        return null;
    }

    const favorites: TeamAndQuizzerFavorites = reportState.favorites;

    // Capture the id set for the type.
    let favoriteIdSet: Set<string>;
    switch (type) {
        case "team":
            favoriteIdSet = favorites.teamIds;
            break;

        case "quizzer":
            favoriteIdSet = favorites.quizzerIds;
            break;

        default:
            throw new Error(`Unknown type: ${type}`);
    }

    const isCurrentFavorite: boolean = favoriteIdSet.has(id);

    const handleFavoritesButtonClick = () => {

        // Update the favorites object.
        if (isCurrentFavorite) {
            favoriteIdSet.delete(id);
        } else {
            favoriteIdSet.add(id);
        }

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

    return (
        <button
            className={`btn ${isCurrentFavorite ? "btn-accent" : "btn-warning"} cursor-pointer hide-on-print pt-0 pb-0 btn-${buttonSize ?? "xs"}`}
            onClick={handleFavoritesButtonClick}
        >
            <FontAwesomeIcon icon={isCurrentFavorite ? "fas faStar" : "far faStar"} />
            {showText && (isCurrentFavorite ? "Remove from Favorites" : "Add to Favorites")}
        </button>);
}