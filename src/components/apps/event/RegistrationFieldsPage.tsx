import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "./RegistrationProvider";

interface Props {
}

export default function RegistrationFieldsPage({ }: Props) {
    const auth = useOutletContext<RegistrationProviderContext>().auth;

    return (
        <>
            <div>
                <b>Fields Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Required fields for people</li>
                <li>Custom fields (e.g., Grade, T-Shirt, etc.)</li>
            </ul>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}