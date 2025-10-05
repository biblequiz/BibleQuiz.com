import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";

interface Props {
}

export default function RegistrationGeneralPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>General Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Event Name</li>
                <li>Event Type (JBQ or TBQ)</li>
                <li>Event & Registration Dates</li>
                <li>If Registration is enabled, then:
                    <ul>
                        <li>Location</li>
                        <li>Description</li>
                        <li>Team Eligibility (National, District, etc.)</li>
                    </ul>
                </li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}