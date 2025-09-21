import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function RegistrationPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Registration Page</b>
            </div>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}