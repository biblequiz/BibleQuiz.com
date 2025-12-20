import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function CloneEventPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Clone Event Page</b>
            </div>
            <p>
                This page allows the coordinator to clone the event.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}