import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function EmailEventPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>E-mail Event Page</b>
            </div>
            <p>
                This page allows the coordinator to end an e-mail to all event participants.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}