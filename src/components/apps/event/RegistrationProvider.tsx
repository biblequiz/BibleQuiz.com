import { Outlet, useOutletContext } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useState } from "react";
import type { RegistrationGeneralInfo } from "./registration/RegistrationGeneralPage";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import type { RegistrationTeamsAndQuizzersInfo } from "./registration/RegistrationTeamsAndQuizzersPage";
import type { RegistrationOfficialsAndAttendeesInfo } from "./registration/RegistrationOfficialsPage";

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
        allowJudges: info?.HasJudges || true,
        allowScorekeepers: info?.HasScorekeepers || true,
        allowTimekeepers: info?.HasTimekeepers || true,
        allowAttendees: info?.AllowAttendees || false,
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
                setOfficialsAndAttendees: setOfficialsAndAttendees
            } as RegistrationProviderContext} />
        </div>);
}