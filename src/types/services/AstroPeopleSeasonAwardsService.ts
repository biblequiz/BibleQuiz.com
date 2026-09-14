import type { AuthManager } from "../AuthManager";
import {
    RemoteServiceUrlBase,
    RemoteServiceUtility,
} from "./RemoteServiceUtility";

const URL_ROOT_PATH = "/api/v1.0/seasonAwards";

/**
 * Wrapper for the Astro People Season Awards service.
 */
export class AstroPeopleSeasonAwardsService {
    /**
     * Retrieves all season awards for a church.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season year.
     * @param churchId Id for the church.
     *
     * @returns Season awards for the church.
     */
    public static getAwardsByChurch(
        auth: AuthManager,
        season: number,
        churchId: string,
    ): Promise<OnlinePersonSeasonAward[]> {
        return RemoteServiceUtility.executeHttpRequest<OnlinePersonSeasonAward[]>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${season}/churches/${churchId}`,
        );
    }

    /**
     * Retrieves all season awards for a district.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season year.
     * @param districtId Id for the district.
     *
     * @returns Season awards for the district.
     */
    public static getAwardsByDistrict(
        auth: AuthManager,
        season: number,
        districtId: string,
    ): Promise<OnlinePersonSeasonAward[]> {
        return RemoteServiceUtility.executeHttpRequest<OnlinePersonSeasonAward[]>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${season}/districts/${districtId}`,
        );
    }

    /**
     * Retrieves season awards for a person.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season year.
     * @param personId Id for the person.
     *
     * @returns Season awards for the person.
     */
    public static getAwardsByPerson(
        auth: AuthManager,
        season: number,
        personId: string,
    ): Promise<OnlinePersonSeasonAward> {
        return RemoteServiceUtility.executeHttpRequest<OnlinePersonSeasonAward>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${season}/people/${personId}`,
        );
    }

    /**
     * Updates season awards for a person.
     *
     * @param auth AuthManager to use for authentication.
     * @param season Season year.
     * @param award Season awards to update.
     *
     * @returns Updated season awards for the person.
     */
    public static updateAwards(
        auth: AuthManager,
        season: number,
        award: OnlinePersonSeasonAward,
    ): Promise<OnlinePersonSeasonAward> {
        return RemoteServiceUtility.executeHttpRequest<OnlinePersonSeasonAward>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${season}/people`,
            null,
            award,
        );
    }
}

/**
 * Season awards for a person.
 */
export interface OnlinePersonSeasonAward {
    /**
     * Id of the person.
     */
    PersonId: string;

    /**
     * Name of the person.
     */
    PersonName: string;

    /**
     * Name of the person's church.
     */
    ChurchName: string;

    /**
     * Location of the person's church.
     */
    ChurchLocation: string;

    /**
     * Id of the person certifying the awards.
     */
    CertifierId: string | null;

    /**
     * Name of the person certifying the awards.
     */
    CertifierName: string | null;

    /**
     * Date when the awards were certified, or null while in draft state.
     */
    CertifiedOn: string | null;

    /**
     * National memorization entries keyed by the server-provided award key.
     */
    NationalMemorization: Record<string, OnlinePersonSeasonAwardEntry | null>;

    /**
     * Master Memorization Award entry, if completed.
     */
    MasterMemorization: OnlinePersonSeasonAwardEntry | null;

    /**
     * Discipleship Award entry, if completed.
     */
    Discipleship: OnlinePersonSeasonAwardEntry | null;
}

/**
 * Entry within a person's season awards.
 */
export interface OnlinePersonSeasonAwardEntry {
    /**
     * Name of the person who witnessed the entry.
     */
    WitnessName: string;

    /**
     * Date when the entry occurred.
     */
    OccurredOn: string;

    /**
     * Time spent completing the entry, when applicable.
     */
    TimeSpent?: string | null;
}