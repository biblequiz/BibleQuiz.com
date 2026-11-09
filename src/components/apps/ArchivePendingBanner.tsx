import FontAwesomeIcon from "components/FontAwesomeIcon";
import { createContext, useContext } from "react";

/**
 * Archive versions published with the site (id => version when the site was generated). Pages embed this
 * at build time because it only changes when the archive job commits to the repo.
 */
export type ArchiveVersionManifest = { [id: string]: string | null };

export const ArchiveVersionsContext = createContext<ArchiveVersionManifest | null>(null);

interface Props {
    /** Id of the event or report. */
    id: string | null | undefined;

    /** Label used in the message (e.g., "event" or "report"). */
    label: string;

    /** Archive version currently reported by the API. */
    liveVersion: string | null | undefined;

    /** Whether an id missing from the published site should be treated as pending (e.g., a newly created
     * item). Otherwise, it's ignored since some items are never published. */
    isMissingPending: boolean;
}

export default function ArchivePendingBanner({ id, label, liveVersion, isMissingPending }: Props) {

    const manifest = useContext(ArchiveVersionsContext);
    if (!manifest || !id || !liveVersion) {
        return null;
    }

    // An entry without a version was published before versions existed, so it can't be compared.
    const publishedVersion = manifest[id];
    const isPending = id in manifest
        ? !!publishedVersion && publishedVersion.toLowerCase() !== liveVersion.toLowerCase()
        : isMissingPending;

    if (!isPending) {
        return null;
    }

    return (
        <div role="alert" className="alert alert-info mb-2">
            <FontAwesomeIcon icon="fas faClockRotateLeft" />
            <span>
                To save money, the changes you've made to this {label} only appear in <i>Upcoming & Live Events</i> or the season results every 3 hours.
            </span>
        </div>
    );
}
