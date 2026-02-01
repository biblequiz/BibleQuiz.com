import { AppReleasePlatform, getAppReleaseManifest, type AppReleaseManifest } from "utils/AppReleases";
import FontAwesomeIcon from "./FontAwesomeIcon";

interface Props {
    product: string;
    platform: AppReleasePlatform;
}

export default async function AppDownloadCard({ product, platform }: Props) {

    const manifest = await getAppReleaseManifest(product, platform);
    if (!manifest) {
        return null;
    }

    const dialogId = `app-dialog-${product}-${platform}`;

    const getDownloadButton = (
        manifest: AppReleaseManifest,
        style: string,
        isPrerelease: boolean) => {

        return (
            <a
                href={manifest.downloadUrl}
                rel="noopener noreferrer"
                className={`btn btn-${style} w-full`}
                download
            >
                <span className="font-bold">v{manifest.version}</span>
                {isPrerelease && (<div className={`badge badge-soft badge-${style}`}>BETA</div>)}
                {!isPrerelease && (<div className={`badge badge-soft badge-${style}`}>STABLE</div>)}
            </a>);
    };

    let icon = "faWindows";
    let text = "Windows";
    let style = "primary";
    switch (platform) {
        case AppReleasePlatform.Windows:
            // Already set.
            break;
        case AppReleasePlatform.WindowsUno:
            text = "Windows (Experimental)";
            break;
        case AppReleasePlatform.Android:
            icon = "faAndroid";
            text = "Android";
            style = "success";
            break;
        case AppReleasePlatform.MacOS:
            icon = "faApple";
            text = "macOS";
            style = "dark";
            break;
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }

    const hasPrerelease = manifest.beta &&
        manifest.beta.version !== manifest.stable?.version;

    return (
        <div
            className={`card w-full md:w-80 card-sm shadow-sm border-1 border-solid mt-0`}
        >
            <div className="card-body items-center">
                <h2 className="card-title mb-0 mt-0">
                    <FontAwesomeIcon icon={`fab ${icon}`} />
                    {text}
                </h2>
                {hasPrerelease && getDownloadButton(manifest.beta!, style, true)}
                {manifest.stable && getDownloadButton(manifest.stable, style, false)}
            </div>
            <dialog id={dialogId} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Hello!</h3>
                    <p className="py-4">Press ESC key or click outside to close</p>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </div>);
}