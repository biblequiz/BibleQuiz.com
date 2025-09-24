import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { AuthManager } from "types/AuthManager";

interface Props {
}

export enum RegistrationPageSection {
    General,
    Eligibility,
    Fields,
    Divisions,
    Forms,
    Money,
    Other
}

export const registrationPageSection = atom<RegistrationPageSection>(RegistrationPageSection.General);

export default function RegistrationPage({ }: Props) {
    const auth = AuthManager.useNanoStore();
    const section = useStore(registrationPageSection);

    return (
        <>
            <div>
                <b>Registration Page | {RegistrationPageSection[section]} Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            {section === RegistrationPageSection.General && (
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
            )}
            {section === RegistrationPageSection.Eligibility && (
                <ul>
                    <li>Team naming (e.g., teams specify their own names, use city names, use church names, etc.).</li>
                    <li>Quizzers per team</li>
                    <li>Require coach</li>
                    <li>Allow individuals without a church</li>
                    <li>Allow attendees</li>
                    <li>Required roles for officials (e.g., judge, scorekeeper, timekeeper)</li>
                </ul>
            )}
            {section === RegistrationPageSection.Fields && (
                <ul>
                    <li>Required fields for people</li>
                    <li>Custom fields (e.g., Grade, T-Shirt, etc.)</li>
                </ul>
            )}
            {section === RegistrationPageSection.Divisions && (
                <ul>
                    <li>Division Name and Abbreviation</li>
                </ul>
            )}
            {section === RegistrationPageSection.Forms && (
                <ul>
                    <li>Custom forms to collect (e.g., Waiver).</li>
                </ul>
            )}
            {section === RegistrationPageSection.Money && (
                <ul>
                    <li>Are you collecting money?</li>
                    <li>Setup the Credit Card processing.</li>
                </ul>
            )}
            {section === RegistrationPageSection.Other && (
                <ul>
                    <li>Hide event from the public.</li>
                </ul>
            )}
        </>);
}