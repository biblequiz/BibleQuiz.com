import type { RegistrationProviderContext } from "./RegistrationProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function RegistrationTeamsAndQuizzersPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Teams & Quizzers Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Team naming (e.g., teams specify their own names, use city names, use church names, etc.).</li>
                <li>Quizzers per team</li>
                <li>Require coach</li>
                <li>Allow individuals without a church</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}