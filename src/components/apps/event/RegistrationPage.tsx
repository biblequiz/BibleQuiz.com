import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { AuthManager } from "types/AuthManager";

interface Props {
}

export enum RegistrationPageSection {
    General,
    Eligibility,
    Divisions,
    Fields,
    Forms,
    Money
}

export const registrationPageSection = atom<RegistrationPageSection>(RegistrationPageSection.General);

export default function RegistrationPage({ }: Props) {
    const auth = AuthManager.useNanoStore();
    const section = useStore(registrationPageSection);

    return (
        <>
            <div>
                <b>Registration Page</b>
            </div>
            <div>Section: {RegistrationPageSection[section]}</div>
            <div>
                Placeholder for {auth.userProfile?.displayName}
            </div>
        </>);
}