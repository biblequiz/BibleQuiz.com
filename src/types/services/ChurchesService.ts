import { ParameterHelpers } from "../../utils/ParameterHelpers";
import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceModelBase, RemoteServiceUtility, type RemoteServicePage } from "./RemoteServiceUtility"
import { Address } from "./models/Address";

const URL_ROOT_PATH = "/api/Churches";

/**
 * Wrapper for the Churches service.
 */
export class ChurchesService {

    /**
     * Retrieves a single church.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the church.
     */
    public static getChurch(
        auth: AuthManager,
        id: string): Promise<Church> {

        return RemoteServiceUtility.getSingle<Church>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            id);
    }

    /**
     * Retrieves the existing churches.
     *
     * @param auth AuthManager to use for authentication.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     * @param searchText Text to search for churches.
     * @param regionId Identifier for the region (if any).
     * @param districtId Identifier for the district (if any).
     * @param filter Filter for the results.
     * @param includeOnlyManuallyAdded Include only the churches that were manually added.
     * @param includeOnlyPotentialDuplicates Include only the potentially duplicated churches.
     */
    public static getChurches(
        auth: AuthManager,
        pageSize: number,
        pageNumber: number,
        searchText: string | null = null,
        regionId: string | null = null,
        districtId: string | null = null,
        filter: ChurchResultFilter = ChurchResultFilter.All,
        includeOnlyManuallyAdded: boolean = false,
        includeOnlyPotentialDuplicates: boolean = false): Promise<RemoteServicePage<Church>> {

        return RemoteServiceUtility.getMany<RemoteServicePage<Church>>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            pageSize,
            pageNumber,
            true, // Indicates the count should be included.
            RemoteServiceUtility.getFilteredUrlParameters({
                f: ChurchResultFilter[filter],
                d: districtId,
                r: regionId,
                srch: searchText,
                man: includeOnlyManuallyAdded,
                dupe: includeOnlyPotentialDuplicates
            }));
    }

    /**
     * Creates a new church.
     *
     * @param auth AuthManager to use for authentication.
     * @param church Church to be created.
     * @param authorize Indicates whether the church should be authorized for this person.
     * @param email E-mail address for the person creating the church (if any).
     */
    public static create(
        auth: AuthManager,
        church: Church,
        authorize: boolean,
        email: string | null = null): Promise<Church> {

        return RemoteServiceUtility.executeHttpRequest<Church>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            RemoteServiceUtility.getFilteredUrlParameters({
                a: authorize,
                m: email
            }),
            church);
    }

    /**
     * Updates an existing church.
     *
     * @param auth AuthManager to use for authentication.
     * @param church Church to be updated.
     * @param mergeWithChurchId Id for a church to merge into this one. The value have already been set on church.
     */
    public static update(
        auth: AuthManager,
        church: Church,
        mergeWithChurchId: string | null = null): Promise<Church> {

        return RemoteServiceUtility.executeHttpRequest<Church>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${ParameterHelpers.urlEncode(church.Id)}`,
            RemoteServiceUtility.getFilteredUrlParameters({
                mid: mergeWithChurchId
            }),
            church);
    }

    /**
     * Authorizes the current user for access to the church.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Identifier for the church.
     */
    public static  authorizeChurch(
        auth: AuthManager,
        id: string): Promise<AuthorizationResult> {

        return RemoteServiceUtility.executeHttpRequest<AuthorizationResult>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${id}/Authorize`);
    }

    /**
     * Removes authorization for the current user from access to the church.
     * 
     * @param auth AuthManager to use for authentication.
     * @param id Identifier for the church.
     */
    public static deauthorizeChurch(
        auth: AuthManager,
        id: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequest<void>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${id}/Deauthorize`);
    }
}

/**
 * Church.
 */
export class Church extends RemoteServiceModelBase<string> {

    /**
     * Gets or sets the District ID for this church.
     */
    public DistrictId!: string;

    /**
    /* Gets or sets the name of this Event.
    **/
    public Name!: string;

    /**
     * Gets or sets the location of the church.
    **/
    public PhysicalAddress!: Address;

    /**
     * Gets a value indicating whether the current user is an administrator for this church.
     */
    public readonly IsAdministrator!: boolean;
}

/**
 * Filter for churches.
 */
export enum ChurchResultFilter {

    /**
     * All churches.
     */
    All,

    /**
     * Churches the user is directly an administrator of.
     */
    IncludeDirectAuthorized,

    /**
     * Churches the user is an administrator for.
     */
    IncludeAuthorized,
}

/**
 * Result of an authorization request.
 */
export class AuthorizationResult {

    /**
     * Gets the item that was authorized.
     */
    Item!: Church;

    /**
     * Gets the state of the authorization.
     */
    State!: AuthorizationResultState;
}

/**
 * State of an authorization request.
 */
export enum AuthorizationResultState {

    /**
     * Unknown state.
     */
    Unknown,

    /**
     * Request was rejected.
     */
    Rejected,

    /**
     * Request is pending approval.
     */
    PendingApproval,

    /**
     * Request was authorized.
     */
    Authorized,
}