import { Outlet, useNavigate, useOutletContext } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useRef, useState } from "react";
import type { RegistrationGeneralInfo } from "./registration/RegistrationGeneralPage";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { RegistrationTeamsAndQuizzersInfo } from "./registration/RegistrationTeamsAndQuizzersPage";
import type { RegistrationOfficialsAndAttendeesInfo } from "./registration/RegistrationOfficialsPage";
import { EventDivision, EventExternalForm, EventInfo, EventPublishType, EventsService, RequiredPersonFields, type EventField } from "types/services/EventsService";
import type { RegistrationRoleRequiredFields } from "./registration/RegistrationRequiredFieldsPage";
import type { RegistrationMoneyInfo } from "./registration/RegistrationMoneyPage";
import type { RegistrationOtherInfo } from "./registration/RegistrationOtherPage";
import RegistrationFormsPageFieldsDialog from "./registration/RegistrationFormsPageFieldsDialog";
import { PersonRole } from "types/services/PeopleService";
import RegistrationImpactingDialog from "./registration/RegistrationImpactingDialog";
import { sharedDirtyWindowState } from "utils/SharedState";
import type { RegistrationFormContext } from "./registration/RegistrationPageForm";
import { Address } from "types/services/models/Address";
import ConfirmationDialog from "components/ConfirmationDialog";

interface Props {
}

export interface RegistrationProviderContext {
    auth: AuthManager;
    isNewEvent: boolean;
    isSaving: boolean;
    context: RegistrationFormContext;

    setEventTitle: (title: string) => void;
    setEventType: (typeId: string) => void;
    setEventIsHidden: (isHidden: boolean) => void;

    general: RegistrationGeneralInfo;
    setGeneral: (updated: RegistrationGeneralInfo) => void;

    teamsAndQuizzers: RegistrationTeamsAndQuizzersInfo;
    setTeamsAndQuizzers: (updated: RegistrationTeamsAndQuizzersInfo) => void;

    officialsAndAttendees: RegistrationOfficialsAndAttendeesInfo;
    setOfficialsAndAttendees: (updated: RegistrationOfficialsAndAttendeesInfo) => void;

    requiredFields: RegistrationRoleRequiredFields;
    setRequiredFields: (updated: RegistrationRoleRequiredFields) => void;

    fields: EventField[];
    setFields: (updated: EventField[]) => void;

    divisions: EventDivision[];
    setDivisions: (updated: EventDivision[]) => void;

    forms: EventExternalForm[];
    setForms: (updated: EventExternalForm[]) => void;

    money: RegistrationMoneyInfo;
    setMoney: (updated: RegistrationMoneyInfo) => void;

    other: RegistrationOtherInfo;
    setOther: (updated: RegistrationOtherInfo) => void;
}

const normalizeDate = (date: string | null): string | null => {
    return DataTypeHelpers.formatDate(
        date,
        "yyyy-MM-dd");
};

function getDefaultEventInfo(): EventInfo {
    const eventInfo = new EventInfo();
    eventInfo.Id = undefined;
    eventInfo.PublishToArchives = true;
    return eventInfo;
}

enum DialogType {
    None,
    DeleteConfirmation
};

export default function RegistrationProvider({ }: Props) {
    const {
        auth,
        info,
        setEventTitle,
        setEventType,
        setEventIsHidden,
        rootUrl
    } = useOutletContext<EventProviderContext>();

    const navigate = useNavigate();

    const [generalState, setGeneralState] = useState<RegistrationGeneralInfo>(() =>
    ({
        name: info?.Name || "",
        description: info?.Description || "",
        typeId: info?.TypeId || "",
        startDate: normalizeDate(info?.StartDate || null) || "",
        endDate: normalizeDate(info?.EndDate || null) || "",
        registrationStartDate: normalizeDate(info?.RegistrationStartDate || null) || "",
        registrationEndDate: normalizeDate(info?.RegistrationEndDate || null) || "",
        districtId: info?.DistrictId || null,
        regionId: info?.RegionId || null,
        publishType: info?.PublishType || EventPublishType.Regular,
        isOfficial: info?.IsOfficial || false,
        locationName: info?.LocationName || null,
        locationAddress: info?.Location || null,
    }));

    const [teamsAndQuizzers, setTeamsAndQuizzers] = useState<RegistrationTeamsAndQuizzersInfo>(() =>
    ({
        minTeamMembers: info?.MinTeamMembers || 1,
        maxTeamMembers: info?.MaxTeamMembers || 8,
        requireTeamCoaches: info?.RequireTeamCoaches || true,
        allowCustomTeamNames: info?.AllowTeamNames || true,
        allowIndividuals: info?.AllowIndividuals || false,
    }));

    const [officialsAndAttendees, setOfficialsAndAttendees] = useState<RegistrationOfficialsAndAttendeesInfo>(() =>
    ({
        extendedOfficialsEndDate: normalizeDate(info?.ExtendedOfficialsEndDate || null),
        extendedAttendeesEndDate: normalizeDate(info?.ExtendedAttendeesEndDate || null),
        allowJudges: info?.HasJudges || true,
        allowScorekeepers: info?.HasScorekeepers || true,
        allowTimekeepers: info?.HasTimekeepers || true,
        allowAttendees: info?.AllowAttendees || false,
    }));

    const [requiredFields, setRequiredFields] = useState<RegistrationRoleRequiredFields>({
        contactFields: info?.RequiredPointOfContactFields ?? RequiredPersonFields.Email,
        roleFields: info?.RequiredRoleFields ?? {}
    });

    const [fields, setFields] = useState<EventField[]>(info?.Fields || []);
    const [hasChangedFields, setHasChangedFields] = useState(false);
    const [divisions, setDivisions] = useState<EventDivision[]>(info?.Divisions || []);
    const [forms, setForms] = useState<EventExternalForm[]>(info?.Forms || []);
    const [hasChangedForms, setHasChangedForms] = useState(false);
    const [missingBirthdateForRoles, setMissingBirthdateForRoles] = useState<string[] | undefined>(undefined);

    const [moneyState, setMoneyState] = useState<RegistrationMoneyInfo>(() =>
    ({
        calculatePayment: info?.CalculatePayment || false,
        trackPayments: info?.TrackPayments || false,
        automatedFeeType: info && info.AutomatedFeeType !== null ? info.AutomatedFeeType : null,
        automatedPaymentDescriptor: info?.AutomatedPaymentDescriptor || null,
        payeeName: info?.PayeeName || null,
        payeeEmail: info?.PayeeEmail || null,
        payeeAddress: info?.PayeeAddress || null,
        perChurchCost: info?.PerChurchCost || null,
        perTeamCost: info?.PerTeamCost || null,
        rolePayment: info?.RolePayment || null,
    }));
    const [hasChangedCosts, setHasChangedCosts] = useState(false);

    const [otherInfo, setOtherInfo] = useState(() => ({
        isHidden: info?.IsHidden || false,
        isHiddenFromLiveEvents: info?.IsHiddenFromLiveEvents || false,
    }));

    const [initializeSavingRegistration, setInitializeSavingRegistration] = useState(false);
    const [impactingChanges, setImpactingChanges] = useState<string[] | undefined>(undefined);
    const [isSavingRegistration, setIsSavingRegistration] = useState(false);
    const [savingError, setSavingError] = useState<string | undefined>(undefined);
    const [dialogType, setDialogType] = useState<DialogType>(DialogType.None);

    const saveRegistration =
        async () => {

            setInitializeSavingRegistration(false);
            setImpactingChanges(undefined);

            // Ensure the required fields are present for forms.
            const newMissingBirthdateForRoles: string[] = [];
            if (forms.length > 0) {
                for (const form of forms) {
                    if (form.IsMinorOnly) {
                        for (let role of form.Roles) {
                            const currentRequirements: RequiredPersonFields = requiredFields.roleFields[PersonRole[role]];
                            if (!DataTypeHelpers.hasEnumFlag(currentRequirements, RequiredPersonFields.DateOfBirth)) {
                                newMissingBirthdateForRoles.push(PersonRole[role]);
                            }
                        }
                    }
                }
            }

            if (moneyState.calculatePayment) {
                for (const roleKey in moneyState.rolePayment) {
                    const payment = moneyState.rolePayment[roleKey];
                    if (payment.Overrides && payment.Overrides.length > 0) {
                        const currentRequirements: RequiredPersonFields = requiredFields.roleFields[roleKey];
                        if (!DataTypeHelpers.hasEnumFlag(currentRequirements, RequiredPersonFields.DateOfBirth)) {
                            newMissingBirthdateForRoles.push(roleKey);
                        }
                    }
                }
            }

            setMissingBirthdateForRoles(newMissingBirthdateForRoles.length > 0 ? newMissingBirthdateForRoles : undefined);
            if (newMissingBirthdateForRoles.length > 0) {
                return Promise.resolve();
            }

            // If there are changes that will impact existing registrations, notify the user.
            if (info?.HasAnyRegistrations && !impactingChanges) {
                const impactingChanges: string[] = [];

                // If allowing attendees or individuals has become more restrictive, inform the user.
                if (!teamsAndQuizzers.allowIndividuals && info.AllowIndividuals) {
                    impactingChanges.push("Any existing individuals will no longer show up in reports.");
                }

                if (!officialsAndAttendees.allowAttendees && info.AllowAttendees) {
                    impactingChanges.push("Any existing attendees will no longer show up in reports.");
                }

                // Determine if there are new fields.
                if (hasChangedFields) {
                    impactingChanges.push("Any existing registration won't have values for the new/updated field. If you want them to be filled in, you may need to send them an e-mail using the <i class=\"fa fa-envelope\"></i> button.");
                }

                // If there are changes to costs.
                if (hasChangedCosts) {
                    impactingChanges.push("Any existing registration will use the old values for payment until they reopen their registration.");
                }

                // If there are changes to the forms.
                if (hasChangedForms) {
                    impactingChanges.push("Any existing registration will use the old forms until they reopen their registration.");
                }

                if (impactingChanges.length > 0) {
                    setImpactingChanges(impactingChanges);
                    return Promise.resolve();
                }
                else {
                    setImpactingChanges(undefined);
                }
            }

            // Persist everything from the states to the object.
            const updatedInfo = info ?? getDefaultEventInfo();
            if (info?.Id) {
                updatedInfo.Id = info.Id;
            }

            updatedInfo.Name = generalState.name;
            updatedInfo.Description = generalState.description;
            updatedInfo.TypeId = generalState.typeId;
            updatedInfo.StartDate = generalState.startDate;
            updatedInfo.EndDate = generalState.endDate;
            updatedInfo.RegistrationStartDate = generalState.registrationStartDate;
            updatedInfo.RegistrationEndDate = generalState.registrationEndDate;
            updatedInfo.DistrictId = generalState.districtId;
            updatedInfo.RegionId = generalState.regionId;
            updatedInfo.PublishType = generalState.publishType;
            updatedInfo.IsOfficial = generalState.isOfficial;
            updatedInfo.LocationName = generalState.locationName!;
            updatedInfo.Location = generalState.locationAddress ?? new Address();

            updatedInfo.MinTeamMembers = teamsAndQuizzers.minTeamMembers;
            updatedInfo.MaxTeamMembers = teamsAndQuizzers.maxTeamMembers;
            updatedInfo.RequireTeamCoaches = teamsAndQuizzers.requireTeamCoaches;
            updatedInfo.AllowTeamNames = teamsAndQuizzers.allowCustomTeamNames;
            updatedInfo.AllowIndividuals = teamsAndQuizzers.allowIndividuals;

            updatedInfo.ExtendedOfficialsEndDate = officialsAndAttendees.extendedOfficialsEndDate;
            updatedInfo.ExtendedAttendeesEndDate = officialsAndAttendees.extendedAttendeesEndDate;
            updatedInfo.HasJudges = officialsAndAttendees.allowJudges;
            updatedInfo.HasScorekeepers = officialsAndAttendees.allowScorekeepers;
            updatedInfo.HasTimekeepers = officialsAndAttendees.allowTimekeepers;
            updatedInfo.AllowAttendees = officialsAndAttendees.allowAttendees;

            updatedInfo.RequiredRoleFields = requiredFields.roleFields;
            updatedInfo.RequiredPointOfContactFields = requiredFields.contactFields;

            updatedInfo.Fields = fields;
            updatedInfo.Divisions = divisions;
            updatedInfo.Forms = forms;

            updatedInfo.CalculatePayment = moneyState.calculatePayment;
            updatedInfo.TrackPayments = updatedInfo.CalculatePayment && moneyState.trackPayments;
            if (updatedInfo.TrackPayments && null !== moneyState.automatedFeeType) {
                updatedInfo.AutomatedFeeType = moneyState.automatedFeeType;
                updatedInfo.AutomatedPaymentDescriptor = moneyState.automatedPaymentDescriptor;
                updatedInfo.PayeeName = moneyState.payeeName;
                updatedInfo.PayeeEmail = moneyState.payeeEmail;
                updatedInfo.PayeeAddress = moneyState.payeeAddress;
            }
            else {
                updatedInfo.AutomatedFeeType = null;
                updatedInfo.AutomatedPaymentDescriptor = null;
                updatedInfo.PayeeName = null;
                updatedInfo.PayeeEmail = null;
                updatedInfo.PayeeAddress = null;
            }

            if (updatedInfo.CalculatePayment) {
                updatedInfo.PerChurchCost = moneyState.perChurchCost;
                updatedInfo.PerTeamCost = moneyState.perTeamCost;
                updatedInfo.RolePayment = moneyState.rolePayment;
            }
            else {
                updatedInfo.PerChurchCost = null;
                updatedInfo.PerTeamCost = null;
                updatedInfo.RolePayment = null;
            }

            if (!updatedInfo.AllowAttendees) {
                delete updatedInfo.RequiredRoleFields[PersonRole[PersonRole.Attendee]];

                if (updatedInfo.RolePayment) {
                    delete updatedInfo.RolePayment[PersonRole[PersonRole.Attendee]];
                }
            }

            updatedInfo.IsHidden = otherInfo.isHidden;
            updatedInfo.IsHiddenFromLiveEvents = otherInfo.isHiddenFromLiveEvents;

            setIsSavingRegistration(true);
            setSavingError(undefined);

            const promise = updatedInfo.Id
                ? EventsService.update(auth, updatedInfo)
                : EventsService.create(auth, updatedInfo);

            return promise
                .then(updated => {
                    setIsSavingRegistration(false);
                    sharedDirtyWindowState.set(false);

                    if (!updatedInfo.Id) {
                        navigate(`/${updated.Id}/registration/general`);
                    }
                })
                .catch(err => {
                    if (err.message) {
                        setSavingError(err.message);
                    }
                    else {
                        setSavingError(err);
                    }

                    setIsSavingRegistration(false);
                });
        };

    const cloneEvent = async () => {
        alert("IN PROGRESS: Clone Event");
        return Promise.resolve();
    };

    const copyRegistrations = async () => {
        alert("IN PROGRESS: Copy Registrations");
        return Promise.resolve();
    };

    const sendEmail = async () => {
        alert("IN PROGRESS: Send E-mail");
        return Promise.resolve();
    };

    const deleteEvent = async () => {
        setDialogType(DialogType.DeleteConfirmation);
        return Promise.resolve();
    };

    if (initializeSavingRegistration) {
        saveRegistration();
    }

    const formsDialogRef = useRef<HTMLDialogElement>(null);

    return (
        <div className="overflow-x-auto">
            {savingError && (
                <div className="alert alert-warning rounded-2xl mb-4">
                    <div
                        className="w-full"
                        dangerouslySetInnerHTML={{ __html: savingError }} />
                </div>)}
            <Outlet context={{
                auth: auth,
                isNewEvent: !info,
                isSaving: isSavingRegistration,
                context: {
                    rootEventUrl: rootUrl,
                    registrationLink: info ? `https://registration.biblequiz.com/#/Registration/${info.Id}` : null,
                    isNewEvent: !info,
                    hasRegistrations: info?.HasAnyRegistrations || false,
                    saveRegistration: async () => {
                        // This is required to allow asynchronous saving of the state.
                        setInitializeSavingRegistration(true);
                        return Promise.resolve();
                    },
                    cloneEvent: cloneEvent,
                    copyRegistrations: copyRegistrations,
                    sendEmail: sendEmail,
                    deleteEvent: deleteEvent,
                },

                setEventTitle: setEventTitle,
                setEventType: setEventType,
                setEventIsHidden: setEventIsHidden,
                saveRegistration: () => setInitializeSavingRegistration(true),

                general: generalState,
                setGeneral: setGeneralState,

                teamsAndQuizzers: teamsAndQuizzers,
                setTeamsAndQuizzers: setTeamsAndQuizzers,

                officialsAndAttendees: officialsAndAttendees,
                setOfficialsAndAttendees: setOfficialsAndAttendees,

                requiredFields: requiredFields,
                setRequiredFields: setRequiredFields,

                fields: fields,
                setFields: f => {
                    setFields(f);
                    setHasChangedFields(true);
                },

                divisions: divisions,
                setDivisions: setDivisions,

                forms: forms,
                setForms: f => {
                    setForms(f);
                    setHasChangedForms(true);
                },

                money: moneyState,
                setMoney: m => {
                    setMoneyState(m);
                    setHasChangedCosts(true);
                },

                other: otherInfo,
                setOther: setOtherInfo,
            } as RegistrationProviderContext
            } />
            {missingBirthdateForRoles && (
                <RegistrationFormsPageFieldsDialog
                    dialogRef={formsDialogRef}
                    missingForRoles={missingBirthdateForRoles}
                    setDialogResult={result => {
                        if (result) {
                            const newRequiredFields = { ...requiredFields };
                            for (const role of missingBirthdateForRoles) {
                                newRequiredFields.roleFields[role] |= RequiredPersonFields.DateOfBirth;
                            }

                            setRequiredFields(newRequiredFields);
                            setInitializeSavingRegistration(true);
                        }

                        setMissingBirthdateForRoles(undefined);
                        formsDialogRef.current?.close();
                    }}
                />)}
            {impactingChanges && (
                <RegistrationImpactingDialog
                    dialogRef={formsDialogRef}
                    changes={impactingChanges}
                    setDialogResult={result => {
                        setInitializeSavingRegistration(result);
                        if (!result) {
                            setImpactingChanges(undefined);
                        }
                        formsDialogRef.current?.close();
                    }}
                />)}
            {dialogType === DialogType.DeleteConfirmation && (
                <ConfirmationDialog
                    title="Delete Event"
                    yesLabel="Yes"
                    onYes={async () => {
                        setIsSavingRegistration(true);
                        await EventsService.delete(auth, info!.Id!);
                        window.location.href = "/manage-events";
                    }}
                    noLabel="No"
                    onNo={() => setDialogType(DialogType.None)}
                >
                    Are you sure you want to delete this event?
                </ConfirmationDialog>)}
        </div>);
}