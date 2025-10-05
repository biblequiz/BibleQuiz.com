import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useOutletContext } from "react-router-dom";

interface Props {
}

export default function RegistrationOfficialsPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Officials and Attendees Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Allow attendees</li>
                <li>Required roles for officials (e.g., judge, scorekeeper, timekeeper)</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}