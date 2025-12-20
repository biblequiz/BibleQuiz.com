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
import { DataTypeHelpers } from "utils/DataTypeHelpers";

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
        auth,
        isNewEvent,
        isSaving,
        context,
        originalEventType,
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
    const [allowJbqEvents, setAllowJbqEvents] = useState<boolean>(true);
    const [allowTbqEvents, setAllowTbqEvents] = useState<boolean>(true);
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

    const isTypeReadOnly = !isNewEvent ||
        ((originalEventType === "agjbq" && !allowJbqEvents) ||
            (originalEventType === "agtbq" && !allowTbqEvents));

    return (
        <RegistrationPageForm
            context={context}
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
            nextPageLink={`${context.rootEventUrl}/registration/teamsAndQuizzers`}>

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
                        disabled={isTypeReadOnly}
                        required={!isTypeReadOnly}
                    >
                        {allowJbqEvents && <option value="agjbq">Junior Bible Quiz (JBQ)</option>}
                        {allowTbqEvents && <option value="agtbq">Teen Bible Quiz (TBQ)</option>}
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
                        onBlur={e => {
                            const now = DataTypeHelpers.nowDateOnly;
                            const newStartDate = e.target.value;
                            const parsedStartDate = DataTypeHelpers.parseDateOnly(newStartDate);
                            if (parsedStartDate && parsedStartDate.getTime() > now.getTime()) {

                                // The end date is assumed to be the first date if missing.
                                if (!DataTypeHelpers.parseDateOnly(endDate)) {
                                    setEndDate(newStartDate);
                                }

                                // The registration start date is assumed to be today if missing.
                                let newRegistrationStart = DataTypeHelpers.parseDateOnly(registrationStartDate);
                                if (null == newRegistrationStart) {
                                    newRegistrationStart = now;
                                    setRegistrationStartDate(DataTypeHelpers.formatDate(now, "yyyy-MM-dd")!);
                                }

                                // The registration end date is assumed to be 5 days before the start of the event if missing.
                                if (null == DataTypeHelpers.parseDateOnly(registrationEndDate)) {

                                    let newRegistrationEnd = new Date(parsedStartDate.getTime());
                                    newRegistrationEnd.setDate(newRegistrationEnd.getDate() - 5);

                                    if (newRegistrationEnd.getTime() < newRegistrationStart.getTime()) {
                                        newRegistrationEnd = newRegistrationStart;
                                    }

                                    setRegistrationEndDate(DataTypeHelpers.formatDate(newRegistrationEnd, "yyyy-MM-dd")!);
                                }
                            }
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
                nameRequired
            />

            <h5 className="mb-2">What type of event?</h5>
            <EventTypeSelectorCards
                isNewEvent={isNewEvent}
                type={typeId}
                regionId={regionId}
                setRegionId={newRegionId => {
                    const profile = auth.userProfile;
                    if (newRegionId) {
                        setAllowJbqEvents(profile?.hasRegionPermission(newRegionId, "agjbq") ?? false);
                        setAllowTbqEvents(profile?.hasRegionPermission(newRegionId, "agtbq") ?? false);
                    } else {
                        setAllowJbqEvents(profile?.hasOrganizationPermission("agjbq") ?? false);
                        setAllowTbqEvents(profile?.hasOrganizationPermission("agtbq") ?? false);
                    }

                    setRegionId(newRegionId);
                }}
                districtId={districtId}
                setDistrictId={(newDistrictId, newRegionId) => {
                    const profile = auth.userProfile;
                    if (newDistrictId) {
                        setAllowJbqEvents(profile?.hasDistrictPermission(newDistrictId, newRegionId!, "agjbq") ?? false);
                        setAllowTbqEvents(profile?.hasDistrictPermission(newDistrictId, newRegionId!, "agtbq") ?? false);
                    } else {
                        setAllowJbqEvents(profile?.hasOrganizationPermission("agjbq") ?? false);
                        setAllowTbqEvents(profile?.hasOrganizationPermission("agtbq") ?? false);
                    }

                    setDistrictId(newDistrictId);
                }}
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