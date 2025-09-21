import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function PermissionsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Permissions Page</b>
            </div>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}