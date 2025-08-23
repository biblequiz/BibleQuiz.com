import { LogLevel, PublicClientApplication, type AccountInfo, type AuthenticationResult, type IPublicClientApplication } from "@azure/msal-browser";
import type { Person } from "./services/PeopleService";
import { AsyncLock } from "../utils/AsyncLock";
import { map, type PreinitializedMapStore, type WritableAtom } from "nanostores";
import { useStore } from "@nanostores/react";
import Auth from "../pages/auth.astro";

const PROFILE_STORAGE_KEY = "auth-user-profile--";
const TOKEN_SCOPES = ["offline_access", "1058ea35-28ff-4b8a-953a-269f36d90235/.default"];

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
     * @param isJbqAdmin Value indicating whether the user is a JBQ administrator.
     * @param isTbqAdmin Value indicating whether the user is a TBQ administrator.
     * @param authTokenProfile Profile from the auth token.
     * @param hasSignUpDialogDisplayed Value indicating whether the sign-up dialog has been displayed.
     */
    public constructor(
        personId: string | null,
        displayName: string | null,
        type: UserProfileType | null,
        isJbqAdmin: boolean,
        isTbqAdmin: boolean,
        authTokenProfile: AuthTokenProfile | null,
        hasSignUpDialogDisplayed: boolean) {

        this.personId = personId;
        this.displayName = displayName;
        this.type = type;
        this.isJbqAdmin = isJbqAdmin;
        this.isTbqAdmin = isTbqAdmin;
        this.authTokenProfile = authTokenProfile;
        this.hasSignUpDialogDisplayed = hasSignUpDialogDisplayed;
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
     * Value indicating whether the user is a JBQ administrator.
     */
    public readonly isJbqAdmin: boolean;

    /**
     * Value indicating whether the user is a TBQ administrator.
     */
    public readonly isTbqAdmin: boolean;

    /**
     * Profile from the auth token (if the user has one).
     */
    public readonly authTokenProfile: AuthTokenProfile | null;

    /**
     * Value indicating whether the sign-up dialog has been displayed.
     */
    public readonly hasSignUpDialogDisplayed: boolean;
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
    Logout
}

/**
 * Manager for auth.
 */
export class AuthManager {

    private static readonly _instance: AuthManager = new AuthManager();

    private readonly _lock: AsyncLock = new AsyncLock();

    private _resolvedClient: IPublicClientApplication | null = null;

    private _accessTokenResolve: ((value: string | null | PromiseLike<string | null>) => void) | null = null;
    private _accessTokenReject: ((reason?: any) => void) | null = null

    /**
     * Private constructor for the AuthManager.
     */
    private constructor() {

        const store = map({
            profile: AuthManager.loadProfile(),
            popupType: PopupType.None,
            isRetrievingProfile: false,
            loginResolve: null,
            loginReject: null
        } as AuthManagerReactState);

        privateStores.set(this, store);
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
                currentProfile.isJbqAdmin ?? false,
                currentProfile.isTbqAdmin ?? false,
                currentProfile.authTokenProfile ?? null,
                currentProfile.hasSignUpDialogDisplayed);
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

        return new Promise<void>((resolve, reject) => {
            client
                .loginPopup({
                    scopes: TOKEN_SCOPES,
                    prompt: 'select_account',
                    state: window.location.pathname
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
     * @returns The latest access token or null if not available.
     */
    public async getLatestAccessToken(): Promise<string | null> {

        return new Promise<string | null>(
            async (resolve, reject) => {
                const client = await this.getInitializedClient();

                const activeAccount: AccountInfo | null = client.getActiveAccount();
                if (!activeAccount) {
                    return Promise.resolve(null);
                }

                try {
                    const tokenResponse = await client
                        .acquireTokenSilent({
                            scopes: TOKEN_SCOPES,
                            account: activeAccount,
                        });

                    resolve(tokenResponse.accessToken);
                }
                catch (error) {

                    // If the resolve/reject is already present, this might be an infinite loop.
                    if (this._accessTokenResolve || this._accessTokenReject) {
                        console.log("Already attempting to get a new access token. Failing to avoid an infinite loop.");
                        reject(error);
                        return;
                    }

                    // It's possible the user is no longer signed in. In this case, save the resolve
                    // and reject so the user can be prompted to sign in again.
                    this._accessTokenResolve = resolve;
                    this._accessTokenReject = reject;

                    this.getNanoState().setKey("popupType", PopupType.LoginConfirmationDialog);
                }
            });
    }

    /**
     * Marks the sign-up dialog as displayed.
     */
    public markDisplaySignUpDialogAsDisplayed() {

        const currentProfile = this.userProfile;

        if (currentProfile) {
            const newProfile = new UserAccountProfile(
                currentProfile.personId,
                currentProfile.displayName,
                currentProfile.type,
                currentProfile.isJbqAdmin ?? false,
                currentProfile.isTbqAdmin ?? false,
                currentProfile.authTokenProfile ?? null,
                true);
            AuthManager.saveProfile(newProfile);

            this.getNanoState().setKey("profile", newProfile);
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

    private retrieveRemoteProfile(
        accessToken: string,
        tokenProfile: AuthTokenProfile | null): Promise<void> {

        return fetch("https://registration.biblequiz.com/api/v1.0/users/profile", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            }
        })
            .then(response => response.json())
            .then((remoteProfile: RemoteUserProfile) => {

                const newProfile = new UserAccountProfile(
                    remoteProfile.PersonId,
                    remoteProfile.Name,
                    remoteProfile.Type,
                    remoteProfile.IsJbqAdmin,
                    remoteProfile.IsTbqAdmin,
                    tokenProfile,
                    false);

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
            });
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

    private static loadProfile(): UserAccountProfile | null {

        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }

        const serialized = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (serialized) {
            const serializedProfile = JSON.parse(serialized) as SerializedAccountProfile;
            if (serializedProfile) {
                return new UserAccountProfile(
                    serializedProfile.personId,
                    serializedProfile.displayName,
                    serializedProfile.type,
                    serializedProfile.isJbqAdmin,
                    serializedProfile.isTbqAdmin,
                    serializedProfile.authTokenProfile,
                    serializedProfile.hasDisplayedSignUpDialog ?? false);
            }
        }

        return null;
    }

    private static saveProfile(profile: UserAccountProfile | null) {

        if (typeof window === "undefined" || !window.localStorage) {
            return;
        }

        if (profile) {

            const serializedProfile: SerializedAccountProfile = {
                personId: profile.personId,
                displayName: profile.displayName,
                type: profile.type,
                isJbqAdmin: profile.isJbqAdmin,
                isTbqAdmin: profile.isTbqAdmin,
                authTokenProfile: profile.authTokenProfile,
                hasDisplayedSignUpDialog: profile.hasSignUpDialogDisplayed
            };

            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(serializedProfile));
        } else {
            localStorage.removeItem(PROFILE_STORAGE_KEY);
        }
    }

    private async getInitializedClient(): Promise<IPublicClientApplication> {

        if (this._resolvedClient) {
            return this._resolvedClient;
        }

        await this._lock.acquireOrWait();
        try {
            this._resolvedClient = await PublicClientApplication.createPublicClientApplication({
                auth: {
                    clientId: "1058ea35-28ff-4b8a-953a-269f36d90235", // This is the ONLY mandatory field that you need to supply.
                    authority: "https://biblequizusers.ciamlogin.com/", // Replace the placeholder with your tenant subdomain
                    redirectUri: window.location.origin + REDIRECT_PATH, // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
                    // postLogoutRedirectUri: "/", // Indicates the page to navigate after logout.
                    navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
                },
                cache: {
                    cacheLocation: "localStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
                    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
                    secureCookies: true, // Set this to "true" to enable secure cookies in browsers that support it (e.g., Chrome, Firefox, Edge). This is recommended for production environments.
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
            this._lock.release();
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
     * Value indicating whether the user is a TBQ administrator.
     */
    public readonly IsTbqAdmin!: boolean;

    /**
     * Value indicating whether the user is a JBQ administrator.
     */
    public readonly IsJbqAdmin!: boolean;
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
    isJbqAdmin: boolean;
    isTbqAdmin: boolean;
    authTokenProfile: AuthTokenProfile | null;
    hasDisplayedSignUpDialog?: boolean;
}
