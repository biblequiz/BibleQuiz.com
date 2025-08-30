import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useStore } from "@nanostores/react";
import { showFavoritesOnlyToggle } from 'utils/SharedState';

interface Props {
    isLoaded: boolean;
}

export default function ToggleFavoritesOnlyButton({ isLoaded }: Props) {

    const showOnlyFavorites: boolean = useStore(showFavoritesOnlyToggle);

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
            className="btn btn-accent cursor-pointer hide-on-print"
            onClick={handleSearchClick}
            disabled={!isLoaded}
        >
            <FontAwesomeIcon icon={showOnlyFavorites ? "fas faStar" : "far faStar"} />
        </button>);
}