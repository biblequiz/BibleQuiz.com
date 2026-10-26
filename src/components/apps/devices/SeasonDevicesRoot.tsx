import { Fragment, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import ProtectedRoute from "components/auth/ProtectedRoute";
import DeviceConfigurationDetails from "components/apps/event/scoring/apps/DeviceConfigurationDetails";
import DeviceCountsTable from "./DeviceCountsTable";
import { AuthManager } from "types/AuthManager";
import { AstroEventsService, type SeasonDevices, type SeasonDeviceEvent } from "types/services/AstroEventsService";
import type { RemoteServiceError } from "types/services/RemoteServiceUtility";
import {
    countBy,
    filterEvents,
    getEventMonth,
    sliceDevices,
    type DeviceAttribute,
    type DeviceAttributeFilters,
    type DeviceEventFilters,
} from "utils/DeviceUsage";

interface Props {
    seasons: number[];
    loadingElementId: string;
}

interface Option {
    value: string;
    label: string;
}

const NO_EVENT_FILTERS: DeviceEventFilters = { regionId: null, districtId: null, competitionTypeId: null, month: null };

const ATTRIBUTE_TABLES: { attribute: DeviceAttribute; title: string; icon: string }[] = [
    { attribute: "model", title: "Model", icon: "fas faTabletScreenButton" },
    { attribute: "cpu", title: "CPU Type", icon: "fas faMicrochip" },
    { attribute: "screen", title: "Screen (pixels)", icon: "fas faDisplay" },
    { attribute: "os", title: "Operating System", icon: "fas faGear" },
    { attribute: "app", title: "App", icon: "fas faCubes" },
    { attribute: "appVersion", title: "App Version", icon: "fas faCodeBranch" },
];

/**
 * Reads the season from the URL ("#/2027"), or the default season.
 */
function getSeasonFromHash(seasons: number[]): number {
    const parsed = parseInt(window.location.hash.replace(/^#\/?/, ""), 10);
    return seasons.includes(parsed) ? parsed : seasons[1] ?? seasons[0];
}

/**
 * Distinct options from the events, sorted by label.
 */
function getOptions(events: SeasonDeviceEvent[], getValue: (e: SeasonDeviceEvent) => [string | null, string | null]): Option[] {
    const options = new Map<string, string>();
    for (const event of events) {
        const [value, label] = getValue(event);
        if (value) {
            options.set(value, label || value);
        }
    }

    return Array.from(options, ([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
}

interface FilterSelectProps {
    label: string;
    value: string | null;
    options: Option[];
    onChange: (value: string | null) => void;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
    return (
        <label className="form-control w-full sm:w-auto mt-0">
            <span className="label-text text-sm">{label}</span>
            <select
                className="select select-bordered select-sm w-full sm:w-48 mt-1"
                value={value ?? ""}
                onChange={e => onChange(e.target.value || null)}
            >
                <option value="">All</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>);
}

/**
 * Devices used across a season's events (#2163), for organization administrators: counts by model, CPU, screen, OS and
 * app, sliceable by region, district, competition type and month, plus a list of the devices.
 */
function SeasonDevicesView({ seasons }: { seasons: number[] }) {
    const auth = AuthManager.useNanoStore();

    const [season, setSeason] = useState<number>(() => getSeasonFromHash(seasons));
    const [data, setData] = useState<SeasonDevices | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isNotAvailable, setIsNotAvailable] = useState(false);
    const [eventFilters, setEventFilters] = useState<DeviceEventFilters>(NO_EVENT_FILTERS);
    const [attributeFilters, setAttributeFilters] = useState<DeviceAttributeFilters>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const onHashChange = () => setSeason(getSeasonFromHash(seasons));
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, [seasons]);

    useEffect(() => {
        // Ignore a response that arrives after the season (or user) changed.
        let isCurrent = true;
        setIsLoading(true);
        setLoadError(null);
        setIsNotAvailable(false);
        setEventFilters(NO_EVENT_FILTERS);
        setAttributeFilters({});
        AstroEventsService.getSeasonDevices(auth, season)
            .then(result => {
                if (isCurrent) {
                    setData(result);
                }
            })
            .catch((err: RemoteServiceError) => {
                if (!isCurrent) {
                    return;
                }

                // Until the Registration API with this endpoint is deployed, the route doesn't exist: a 404 with no error
                // details. Any other error is shown.
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
    }, [auth, season]);

    const events = data?.Events ?? [];
    const eventsById = useMemo(() => new Map(events.map(e => [e.Id, e])), [events]);

    const regionOptions = useMemo(() => getOptions(events, e => [e.RegionId, e.RegionName]), [events]);
    const districtOptions = useMemo(
        () => getOptions(events.filter(e => !eventFilters.regionId || e.RegionId === eventFilters.regionId), e => [e.DistrictId, e.DistrictName]),
        [events, eventFilters.regionId]);
    const typeOptions = useMemo(() => getOptions(events, e => [e.CompetitionTypeId, e.CompetitionType]), [events]);
    const monthOptions = useMemo(
        () => getOptions(events, e => [getEventMonth(e), format(new Date(`${getEventMonth(e)}-01T00:00:00`), "MMMM yyyy")])
            .sort((a, b) => a.value.localeCompare(b.value)),
        [events]);

    const slicedEventIds = useMemo(() => filterEvents(events, eventFilters), [events, eventFilters]);
    const sliced = useMemo(
        () => sliceDevices(data?.Devices.Devices ?? [], slicedEventIds, attributeFilters),
        [data, slicedEventIds, attributeFilters]);
    const eventsWithDevices = useMemo(() => new Set(sliced.flatMap(d => d.eventIds)).size, [sliced]);

    const changeSeason = (value: number) => {
        window.location.hash = `#/${value}`;
        setSeason(value);
    };

    const setAttributeFilter = (attribute: DeviceAttribute, value: string | null) => {
        setAttributeFilters(current => {
            const updated = { ...current };
            if (value) {
                updated[attribute] = value;
            }
            else {
                delete updated[attribute];
            }

            return updated;
        });
    };

    const hasFilters = Object.values(eventFilters).some(v => !!v) || Object.keys(attributeFilters).length > 0;

    return (
        <div className="mt-0 mb-0">
            <h1 className="page-title mt-0 mb-2">Device Usage</h1>
            <p className="text-sm text-base-content/70 mt-0 mb-4">
                Every device that uploaded scores to, or downloaded the schedule of, an event this season. Pick filters, or
                click a count, to narrow it down. A device used at several events counts once in each view, so the counts for
                different months or areas can add up to more than the season's.
            </p>

            <div className="flex flex-wrap items-end gap-3 mt-0 mb-4">
                <label className="form-control w-full sm:w-auto mt-0">
                    <span className="label-text text-sm">Season</span>
                    <select
                        className="select select-bordered select-sm w-full sm:w-32 mt-1"
                        value={season}
                        onChange={e => changeSeason(parseInt(e.target.value, 10))}
                    >
                        {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </label>
                <FilterSelect
                    label="Region"
                    value={eventFilters.regionId}
                    options={regionOptions}
                    onChange={v => setEventFilters(f => ({ ...f, regionId: v, districtId: null }))}
                />
                <FilterSelect
                    label="District"
                    value={eventFilters.districtId}
                    options={districtOptions}
                    onChange={v => setEventFilters(f => ({ ...f, districtId: v }))}
                />
                <FilterSelect
                    label="Competition"
                    value={eventFilters.competitionTypeId}
                    options={typeOptions}
                    onChange={v => setEventFilters(f => ({ ...f, competitionTypeId: v }))}
                />
                <FilterSelect
                    label="Month"
                    value={eventFilters.month}
                    options={monthOptions}
                    onChange={v => setEventFilters(f => ({ ...f, month: v }))}
                />
                {hasFilters && (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm mt-0"
                        onClick={() => {
                            setEventFilters(NO_EVENT_FILTERS);
                            setAttributeFilters({});
                        }}
                    >
                        <FontAwesomeIcon icon="fas faFilterCircleXmark" classNames={["mr-1"]} />
                        Clear filters
                    </button>)}
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 mt-0 mb-0">
                    <span className="loading loading-spinner loading-md"></span>
                    <span>Loading devices ...</span>
                </div>
            ) : isNotAvailable ? (
                <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center mt-0 mb-0">
                    <FontAwesomeIcon icon="fas faHourglassHalf" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                    <p className="text-base-content/60">
                        Device usage isn't available yet. Devices will be listed here once it is.
                    </p>
                </div>
            ) : loadError ? (
                <div role="alert" className="alert alert-error mt-0 mb-0">
                    <FontAwesomeIcon icon="fas faTriangleExclamation" />
                    {/* RemoteServiceUtility builds its messages as HTML, as the other pages render them. */}
                    <span dangerouslySetInnerHTML={{ __html: loadError }} />
                </div>
            ) : (
                <>
                    <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-200 mt-0 mb-4">
                        <div className="stat">
                            <div className="stat-title">Devices</div>
                            <div className="stat-value text-2xl mb-0 mt-0">{sliced.length}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Events with devices</div>
                            <div className="stat-value text-2xl mb-0 mt-0">{eventsWithDevices}</div>
                            <div className="stat-desc">of {slicedEventIds.size} events</div>
                        </div>
                    </div>

                    {sliced.length === 0 ? (
                        <div className="p-8 border border-dashed border-base-300 rounded-lg bg-base-200 text-center mt-0 mb-0">
                            <FontAwesomeIcon icon="fas faTabletScreenButton" classNames={["text-4xl", "text-base-content/40", "mb-4"]} />
                            <p className="text-base-content/60">
                                {hasFilters
                                    ? "No devices match these filters."
                                    : "No devices have uploaded to or downloaded an event this season yet."}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-0 mb-4">
                                {ATTRIBUTE_TABLES.map(t => (
                                    <DeviceCountsTable
                                        key={t.attribute}
                                        title={t.title}
                                        icon={t.icon}
                                        counts={countBy(sliced, t.attribute)}
                                        total={sliced.length}
                                        selected={attributeFilters[t.attribute] ?? null}
                                        onSelect={v => setAttributeFilter(t.attribute, v)}
                                    />))}
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
                                        {sliced.map(entry => {
                                            const device = entry.device;
                                            const isExpanded = expandedId === device.Id;
                                            const eventNames = entry.eventIds.map(id => eventsById.get(id)?.Name ?? id);

                                            return (
                                                <Fragment key={device.Id}>
                                                    <tr className="hover">
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-xs mt-0 px-1 font-normal"
                                                                aria-expanded={isExpanded}
                                                                onClick={() => setExpandedId(isExpanded ? null : device.Id)}
                                                            >
                                                                <FontAwesomeIcon icon={isExpanded ? "fas faChevronDown" : "fas faChevronRight"} classNames={["mr-1", "text-base-content/60"]} />
                                                                {device.Name || "Unnamed device"}
                                                            </button>
                                                        </td>
                                                        <td>{entry.values.model[0]}</td>
                                                        <td>{entry.values.cpu[0]}</td>
                                                        <td>
                                                            {entry.apps.map(app => (
                                                                <span key={app.Name} className="badge badge-sm badge-ghost mr-1">{app.Name} v{app.Version}</span>
                                                            ))}
                                                        </td>
                                                        <td title={eventNames.join(", ")}>
                                                            {eventNames.length === 1 ? eventNames[0] : `${eventNames.length} events`}
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={5} className="bg-base-100">
                                                                <DeviceConfigurationDetails configuration={device.Configuration} />
                                                                <p className="text-sm text-base-content/70 mt-2 mb-0">
                                                                    <span className="font-semibold">Events:</span> {eventNames.join(", ")}
                                                                </p>
                                                            </td>
                                                        </tr>)}
                                                </Fragment>);
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>)}
                </>)}
        </div>);
}

/**
 * Root for the Device Usage page.
 */
export default function SeasonDevicesRoot({ seasons, loadingElementId }: Props) {
    useEffect(() => {
        const fallback = document.getElementById(loadingElementId);
        if (fallback) {
            fallback.style.display = "none";
        }
    }, [loadingElementId]);

    return (
        <ProtectedRoute permissionCheck={p => p.hasOrganizationPermission(null)}>
            <SeasonDevicesView seasons={seasons} />
        </ProtectedRoute>);
}
