import { useRef, useMemo } from "react";
import { format } from "date-fns";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { useModalDialog } from "hooks/useModalDialog";
import type { OnlineDatabaseMeetSummary } from "types/services/AstroDatabasesService";
import type {
    OnlineDatabaseDeviceSummary,
    OnlineDatabaseDeviceSummaryActivity,
} from "types/services/AstroDatabaseDevicesService";

interface Props {
    device: OnlineDatabaseDeviceSummary;
    meets: OnlineDatabaseMeetSummary[];
    onClose: () => void;
}

/** Key used to group activity that is not associated with any Division. */
const NO_DIVISION_KEY = "none";

/**
 * Formats a C# DateTimeOffset string (ISO-8601 with offset) as a localized
 * date and time. Falls back to the raw value if it cannot be parsed.
 */
function formatTimestamp(value: string | null): string {
    if (!value) {
        return "";
    }

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
        return value;
    }

    return format(parsed, "MMM d, yyyy h:mm a");
}

/**
 * A grouping of a device's activity for a single Division (meet).
 */
interface DivisionActivityGroup {
    key: string;
    divisionName: string;
    activity: OnlineDatabaseDeviceSummaryActivity[];
}

export default function DeviceDialog({
    device,
    meets,
    onClose }: Props) {

    const dialogRef = useRef<HTMLDialogElement>(null);

    // Register Escape handling and promote the dialog to the top layer.
    useModalDialog(dialogRef, onClose);

    const handleClose = () => {
        onClose();
        dialogRef.current?.close();
    };

    // Lookup of meet id -> display name for resolving Division names.
    const meetNamesById = useMemo(() => {
        const map = new Map<number, string>();
        for (const meet of meets) {
            map.set(meet.Display.Id, meet.Display.NameOverride || meet.Display.Name);
        }
        return map;
    }, [meets]);

    // Installed apps sorted by name for a stable display.
    const apps = useMemo(() => {
        return Object.values(device.Apps).sort((a, b) => a.Name.localeCompare(b.Name));
    }, [device]);

    // Activity grouped by Division (meet), sorted by Division name. Activity
    // within each group is sorted by timestamp (oldest first).
    const divisionGroups = useMemo((): DivisionActivityGroup[] => {
        const groups = new Map<string, DivisionActivityGroup>();

        for (const activity of device.Activity) {
            const key = activity.MeetId == null ? NO_DIVISION_KEY : String(activity.MeetId);
            let group = groups.get(key);
            if (!group) {
                const divisionName = activity.MeetId == null
                    ? "No Division"
                    : meetNamesById.get(activity.MeetId) || `Division ${activity.MeetId}`;
                group = { key, divisionName, activity: [] };
                groups.set(key, group);
            }
            group.activity.push(activity);
        }

        for (const group of groups.values()) {
            group.activity.sort((a, b) =>
                new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
        }

        return Array.from(groups.values()).sort((a, b) => {
            // Keep the "No Division" bucket last.
            if (a.key === NO_DIVISION_KEY) return 1;
            if (b.key === NO_DIVISION_KEY) return -1;
            return a.divisionName.localeCompare(b.divisionName);
        });
    }, [device, meetNamesById]);

    const hasDivisionActivity = divisionGroups.some(g => g.key !== NO_DIVISION_KEY);

    return (
        <dialog ref={dialogRef} className="modal items-start pt-20" onClose={handleClose}>
            <div className="modal-box w-full max-w-2xl max-h-[calc(100vh-6rem)] flex flex-col">
                {/* Fixed Header */}
                <div className="flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FontAwesomeIcon icon="fas faTabletScreenButton" />
                        {device.Name}
                    </h3>
                    <button
                        type="button"
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 mt-0"
                        onClick={handleClose}
                    >
                        ✕
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto mt-3">
                    {/* Platform Version */}
                    <div className="flex items-center gap-2 text-sm mt-0 mb-0">
                        <FontAwesomeIcon icon="fas faTag" classNames={["text-base-content/60"]} />
                        <span className="font-semibold">Platform Version:</span>
                        <span>{device.PlatformVersion || "Unknown"}</span>
                    </div>

                    {/* Installed Apps */}
                    <div className="mt-2 mb-0">
                        <h4 className="font-semibold text-sm mb-2">Installed Apps</h4>
                        {apps.length === 0 ? (
                            <p className="text-sm text-base-content/60 mt-0 mb-0">No apps reported for this device.</p>
                        ) : (
                            <div className="card bg-base-200 mt-0 mb-0">
                                <div className="card-body p-3 gap-1">
                                    {apps.map(app => (
                                        <div
                                            key={app.Name}
                                            className="flex flex-wrap items-center gap-x-2 text-sm mt-0 mb-0"
                                        >
                                            <span className="font-semibold">{app.Name}</span>
                                            <span className="badge badge-sm badge-ghost">v{app.Version}</span>
                                            <span className="text-base-content/60">
                                                last upload {formatTimestamp(app.LastUploaded)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Divisions Uploaded */}
                    <div className="mt-4 mb-0">
                        <h4 className="font-semibold text-sm mb-2">Divisions Uploaded</h4>
                        {!hasDivisionActivity ? (
                            <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center mt-0 mb-0">
                                <FontAwesomeIcon icon="fas faCalendarXmark" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                                <p className="text-base-content/60">
                                    This device hasn't uploaded for any Divisions yet.
                                </p>
                            </div>
                        ) : (
                            <div className="card bg-base-200 mt-0 mb-0">
                                <div className="card-body p-3 gap-3">
                                    {divisionGroups.map((group, index) => (
                                        <div key={group.key} className="mb-0 mt-0">
                                            {index > 0 && <div className="divider my-0"></div>}
                                            <div className="flex items-center gap-2 font-bold mt-0 mb-0">
                                                <FontAwesomeIcon icon="fas faCalendar" />
                                                <span>{group.divisionName}</span>
                                            </div>
                                            <ul className="mt-1 space-y-2">
                                                {group.activity.map((activity, activityIndex) => (
                                                    <li key={activityIndex} className="pl-6 text-sm mt-0 mb-0">
                                                        <div className="flex flex-wrap items-center gap-x-2 mt-0 mb-0">
                                                            <span className="font-semibold">
                                                                {activity.MatchId != null ? `Match ${activity.MatchId}` : "—"}
                                                            </span>
                                                            <span className="text-base-content/60">·</span>
                                                            <span>
                                                                <FontAwesomeIcon icon="fas faDoorOpen" classNames={["mr-1", "text-base-content/60"]} />
                                                                {activity.RoomName || "—"}
                                                            </span>
                                                            <span className="text-base-content/60">·</span>
                                                            <span>{activity.AppName}</span>
                                                            <span className="text-base-content/60">·</span>
                                                            <span className="text-base-content/70">
                                                                by {activity.UserName || "unknown"}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-base-content/60 mt-0 mb-2">
                                                            {formatTimestamp(activity.Timestamp)}
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="modal-action flex-shrink-0">
                    <button
                        type="button"
                        className="btn btn-primary mt-0"
                        onClick={handleClose}
                    >
                        Close
                    </button>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={handleClose}>close</button>
            </form>
        </dialog>
    );
}

