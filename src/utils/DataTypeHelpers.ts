import type { Address } from 'types/services/models/Address';
import { format } from 'date-fns';

/**
 * Helpers for interacting with data types.
 */
export class DataTypeHelpers {

    /**
     * Gets the current date.
     */
    public static get now(): Date {

        return new Date();
    }

    /**
     * Gets the current date.
     */
    public static get nowDateOnly(): Date {

        const now: Date = new Date();
        now.setHours(0);
        now.setMinutes(0);
        now.setSeconds(0);
        now.setMilliseconds(0);

        return now;
    }

    /**
     * Parses a date from a string. If it fails to parse, null is returned.
     *
     * @param value Value representing the date to parse.
     */
    public static parseDateOnly(value: string | null): Date | null {

        if (DataTypeHelpers.isNullOrEmpty(value)) {
            return null;
        }

        let year: number | null = null;
        let month: number | null = null;
        let day: number | null = null;

        let parts: string[] = value!.split("-", 3);
        if (3 == parts.length) {
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
        }
        else {

            parts = value!.split("/", 3);
            if (3 == parts.length) {

                year = parseInt(parts[2]);
                month = parseInt(parts[0]);
                day = parseInt(parts[1]);
            }
            else {
                return null;
            }
        }

        // A Date object is intially set to the current time.
        const result: Date = new Date();

        // Handle any two digit dates.
        if (year < 100) {
            const nowYear: number = result.getUTCFullYear();
            if (year < nowYear) {
                year += 1900;
            }
            else {
                year += 2000;
            }
        }

        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    /**
     * Formats an address as a single line.
     * 
     * @param address Address to be formatted.
     */
    public static formatAddress(address: Address | null): string | null {
        if (null == address) {
            return "";
        }

        const parts: string[] = [];
        if (!DataTypeHelpers.isNullOrEmpty(address.StreetAddress)) {
            parts.push(address.StreetAddress);
        }

        if (!DataTypeHelpers.isNullOrEmpty(address.City)) {
            parts.push(address.City);
        }

        if (!DataTypeHelpers.isNullOrEmpty(address.State) || null != address.ZipCode) {
            const stateZip: string = (DataTypeHelpers.formatNullableString(address.State) + " " + DataTypeHelpers.formatZipCode(address.ZipCode)).trim();
            if (!DataTypeHelpers.isNullOrEmpty(stateZip)) {
                parts.push(stateZip);
            }
        }

        let formatted: string = parts.join(", ").trim();
        if (!DataTypeHelpers.isNullOrEmpty(formatted)) {
            return formatted;
        }

        return null;
    }

    /**
     * Formats a single date.
     * 
     * @param date Date to format.
     * @param formatPattern Format to apply (using date-fns format patterns).
     */
    public static formatDate(date: Date | string | null, formatPattern: string = "MMM d, yyyy"): string | null {

        if (typeof date == "string") {
            date = this.parseDateOnly(date);
        }

        if (null == date) {
            return null;
        }
        else {
            return format(date, formatPattern);
        }
    }

    /**
     * Formats a date range.
     * 
     * @param startDate Starting date.
     * @param endDate Ending date.
     */
    public static formatDateRange(startDate: Date | string, endDate: Date | string): string | null {

        const startDateRange: Date | null = typeof startDate == "string"
            ? this.parseDateOnly(startDate)
            : startDate;
        const endDateRange: Date | null = typeof endDate == "string"
            ? this.parseDateOnly(endDate)
            : endDate;

        if (null == startDateRange || null == endDateRange) {
            if (null == startDateRange && null == endDateRange) {
                return "";
            }
            else if (null == startDateRange) {
                return this.formatDate(endDateRange);
            }
            else {
                return this.formatDate(startDateRange);
            }
        }

        if (startDateRange.getFullYear() == endDateRange.getFullYear()) {
            if (startDateRange.getMonth() == endDateRange.getMonth()) {
                if (startDateRange.getDate() == endDateRange.getDate()) {

                    return this.formatDate(startDateRange, "MMM d, yyyy");
                }
                else {

                    return `${this.formatDate(startDateRange, "MMM d - ")}${this.formatDate(endDateRange, "d, yyyy")}`;
                }
            }
            else {
                return `${this.formatDate(startDateRange, "MMM d - ")}${this.formatDate(endDateRange, "MMM d, yyyy")}`;
            }
        }
        else {
            return `${this.formatDate(startDateRange, "MMM d, yyyy - ")}${this.formatDate(endDateRange, "MMM d, yyyy")}`;
        }
    }

    /**
     * Formats a number.
     * 
     * @param value Value to format.
     */
    public static formatNumber(value: number | null, fixedDecimals: number | null = null): string {

        const options: Intl.NumberFormatOptions = {
            useGrouping: true
        };

        if (null != fixedDecimals) {
            options.minimumFractionDigits = fixedDecimals;
            options.maximumFractionDigits = fixedDecimals;
        }

        return (null == value ? 0 : value).toLocaleString("en", options);
    }

    /**
     * Formats a zip code.
     * 
     * @param code Code to format.
     */
    public static formatZipCode(code: number | null): string {

        if (null == code) {
            return "";
        }

        const notPadded: string = code.toString();
        if (notPadded.length < 5) {
            const values: string[] = [];
            for (let i: number = 5 - notPadded.length - 1; i >= 0; i--) {
                values.push("0");
            }

            values.push(notPadded);
            return values.join("");
        }

        return notPadded;
    }

    /**
     * Formats a nullable string.
     * 
     * @param value Value to be formatted.
     */
    public static formatNullableString(value: string | null): string | null {

        if (this.isNullOrEmpty(value)) {
            return null;
        }

        return value;
    }

    /**
     * Parses a nullable decimal.
     * 
     * @param value Value to be parsed.
     */
    public static parseNullableFloat(value: string): number | null {

        if (this.isNullOrEmpty(value)) {
            return null;
        }

        return parseFloat(value);
    }

    /**
     * Parses a nullable integer.
     * 
     * @param value Value to be parsed.
     */
    public static parseNullableInt(value: string): number | null {

        if (this.isNullOrEmpty(value)) {
            return null;
        }

        return parseInt(value);
    }

    /**
     * Determines if flagsValue contains individualValue.
     * 
     * @param flagsValue Value for the flags.
     * @param individualValue Individual value.
     */
    public static hasEnumFlag<T extends number>(flagsValue: T, individualValue: T): boolean {

        return (flagsValue & individualValue) == individualValue;
    }

    /**
     * Determines if the value is null or empty.
     * 
     * @param value Value to be checked.
     */
    public static isNullOrEmpty(value: string | null): boolean {
        return null == value || 0 == value.length;
    }
}