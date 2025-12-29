import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function EventPaymentsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Fees & Payments Page</b>
            </div>
            <p>
                This page allows management of payments for registrations.
            </p>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}