import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useStore } from "@nanostores/react";
import { sharedEventScoringReportState, showFavoritesOnlyToggle } from 'utils/SharedState';
import { useEffect, useState } from "react";

interface Props {
    isLoaded: boolean;
}

export default function ToggleFavoritesOnlyButton({ isLoaded }: Props) {

    const showOnlyFavorites: boolean = useStore(showFavoritesOnlyToggle);

    const [isDisabled, setIsDisabled] = useState(!isLoaded);
    const reportState = useStore(sharedEventScoringReportState);

    useEffect(() => {
        if (!isLoaded && reportState?.report) {
            setIsDisabled(false);
        }
    }, [isLoaded, reportState]);

    const handleSearchClick = (e: React.MouseEvent<HTMLButtonElement>) => {

        e.preventDefault();

        if (showOnlyFavorites) {
            showFavoritesOnlyToggle.set(false);
        }
        else {
            showFavoritesOnlyToggle.set(true);
        }
    };

    return (
        <button
            className={`btn ${showOnlyFavorites ? "btn-accent" : "btn-outline"} cursor-pointer hide-on-print break-words`}
            onClick={handleSearchClick}
            disabled={isDisabled}
        >
            <FontAwesomeIcon icon={showOnlyFavorites ? "fas faStar" : "far faStar"} />
            <span>Show {showOnlyFavorites ? "All" : "Followed"}</span>
        </button>);
}