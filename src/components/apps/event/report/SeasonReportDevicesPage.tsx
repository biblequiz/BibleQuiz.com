import { Fragment, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import DeviceConfigurationDetails from "../scoring/apps/DeviceConfigurationDetails";
import DeviceCountsTable from "../../devices/DeviceCountsTable";
import { DatabaseReportsService, type ReportDevices } from "types/services/DatabaseReportsService";
import type { RemoteServiceError } from "types/services/RemoteServiceUtility";
import type { EventReportsProviderContext } from "../EventReportsProvider";

interface Props {
}

/**
 * Devices that uploaded to, or downloaded, any database in the season report.
 */
export default function SeasonReportDevicesPage({ }: Props) {
    const { auth, reportId } = useOutletContext<EventReportsProviderContext>();

    const [isLoading, setIsLoading] = useState(!!reportId);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isNotAvailable, setIsNotAvailable] = useState(false);
    const [devices, setDevices] = useState<ReportDevices | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        // A report that hasn't been saved has no devices yet.
        if (!reportId) {
            setIsLoading(false);
            setDevices(null);
            return;
        }

        // Ignore a response that arrives after the report (or user) changed.
        let isCurrent = true;
        setIsLoading(true);
        setLoadError(null);
        setIsNotAvailable(false);
        DatabaseReportsService.getSeasonReportDevices(auth, reportId)
            .then(result => {
                if (isCurrent) {
                    setDevices(result);
                }
            })
            .catch((err: RemoteServiceError) => {
                if (!isCurrent) {
                    return;
                }

                // Until the Registration API with this endpoint is deployed, the route doesn't exist: a 404 with no error
                // details. Any other error (including a 404 for a missing report, which has details) is shown.
                if (err?.statusCode === 404 && !err.hasErrorDetails) {
                    setIsNotAvailable(true);
                }
                else {
                    setLoadError(err?.message || "Unable to load the devices.");
                }
            })
            .finally(() => {
                if (isCurrent) {
                    setIsLoading(false);
                }
            });

        return () => { isCurrent = false; };
    }, [auth, reportId]);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 mt-0 mb-0">
                <span className="loading loading-spinner loading-md"></span>
                <span>Loading devices ...</span>
            </div>);
    }
    else if (isNotAvailable) {
        return (
            <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center mt-0 mb-0">
                <FontAwesomeIcon icon="fas faHourglassHalf" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                <p className="text-base-content/60">
                    Device reporting isn't available yet. Devices will be listed here once it is.
                </p>
            </div>);
    }
    else if (loadError) {
        return (
            <div role="alert" className="alert alert-error mt-0 mb-0">
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                {/* RemoteServiceUtility builds its messages as HTML, as the other pages render them. */}
                <span dangerouslySetInnerHTML={{ __html: loadError }} />
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
                <DeviceCountsTable title="CPU Type" icon="fas faMicrochip" counts={devices.CountsByCpuType} total={total} />
                <DeviceCountsTable title="Model" icon="fas faTabletScreenButton" counts={devices.CountsByModel} total={total} />
                <DeviceCountsTable title="App Version" icon="fas faCodeBranch" counts={devices.CountsByAppVersion} total={total} />
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
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs mt-0 px-1 font-normal"
                                                aria-expanded={isExpanded}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setExpandedId(isExpanded ? null : device.Id);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={isExpanded ? "fas faChevronDown" : "fas faChevronRight"} classNames={["mr-1", "text-base-content/60"]} />
                                                {device.Name || "Unnamed device"}
                                            </button>
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
