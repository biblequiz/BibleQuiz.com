import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { OnlineDeviceConfiguration } from "types/services/AstroDatabaseDevicesService";

interface Props {
    configuration: OnlineDeviceConfiguration | null | undefined;
}

interface DetailRow {
    label: string;
    value: string;
}

/**
 * Formats a number with at most the given number of decimal places (e.g., 1.5, not 1.500).
 */
function formatNumber(value: number, maxDecimals: number): string {
    return value.toLocaleString(undefined, { maximumFractionDigits: maxDecimals });
}

/**
 * Joins the values that are present with a separator, or returns null if none are.
 */
function joinPresent(values: (string | null | undefined)[], separator: string): string | null {
    const present = values.filter((v): v is string => !!v && v.trim().length > 0);
    return present.length > 0 ? present.join(separator) : null;
}

/**
 * Builds the rows for the values that were reported, skipping the ones that weren't.
 */
function buildRows(configuration: OnlineDeviceConfiguration): DetailRow[] {
    const rows: DetailRow[] = [];
    const add = (label: string, value: string | null | undefined) => {
        if (value) {
            rows.push({ label, value });
        }
    };

    add("Device", joinPresent([configuration.Manufacturer, configuration.Model], " "));
    add("Type", joinPresent([configuration.Idiom, configuration.DeviceType], " · "));
    add("Operating System", joinPresent([configuration.Platform, configuration.OsVersion], " "));
    add("OS Description", configuration.OsDescription);
    add("CPU (App / OS)", joinPresent([configuration.ProcessArchitecture, configuration.OsArchitecture], " / "));
    add("Runtime", configuration.Runtime);

    if (configuration.PixelWidth != null && configuration.PixelHeight != null) {
        add("Screen", `${formatNumber(configuration.PixelWidth, 0)} × ${formatNumber(configuration.PixelHeight, 0)} px`);
    }

    if (configuration.AppWidth != null && configuration.AppHeight != null) {
        add("App Size", `${formatNumber(configuration.AppWidth, 1)} × ${formatNumber(configuration.AppHeight, 1)} dp`);
    }

    if (configuration.Density != null) {
        add("Density", formatNumber(configuration.Density, 3));
    }

    add(
        "Orientation",
        joinPresent(
            [configuration.Orientation, configuration.Rotation != null ? `${configuration.Rotation}°` : null],
            " · "));

    if (configuration.RefreshRate != null) {
        add("Refresh Rate", `${formatNumber(configuration.RefreshRate, 1)} Hz`);
    }

    return rows;
}

/**
 * Shows the hardware, operating system and display configuration a device reported.
 */
export default function DeviceConfigurationDetails({ configuration }: Props) {
    const rows = configuration ? buildRows(configuration) : [];
    const abis = configuration?.SupportedAbis ?? [];

    if (rows.length === 0 && abis.length === 0) {
        return (
            <p className="text-sm text-base-content/60 mt-0 mb-0">
                This device hasn't reported its configuration. Older app versions don't report it.
            </p>
        );
    }

    return (
        <div className="card bg-base-200 mt-0 mb-0">
            <div className="card-body p-3 gap-1">
                {rows.map(row => (
                    <div key={row.label} className="flex flex-wrap items-center gap-x-2 text-sm mt-0 mb-0">
                        <span className="font-semibold">{row.label}:</span>
                        <span>{row.value}</span>
                    </div>
                ))}
                {abis.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm mt-0 mb-0">
                        <span className="font-semibold">
                            <FontAwesomeIcon icon="fas faMicrochip" classNames={["mr-1", "text-base-content/60"]} />
                            Supported ABIs:
                        </span>
                        {abis.map(abi => (
                            <span key={abi} className="badge badge-sm badge-ghost">{abi}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
