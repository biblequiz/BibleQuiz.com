import { useOutletContext } from "react-router-dom";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import RegistrationPageForm from "./RegistrationPageForm";
import { EventExternalForm } from "types/services/EventsService";
import EventFieldCard from "./EventFieldCard";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import { sharedDirtyWindowState } from "utils/SharedState";
import LocalIdGenerator from "utils/LocalIdGenerator";
import EventFormCardBody from "./EventFormCardBody";
import { PersonRole } from "types/services/PeopleService";

interface Props {
}

export default function RegistrationFormsPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        officialsAndAttendees,
        forms,
        setForms } = useOutletContext<RegistrationProviderContext>();

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/customFields`}
            nextPageLink={`${rootEventUrl}/registration/money`}>
            <div className="flex flex-wrap gap-4">
                {(forms ?? []).map((form, index) => (
                    <EventFieldCard key={`form_${form.Id ?? LocalIdGenerator.getLocalId(form)}`} width="lg:w-3/8">
                        <div className="w-full mt-0">
                            <button
                                type="button"
                                className="btn btn-primary w-3/8 mt-0 mb-0 pt-1 pb-1"
                                onClick={() => {
                                    const newForms = [...forms];
                                    const current = newForms[index];
                                    newForms[index] = newForms[index - 1];
                                    newForms[index - 1] = current;

                                    setForms(newForms);
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
                                    const newForms = [...forms];
                                    const current = newForms[index];
                                    newForms[index] = newForms[index + 1];
                                    newForms[index + 1] = current;

                                    setForms(newForms);
                                    sharedDirtyWindowState.set(true);
                                }}
                                disabled={index >= forms.length - 1}>
                                <FontAwesomeIcon icon="fas faArrowRight" />
                                Move
                            </button>
                        </div>
                        <EventFormCardBody
                            form={form}
                            allowAttendees={officialsAndAttendees.allowAttendees}
                        />
                        <div className="w-full mt-0">
                            <button
                                type="button"
                                className="btn btn-error text-white w-full mt-0 mb-0 pt-1 pb-1"
                                onClick={() => {
                                    const newForms = forms.filter((_, i) => i !== index);
                                    setForms(newForms);
                                    sharedDirtyWindowState.set(true);
                                }}>
                                <FontAwesomeIcon icon="fas faTrash" />
                                Delete Form
                            </button>
                        </div>
                    </EventFieldCard>
                ))}
                <EventFieldCard width="lg:w-3/8">
                    <button
                        type="button"
                        className="btn btn-primary w-full mt-0 mb-0 pt-1 pb-1"
                        onClick={() => {
                            const newForm: EventExternalForm = {
                                Id: null,
                                Label: "",
                                Roles: [PersonRole.Quizzer],
                                Url: "",
                                DescriptionHtml: "",
                                IsMinorOnly: false,
                                IsRequired: false,
                                IsTracked: false,
                                WaiverHtml: ""
                            };

                            setForms([...(forms ?? []), newForm]);
                            sharedDirtyWindowState.set(true);
                        }}>
                        <FontAwesomeIcon icon="fas faPlus" />
                        Waiver or Form
                    </button>
                </EventFieldCard>
            </div>
        </RegistrationPageForm>);
}