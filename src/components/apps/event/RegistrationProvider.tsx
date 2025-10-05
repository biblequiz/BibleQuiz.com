import { Outlet, useOutletContext } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useEffect, useState } from "react";
import type { RegistrationGeneralInfo } from "./registration/RegistrationGeneralPage";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
}

export interface RegistrationProviderContext {
    auth: AuthManager;

    setEventTitle: (title: string) => void;
    setEventType: (typeId: string) => void;

    general: RegistrationGeneralInfo;
    setGeneral: (updated: RegistrationGeneralInfo) => void;
}

const normalizeDate = (date: string | null): string | null => {
    return DataTypeHelpers.formatDate(
        date,
        "yyyy-MM-dd");
};

export default function RegistrationProvider({ }: Props) {
    const {
        auth,
        eventId,
        info,
        setEventTitle,
        setEventType
    } = useOutletContext<EventProviderContext>();

    const [generalState, setGeneralState] = useState<RegistrationGeneralInfo>(() =>
    ({
        name: info?.Name || "",
        typeId: info?.TypeId || "",
        startDate: normalizeDate(info?.StartDate || null) || "",
        endDate: normalizeDate(info?.EndDate || null) || "",
        registrationStartDate: normalizeDate(info?.RegistrationStartDate || null) || "",
        registrationEndDate: normalizeDate(info?.RegistrationEndDate || null) || "",
        extendedOfficialsEndDate: normalizeDate(info?.ExtendedOfficialsEndDate || null),

        allowAttendees: info?.AllowAttendees || false,
        extendedAttendeesEndDate: normalizeDate(info?.ExtendedAttendeesEndDate || null)
    }));

    return (
        <div className="overflow-x-auto">
            <Outlet context={{
                auth: auth,
                setEventTitle: setEventTitle,
                setEventType: setEventType,

                general: generalState,
                setGeneral: setGeneralState,
            } as RegistrationProviderContext} />
        </div>);
}