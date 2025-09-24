import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "./RegistrationProvider";

interface Props {
}

export default function RegistrationOtherPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Other Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Hide event from the public.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}