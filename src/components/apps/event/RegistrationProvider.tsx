import { Outlet, useOutletContext } from "react-router-dom";
import { AuthManager } from "types/AuthManager";
import type { EventProviderContext } from "./EventProvider";
import { useState } from "react";
import type { RegistrationGeneralInfo } from "./registration/RegistrationGeneralPage";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

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
            } as RegistrationProviderContext} />
        </div>);
}