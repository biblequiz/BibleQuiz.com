import { AuthManager } from "types/AuthManager";

interface Props {
}

export default function EventRegistrationsPage({ }: Props) {
    const auth = AuthManager.useNanoStore();

    return (
        <>
            <div>
                <b>Downloads & Registrations Page</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Registration Report & File</li>
                <li>ScoreKeep File (Excel and Text)</li>
                <li>Ability to manage the registrations</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}