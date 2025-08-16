import type { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";

const PROFILE_STORAGE_KEY = "auth-user-profile--";
const TOKEN_SCOPES = ["offline_access", "1058ea35-28ff-4b8a-953a-269f36d90235/.default"];

/**
 * Manager for auth.
 */
export class AuthManager {

    private readonly _client: IPublicClientApplication | null;
    private readonly _profile: UserAccountProfile | null;
    private readonly _stateChangedCallback: (client: IPublicClientApplication | null, state: any | null) => void;

    private readonly _popupType: PopupType = PopupType.None;
    private readonly _isRetrievingProfile: boolean = false;

    /**
     * Creates a new instance of the AuthManager.
     * @param client Initialized MSAL client.
     * @param state The current user state.
     * @param stateChangedCallback Callback to invoke when the state changes.
     */
    public constructor(
        client: IPublicClientApplication | null,
        state: any | null,
        stateChangedCallback: (client: IPublicClientApplication | null, state: any | null) => void) {

        if (!state) {
            this._profile = AuthManager.loadProfile();
            this._popupType = PopupType.None;
            this._isRetrievingProfile = false;
        }
        else {
            this._profile = state.profile;
            this._popupType = state.popupType ?? PopupType.None;
            this._isRetrievingProfile = state.isRetrievingProfile ?? false;
        }

        this._client = client;
        this._stateChangedCallback = stateChangedCallback;
    }

    /**
     * Value indicating whether the auth manager is ready for auth activity. If this is false,
     * only the userProfile will be available.
     */
    public get isReady(): boolean {
        return this._client !== null;
    }

    /**
     * Value indicating whether an auth popup is currently open.
     */
    public get popupType(): PopupType {
        return this._popupType;
    }

    /**
     * Value indicating whether the profile is being retrieved.
     */
    public get isRetrievingProfile(): boolean {
        return this._isRetrievingProfile;
    }

    /**
     * Value indicating whether the user is fully authenticated.
     */
    public get isAuthenticated(): boolean {
        return this._profile !== null && this._profile.type !== UserProfileType.NotConfigured;
    }

    /**
     * Current profile for the user (if any).
     */
    public get userProfile(): UserAccountProfile | null {
        return this._profile;
    }

    /**
     * Starts the login flow.
     */
    public login(): Promise<void | AuthenticationResult> {
        if (!this._client) {
            return Promise.reject(new Error("Auth client is not initialized."));
        }

        this._stateChangedCallback(this._client, { popupType: PopupType.Login, isRetrievingProfile: true, profile: null });

        return this._client
            .loginPopup({
                scopes: TOKEN_SCOPES,
                prompt: 'select_account',
                state: window.location.pathname
            })
            .then((tokenResponse: AuthenticationResult) => {

                // Persist the result of the login.
                this._client!.setActiveAccount(
                    tokenResponse?.account ?? null,
                );

                const tokenProfile = AuthManager.getAuthTokenProfile(tokenResponse.account);

                fetch("https://registration.biblequiz.com/api/v1.0/users/profile", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${tokenResponse.idToken}`,
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
                        this._stateChangedCallback(this._client, { popupType: PopupType.None, isRetrievingProfile: false, profile: newProfile });
                    })
                    .catch((error) => {
                        console.error("Failed to fetch user profile:", error);
                    });
            })
            .catch((error) => {
                console.log(error);
                this._stateChangedCallback(this._client, { popupType: PopupType.None, isRetrievingProfile: false, profile: this._profile });
            });
    }

    /**
     * Starts the logout flow.
     */
    public logout(): Promise<void> {
        if (!this._client) {
            return Promise.reject(new Error("Auth client is not initialized."));
        }

        this._stateChangedCallback(this._client, { popupType: PopupType.Logout, isRetrievingProfile: false, profile: this._profile });

        return this._client
            .logoutPopup({
                state: window.location.pathname
            })
            .then(() => {
                AuthManager.saveProfile(null);
                this._stateChangedCallback(this._client, { popupType: PopupType.None, isRetrievingProfile: false, profile: null });
            })
            .catch((error) => {
                console.log(error);
                this._stateChangedCallback(this._client, { popupType: PopupType.None, isRetrievingProfile: false, profile: this._profile });
            });
    }

    /**
     * Retrieves the latest access token for the current user.
     * @returns The latest access token or null if not available.
     */
    public getLatestAccessToken(): Promise<string | null> {

        if (!this._client) {
            return Promise.reject(new Error("Auth client is not initialized."));
        }

        const activeAccount: AccountInfo | null = this._client.getActiveAccount();
        if (!activeAccount) {
            return Promise.resolve(null);
        }

        return this._client
            .acquireTokenSilent({
                scopes: TOKEN_SCOPES,
                account: activeAccount,
            })
            .then((tokenResponse: AuthenticationResult) => {
                return tokenResponse.accessToken;
            })
            .catch((error) => {
                console.error("Error acquiring token silently:", error);
                return null;
            });
    }

    /**
     * Marks the sign-up dialog as displayed.
     */
    public markDisplaySignUpDialogAsDisplayed() {

        if (this._profile) {
            const newProfile = new UserAccountProfile(
                this._profile.personId,
                this._profile.displayName,
                this._profile.type,
                this._profile.isJbqAdmin ?? false,
                this._profile.isTbqAdmin ?? false,
                this._profile.authTokenProfile ?? null,
                true);
            AuthManager.saveProfile(newProfile);

            this._stateChangedCallback(
                this._client,
                {
                    popupType: PopupType.None,
                    isRetrievingProfile: false,
                    hasDisplayedSignUpDialog: true,
                    profile: newProfile
                });
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
    public readonly hasSignUpDialogDisplayed: boolean = false;
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
     * Logout popup is present.
     */
    Logout
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
