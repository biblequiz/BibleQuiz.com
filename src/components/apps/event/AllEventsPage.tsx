import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function AllEventsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>All Events Page</b>
            </div>
            <p>
                This page allows an event coordinator to select their event.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}