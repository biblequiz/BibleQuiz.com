import { useEffect } from "react";
import { useStore } from "@nanostores/react";
import { PublicClientApplication, type IPublicClientApplication } from "@azure/msal-browser";
import { getMsalConfig, sharedAuthClient } from "../utils/AuthState";

interface Props {
    type?: "loginButton" | "redirect";
};

export default function AuthButton({ type }: Props) {

    const rootUrl = window?.location?.origin ? window.location.origin : "";

    const client: IPublicClientApplication | null = useStore(sharedAuthClient);

    useEffect(() => {
        PublicClientApplication.createPublicClientApplication(getMsalConfig(rootUrl))
            .then((instance) => {

                // If there is an active account, it's token may need to be retrieved.
                const activeAccount = instance.getActiveAccount();
                if (activeAccount && !activeAccount.idToken) {
                    instance
                        .acquireTokenSilent({
                            scopes: [],
                            account: activeAccount
                        })
                        .then(() => {
                            sharedAuthClient.set(instance);
                        })
                        .catch((error) => {
                            console.error("Error acquiring token silently:", error);
                        });
                }
                else {
                    sharedAuthClient.set(instance);
                }
            })
            .catch((error) => {
                console.error("Error creating MSAL instance:", error);
            });
    }, []);

    if (client?.getActiveAccount()?.idTokenClaims) {
        return (
            <span>Authenticated!</span>
        );
    }
    else {
        return (
            <button className="btn btn-primary" disabled={!client} onClick={() => {
                client!
                    .loginRedirect({
                        scopes: [],
                        prompt: 'select_account'
                    })
                    .catch((error) => console.log(error));
            }}>
                Sign In
            </button>);
    }
}