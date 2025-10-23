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
    const [regionOrDistrictId, setRegionOrDistrictId] = useState(general?.districtId || general?.regionId || null);
    const [isOfficial, setIsOfficial] = useState(general?.isOfficial || false);
    const [locationName, setLocationName] = useState(general?.locationName || "");
    const [eventLocation, setEventLocation] = useState<Address | null>(general?.locationAddress || null);

    return (
        <RegistrationPageForm
            persistFormToEventInfo={() => {

                const districtId = scope === EventScope.District ? regionOrDistrictId : null;
                const regionId = scope === EventScope.Regional
                    ? regionOrDistrictId
                    : (scope === EventScope.District
                        ? districts.find(d => d.id === districtId)?.regionId
                        : null);

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
                    districtId: districtId,
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
                        <span className="label-text font-medium">Type</span>
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

            <h5 className="mb-0">Who can compete?</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0 mb-0">
                <div className="w-full mt-0">
                    <select
                        name="scope"
                        className="select select-bordered w-full mt-0"
                        value={scope || EventScope.District}
                        onChange={e => {
                            setScope(e.target.value as EventScope);
                            setRegionOrDistrictId(null);
                            sharedDirtyWindowState.set(true);
                        }}
                        required
                    >
                        <option value={EventScope.District}>Any Church in the District</option>
                        <option value={EventScope.Regional}>Any Church in the Region</option>
                        <option value={EventScope.National}>Any Church in the Nation</option>
                    </select>
                </div>
                {scope !== EventScope.National && (
                    <div className="w-full mt-0">
                        <select
                            name="regionOrDistrict"
                            className="select select-bordered w-full mt-0"
                            value={regionOrDistrictId || undefined}
                            onChange={e => {
                                setRegionOrDistrictId(e.target.value);
                                sharedDirtyWindowState.set(true);
                            }}
                            required
                        >
                            <option value="" disabled>Select {scope}</option>
                            {scope === EventScope.District && districts.map((district => (
                                <option key={`district_${district.id}`} value={district.id}>
                                    {district.name}
                                </option>)))}
                            {scope === EventScope.Regional && regions.map((region => (
                                <option key={`region_${region.id}`} value={region.id}>
                                    {region.name}
                                </option>)))}
                        </select>
                    </div>)}
            </div>

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