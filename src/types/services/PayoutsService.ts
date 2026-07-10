import type { AuthManager } from "types/AuthManager";
import { RemoteServiceModelBase, RemoteServiceUrlBase, RemoteServiceUtility } from "types/services/RemoteServiceUtility";
import { Address } from "types/services/models/Address";

const URL_ROOT_PATH = "/api/Payouts";

/**
 * Wrapper for the payouts service.
 */
export class PayoutsService {

    /**
     * Gets the summary of payouts for a specific season.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season to query.
     */
    public static getSeasonSummary(
        auth: AuthManager,
        season: number): Promise<SeasonPayoutSummary> {

        return RemoteServiceUtility.executeHttpRequest<SeasonPayoutSummary>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Seasons/${season}`);
    }

    /**
     * Adds or updates an entry for an event payout.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season for the payout entry.
     * @param eventId Event id for the payout entry.
     * @param entry Entry to add or update.
     */
    public static addOrUpdate(
        auth: AuthManager,
        season: number,
        eventId: string,
        entry: EventPayoutEntry): Promise<SeasonPayoutSummary> {

        return RemoteServiceUtility.executeHttpRequest<SeasonPayoutSummary>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Seasons/${season}/Events/${eventId}/Entries`,
            undefined,
            entry);
    }

    /**
     * Deletes an event payout entry.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season for the payout entry.
     * @param eventId Event id for the payout entry.
     * @param entryId Id of the entry to delete.
     */
    public static delete(
        auth: AuthManager,
        season: number,
        eventId: string,
        entryId: string): Promise<SeasonPayoutSummary> {

        return RemoteServiceUtility.executeHttpRequest<SeasonPayoutSummary>(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Seasons/${season}/Events/${eventId}/Entries/${entryId}`);
    }

    /**
     * Downloads the Excel report for a season.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season to download.
     */
    public static downloadSeasonExcel(
        auth: AuthManager,
        season: number): Promise<void> {

        return RemoteServiceUtility.downloadFromHttpRequest(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Seasons/${season}/Excel`);
    }
}

/**
 * Summary of payouts for a season.
 */
export class SeasonPayoutSummary {

    /**
     * Available seasons from the backend.
     */
    public readonly Seasons!: number[];

    /**
     * Season currently represented by this summary.
     */
    public readonly Season!: number;

    /**
     * Total processing fees for the season.
     */
    public readonly TotalProcessingFees!: number;

    /**
     * Total site fees for the season.
     */
    public readonly TotalSiteFees!: number;

    /**
     * Remaining amount that is ready to payout.
     */
    public readonly UnpaidPayout!: number;

    /**
     * Remaining site fees not yet reconciled.
     */
    public readonly UnreconciledSiteFees!: number;

    /**
     * Event-level payout summaries.
     */
    public readonly Events!: EventPayoutSummary[];
}

/**
 * Event-level payout summary.
 */
export class EventPayoutSummary extends RemoteServiceModelBase<string> {

    /**
     * Season for this event.
     */
    public readonly Season!: number;

    /**
     * Event name.
     */
    public readonly EventName!: string;

    /**
     * Event end date.
     */
    public readonly EventEndDate!: string;

    /**
     * Payee name.
     */
    public readonly PayeeName!: string;

    /**
     * Payee email.
     */
    public readonly PayeeEmail!: string;

    /**
     * Payee address.
     */
    public readonly PayeeAddress!: Address;

    /**
     * Remaining payout for this event.
     */
    public readonly UnpaidPayout!: number;

    /**
     * Remaining unreconciled site fees for this event.
     */
    public readonly UnreconciledSiteFees!: number;

    /**
     * Payout entries recorded for this event.
     */
    public readonly Entries!: EventPayoutEntry[];
}

/**
 * Payout entry.
 */
export class EventPayoutEntry extends RemoteServiceModelBase<string> {

    /**
     * Entry date.
     */
    public EntryDate!: string;

    /**
     * Optional notes.
     */
    public Notes!: string | null;

    /**
     * Amount paid.
     */
    public Amount!: number;

    /**
     * Site fees reconciled with this entry.
     */
    public SiteFees!: number;

    /**
     * Payee name.
     */
    public PayeeName!: string;

    /**
     * Payee email.
     */
    public PayeeEmail!: string;

    /**
     * Payee address.
     */
    public PayeeAddress!: Address;
}
