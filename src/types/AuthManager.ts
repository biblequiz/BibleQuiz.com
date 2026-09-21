import { BrowserCacheLocation, LogLevel, PublicClientApplication, type AccountInfo, type AuthenticationResult, type IPublicClientApplication } from "@azure/msal-browser";
import type { Person } from 'types/services/PeopleService';
import { AuthService } from './services/AuthService';
import { AsyncLock } from 'utils/AsyncLock';
import { map, type PreinitializedMapStore } from "nanostores";
import { useStore } from "@nanostores/react";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { RemoteServiceUrlBase, RemoteServiceUtility } from "./services/RemoteServiceUtility";

const PROFILE_STORAGE_KEY = "auth-user-profile--";
const IMPERSONATION_STORAGE_KEY = "auth-impersonation--";
const BACKGROUND_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Deliberately below the interval: the tick renews the token before it checks the profile, so a
// max age equal to the interval is never quite reached and the refresh lands on alternate ticks.
const PROFILE_MAX_AGE_MS = BACKGROUND_REFRESH_INTERVAL_MS - (30 * 1000);
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

    /**
     * Current impersonation state.
     */
    impersonation: ImpersonationState | null;
}

interface ImpersonationState {

    /**
     * Id of the user currently being impersonated.
     */
    impersonatedId: string;

    /**
     * Original profile to restore when impersonation stops.
     */
    originalProfile: UserAccountProfile | null;
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
     * @param retrievedAt Time (in epoch milliseconds) the profile was retrieved from the service.
     */
    public constructor(
        personId: string | null,
        displayName: string | null,
        type: UserProfileType | null,
        organizationPermission: RemoteUserPermission | null,
        regionPermissions: Record<string, RemoteUserPermission | null> | null,
        districtPermissions: Record<string, RemoteUserPermission | null> | null,
        churchPermissions: Set<string> | string[] | null,
        eventPermissions: Set<string> | string[] | null,
        canCreateEvents: boolean,
        isPayoutManager: boolean,
        authTokenProfile: AuthTokenProfile | null,
        retrievedAt: number) {

        this.personId = personId;
        this.displayName = displayName;
        this.type = type;
        this.organizationPermission = organizationPermission;
        this.regionPermissions = regionPermissions;
        this.districtPermissions = districtPermissions;
        this.churchPermissions = DataTypeHelpers.normalizeToSet(churchPermissions);
        this.eventPermissions = DataTypeHelpers.normalizeToSet(eventPermissions);
        this.canCreateEvents = canCreateEvents;
        this.canManageEvents = canCreateEvents || (this.eventPermissions !== null && this.eventPermissions.size > 0);
        this.isPayoutManager = isPayoutManager;
        this.authTokenProfile = authTokenProfile;
        this.retrievedAt = retrievedAt;
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
     * Value indicating whether the user can manage events.
     */
    public readonly canManageEvents!: boolean;

    /**
     * Value indicating if the user is a payout manager.
     */
    public readonly isPayoutManager!: boolean;

    /**
     * Profile from the auth token (if the user has one).
     */
    public readonly authTokenProfile: AuthTokenProfile | null;

    /**
     * Time (in epoch milliseconds) at which the profile was retrieved from the service. Permissions
     * are granted and revoked remotely, so a cached profile goes stale and has to be refreshed.
     */
    public readonly retrievedAt: number;

    /**
     * Determines whether the profile is older than the supplied age.
     *
     * @param maxAgeMs Maximum age (in milliseconds) for which the profile is considered current.
     */
    public isStale(maxAgeMs: number = PROFILE_MAX_AGE_MS): boolean {
        return (Date.now() - this.retrievedAt) >= maxAgeMs;
    }

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
        let initialImpersonation: ImpersonationState | null;
        if (AuthManager.isPersistenceSupported()) {
            initialProfile = AuthManager.parseProfile(localStorage.getItem(PROFILE_STORAGE_KEY));
            initialImpersonation = AuthManager.parseImpersonationState(localStorage.getItem(IMPERSONATION_STORAGE_KEY));
            AuthManager.registerProfileChangeListener();
        } else {
            initialProfile = null;
            initialImpersonation = null;
        }

        const store = map({
            profile: initialProfile,
            impersonation: initialImpersonation,
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
     * Value indicating whether the user is currently impersonating another user.
     */
    public get isImpersonating(): boolean {
        return this.getNanoState().get().impersonation !== null;
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
                currentProfile.authTokenProfile ?? null,
                currentProfile.retrievedAt);
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

                    if (isBackground) {
                        // Nothing will resolve the promise on behalf of a background caller, so it
                        // has to be settled here or the caller waits forever (holding the lock).
                        resolve(null);
                    }
                }
            });
    }

    /**
     * Refreshes the cached profile from the service if it is older than the supplied age.
     *
     * Permissions are granted and revoked remotely, so a browser that stays signed in would
     * otherwise keep the profile it captured when the user logged in. This runs quietly in the
     * background: it never prompts for sign-in, and a failure leaves the cached profile in place.
     *
     * @param maxAgeMs Maximum age (in milliseconds) for which the cached profile is kept.
     */
    public async refreshRemoteProfileIfStale(maxAgeMs: number = PROFILE_MAX_AGE_MS): Promise<void> {

        const currentProfile = this.userProfile;
        if (!currentProfile || !currentProfile.isStale(maxAgeMs)) {
            return;
        }

        const state = this.getNanoState();
        if (!AuthManager.isProfileIdle(state.get())) {
            // A sign-in, sign-out or impersonation change is in flight and owns the profile.
            return;
        }

        try {
            const accessToken = await this.getLatestAccessToken(true);
            if (!accessToken) {
                return;
            }

            const newProfile = await this.fetchRemoteProfile(
                accessToken,
                currentProfile.authTokenProfile ?? null);

            if (!AuthManager.isProfileIdle(state.get()) || this.userProfile !== currentProfile) {
                // One of those flows ran while the profile was being retrieved, so the response is
                // already out of date - a completed sign-out would otherwise be undone by it.
                return;
            }

            AuthManager.saveProfile(newProfile);
            state.setKey("profile", newProfile);
        } catch (error) {
            // Leave the cached profile in place. The next refresh will try again.
            console.log("Background profile refresh failed:", error);
        }
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
     * Stores impersonation state locally and refreshes the active profile.
     * @param impersonatedId Id of the user being impersonated.
     */
    public async startImpersonating(impersonatedId: string): Promise<void> {
        const originalProfile = this.userProfile;
        if (!originalProfile) {
            throw new Error("A signed-in profile is required before impersonation can start.");
        }

        const accessToken = await this.getLatestAccessToken();
        if (!accessToken) {
            throw new Error("No access token available to start impersonation.");
        }

        this.getNanoState().setKey("isRetrievingProfile", true);
        await this.retrieveRemoteProfile(accessToken, originalProfile.authTokenProfile ?? null);

        const impersonationState: ImpersonationState = {
            impersonatedId,
            originalProfile,
        };

        AuthManager.saveImpersonationState(impersonationState);
        this.getNanoState().setKey("impersonation", impersonationState);
    }

    /**
     * Stops impersonation and restores the original active profile.
     */
    public async stopImpersonating(): Promise<void> {
        const state = this.getNanoState();
        const impersonation = state.get().impersonation;
        if (!impersonation) {
            return;
        }

        state.setKey("isRetrievingProfile", true);
        try {
            await AuthService.impersonate(this, null);

            AuthManager.saveImpersonationState(null);
            AuthManager.saveProfile(impersonation.originalProfile);

            state.setKey("impersonation", null);
            state.setKey("popupType", PopupType.None);
            state.setKey("profile", impersonation.originalProfile);
        }
        finally {
            state.setKey("isRetrievingProfile", false);
        }
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
     * Set up the periodic token and profile refresh to prevent expiration and stale permissions.
     */
    private setupPeriodicTokenRefresh(): void {

        // Delay setup to allow the static instance to be fully constructed.
        setTimeout(() => {
            // Renew the token and refresh the profile once for this page load.
            this.runBackgroundRefresh();

            // Renew the token every 5 minutes (tokens typically last 1 hour). The arrow function
            // is required so the interval runs against the instance instead of the global scope.
            setInterval(() => this.runBackgroundRefresh(), BACKGROUND_REFRESH_INTERVAL_MS);
        }, 5);
    }

    /**
     * Renews the access token and refreshes the cached profile when it has gone stale.
     */
    private async runBackgroundRefresh(): Promise<void> {
        await this.renewTokenWithoutError();
        await this.refreshRemoteProfileIfStale();
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

    private async fetchRemoteProfile(
        accessToken: string,
        tokenProfile: AuthTokenProfile | null): Promise<UserAccountProfile> {

        const response = await fetch(
            RemoteServiceUtility.buildUrl(
                RemoteServiceUrlBase.Registration,
                "api/v1.0/users/profile",
                null),
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                }
            });

        if (!response.ok) {
            throw new Error("Unable to retrieve the latest user profile.");
        }

        const remoteProfile = await response.json() as RemoteUserProfile;

        return new UserAccountProfile(
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
            tokenProfile,
            Date.now());
    }

    private async retrieveRemoteProfile(
        accessToken: string,
        tokenProfile: AuthTokenProfile | null): Promise<void> {
        const state = this.getNanoState();
        try {
            const newProfile = await this.fetchRemoteProfile(accessToken, tokenProfile);

            AuthManager.saveProfile(newProfile);

            state.setKey("popupType", PopupType.None);
            state.setKey("profile", newProfile);

            if (this._accessTokenResolve) {
                this._accessTokenResolve(accessToken);
                this._accessTokenResolve = null;
                this._accessTokenReject = null;
            }
        }
        finally {
            state.setKey("isRetrievingProfile", false);
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
            return AuthManager.deserializeProfile(serializedProfile);
        }

        return null;
    }

    private static parseImpersonationState(serialized: string | null): ImpersonationState | null {

        if (!serialized) {
            return null;
        }

        const parsed = JSON.parse(serialized) as SerializedImpersonationState;
        return {
            impersonatedId: parsed.impersonatedId,
            originalProfile: AuthManager.deserializeProfile(parsed.originalProfile),
        };
    }

    private static saveProfile(profile: UserAccountProfile | null) {

        if (!AuthManager.isPersistenceSupported()) {
            return;
        }

        if (profile) {
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(AuthManager.serializeProfile(profile)));
        } else {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
    }

    private static saveImpersonationState(impersonation: ImpersonationState | null): void {

        if (!AuthManager.isPersistenceSupported()) {
            return;
        }

        if (impersonation) {
            const serialized: SerializedImpersonationState = {
                impersonatedId: impersonation.impersonatedId,
                originalProfile: AuthManager.serializeProfile(impersonation.originalProfile),
            };

            localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(serialized));
        } else {
            localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        }
    }

    private static serializeProfile(profile: UserAccountProfile | null): SerializedAccountProfile | null {

        if (!profile) {
            return null;
        }

        return {
            personId: profile.personId,
            displayName: profile.displayName,
            type: profile.type,
            organizationPermission: profile.organizationPermission,
            regionPermissions: profile.regionPermissions,
            districtPermissions: profile.districtPermissions,
            // JSON.stringify turns a Set into {}, which reads back as an empty set and silently
            // drops the user's church and event permissions.
            churchPermissions: profile.churchPermissions === null
                ? null
                : [...profile.churchPermissions],
            eventPermissions: profile.eventPermissions === null
                ? null
                : [...profile.eventPermissions],
            canCreateEvents: profile.canCreateEvents,
            isPayoutManager: profile.isPayoutManager,
            authTokenProfile: profile.authTokenProfile,
            retrievedAt: profile.retrievedAt,
        };
    }

    private static deserializeProfile(serializedProfile: SerializedAccountProfile | null | undefined): UserAccountProfile | null {

        if (!serializedProfile) {
            return null;
        }

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
            serializedProfile.authTokenProfile,
            // A profile cached before this field existed is always treated as stale.
            serializedProfile.retrievedAt ?? 0);
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

                if (event.key === IMPERSONATION_STORAGE_KEY) {
                    console.log("Detected impersonation change in another tab.");
                    AuthManager._instance.getNanoState().setKey(
                        "impersonation",
                        AuthManager.parseImpersonationState(event.newValue));
                }
            });
    }

    private static isProfileIdle(state: AuthManagerReactState): boolean {
        return state.popupType === PopupType.None && !state.isRetrievingProfile;
    }

    private static isPersistenceSupported(): boolean {
        if (typeof window === "undefined") {
            return false;
        }

        try {
            const storage = window.localStorage;
            const probeKey = "auth-storage-probe--";
            storage.setItem(probeKey, probeKey);
            storage.removeItem(probeKey);
            return true;
        } catch {
            return false;
        }
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
                    cacheLocation: AuthManager.isPersistenceSupported()
                        ? BrowserCacheLocation.LocalStorage
                        : BrowserCacheLocation.MemoryStorage,
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
    churchPermissions: string[] | null;
    eventPermissions: string[] | null;
    canCreateEvents: boolean;
    isPayoutManager: boolean;
    authTokenProfile: AuthTokenProfile | null;
    retrievedAt?: number;
    hasDisplayedSignUpDialog?: boolean;
}

interface SerializedImpersonationState {
    impersonatedId: string;
    originalProfile: SerializedAccountProfile | null;
}
