import { ApiModel, type ApiPage, type HttpServiceErrorCallback, ServiceBase } from "./ServiceBase"
import { Address } from "./models/Address";

/**
 * Wrapper for the Churches service.
 */
export class ChurchesService extends ServiceBase<Church> {

    /**
     * Constructor for ChurchesService class.
     * @param authToken Authentication token for the service.
     */
    constructor(authToken: string | null) {
        super("/api/Churches", authToken);
    }

    /**
     * Retrieves a single church.
     *
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param id Id for the church.
     */
    public getChurch(
        successCallback: (church: Church) => void,
        errorCallback: HttpServiceErrorCallback,
        id: string) {

        this.getSingle(
            successCallback,
            errorCallback,
            id);
    }

    /**
     * Retrieves the existing churches.
     *
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     * @param searchText Text to search for churches.
     * @param regionId Identifier for the region (if any).
     * @param districtId Identifier for the district (if any).
     * @param filter Filter for the results.
     * @param includeOnlyManuallyAdded Include only the churches that were manually added.
     * @param includeOnlyPotentialDuplicates Include only the potentially duplicated churches.
     */
    public getChurches(
        successCallback: (churches: Church[], pageCount: number) => void,
        errorCallback: HttpServiceErrorCallback,
        pageSize: number,
        pageNumber: number,
        searchText: string | null = null,
        regionId: string | null = null,
        districtId: string | null = null,
        filter: ChurchResultFilter = ChurchResultFilter.All,
        includeOnlyManuallyAdded: boolean = false,
        includeOnlyPotentialDuplicates: boolean = false): void {

        let urlParameters: string = this.buildUrlParameters({
            f: ChurchResultFilter[filter],
            d: districtId,
            r: regionId,
            srch: searchText,
            man: includeOnlyManuallyAdded,
            dupe: includeOnlyPotentialDuplicates
        });

        this.getMany(
            (result: ApiPage<Church>): void => {

                successCallback(<Church[]>result.Items, <number>result.PageCount);
            },

            errorCallback,
            pageSize,
            pageNumber,
            true, // Indicates the count should be included.
            urlParameters);
    }

    /**
     * Creates a new church.
     *
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param church Church to be created.
     * @param authorize Indicates whether the church should be authorized for this person.
     * @param email E-mail address for the person creating the church (if any).
     */
    public create(
        successCallback: (entry: Church) => void,
        errorCallback: HttpServiceErrorCallback,
        church: Church,
        authorize: boolean,
        email: string | null = null): void {

        this.executeHttpRequest(
            successCallback,
            errorCallback,
            "POST",
            "?" + this.buildUrlParameters({ a: authorize, m: email }),
            church);
    }

    /**
     * Updates an existing church.
     *
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param church Church to be updated.
     * @param mergeWithChurchId Id for a church to merge into this one. The value have already been set on church.
     */
    public update(
        successCallback: (entry: Church) => void,
        errorCallback: HttpServiceErrorCallback,
        church: Church,
        mergeWithChurchId: string | null = null): void {

        let urlParameters: string = this.buildUrlParameters({ mid: mergeWithChurchId });
        if (0 != urlParameters.length) {
            urlParameters = "?" + urlParameters;
        }

        this.executeHttpRequest(
            successCallback,
            errorCallback,
            "PUT",
            "/" + church.Id + urlParameters,
            church);
    }

    /**
     * Authorizes the current user for access to the church.
     *
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param id Identifier for the church.
     */
    public authorizeChurch(
        successCallback: (result: AuthorizationResult) => void,
        errorCallback: HttpServiceErrorCallback,
        id: string) {

        this.executeHttpRequest(
            successCallback,
            errorCallback,
            "POST",
            "/" + id + "/Authorize");
    }

    /**
     * Removes authorization for the current user from access to the church.
     * 
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation isn't successful.
     * @param id Identifier for the church.
     */
    public deauthorizeChurch(
        successCallback: () => void,
        errorCallback: HttpServiceErrorCallback,
        id: string) {

        this.executeHttpRequest(
            successCallback,
            errorCallback,
            "POST",
            "/" + id + "/Deauthorize");
    }
}

/**
 * Church.
 */
export class Church extends ApiModel<string> {

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