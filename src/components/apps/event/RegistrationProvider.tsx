import { Outlet } from "react-router-dom";
import { AuthManager } from "types/AuthManager";

interface Props {
}

export interface RegistrationProviderContext {
    auth: AuthManager;
}

export default function RegistrationProvider({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Registration Page</b>
            </div>
            <Outlet context={{ auth: auth } as RegistrationProviderContext} />
        </>);
}