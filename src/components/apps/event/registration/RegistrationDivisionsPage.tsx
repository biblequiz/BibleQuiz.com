import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";

interface Props {
}

export default function RegistrationDivisionsPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Divisions Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Division Name and Abbreviation</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}