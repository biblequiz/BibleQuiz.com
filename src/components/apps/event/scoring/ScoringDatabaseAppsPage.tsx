import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import type { ScoringDatabaseProviderContext } from "./ScoringDatabaseProvider";
import {
    AstroDatabaseDevicesService,
    type OnlineDatabaseDeviceSummary,
    type OnlineDatabaseDeviceSummaryActivity,
} from "types/services/AstroDatabaseDevicesService";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import DeviceDialog from "./apps/DeviceDialog";

/**
 * The current state of a device, derived from its most recent activity.
 */
interface DeviceCurrentState {
    activity: OnlineDatabaseDeviceSummaryActivity | null;
    divisionName: string | null;
    roomName: string | null;
    matchId: number | null;
    lastActive: string | null;
}

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

export default function ScoringDatabaseAppsPage() {
    const {
        auth,
        eventId,
        databaseId,
        currentDatabase,
    } = useOutletContext<ScoringDatabaseProviderContext>();

    const [devices, setDevices] = useState<OnlineDatabaseDeviceSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<OnlineDatabaseDeviceSummary | null>(null);

    // Lookup of meet id -> display name for resolving Division names.
    const meetNamesById = useMemo(() => {
        const map = new Map<number, string>();
        for (const meet of currentDatabase?.Meets ?? []) {
            map.set(meet.Display.Id, meet.Display.NameOverride || meet.Display.Name);
        }
        return map;
    }, [currentDatabase]);

    // Load devices on mount / when the database changes.
    useEffect(() => {
        if (!databaseId) return;

        setIsLoading(true);
        setLoadError(null);

        AstroDatabaseDevicesService.getAllDevices(auth, eventId, databaseId)
            .then(result => {
                setDevices(result);
                setIsLoading(false);
            })
            .catch(err => {
                setLoadError(err.message || "Failed to load devices.");
                setIsLoading(false);
            });
    }, [auth, eventId, databaseId]);

    // Determine the "current" state for a device from its most recent activity.
    const getCurrentState = useMemo(() => {
        return (device: OnlineDatabaseDeviceSummary): DeviceCurrentState => {
            let latest: OnlineDatabaseDeviceSummaryActivity | null = null;
            for (const activity of device.Activity) {
                if (!latest || new Date(activity.Timestamp).getTime() > new Date(latest.Timestamp).getTime()) {
                    latest = activity;
                }
            }

            const divisionName = latest && latest.MeetId != null
                ? meetNamesById.get(latest.MeetId) || `Division ${latest.MeetId}`
                : null;

            return {
                activity: latest,
                divisionName,
                roomName: latest?.RoomName ?? null,
                matchId: latest?.MatchId ?? null,
                lastActive: latest?.Timestamp ?? null,
            };
        };
    }, [meetNamesById]);

    // Sort devices by Division name, then Room (when present), else Device Name.
    const sortedDevices = useMemo(() => {
        return devices
            .map(device => ({ device, current: getCurrentState(device) }))
            .sort((a, b) => {
                const divisionCompare =
                    (a.current.divisionName || "").localeCompare(b.current.divisionName || "");
                if (divisionCompare !== 0) {
                    return divisionCompare;
                }

                const aSecondary = a.current.roomName || a.device.Name;
                const bSecondary = b.current.roomName || b.device.Name;
                return aSecondary.localeCompare(bSecondary);
            });
    }, [devices, getCurrentState]);


    // Loading state
    if (isLoading) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <span className="loading loading-spinner loading-lg"></span>
                            <span className="ml-4">Loading Devices...</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">
                            The connected devices are being downloaded from the server. This should
                            just take a second or two ...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (loadError) {
        return (
            <div className="hero bg-base-300 rounded-2xl shadow-lg">
                <div className="hero-content text-center py-16 px-8">
                    <div className="max-w-4xl">
                        <h1 className="text-3xl font-bold text-base-content mb-4">
                            <FontAwesomeIcon icon="fas faTriangleExclamation" />
                            <span className="ml-4">Error</span>
                        </h1>
                        <p className="text-lg text-base-content/70 mb-8">{loadError}</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-lg font-semibold">
                    <FontAwesomeIcon icon="fas faTabletScreenButton" />
                    <span className="ml-2">Devices</span>
                </h3>
            </div>

            {sortedDevices.length === 0 ? (
                <div className="card bg-base-100 shadow">
                    <div className="card-body text-center py-12">
                        <FontAwesomeIcon icon="fas faTabletScreenButton" classNames={["text-4xl", "text-base-content/30", "mb-4"]} />
                        <p className="text-base-content/60">
                            No devices have connected for this database yet.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedDevices.map(({ device, current }) => {
                        const appCount = Object.keys(device.Apps).length;
                        const divisionCount = new Set(
                            device.Activity
                                .filter(a => a.MeetId != null)
                                .map(a => a.MeetId)
                        ).size;

                        return (
                            <button
                                key={device.Id}
                                type="button"
                                className="card bg-base-200 shadow text-left hover:shadow-lg transition-shadow cursor-pointer mt-0"
                                onClick={() => setSelectedDevice(device)}
                            >
                                <div className="card-body p-4 gap-2">
                                    {/* Device name + platform */}
                                    <div>
                                        <h4 className="card-title text-base mb-0">
                                            <FontAwesomeIcon icon="fas faTabletScreenButton" />
                                            <span className="truncate">{device.Name}</span>
                                        </h4>
                                        <p className="text-sm text-base-content/70 mt-0">
                                            {device.PlatformVersion || "Unknown platform"}
                                        </p>
                                    </div>

                                    <div className="divider my-0 mt-0 mb-0"></div>

                                    {/* Current Division / Room / Match */}
                                    <div className="text-sm space-y-1 mt-0 mb-0">
                                        <div className="flex items-center gap-2 mt-0 mb-0">
                                            <FontAwesomeIcon icon="fas faCalendar" classNames={["text-base-content/60"]} />
                                            <span className="truncate">
                                                {current.divisionName || "— (no current division)"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-0 mb-1">
                                            <FontAwesomeIcon icon="fas faDoorOpen" classNames={["text-base-content/60"]} />
                                            <span>{current.roomName || "—"}</span>
                                            <span className="text-base-content/60">▸</span>
                                            <span>
                                                {current.matchId != null ? `Match ${current.matchId}` : "—"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="divider my-0 mt-0 mb-0"></div>

                                    {/* Counts + last active */}
                                    <div className="flex items-center justify-between text-xs text-base-content/60 mt-0 mb-0">
                                        <span>
                                            {appCount} app{appCount === 1 ? "" : "s"} · {divisionCount} division{divisionCount === 1 ? "" : "s"}
                                        </span>
                                        {current.lastActive && (
                                            <span className="flex items-center gap-1">
                                                <FontAwesomeIcon icon="fas faClock" />
                                                {formatTimestamp(current.lastActive)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Device Detail Dialog */}
            {selectedDevice && (
                <DeviceDialog
                    device={selectedDevice}
                    meets={currentDatabase?.Meets ?? []}
                    onClose={() => setSelectedDevice(null)}
                />
            )}
        </div>
    );
}

