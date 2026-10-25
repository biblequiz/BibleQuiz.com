import { AppReleasePlatform } from "utils/AppReleases";
import AppDownloadCard from "./AppDownloadCard";

interface Props {
    product: string;
}

export default async function AppDownloadCardDeck({ product }: Props) {

    const windowsCard = (<AppDownloadCard product={product} platform={AppReleasePlatform.Windows} />);
    const androidCard = (<AppDownloadCard product={product} platform={AppReleasePlatform.Android} />);
    const macOsCard = (<AppDownloadCard product={product} platform={AppReleasePlatform.MacOS} />);

    if (!windowsCard && !androidCard && !macOsCard) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-4">
            {windowsCard}
            {androidCard}
            {macOsCard}
        </div>);
}