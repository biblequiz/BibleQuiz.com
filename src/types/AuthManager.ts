import type { AccountInfo, AuthenticationResult, IPublicClientApplication } from "@azure/msal-browser";

const PROFILE_STORAGE_KEY = "auth-user-profile--";

/**
 * Manager for auth.
 */
export class AuthManager {

    private readonly _client: IPublicClientApplication | null;
    private readonly _profile: UserAccountProfile | null;
    private readonly _stateChangedCallback: (client: IPublicClientApplication | null, state: any | null) => void;

    private _isPopupOpen: boolean = false;

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
            this._isPopupOpen = false;
        }
        else {
            this._profile = state.profile;
            this._isPopupOpen = state.isPopupOpen;
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
    public get isPopupOpen(): boolean {
        return this._isPopupOpen;
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

        this._stateChangedCallback(this._client, { isPopupOpen: true, profile: null });

        return this._client
            .loginPopup({
                scopes: [],
                prompt: 'select_account',
                state: window.location.pathname
            })
            .then((tokenResponse: AuthenticationResult) => {

                // Persist the result of the login.
                this._client!.setActiveAccount(
                    tokenResponse?.account ?? null,
                );

                const newProfile = new UserAccountProfile(tokenResponse.account?.name ?? null);

                AuthManager.saveProfile(newProfile);
                this._stateChangedCallback(this._client, { isPopupOpen: false, profile: newProfile });
            })
            .catch((error) => {
                console.log(error);
                this._stateChangedCallback(this._client, { isPopupOpen: false, profile: this._profile });
            });
    }

    /**
     * Starts the logout flow.
     */
    public logout(): Promise<void> {
        if (!this._client) {
            return Promise.reject(new Error("Auth client is not initialized."));
        }

        this._stateChangedCallback(this._client, { isPopupOpen: true, profile: this._profile });

        return this._client
            .logoutPopup({
                state: window.location.pathname
            })
            .then(() => {
                AuthManager.saveProfile(null);
                this._stateChangedCallback(this._client, { isPopupOpen: false, profile: null });
            })
            .catch((error) => {
                console.log(error);
                this._stateChangedCallback(this._client, { isPopupOpen: false, profile: this._profile });
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
                scopes: [],
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

    private static loadProfile(): UserAccountProfile | null {

        if (typeof window === "undefined" || !window.localStorage) {
            return null;
        }

        const serialized = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (serialized) {
            const serializedProfile = JSON.parse(serialized) as SerializedAccountProfile;
            if (serializedProfile) {
                return new UserAccountProfile(serializedProfile.displayName);
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
                displayName: profile.displayName
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
    private readonly _displayName: string | null;

    /**
     * Creates a new instance of the AccountProfile.
     * @param account The account information.
     */
    public constructor(displayName: string | null) {
        this._displayName = displayName;
    }

    /**
     * Display name of the current user (if user is authenticated).
     */
    public get displayName(): string | null {
        return this._displayName;
    }
}

interface AuthManagerState {
    isPopupOpen: boolean;
    profile: UserAccountProfile | null;
}

interface SerializedAccountProfile {
    displayName: string | null;
}