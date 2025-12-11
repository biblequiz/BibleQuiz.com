import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useState } from "react";
import regions from "data/regions.json";
import districts from "data/districts.json";
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

enum EventScope {
    National = "N",
    Regional = "Region",
    District = "District"
}

export default function RegistrationGeneralPage({ }: Props) {
    const {
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
    const [scope, setScope] = useState(general?.districtId
        ? EventScope.District :
        (general?.regionId
            ? EventScope.Regional
            : (general ? EventScope.National : EventScope.District)));
    const [regionId, setRegionId] = useState(general?.regionId || null);
    const [districtId, setDistrictId] = useState(general?.districtId || null);
    const [publishType, setPublishType] = useState(general?.publishType || EventPublishType.Regular);
    const [isOfficial, setIsOfficial] = useState(general?.isOfficial || false);
    const [locationName, setLocationName] = useState(general?.locationName || "");
    const [eventLocation, setEventLocation] = useState<Address | null>(general?.locationAddress || null);

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
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
                regionId={regionId}
                setRegionId={setRegionId}
                districtId={districtId}
                setDistrictId={setDistrictId}
                publishType={publishType}
                setPublishType={setPublishType}
                isOfficial={isOfficial}
                setIsOfficial={setIsOfficial}
            />

            <div className="w-full p-2 border border-base-400 bg-base-300 rounded-lg">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isOfficial"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={isOfficial}
                        onChange={e => {
                            setIsOfficial(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span className="font-bold">
                        Official Competition which applies the following restrictions (per rules):
                    </span>
                </label>
                <br />
                <ul>
                    <li>Defaults to at least 2 quizzers per team (can be changed below).</li>
                    <li>Teams can only compete in events within their district/region or at National events.</li>
                    <li>Quizzers can only compete for their official church.</li>
                    <li>Maximum number of 3 coaches.</li>
                    <li>If qualifying by team, new quizzers cannot be added once the qualifying event occurs.</li>
                </ul>
            </div>

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