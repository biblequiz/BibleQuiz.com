import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";

interface Props {
}

export default function RegistrationFormsPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Forms Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Custom forms to collect (e.g., Waiver).</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}