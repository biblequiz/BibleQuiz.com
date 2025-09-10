import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportFilterState, sharedEventScoringReportState, type SharedEventScoringReportFilterState, type SharedEventScoringReportState } from 'utils/SharedState';
import type { TeamAndQuizzerFavorites } from "types/TeamAndQuizzerFavorites";

interface Props {
    id: string;
    type: "team" | "quizzer";
    buttonSize?: string;
}

export default function ToggleTeamOrQuizzerFavoriteButton({ id, type, buttonSize }: Props) {

    const reportState: SharedEventScoringReportState = useStore(sharedEventScoringReportState as any);
    const eventFilters: SharedEventScoringReportFilterState = useStore(sharedEventScoringReportFilterState as any);
    if (!reportState) {
        return null;
    }

    const favorites: TeamAndQuizzerFavorites = reportState.favorites;

    // Capture the id set for the type.
    let favoriteIdSet: Set<string>;
    let objectText: string;
    switch (type) {
        case "team":
            favoriteIdSet = favorites.teamIds;
            objectText = "Team";
            break;

        case "quizzer":
            favoriteIdSet = favorites.quizzerIds;
            objectText = "Quizzer";
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
            className={`btn ${isCurrentFavorite ? "btn-accent" : "btn-outline"} cursor-pointer hide-on-print pt-0 pb-0 btn-${buttonSize ?? "xs"} text-nowrap`}
            onClick={handleFavoritesButtonClick}
        >
            <FontAwesomeIcon icon={isCurrentFavorite ? "fas faStar" : "far faStar"} />
            {isCurrentFavorite ? "Unfollow" : "Follow"} {objectText}
        </button>);
}