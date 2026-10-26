import { Fragment, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import DeviceConfigurationDetails from "../scoring/apps/DeviceConfigurationDetails";
import { DatabaseReportsService, type ReportDevices } from "types/services/DatabaseReportsService";
import type { EventReportsProviderContext } from "../EventReportsProvider";

interface Props {
}

interface CountsTableProps {
    title: string;
    icon: string;
    counts: Record<string, number>;
    total: number;
}

/**
 * Table of counts with a bar showing each count's share of the total, largest first.
 */
function CountsTable({ title, icon, counts, total }: CountsTableProps) {
    const rows = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    return (
        <div className="card bg-base-200 mt-0 mb-0">
            <div className="card-body p-3 gap-2">
                <h4 className="font-semibold text-sm mt-0 mb-0 flex items-center gap-2">
                    <FontAwesomeIcon icon={icon} classNames={["text-base-content/60"]} />
                    {title}
                </h4>
                <table className="table table-zebra table-sm w-full mt-0 mb-0">
                    <tbody>
                        {rows.map(([label, count]) => (
                            <tr key={label}>
                                <td className="w-1/2">{label}</td>
                                <td className="w-1/3">
                                    <progress className="progress progress-primary w-full" value={count} max={Math.max(total, 1)}></progress>
                                </td>
                                <td className="text-right">{count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>);
}

/**
 * Devices that uploaded to, or downloaded, any database in the season report.
 */
export default function SeasonReportDevicesPage({ }: Props) {
    const { auth, reportId } = useOutletContext<EventReportsProviderContext>();

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [devices, setDevices] = useState<ReportDevices | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!reportId) {
            return;
        }

        setIsLoading(true);
        setLoadError(null);
        DatabaseReportsService.getSeasonReportDevices(auth, reportId)
            .then(result => setDevices(result))
            .catch(err => setLoadError(err?.message || "Unable to load the devices."))
            .finally(() => setIsLoading(false));
    }, [auth, reportId]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 mt-0 mb-0">
                <span className="loading loading-spinner loading-md"></span>
                <span>Loading devices ...</span>
            </div>);
    }
    else if (loadError) {
        return (
            <div role="alert" className="alert alert-error mt-0 mb-0">
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                <span>{loadError}</span>
            </div>);
    }
    else if (!devices || devices.Devices.length === 0) {
        return (
            <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center mt-0 mb-0">
                <FontAwesomeIcon icon="fas faTabletScreenButton" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                <p className="text-base-content/60">
                    No devices have uploaded to or downloaded the databases in this report yet.
                </p>
            </div>);
    }

    const total = devices.Devices.length;

    return (
        <div className="mt-0 mb-0">
            <p className="text-sm text-base-content/70 mt-0 mb-4">
                Every device that uploaded scores to, or downloaded the schedule of, a database in this report. Older app
                versions don't report their configuration, so they're counted as "Not reported".
            </p>

            <div className="stats shadow bg-base-200 mt-0 mb-4">
                <div className="stat">
                    <div className="stat-title">Devices</div>
                    <div className="stat-value text-2xl mb-0 mt-0">{total}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-0 mb-4">
                <CountsTable title="CPU Type" icon="fas faMicrochip" counts={devices.CountsByCpuType} total={total} />
                <CountsTable title="Model" icon="fas faTabletScreenButton" counts={devices.CountsByModel} total={total} />
                <CountsTable title="App Version" icon="fas faCodeBranch" counts={devices.CountsByAppVersion} total={total} />
            </div>

            <div className="overflow-x-auto mt-0 mb-0">
                <table className="table table-sm w-full mt-0 mb-0">
                    <thead>
                        <tr>
                            <th>Device</th>
                            <th>Model</th>
                            <th>CPU</th>
                            <th>Apps</th>
                            <th>Events</th>
                        </tr>
                    </thead>
                    <tbody>
                        {devices.Devices.map(device => {
                            const isExpanded = expandedId === device.Id;
                            const configuration = device.Configuration;
                            const model = [configuration?.Manufacturer, configuration?.Model].filter(v => !!v).join(" ");

                            return (
                                <Fragment key={device.Id}>
                                    <tr
                                        className="hover cursor-pointer"
                                        onClick={() => setExpandedId(isExpanded ? null : device.Id)}
                                    >
                                        <td>
                                            <FontAwesomeIcon icon={isExpanded ? "fas faChevronDown" : "fas faChevronRight"} classNames={["mr-2", "text-base-content/60"]} />
                                            {device.Name || "Unnamed device"}
                                        </td>
                                        <td>{model || "—"}</td>
                                        <td>{configuration?.ProcessArchitecture || "—"}</td>
                                        <td>
                                            {device.Apps.map(app => (
                                                <span key={app.Name} className="badge badge-sm badge-ghost mr-1">{app.Name} v{app.Version}</span>
                                            ))}
                                        </td>
                                        <td>{Array.from(new Set(device.Databases.map(d => d.EventName || d.EventId))).join(", ")}</td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={5} className="bg-base-100">
                                                <DeviceConfigurationDetails configuration={configuration} />
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>);
                        })}
                    </tbody>
                </table>
            </div>
        </div>);
}
