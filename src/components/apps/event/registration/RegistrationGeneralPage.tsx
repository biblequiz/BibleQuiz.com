import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useState } from "react";
import AddressSelector from "../AddressSelector";
import type { Address } from "types/services/models/Address";
import RichTextEditor from "components/RichTextEditor";
import { sharedDirtyWindowState } from "utils/SharedState";
import RegistrationPageForm from "./RegistrationPageForm";
import { EventPublishType } from "types/services/EventsService";
import EventTypeSelectorCards from "./EventTypeSelectorCards";

interface Props {
}

export interface RegistrationGeneralInfo {
    name: string;
    description: string;
    typeId: string;
    startDate: string;
    endDate: string;
    registrationStartDate: string;
    registrationEndDate: string;
    regionId: string | null;
    districtId: string | null;
    publishType: EventPublishType;
    isOfficial: boolean;
    locationName: string | null;
    locationAddress: Address | null;
}

export default function RegistrationGeneralPage({ }: Props) {
    const {
        isNewEvent,
        isSaving,
        rootEventUrl,
        saveRegistration,
        setEventTitle,
        setEventType,
        general,
        setGeneral,
        teamsAndQuizzers,
        setTeamsAndQuizzers,
        officialsAndAttendees,
        setOfficialsAndAttendees } = useOutletContext<RegistrationProviderContext>();

    const [name, setName] = useState(general?.name || "");
    const [description, setDescription] = useState(general?.description || "");
    const [typeId, setTypeId] = useState(general?.typeId || "");
    const [startDate, setStartDate] = useState(general?.startDate || "");
    const [endDate, setEndDate] = useState(general?.endDate || "");
    const [registrationStartDate, setRegistrationStartDate] = useState(general?.registrationStartDate || "");
    const [registrationEndDate, setRegistrationEndDate] = useState(general?.registrationEndDate || "");
    const [regionId, setRegionId] = useState(general?.regionId || null);
    const [districtId, setDistrictId] = useState(general?.districtId || null);
    const [publishType, setPublishType] = useState(general?.publishType || EventPublishType.Regular);
    const [isOfficial, setIsOfficial] = useState(general?.isOfficial || false);
    const [locationName, setLocationName] = useState(general?.locationName || "");
    const [eventLocation, setEventLocation] = useState<Address | null>(general?.locationAddress || null);

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
            isSaving={isSaving}
            persistFormToEventInfo={() => {
                setGeneral({
                    ...general,
                    name,
                    description,
                    typeId,
                    startDate,
                    endDate,
                    registrationStartDate,
                    registrationEndDate,
                    regionId: regionId || null,
                    districtId: districtId || null,
                    publishType,
                    isOfficial,
                    locationName,
                    locationAddress: eventLocation
                });
            }}
            saveRegistration={saveRegistration}
            nextPageLink={`${rootEventUrl}/registration/teamsAndQuizzers`}>

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
                        placeholder="Name of your event"
                        onChange={e => {
                            setName(e.target.value);
                            setEventTitle(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
                        required
                    />
                </div>
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Type of Competition</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <select
                        name="type"
                        className="select select-bordered w-full mt-0"
                        value={typeId || "agjbq"}
                        onChange={e => {
                            setTypeId(e.target.value);
                            setEventType(e.target.value);

                            const isJbq = e.target.value === "agjbq";

                            setTeamsAndQuizzers({
                                ...teamsAndQuizzers,
                                minTeamMembers: isJbq ? 1 : 2,
                                maxTeamMembers: isJbq ? 8 : 6,
                                requireTeamCoaches: isJbq
                            });

                            setOfficialsAndAttendees({
                                ...officialsAndAttendees,
                                allowTimekeepers: isJbq
                            });

                            sharedDirtyWindowState.set(true);
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
                        onChange={e => {
                            setStartDate(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
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
                        onChange={e => {
                            setEndDate(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
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
                        onChange={e => {
                            setRegistrationStartDate(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
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
                        onChange={e => {
                            setRegistrationEndDate(e.target.value);
                            sharedDirtyWindowState.set(true);
                        }}
                        required
                    />
                </div>
            </div>

            <h5 className="mb-0">Where is the event?</h5>
            <AddressSelector
                id="location"
                label="Name of event's location"
                name={locationName}
                setName={n => {
                    setLocationName(n);
                    sharedDirtyWindowState.set(true);
                }}
                address={eventLocation || undefined}
                setAddress={a => {
                    setEventLocation(a);
                    sharedDirtyWindowState.set(true);
                }}
            />

            <h5 className="mb-2">What type of event?</h5>
            <EventTypeSelectorCards
                isNewEvent={isNewEvent}
                type={typeId}
                regionId={regionId}
                setRegionId={setRegionId}
                districtId={districtId}
                setDistrictId={setDistrictId}
                publishType={publishType}
                setPublishType={setPublishType}
                setIsOfficial={setIsOfficial}
            />

            <h5 className="mb-0">Additional Details</h5>
            <RichTextEditor
                text={description}
                setText={t => {
                    setDescription(t);
                    sharedDirtyWindowState.set(true);
                }}
            />
        </RegistrationPageForm>);
}