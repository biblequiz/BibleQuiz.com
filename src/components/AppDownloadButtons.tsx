import { AppReleasePlatform, getAppReleaseManifest, type AppReleaseManifest } from "utils/AppReleases";
import FontAwesomeIcon from "./FontAwesomeIcon";

interface Props {
    product: string;
}

export default async function AppDownloadButtons({ product }: Props) {

    const manifest = await getAppReleaseManifest(product);
    if (!manifest) {
        throw new Error(`No release manifest found for product: ${product}`);
    }

    const getDownloadButton = (
        manifest: AppReleaseManifest,
        platform: AppReleasePlatform,
        style: string,
        isPrerelease: boolean) => {

        const downloadUrl = manifest.platforms[platform];
        if (!downloadUrl) {
            return null;
        }

        let icon = "faWindows";
        let text = "Windows";
        switch (platform) {
            case AppReleasePlatform.Windows:
                // Already set.
                break;
            case AppReleasePlatform.Android:
                icon = "faAndroid";
                text = "Android";
                break;
            case AppReleasePlatform.MacOS:
                icon = "faApple";
                text = "macOS";
                break;
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }

        return (
            <a
                key={`${product}_${platform}`}
                href={downloadUrl}
                rel="noopener noreferrer"
                className={`btn btn-${style}`}
                download
            >
                <FontAwesomeIcon icon={`fab ${icon}`} />
                {text}
                {isPrerelease && (<div className={`badge badge-soft badge-${style}`}>BETA RELEASE</div>)}
            </a>)
    };

    const hasPrerelease = manifest.prerelease && manifest.prerelease.version !== manifest.latest.version;

    return (
        <>
            <div className="mt-4 mb-0 text-sm">
                <b>Current Version:</b> {manifest.latest.version} <i>(Released on {new Date(manifest.latest.releaseDate).toLocaleDateString()})</i>
                {hasPrerelease && (
                    <>
                        <br />
                        <b>Beta Release Version:</b> {manifest.prerelease.version} <i>(Released on {new Date(manifest.prerelease.releaseDate).toLocaleDateString()})</i>
                    </>)}
            </div>
            <div className="mt-4 mb-0 flex flex-wrap gap-4">
                {getDownloadButton(manifest.latest, AppReleasePlatform.Windows, "primary", false)}
                {getDownloadButton(manifest.latest, AppReleasePlatform.Android, "success", false)}
                {getDownloadButton(manifest.latest, AppReleasePlatform.MacOS, "dark", false)}

                {hasPrerelease && (
                    <>
                        {getDownloadButton(manifest.prerelease, AppReleasePlatform.Windows, "primary", true)}
                        {getDownloadButton(manifest.prerelease, AppReleasePlatform.Android, "success", true)}
                        {getDownloadButton(manifest.prerelease, AppReleasePlatform.MacOS, "dark", true)}
                    </>)}

                <a
                    href={manifest.allReleasesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                >
                    <FontAwesomeIcon icon="fab faGithub" />
                    All Releases
                </a>
            </div>
        </>);
    /*
    <LinkButton href="https://github.com/biblequiz/Releases.CoachApp/releases/latest/download/com.biblequiz.coachapp.windows.msixbundle">
        <FontAwesomeIcon icon="fab faWindows" /> Windows
    </LinkButton>
    <a class:list={['sl-link-button not-content', variant, className]} {...attrs}>
    {icon && iconPlacement === 'start' && <Icon name={icon} size="1.5rem" />}
    <slot />
    {icon && iconPlacement === 'end' && <Icon name={icon} size="1.5rem" />}
</a>

    <LinkButton href="https://github.com/biblequiz/Releases.EZScore/releases/latest/download/com.biblequiz.ezscore.windows.msixbundle">
        <FontAwesomeIcon icon="fab faWindows" /> Windows
    </LinkButton>
    <LinkButton href="https://github.com/biblequiz/Releases.EZScore/releases/latest/download/com.biblequiz.ezscore.android.apk">
        <FontAwesomeIcon icon="fab faAndroid" /> Android
    </LinkButton>
    <LinkButton href="https://github.com/biblequiz/Releases.EZScore/releases" variant="secondary">
        <FontAwesomeIcon icon="fab faGithub" /> All Releases
    </LinkButton>
    <LinkButton href="https://github.com/biblequiz/Releases.CoachApp/releases" variant="secondary">
        <FontAwesomeIcon icon="fab faGithub" /> All Releases
    </LinkButton>*/
}