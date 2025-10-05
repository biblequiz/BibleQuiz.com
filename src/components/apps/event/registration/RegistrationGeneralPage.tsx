import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useState } from "react";
import ExtendedRegistrationDateSelector from "./ExtendedRegistrationDateSelector";

interface Props {
}

export interface RegistrationGeneralInfo {
    name: string;
    typeId: string;
    startDate: string;
    endDate: string;
    registrationStartDate: string;
    registrationEndDate: string;
    extendedOfficialsEndDate: string | null;

    allowAttendees: boolean;
    extendedAttendeesEndDate: string | null;
}

export default function RegistrationGeneralPage({ }: Props) {
    const {
        auth,
        setEventTitle,
        setEventType,
        general,
        setGeneral } = useOutletContext<RegistrationProviderContext>();

    const [name, setName] = useState(general?.name || "");
    const [typeId, setTypeId] = useState(general?.typeId || "");
    const [startDate, setStartDate] = useState(general?.startDate || "");
    const [endDate, setEndDate] = useState(general?.endDate || "");
    const [registrationStartDate, setRegistrationStartDate] = useState(general?.registrationStartDate || "");
    const [registrationEndDate, setRegistrationEndDate] = useState(general?.registrationEndDate || "");
    const [extendedOfficialsRegistrationDate, setExtendedOfficialsRegistrationDate] = useState(general?.extendedOfficialsEndDate || null);
    const [extendedAttendeesRegistrationDate, setExtendedAttendeesRegistrationDate] = useState(general?.extendedAttendeesEndDate || null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert("submit");
    };

    return (
        <>
            <div>
                <b>General Section</b>
            </div>
            <p>
                This page includes the following fields:
            </p>
            <ul>
                <li>Event Name: {general.name}</li>
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

            <div className="overflow-x-auto">
                <form className="space-y-6 mt-0" onSubmit={handleSubmit}>
                    <h5 className="mb-0">What's the event?</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0">
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Name</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                name="name"
                                type="text"
                                className="input w-full"
                                value={name}
                                maxLength={60}
                                onChange={e => {
                                    setName(e.target.value);
                                    setEventTitle(e.target.value);
                                }}
                                required
                            />
                        </div>
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Type</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <select
                                name="language"
                                className="select select-bordered w-full mt-0"
                                value={typeId || "agjbq"}
                                onChange={e => {
                                    setTypeId(e.target.value);
                                    setEventType(e.target.value);
                                }}
                                required
                            >
                                <option value="agjbq">Junior Bible Quiz (JBQ)</option>
                                <option value="agtbq">Teen Bible Quiz (TBQ)</option>
                            </select>
                        </div>
                    </div>

                    <h5 className="mb-0">When is the event?</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0">
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">First Day of Event</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                name="startDate"
                                type="date"
                                className="input w-full"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Last Day of Event</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                name="endDate"
                                type="date"
                                className="input w-full"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">First Day to Register</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                name="startDate"
                                type="date"
                                className="input w-full"
                                value={registrationStartDate}
                                onChange={e => setRegistrationStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="w-full mt-0">
                            <label className="label">
                                <span className="label-text font-medium">Last Day to Register</span>
                                <span className="label-text-alt text-error">*</span>
                            </label>
                            <input
                                name="endDate"
                                type="date"
                                className="input w-full"
                                value={registrationEndDate}
                                onChange={e => setRegistrationEndDate(e.target.value)}
                                required
                            />
                        </div>
                        <ExtendedRegistrationDateSelector
                            id="officials"
                            label="Officials"
                            registrationEndDate={registrationEndDate}
                            extendedDate={extendedOfficialsRegistrationDate}
                            setExtendedDate={setExtendedOfficialsRegistrationDate}
                        />
                        {general?.allowAttendees && (
                            <ExtendedRegistrationDateSelector
                                id="officials"
                                label="Officials"
                                registrationEndDate={registrationEndDate}
                                extendedDate={extendedOfficialsRegistrationDate}
                                setExtendedDate={setExtendedOfficialsRegistrationDate}
                            />)}
                    </div>
                </form>
            </div>
        </>);
}