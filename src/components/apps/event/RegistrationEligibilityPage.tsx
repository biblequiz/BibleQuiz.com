import type { RegistrationProviderContext } from "./RegistrationProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function RegistrationEligibilityPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Eligibility Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Team naming (e.g., teams specify their own names, use city names, use church names, etc.).</li>
                <li>Quizzers per team</li>
                <li>Require coach</li>
                <li>Allow individuals without a church</li>
                <li>Allow attendees</li>
                <li>Required roles for officials (e.g., judge, scorekeeper, timekeeper)</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}