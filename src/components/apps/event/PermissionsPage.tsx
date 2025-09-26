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
            <p>
                This page allows the event coordinator to manage permissions for who can
                administer the event.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}