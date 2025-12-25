import { RemoteServiceModelBase, RemoteServiceUrlBase, RemoteServiceUtility, type RemoteServicePage } from './RemoteServiceUtility';
import { Person } from "./PeopleService";
import type { AuthManager } from "../AuthManager";

const URL_ROOT_PATH = "/api/Permissions";

/**
 * Wrapper for the Permissions service.
 */
export class PermissionsService {

    /**
     * Retrieves the current user's permissions.
     *
     * @param auth AuthManager to use for authentication.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     */
    public static getMyPermissions(
        auth: AuthManager,
        pageSize: number,
        pageNumber: number): Promise<RemoteServicePage<PersonPermission>> {

        return RemoteServiceUtility.getMany<RemoteServicePage<PersonPermission>>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            pageSize,
            pageNumber,
            true);
    }

    /**
     * Retrieves the existing permissions.
     *
     * @param auth AuthManager to use for authentication.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     * @param scope Scope of the permission to return.
     * @param regionId ID for the region (if any).
     * @param districtId ID for the district (if any).
     * @param churchId ID for the church (if any).
     * @param eventId ID for the event (if any).
     */
    public static getPermissions(
        auth: AuthManager,
        pageSize: number,
        pageNumber: number,
        scope: PersonPermissionScope,
        regionId?: string,
        districtId?: string,
        churchId?: string,
        eventId?: string): Promise<RemoteServicePage<PersonPermission>> {

        return RemoteServiceUtility.getMany<RemoteServicePage<PersonPermission>>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            pageSize,
            pageNumber,
            true, // Indicates the count should be included.
            RemoteServiceUtility.getFilteredUrlParameters({
                s: PersonPermissionScope[scope],
                r: regionId,
                d: districtId,
                c: churchId,
                e: eventId
            }));
    }

    /**
     * Gets a single permission.
     *
     * @param auth AuthManager to use for authentication.
     * @param successCallback Callback if the operation is successful.
     * @param errorCallback Callback if the operation fails.
     * @param id Id for the request.
     */
    public static getPermission(
        auth: AuthManager,
        id: string): Promise<PersonPermission> {

        return RemoteServiceUtility.getSingle<PersonPermission>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            id);
    }

    /**
     * Approves a permission request.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the request.
     */
    public approve(
        auth: AuthManager,
        id: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Approve/${id}`);
    }

    /**
     * Rejects a permission request.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the permission.
     */
    public reject(
        auth: AuthManager,
        id: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Reject/${id}`);
    }

    /**
     * Creates a new Permission.
     *
     * @param auth AuthManager to use for authentication.
     * @param scope Scope for the new permission.
     * @param type Type for the permission.
     * @param personId ID for the person.
     * @param competitionTypeId ID for the competition type restricting this permission. If this is null, ALL competition types are
     * allowed.
     * @param regionId ID for the region (if any).
     * @param districtId ID for the district (if any).
     * @param churchId ID for the church (if any).
     * @param eventId ID for the event (if any).
     */
    public static createOrUpdate(
        auth: AuthManager,
        scope: PersonPermissionScope,
        type: PersonPermissionType,
        personId: string,
        competitionTypeId: string | null,
        regionId?: string,
        districtId?: string,
        churchId?: string,
        eventId?: string): Promise<PersonPermission> {

        return RemoteServiceUtility.executeHttpRequest<PersonPermission>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            RemoteServiceUtility.getFilteredUrlParameters({
                s: PersonPermissionScope[scope],
                t: type,
                p: personId,
                ct: competitionTypeId,
                r: regionId,
                d: districtId,
                c: churchId,
                e: eventId
            }));
    }

    /**
     * Deletes the specific permission.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the permission.
     */
    public static delete(
        auth: AuthManager,
        id: string): Promise<void> {

        return RemoteServiceUtility.executeHttpRequestWithoutResponse(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/${id}`);
    }
}

/**
 * Description of permissions about a person.
 */
export class PersonPermission extends RemoteServiceModelBase<string> {

    /**
     * Gets the name of the requestor.
     */
    public readonly Requestor!: Person;

    /**
     * Gets the permission label.
     */
    public readonly Label!: string;

    /**
     * Gets the type of permission.
     */
    public readonly Type!: PersonPermissionType;

    /**
     * Gets the scope of this permission.
     */
    public readonly Scope!: PersonPermissionScope;

    /**
     * Gets the region ID associated with this permission.
     */
    public readonly RegionId!: string | null;

    /**
     * Gets the district ID associated with this permission.
     */
    public readonly DistrictId!: string | null;

    /**
     * Gets the church ID associated with this permission.
     */
    public readonly ChurchId!: string | null;

    /**
     * Gets the event ID associated with this permission.
     */
    public readonly EventId!: string | null;

    /**
     * Gets the competition type restricting this permission. If null, it means this permission applies to ALL competition types.
     */
    public readonly CompetitionTypeId!: string | null;

    /**
     * Gets a label for the competition type.
     */
    public readonly CompetitionTypeLabel!: string;

    /**
     * Gets the status of the permission.
     */
    public readonly Status!: PersonPermissionStatus;

    /**
     * Gets the person that granted this permission.
     */
    public readonly GrantedById!: string;

    /**
     * Gets the reason this user was granted this permission.
     */
    public readonly GrantReason!: PersonPermissionGrantReason;
}

/**
 * Type of PersonPermission
 */
export enum PersonPermissionType {

    /**
     * Administrator for an entity at a scope.
     */
    Administrator
}

/**
 * Scope of a PersonPermission
 */
export enum PersonPermissionScope {

    /**
     * Applies to all Organization-wide permissions.
     */
    Organization = 0,

    /**
     * Applies to all Region-wide permissions.
     */
    Region = 1,

    /**
     * Applies to all District-wide permissions.
     */
    District = 2,

    /**
     * Applies to all Church-wide permissions.
     */
    Church = 3,

    /**
     * Applies to all Meet-wide permissions.
     */
    Meet = 4
}

/**
 * Indicates why a PersonPermission was granted.
 */
export enum PersonPermissionGrantReason {

    /**
     * The source of the permission is unknown.
     */
    Unknown,

    /**
     * Permission was directly added.
     */
    Direct,

    /**
     * A user was granted access via e-mail validation.
     */
    EmailValidation,
}

/**
 * Status of a permission.
 */
export enum PersonPermissionStatus {

    /**
     * Permission has been requested, but not granted.
     */
    Pending,

    /**
     * Permission has been granted.
     */
    Granted,

    /**
     * Permission has been rejected.
     */
    Rejected
}