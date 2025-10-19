import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";

interface Props {
}

export default function RegistrationMoneyPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Money Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Will you collect money?</li>
                <li>Setup credit card transactions.</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}