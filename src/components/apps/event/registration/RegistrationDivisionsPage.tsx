import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { EventDivision } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { sharedDirtyWindowState } from "utils/SharedState";
import LocalIdGenerator from "utils/LocalIdGenerator";
import EventDivisionCardBody from "./EventDivisionCardBody";

interface Props {
}

export default function RegistrationDivisionsPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        divisions,
        setDivisions } = useOutletContext<RegistrationProviderContext>();

    const [eventDivisions, setEventDivisions] = useState<EventDivision[]>(() => [...divisions]);

    return (
        <RegistrationPageForm
            persistFormToEventInfo={() => setDivisions(eventDivisions)}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/customFields`}
            nextPageLink={`${rootEventUrl}/registration/forms`}>
            <div className="flex flex-wrap gap-4">
                {eventDivisions.map((division, index) => (
                    <EventFieldCard key={`division_${division.Id ?? LocalIdGenerator.getLocalId(division)}`}>
                        <div className="w-full mt-0">
                            <button
                                type="button"
                                className="btn btn-primary w-3/8 mt-0 mb-0 pt-1 pb-1"
                                onClick={() => {
                                    const newDivisions = [...eventDivisions];
                                    const current = newDivisions[index];
                                    newDivisions[index] = newDivisions[index - 1];
                                    newDivisions[index - 1] = current;

                                    setEventDivisions(newDivisions);
                                    setDivisions(newDivisions);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={index < 1}>
                                <FontAwesomeIcon icon="fas faArrowLeft" />
                                Move
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary w-3/8 mt-0 mb-0 ml-2 pt-1 pb-1"
                                onClick={() => {
                                    const newDivisions = [...eventDivisions];
                                    const current = newDivisions[index];
                                    newDivisions[index] = newDivisions[index + 1];
                                    newDivisions[index + 1] = current;

                                    setEventDivisions(newDivisions);
                                    setDivisions(newDivisions);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={index >= eventDivisions.length - 1}>
                                <FontAwesomeIcon icon="fas faArrowRight" />
                                Move
                            </button>
                        </div>
                        <EventDivisionCardBody division={division} />
                        <div className="w-full mt-0">
                            <button
                                type="button"
                                className="btn btn-error text-white w-full mt-0 mb-0 pt-1 pb-1"
                                onClick={() => {
                                    const newDivisions = eventDivisions.filter((_, i) => i !== index);
                                    setEventDivisions(newDivisions);
                                    setDivisions(newDivisions);
                                    sharedDirtyWindowState.set(true);
                                }}>
                                <FontAwesomeIcon icon="fas faTrash" />
                                Delete Division
                            </button>
                        </div>
                    </EventFieldCard>
                ))}
                <EventFieldCard alignMiddle={true}>
                    <button
                        type="button"
                        className="btn btn-primary w-full mt-0 mb-0 pt-1 pb-1"
                        onClick={() => {
                            const newDivision: EventDivision = {
                                Id: null,
                                Abbreviation: "",
                                Label: ""
                            };

                            setEventDivisions(prevFields => [...prevFields, newDivision]);
                            sharedDirtyWindowState.set(true);
                        }}>
                        <FontAwesomeIcon icon="fas faPlus" />
                        Division
                    </button>
                </EventFieldCard>
            </div>
        </RegistrationPageForm>);
}