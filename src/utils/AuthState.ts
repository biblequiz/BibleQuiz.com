import { atom } from 'nanostores';
import { LogLevel, type Configuration, type IPublicClientApplication } from '@azure/msal-browser';

export const sharedAuthClient = atom<IPublicClientApplication | null>(null);

/**
 * Gets the MSAL configuration for initializing a client.
 * 
 * @param rootUrl Root URL for the service.
 * @returns MSAL configuration object.
 */
export function getMsalConfig(rootUrl: string): Configuration {
    return {
        auth: {
            clientId: "1058ea35-28ff-4b8a-953a-269f36d90235", // This is the ONLY mandatory field that you need to supply.
            authority: "https://biblequizusers.ciamlogin.com/", // Replace the placeholder with your tenant subdomain
            redirectUri: `${rootUrl}/auth`, // Points to window.location.origin. You must register this URI on Microsoft Entra admin center/App Registration.
            postLogoutRedirectUri: "/", // Indicates the page to navigate after logout.
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
    };
}