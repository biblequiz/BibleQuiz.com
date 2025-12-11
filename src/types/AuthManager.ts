import { LogLevel, PublicClientApplication, type AccountInfo, type AuthenticationResult, type IPublicClientApplication } from "@azure/msal-browser";
import type { Person } from 'types/services/PeopleService';
import { AsyncLock } from 'utils/AsyncLock';
import { map, type PreinitializedMapStore } from "nanostores";
import { useStore } from "@nanostores/react";

const PROFILE_STORAGE_KEY = "auth-user-profile--";
const TOKEN_SCOPES = ["offline_access", "openid", "profile", "1058ea35-28ff-4b8a-953a-269f36d90235/.default"];

// Initialize the MSAL client and active account. This happens in the background so that
// other processing can happen at the same time.
const REDIRECT_PATH = "/auth";

/**
 * The private state of the auth manager.
 */
const privateStores = new WeakMap<AuthManager, PreinitializedMapStore<AuthManagerReactState>>();

/**
 * State of the auth manager that must trigger React reloads.
 */
interface AuthManagerReactState {

    /**
     * Type of the popup.
     */
    popupType: PopupType;

    /**
     * Value indicating whether the profile is being retrieved.
     */
    isRetrievingProfile: boolean;

    /**
     * Current user profile.
     */
    profile: UserAccountProfile | null;
}

/**
 * Profile for the current user.
 */
export class UserAccountProfile {

    /**
     * Creates a new instance of the AccountProfile.
     * @param personId  Id of the person in the remote system.
     * @param displayName Display name of the user.
     * @param type Type of the user's profile.
     * @param organizationPermission Organization-level permission.
     * @param regionPermissions Region-level permissions.
     * @param districtPermissions District-level permissions.
     * @param eventPermissions Events for which the user is considered an administrator.
     * @param churchPermissions Churches for which the user is considered an administrator.
     * @param canCreateEvents Value indicating whether the user can create events.
     * @param isPayoutManager Value indicating if the user is a payout manager.
     * @param authTokenProfile Profile from the auth token.
     */
    public constructor(
        personId: string | null,
        displayName: string | null,
        type: UserProfileType | null,
        organizationPermission: RemoteUserPermission | null,
        regionPermissions: Record<string, RemoteUserPermission | null> | null,
        districtPermissions: Record<string, RemoteUserPermission | null> | null,
        churchPermissions: Set<string> | null,
        eventPermissions: Set<string> | null,
        canCreateEvents: boolean,
        isPayoutManager: boolean,
        authTokenProfile: AuthTokenProfile | null) {

        this.personId = personId;
        this.displayName = displayName;
        this.type = type;
        this.organizationPermission = organizationPermission;
        this.regionPermissions = regionPermissions;
        this.districtPermissions = districtPermissions;
        this.churchPermissions = churchPermissions;
        this.eventPermissions = eventPermissions;
        this.canCreateEvents = canCreateEvents;
        this.isPayoutManager = isPayoutManager;
        this.authTokenProfile = authTokenProfile;
    }

    /**
     * Id of the person in the remote system.
     */
    public readonly personId: string | null;

    /**
     * Display name of the current user (if user is authenticated).
     */
    public readonly displayName: string | null;

    /**
     * Type of the user's profile.
     */
    public readonly type!: UserProfileType | null;

    /**
     * Organization-level permission.
     */
    public readonly organizationPermission!: RemoteUserPermission | null;

    /**
     * Region-level permissions.
     */
    public readonly regionPermissions!: Record<string, RemoteUserPermission | null> | null;

    /**
     * District-level permissions.
     */
    public readonly districtPermissions!: Record<string, RemoteUserPermission | null> | null;

    /**
     * Churches for which the user is considered an administrator.
     */
    public readonly churchPermissions!: Set<string> | null;

    /**
     * Events for which the user is considered an administrator.
     */
    public readonly eventPermissions!: Set<string> | null;

    /**
     * Value indicating whether the user can create events.
     */
    public readonly canCreateEvents!: boolean;

    /**
     * Value indicating if the user is a payout manager.
     */
    public readonly isPayoutManager!: boolean;

    /**
     * Profile from the auth token (if the user has one).
     */
    public readonly authTokenProfile: AuthTokenProfile | null;

    /**
     * Checks if the current user has organization-level permission.
     * 
     * @param minimumRestriction Minimum restriction on the permission.
     */
    public hasOrganizationPermission(
        minimumRestriction: string | null) {

        if (UserAccountProfile.hasMinimumRestriction(this.organizationPermission, minimumRestriction)) {
            return true;
        }

        return false;
    }

    /**
     * Checks if the current user has region-level permission.
     * 
     * @param regionId Id for the region.
     * @param minimumRestriction Minimum restriction on the permission.
     */
    public hasRegionPermission(
        regionId: string,
        minimumRestriction: string | null) {

        if (this.hasOrganizationPermission(minimumRestriction)) {
            return true;
        }

        if (!this.regionPermissions) {
            return false;
        }

        if (UserAccountProfile.hasMinimumRestriction(this.regionPermissions[regionId], minimumRestriction)) {
            return true;
        }

        return false;
    }

    /**
     * Checks if the current user has district-level permission.
     * 
     * @param districtId Id for the district.
     * @param regionId Id for the region.
     * @param minimumRestriction Minimum restriction on the permission.
     */
    public hasDistrictPermission(
        districtId: string,
        regionId: string,
        minimumRestriction: string | null) {

        if (this.hasRegionPermission(regionId, minimumRestriction)) {
            return true;
        }

        if (!this.districtPermissions) {
            return false;
        }

        if (UserAccountProfile.hasMinimumRestriction(this.districtPermissions[districtId], minimumRestriction)) {
            return true;
        }

        return false;
    }

    private static hasMinimumRestriction(
        permission: RemoteUserPermission | null | undefined,
        minimumRestriction: string | null): boolean {

        if (!permission) {
            return false;
        }

        const currentRestriction = permission.Restriction;
        if (!currentRestriction) {
            return true;
        }

        switch (minimumRestriction) {
            case "agjbq":
                return currentRestriction === UserPermissionRestriction.JbqOnly;
            case "agtbq":
                return currentRestriction === UserPermissionRestriction.TbqOnly;
            default:
                return false;
        }
    }
}

/**
 * Restriction on a permission.
 */
enum UserPermissionRestriction {

    /**
     * Restrict to JBQ objects.
     */
    JbqOnly = "JbqOnly",

    /**
     * Restrict to TBQ objects.
     */
    TbqOnly = "TbqOnly",
}

/**
 * Profile for the user from the auth token.
 */
export class AuthTokenProfile {

    /**
     * Creates an instance of the AuthTokenProfile.
     * @param firstName First name of the user.
     * @param lastName Last name of the user.
     * @param email E-mail address of the user.
     */
    constructor(
        firstName: string,
        lastName: string,
        email: string) {

        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
    }

    /**
     * First name of the user.
     */
    public readonly firstName: string;

    /**
     * Last name of the user.
     */
    public readonly lastName: string;

    /**
     * E-mail address of the user.
     */
    public readonly email: string;
}

/**
 * Type of popup that is currently open, if any.
 */
export enum PopupType {

    /**
     * No popup is present.
     */
    None,

    /**
     * Login popup is present.
     */
    Login,

    /**
     * Confirmation Dialog is present indicating to the user that they need to login.
     */
    LoginConfirmationDialog,

    /**
     * Logout popup is present.
     */
    Logout,

    /**
     * Login is required, but it has been disabled.
     */
    LoginRequired,
}

/**
 * Manager for auth.
 */
export class AuthManager {

    private static readonly _instance: AuthManager = new AuthManager();
    private readonly _lock: AsyncLock = new AsyncLock();

    private _resolvedClient: IPublicClientApplication | null = null;
    private _showLoginWindowFromBackground: boolean = false;

    private _accessTokenResolve: ((value: string | null | PromiseLike<string | null>) => void) | null = null;
    private _accessTokenReject: ((reason?: any) => void) | null = null

    /**
     * Private constructor for the AuthManager.
     */
    private constructor() {

        let initialProfile: UserAccountProfile | null;
        if (AuthManager.isPersistenceSupported()) {
            initialProfile = AuthManager.parseProfile(localStorage.getItem(PROFILE_STORAGE_KEY));
            AuthManager.registerProfileChangeListener();
        } else {
            initialProfile = null;
        }

        const store = map({
            profile: initialProfile,
            popupType: PopupType.None,
            isRetrievingProfile: false,
        } as AuthManagerReactState);

        privateStores.set(this, store);

        // Initialize background token renewal.
        if (AuthManager.isPersistenceSupported()) {
            this.setupPeriodicTokenRefresh();
        }
    }

    /**
     * Value indicating whether an auth popup is currently open.
     */
    public get popupType(): PopupType {
        return this.getNanoState().get().popupType;
    }

    /**
     * Value indicating whether the profile is being retrieved.
     */
    public get isRetrievingProfile(): boolean {
        return this.getNanoState().get().isRetrievingProfile;
    }

    /**
     * Value indicating whether the user is fully authenticated.
     */
    public get isAuthenticated(): boolean {
        const currentProfile = this.userProfile;
        return currentProfile !== null && currentProfile.type !== UserProfileType.NotConfigured;
    }

    /**
     * Current profile for the user (if any).
     */
    public get userProfile(): UserAccountProfile | null {
        return this.getNanoState().get().profile;
    }

    /**
     * Uses the nano store for the auth manager to trigger re-renders.
     */
    public static useNanoStore(): AuthManager {
        useStore(AuthManager._instance.getNanoState());
        return AuthManager._instance;
    }

    /**
     * Refreshes the person if the current user is the same as the parameter.
     * @param person Person to refresh.
     */
    public refreshPersonIfCurrentUser(person: Person): void {

        const currentProfile = this.userProfile;
        if (currentProfile && currentProfile.personId === person.Id) {

            const newProfile = new UserAccountProfile(
                currentProfile.personId,
                `${person.FirstName} ${person.LastName}`,
                currentProfile.type,
                currentProfile.organizationPermission ?? null,
                currentProfile.regionPermissions ?? null,
                currentProfile.districtPermissions ?? null,
                currentProfile.churchPermissions ?? null,
                currentProfile.eventPermissions ?? null,
                currentProfile.canCreateEvents ?? false,
                currentProfile.isPayoutManager ?? false,
                currentProfile.authTokenProfile ?? null);
            AuthManager.saveProfile(newProfile);

            this.getNanoState().setKey("profile", newProfile);
        }
    }

    /**
     * Starts the login flow.
     */
    public async login(): Promise<void> {

        const client = await this.getInitializedClient();

        const state = this.getNanoState();
        state.setKey("popupType", PopupType.Login);
        state.setKey("isRetrievingProfile", true);

        return new Promise<void>((resolve) => {
            client
                .loginPopup({
                    scopes: TOKEN_SCOPES,
                    prompt: 'select_account',
                    state: window.location.pathname,
                    extraQueryParameters: {
                        // Request offline access for refresh tokens
                        "access_type": "offline"
                    }
                })
                .then((tokenResponse: AuthenticationResult) => {

                    // Persist the result of the login.
                    client.setActiveAccount(
                        tokenResponse?.account ?? null,
                    );

                    const tokenProfile = AuthManager.getAuthTokenProfile(tokenResponse.account);

                    this.retrieveRemoteProfile(tokenResponse.accessToken, tokenProfile)
                        .then(resolve);
                })
                .catch((error) => {

                    console.log(error);

                    state.setKey("popupType", PopupType.None);
                    state.setKey("isRetrievingProfile", false);

                    if (this._accessTokenReject) {
                        this._accessTokenReject(error);
                        resolve();
                    }
                    else {
                        resolve();
                    }

                    this._accessTokenResolve = null;
                    this._accessTokenReject = null;
                });
        });
    }

    /**
     * Starts the logout flow.
     */
    public async logout(): Promise<void> {

        const client = await this.getInitializedClient();

        this.getNanoState().setKey("popupType", PopupType.Logout);

        return client
            .logoutPopup({
                state: window.location.pathname
            })
            .then(() => {
                AuthManager.saveProfile(null);

                const state = this.getNanoState();
                state.setKey("popupType", PopupType.None);
                state.setKey("profile", null);
            })
            .catch((error) => {
                console.log(error);

                this.getNanoState().setKey("popupType", PopupType.None);
            });
    }

    /**
     * Retrieves the latest access token for the current user. If the user was signed in, but their
     * token expired, this may display a popup for the user to sign in again.
     * @param isBackground Value indicating whether this is a background process.
     * @returns The latest access token or null if not available.
     */
    public async getLatestAccessToken(isBackground: boolean = false): Promise<string | null> {

        return new Promise<string | null>(
            async (resolve, reject) => {
                const client = await this.getInitializedClient(isBackground);

                const activeAccount: AccountInfo | null = client.getActiveAccount();
                if (!activeAccount) {
                    return resolve(null);
                }

                try {
                    const tokenResponse = await client
                        .acquireTokenSilent({
                            scopes: TOKEN_SCOPES,
                            account: activeAccount,
                            forceRefresh: false, // Allow cached tokens
                        });

                    resolve(tokenResponse.accessToken);
                }
                catch (error: any) {

                    // If the resolve/reject is already present, this might be an infinite loop.
                    if (this._accessTokenResolve || this._accessTokenReject) {
                        console.log("Already attempting to get a new access token. Failing to avoid an infinite loop.");
                        reject(error);
                        return;
                    }

                    // Check if this is a consent required or interaction required error
                    if (error.errorCode === "consent_required" ||
                        error.errorCode === "interaction_required" ||
                        error.errorCode === "login_required") {

                        console.log("Token acquisition requires interaction, prompting user to sign in again");
                    }

                    if (!isBackground || this._showLoginWindowFromBackground) {
                        // It's possible the user is no longer signed in. In this case, save the resolve
                        // and reject so the user can be prompted to sign in again.
                        if (!isBackground) {
                            this._accessTokenResolve = resolve;
                            this._accessTokenReject = reject;
                        }

                        this.getNanoState().setKey("popupType", PopupType.LoginConfirmationDialog);
                    }
                    else {
                        this.getNanoState().setKey("popupType", PopupType.LoginRequired);
                    }
                }
            });
    }

    /**
     * Refreshes the remote profile for the user.
     */
    public async refreshRemoteProfile(): Promise<void> {
        const accessToken = await this.getLatestAccessToken();
        if (!accessToken) {
            throw new Error("No access token available to refresh the profile.");
        }

        return this.retrieveRemoteProfile(accessToken, this.userProfile?.authTokenProfile ?? null);
    }

    /**
     * Enable the login window to appear if required by the background refresh.
     */
    public showLoginWindowFromBackground(): void {
        this._showLoginWindowFromBackground = true;
    }

    /**
     * Causes the login to be displayed.
     */
    public requireLoginWindow(): void {
        this.getNanoState().setKey("popupType", PopupType.LoginConfirmationDialog);
    }

    /**
     * Set up periodic token refresh to prevent expiration
     */
    private setupPeriodicTokenRefresh(): void {

        // Delay setup to allow the static instance to be fully constructed.
        setTimeout(() => {
            // Renew the token once.
            this.renewTokenWithoutError();

            // Refresh token every 30 minutes (tokens typically last 1 hour)
            setInterval(this.renewTokenWithoutError, 5 * 60 * 1000); // 30 minutes
        }, 5);
    }

    private async renewTokenWithoutError(): Promise<void> {

        if (this !== AuthManager._instance) {
            // Only do the renewal on the singleton instance.
            return;
        }

        await this._lock.acquireOrWait();
        try {
            await this.getLatestAccessToken(true);
        } catch (error) {
            console.log("Periodic token refresh failed:", error);
        }
        finally {
            this._lock.release();
        }
    }

    private async retrieveRemoteProfile(
        accessToken: string,
        tokenProfile: AuthTokenProfile | null): Promise<void> {

        const response = await fetch(
            "https://registration.biblequiz.com/api/v1.0/users/profile",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            });

        const remoteProfile = await response.json() as RemoteUserProfile;

        const newProfile = new UserAccountProfile(
            remoteProfile.PersonId,
            remoteProfile.Name,
            remoteProfile.Type,
            remoteProfile.OrganizationPermission ?? null,
            remoteProfile.RegionPermissions ?? null,
            remoteProfile.DistrictPermissions ?? null,
            remoteProfile.ChurchPermissions ?? null,
            remoteProfile.EventPermissions ?? null,
            remoteProfile.CanCreateEvents ?? false,
            remoteProfile.IsPayoutManager ?? false,
            tokenProfile);

        AuthManager.saveProfile(newProfile);

        const state = this.getNanoState();
        state.setKey("popupType", PopupType.None);
        state.setKey("isRetrievingProfile", false);
        state.setKey("profile", newProfile);

        if (this._accessTokenResolve) {
            this._accessTokenResolve(accessToken);
            this._accessTokenResolve = null;
            this._accessTokenReject = null;
        }
    }

    private static getAuthTokenProfile(account: AccountInfo): AuthTokenProfile | null {

        const fullName = account.name || "";
        if (!fullName || fullName.trim().length === 0) {
            return null;
        }

        let firstName = "";
        let lastName = "";

        // Split by spaces, remove empty entries, and trim each part
        const parts = fullName
            .split(" ")
            .map(part => part.trim())
            .filter(part => part.length > 0);

        if (parts.length > 0) {
            if (parts.length > 1) {
                firstName = parts.slice(0, parts.length - 1).join(" ");
                lastName = parts[parts.length - 1];
            } else {
                firstName = fullName.trim();
            }
        }

        const lastSpaceInFirstName = firstName.lastIndexOf(" ");
        const parenthesisInLastName = lastName.lastIndexOf("(");
        if (lastSpaceInFirstName > 0 && parenthesisInLastName >= 0) {
            lastName = `${firstName.substring(lastSpaceInFirstName + 1)} ${lastName}`;
            firstName = firstName.substring(0, lastSpaceInFirstName);
        }

        return new AuthTokenProfile(firstName, lastName, account.username);
    }

    private static parseProfile(serialized: string | null): UserAccountProfile | null {

        if (serialized) {
            const serializedProfile = JSON.parse(serialized) as SerializedAccountProfile;
            if (serializedProfile) {
                return new UserAccountProfile(
                    serializedProfile.personId,
                    serializedProfile.displayName,
                    serializedProfile.type,
                    serializedProfile.organizationPermission ?? null,
                    serializedProfile.regionPermissions ?? null,
                    serializedProfile.districtPermissions ?? null,
                    serializedProfile.churchPermissions ?? null,
                    serializedProfile.eventPermissions ?? null,
                    serializedProfile.canCreateEvents ?? false,
                    serializedProfile.isPayoutManager ?? false,
                    serializedProfile.authTokenProfile);
            }
        }

        return null;
    }

    private static saveProfile(profile: UserAccountProfile | null) {

        if (!AuthManager.isPersistenceSupported()) {
            return;
        }

        if (profile) {

            const serializedProfile: SerializedAccountProfile = {
                personId: profile.personId,
                displayName: profile.displayName,
                type: profile.type,
                organizationPermission: profile.organizationPermission,
                regionPermissions: profile.regionPermissions,
                districtPermissions: profile.districtPermissions,
                churchPermissions: profile.churchPermissions,
                eventPermissions: profile.eventPermissions,
                canCreateEvents: profile.canCreateEvents,
                isPayoutManager: profile.isPayoutManager,
                authTokenProfile: profile.authTokenProfile
            };

            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(serializedProfile));
        } else {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
    }

    private static registerProfileChangeListener(): void {
        if (!AuthManager.isPersistenceSupported()) {
            return;
        }

        // Add listener for changes to the profile in other tabs.
        window.addEventListener(
            "storage",
            (event: StorageEvent) => {
                if (event.key === PROFILE_STORAGE_KEY) {
                    console.log("Detected change to user profile in another tab.");
                    AuthManager._instance.getNanoState().setKey(
                        "profile",
                        AuthManager.parseProfile(event.newValue));
                }
            });
    }

    private static isPersistenceSupported(): boolean {
        return typeof window === "undefined" || !window.localStorage
            ? false
            : true;
    }

    private async getInitializedClient(skipLock: boolean = false): Promise<IPublicClientApplication> {

        if (this._resolvedClient) {
            return this._resolvedClient;
        }

        if (!skipLock) {
            await this._lock.acquireOrWait();
        }

        try {
            if (this._resolvedClient) {
                return this._resolvedClient;
            }

            const redirectUri = typeof window !== "undefined"
                ? window.location.origin + REDIRECT_PATH
                : `https://biblequiz.com${REDIRECT_PATH}`;

            this._resolvedClient = await PublicClientApplication.createPublicClientApplication({
                auth: {
                    clientId: "1058ea35-28ff-4b8a-953a-269f36d90235", // This is the ONLY mandatory field that you need to supply.
                    authority: "https://biblequizusers.ciamlogin.com/", // Replace the placeholder with your tenant subdomain
                    redirectUri: redirectUri, // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
                    // postLogoutRedirectUri: "/", // Indicates the page to navigate after logout.
                    navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
                },
                cache: {
                    cacheLocation: "localStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
                    storeAuthStateInCookie: true, // Set this to "true" if you are having issues on IE11 or Edge or want better persistence
                    secureCookies: true, // Set this to "true" to enable secure cookies in browsers that support it (e.g., Chrome, Firefox, Edge). This is recommended for production environments.
                    claimsBasedCachingEnabled: true, // Enable claims-based caching for better token management
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (
                            level: LogLevel,
                            message: string,
                            containsPii: boolean,
                        ) => {
                            if (containsPii) {
                                return;
                            }
                            switch (level) {
                                case LogLevel.Error:
                                    console.error(message);
                                    return;
                                case LogLevel.Info:
                                    console.info(message);
                                    return;
                                case LogLevel.Verbose:
                                    console.debug(message);
                                    return;
                                case LogLevel.Warning:
                                    console.warn(message);
                                    return;
                                default:
                                    return;
                            }
                        },
                    },
                },
            });
        } finally {
            if (!skipLock) {
                this._lock.release();
            }
        }

        return this._resolvedClient;
    }

    private getNanoState(): PreinitializedMapStore<AuthManagerReactState> {
        return privateStores.get(this)!;
    }
}

/**
 * User profile information from the service.
 */
class RemoteUserProfile {

    /**
     * Id for the person within the system.
     */
    public readonly PersonId!: string | null;

    /**
     * Display name for the user.
     */
    public readonly Name!: string | null;

    /**
     * Type of the user's profile.
     */
    public readonly Type!: UserProfileType;

    /**
     * Organization-level permission.
     */
    public readonly OrganizationPermission!: RemoteUserPermission | null;

    /**
     * Region-level permissions.
     */
    public readonly RegionPermissions!: Record<string, RemoteUserPermission | null> | null;

    /**
     * District-level permissions.
     */
    public readonly DistrictPermissions!: Record<string, RemoteUserPermission | null> | null;

    /**
     * Churches for which the user is considered an administrator.
     */
    public readonly ChurchPermissions!: Set<string> | null;

    /**
     * Events for which the user is considered an administrator.
     */
    public readonly EventPermissions!: Set<string> | null;

    /**
     * Value indicating whether the user can create events.
     */
    public readonly CanCreateEvents!: boolean;

    /**
     * Value indicating if the user is a payout manager.
     */
    public readonly IsPayoutManager!: boolean;
}

/**
 * Permission for a user.
 */
class RemoteUserPermission {

    /**
     * Restriction on the permission (if any).
     */
    public readonly Restriction!: UserPermissionRestriction | null;
}

/**
 * Type of the user's profile.
 */
export enum UserProfileType {

    /**
     * User hasn't been configured yet.
     */
    NotConfigured = "NotConfigured",

    /**
     * Administrator for the organization.
     */
    OrganizationAdmin = "OrganizationAdmin",

    /**
     * Administrator for one or more regions.
     */
    RegionAdmin = "RegionAdmin",

    /**
     * Administrator for one or more districts.
     */
    DistrictAdmin = "DistrictAdmin",

    /**
     * Administrator for one or more churches.
     */
    ChurchAdmin = "ChurchAdmin",
}

interface SerializedAccountProfile {
    personId: string | null;
    displayName: string | null;
    type: UserProfileType | null;
    organizationPermission: RemoteUserPermission | null;
    regionPermissions: Record<string, RemoteUserPermission | null> | null;
    districtPermissions: Record<string, RemoteUserPermission | null> | null;
    churchPermissions: Set<string> | null;
    eventPermissions: Set<string> | null;
    canCreateEvents: boolean;
    isPayoutManager: boolean;
    authTokenProfile: AuthTokenProfile | null;
    hasDisplayedSignUpDialog?: boolean;
}
