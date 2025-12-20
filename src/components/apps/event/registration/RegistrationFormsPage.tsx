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
        context,
        isSaving,
        officialsAndAttendees,
        forms,
        setForms } = useOutletContext<RegistrationProviderContext>();

    return (
        <RegistrationPageForm
            context={context}
            isSaving={isSaving}
            previousPageLink={`${context.rootEventUrl}/registration/divisions`}
            nextPageLink={`${context.rootEventUrl}/registration/money`}>
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
                            getLabelValidityMessage={newLabel => {
                                if (newLabel) {
                                    newLabel = newLabel.trim().toLowerCase();
                                    const duplicates = forms.filter(f => f !== form && f.Label && f.Label.toLowerCase() === newLabel);
                                    if (duplicates.length > 0) {
                                        return "Labels must be unique across forms.";
                                    }
                                }

                                return null;
                            }}
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