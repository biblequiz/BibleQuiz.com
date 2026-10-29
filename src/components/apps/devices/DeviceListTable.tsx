import { Fragment, useMemo, useState } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import DeviceConfigurationDetails from "components/apps/event/scoring/apps/DeviceConfigurationDetails";
import { SortableHeader, TableFilter } from "./TableControls";
import type { OnlineDatabaseDeviceSummaryApp } from "types/services/AstroDatabaseDevicesService";
import type { ReportDevice } from "types/services/DatabaseReportsService";
import type { DeviceAttribute } from "utils/DeviceUsage";
import { compareText, getNextSort, matchesFilter, sortRows, type SortState } from "utils/TableSort";

/**
 * A device as the list shows it.
 */
export interface DeviceListEntry {
    device: ReportDevice;

    /** Apps the device used, one version each. */
    apps: OnlineDatabaseDeviceSummaryApp[];

    /** Values the device is counted by (see sliceDevices). */
    values: Record<DeviceAttribute, string[]>;

    /** Names of the events the device was used at. */
    eventNames: string[];
}

interface Props {
    entries: DeviceListEntry[];
}

type DeviceSortKey = "name" | "model" | "cpu" | "apps" | "events";

const DEFAULT_SORT: SortState<DeviceSortKey> = { key: "name", direction: "asc" };

function getDeviceName(entry: DeviceListEntry): string {
    return entry.device.Name || "Unnamed device";
}

function getAppsText(entry: DeviceListEntry): string {
    return entry.apps.map(app => `${app.Name} v${app.Version}`).join(", ");
}

/**
 * List of devices that can be sorted by any column and filtered by typing (any of the device's name, model, CPU, OS,
 * screen, app versions or events). Clicking a device shows its configuration and events.
 */
export default function DeviceListTable({ entries }: Props) {
    const [sort, setSort] = useState<SortState<DeviceSortKey>>(DEFAULT_SORT);
    const [filter, setFilter] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const rows = useMemo(
        () => sortRows(
            entries.filter(entry => matchesFilter(
                filter,
                [
                    getDeviceName(entry),
                    getAppsText(entry),
                    ...entry.values.model,
                    ...entry.values.cpu,
                    ...entry.values.os,
                    ...entry.values.screen,
                    ...entry.eventNames,
                ])),
            sort,
            {
                name: (a, b) => compareText(getDeviceName(a), getDeviceName(b)),
                model: (a, b) => compareText(a.values.model[0], b.values.model[0]),
                cpu: (a, b) => compareText(a.values.cpu[0], b.values.cpu[0]),
                apps: (a, b) => compareText(getAppsText(a), getAppsText(b)),
                events: (a, b) => a.eventNames.length - b.eventNames.length || compareText(a.eventNames.join(", "), b.eventNames.join(", ")),
            }),
        [entries, filter, sort]);

    const onSort = (key: DeviceSortKey) => setSort(current => getNextSort(current, key));
    const toggle = (id: string) => setExpandedId(current => current === id ? null : id);

    return (
        <div className="mt-0 mb-0">
            <div className="flex flex-wrap items-center gap-3 mt-0 mb-2">
                <TableFilter
                    value={filter}
                    onChange={setFilter}
                    placeholder="Filter devices (name, model, app version, event ...)"
                    className="w-full sm:w-96"
                />
                <span className="text-sm text-base-content/60">
                    {rows.length === entries.length
                        ? `${entries.length} device${entries.length === 1 ? "" : "s"}`
                        : `${rows.length} of ${entries.length} devices`}
                </span>
            </div>

            <div className="overflow-x-auto mt-0 mb-0">
                <table className="table table-sm w-full mt-0 mb-0">
                    <thead>
                        <tr>
                            <SortableHeader label="Device" sortKey="name" sort={sort} onSort={onSort} />
                            <SortableHeader label="Model" sortKey="model" sort={sort} onSort={onSort} />
                            <SortableHeader label="CPU" sortKey="cpu" sort={sort} onSort={onSort} />
                            <SortableHeader label="Apps" sortKey="apps" sort={sort} onSort={onSort} />
                            <SortableHeader label="Events" sortKey="events" sort={sort} onSort={onSort} />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-base-content/60">No devices match the filter.</td>
                            </tr>)}
                        {rows.map(entry => {
                            const device = entry.device;
                            const isExpanded = expandedId === device.Id;

                            return (
                                <Fragment key={device.Id}>
                                    <tr className="hover:bg-base-300 cursor-pointer" onClick={() => toggle(device.Id)}>
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-ghost btn-xs mt-0 px-1 font-normal"
                                                aria-expanded={isExpanded}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    toggle(device.Id);
                                                }}
                                            >
                                                <FontAwesomeIcon icon={isExpanded ? "fas faChevronDown" : "fas faChevronRight"} classNames={["mr-1", "text-base-content/60"]} />
                                                {getDeviceName(entry)}
                                            </button>
                                        </td>
                                        <td>{entry.values.model[0]}</td>
                                        <td>{entry.values.cpu[0]}</td>
                                        <td>
                                            {entry.apps.map(app => (
                                                <span key={app.Name} className="badge badge-sm badge-ghost mr-1">{app.Name} v{app.Version}</span>
                                            ))}
                                        </td>
                                        <td title={entry.eventNames.join(", ")}>
                                            {entry.eventNames.length === 1 ? entry.eventNames[0] : `${entry.eventNames.length} events`}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan={5} className="bg-base-100">
                                                <DeviceConfigurationDetails configuration={device.Configuration} />
                                                <p className="text-sm text-base-content/70 mt-2 mb-0">
                                                    <span className="font-semibold">Events:</span> {entry.eventNames.join(", ")}
                                                </p>
                                            </td>
                                        </tr>)}
                                </Fragment>);
                        })}
                    </tbody>
                </table>
            </div>
        </div>);
}
