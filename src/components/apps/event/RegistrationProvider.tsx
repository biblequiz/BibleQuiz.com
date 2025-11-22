import { Outlet, useOutletContext } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useState } from "react";
import type { RegistrationGeneralInfo } from "./registration/RegistrationGeneralPage";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { RegistrationTeamsAndQuizzersInfo } from "./registration/RegistrationTeamsAndQuizzersPage";
import type { RegistrationOfficialsAndAttendeesInfo } from "./registration/RegistrationOfficialsPage";
import { EventDivision, EventExternalForm, RequiredPersonFields, type EventField } from "types/services/EventsService";
import type { RegistrationRoleRequiredFields } from "./registration/RegistrationRequiredFieldsPage";
import type { RegistrationMoneyInfo } from "./registration/RegistrationMoneyPage";

interface Props {
}

export interface RegistrationProviderContext {
    auth: AuthManager;
    rootEventUrl: string;

    setEventTitle: (title: string) => void;
    setEventType: (typeId: string) => void;
    saveRegistration: () => Promise<void>;

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
}

const normalizeDate = (date: string | null): string | null => {
    return DataTypeHelpers.formatDate(
        date,
        "yyyy-MM-dd");
};

export default function RegistrationProvider({ }: Props) {
    const {
        auth,
        info,
        setEventTitle,
        setEventType,
        rootUrl
    } = useOutletContext<EventProviderContext>();

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
    const [divisions, setDivisions] = useState<EventDivision[]>(info?.Divisions || []);
    const [forms, setForms] = useState<EventExternalForm[]>(info?.Forms || []);

    const [moneyState, setMoneyState] = useState<RegistrationMoneyInfo>(() =>
    ({
        calculatePayment: info?.CalculatePayment || false,
        trackPayments: info?.TrackPayments || false,
        automatedFeeType: info?.AutomatedFeeType || null,
        automatedPaymentDescriptor: info?.AutomatedPaymentDescriptor || null,
        payeeName: info?.PayeeName || null,
        payeeEmail: info?.PayeeEmail || null,
        payeeAddress: info?.PayeeAddress || null,
        perChurchCost: info?.PerChurchCost || null,
        perTeamCost: info?.PerTeamCost || null,
        rolePayment: info?.RolePayment || null,
    }));

    const [otherInfo, setOtherInfo] = useState(() => ({
        isHidden: info?.IsHidden || false,
        isHiddenFromLiveEvents: info?.IsHiddenFromLiveEvents || false,
    }));

    const saveRegistration =
        () => {
            alert("Save registration called");
            return Promise.resolve();
        };

    return (
        <div className="overflow-x-auto">
            <Outlet context={{
                auth: auth,
                rootEventUrl: rootUrl,

                setEventTitle: setEventTitle,
                setEventType: setEventType,
                saveRegistration: saveRegistration,

                general: generalState,
                setGeneral: setGeneralState,

                teamsAndQuizzers: teamsAndQuizzers,
                setTeamsAndQuizzers: setTeamsAndQuizzers,

                officialsAndAttendees: officialsAndAttendees,
                setOfficialsAndAttendees: setOfficialsAndAttendees,

                requiredFields: requiredFields,
                setRequiredFields: setRequiredFields,

                fields: fields,
                setFields: setFields,

                divisions: divisions,
                setDivisions: setDivisions,

                forms: forms,
                setForms: setForms,

                money: moneyState,
                setMoney: setMoneyState,

                other: otherInfo,
                setOther: setOtherInfo,
            } as RegistrationProviderContext} />
        </div>);
}