import { useEffect, useMemo, useState } from "react";
import regions from "data/regions.json";
import districts from "data/districts.json";
import { EventPublishType } from "types/services/EventsService";
import { sharedDirtyWindowState } from "utils/SharedState";
import { AuthManager } from "types/AuthManager";
import type { DistrictInfo, RegionInfo } from "types/RegionAndDistricts";

interface Props {
    eventId: string | null;
    type: string,
    regionId: string | null;
    setRegionId: (regionId: string | null) => void;
    districtId: string | null;
    setDistrictId: (districtId: string | null) => void;
    publishType: EventPublishType;
    setPublishType: (publishType: EventPublishType) => void;
    isOfficial: boolean;
    setIsOfficial: (isOfficial: boolean) => void;
}

enum EventType {
    Local = "Local",
    Tournament = "Tournament",
    DistrictFinal = "DistrictFinal",
    RegionalFinal = "RegionalFinal",
    NationalFinal = "NationalFinal"
}

export default function EventTypeSelectorCards({
    isNewEvent,
    type,
    regionId,
    setRegionId,
    districtId,
    setDistrictId,
    publishType,
    setPublishType,
    isOfficial,
    setIsOfficial }: Props) {

    const auth = AuthManager.useNanoStore();

    const [eventType, setEventType] = useState<EventType | undefined>(
        () => {
            switch (publishType) {
                case EventPublishType.Regular:
                    if (districtId) {
                        return EventType.Local;
                    }
                    break;
                case EventPublishType.Tournament:
                    return EventType.Tournament;
                case EventPublishType.Finals:
                    if (districtId) {
                        return EventType.DistrictFinal;
                    }
                    else if (regionId) {
                        return EventType.RegionalFinal;
                    }
                    else {
                        return EventType.NationalFinal;
                    }
            }

            return isNewEvent ? EventType.Local : undefined;
        });

    const filteredRegions = useMemo(() => {
        const filtered: RegionInfo[] = [];
        for (const region of regions) {
            if (regionId === region.id ||
                (auth.userProfile &&
                    auth.userProfile.hasRegionPermission(region.id, type))) {
                filtered.push(region);
            }
        }

        return filtered;
    }, [auth, type, ]);

    const filteredDistricts = useMemo(() => {
        const filtered: DistrictInfo[] = [];
        for (const district of districts) {
            if (districtId === district.id ||
                (auth.userProfile &&
                    auth.userProfile.hasDistrictPermission(district.id, district.regionId, type))) {
                filtered.push(district);
            }
        }

        return filtered;
    }, [auth, type]);

    const getCard = (
        label: string,
        description: React.ReactNode,
        eligibility: string,
        cardType: EventType,
        cardPublishType: EventPublishType,
        cardIsOfficial: boolean,
        listLabel?: string | undefined,
        currentListItemId?: string | null | undefined,
        setListItem?: ((id: string) => void) | undefined,
        listItems?: { id: string, name: string }[] | undefined) => {

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 mt-0 mb-4 border border-base-400 bg-base-300 rounded-lg">
                <div className={`w-full mt-0 ${listItems ? "md:col-span-2" : "col-span-3"}`}>
                    <label className="label text-wrap">
                        <input
                            type="radio"
                            name="EventType"
                            className="radio radio-info"
                            checked={cardType === eventType}
                            value={cardType}
                            onChange={() => {
                                setEventType(cardType);
                                setPublishType(cardPublishType);
                                setIsOfficial(cardIsOfficial);
                                sharedDirtyWindowState.set(true);
                            }}
                            required
                        />
                        <span className="text-sm">
                            <b>{label}</b>
                        </span>
                    </label>
                    <p className="text-sm mt-0">
                        {description}
                    </p>
                    <p className="text-sm">
                        <b><i>Who can register?</i></b> {eligibility}
                    </p>
                </div>
                {setListItem && listLabel && listItems && (
                    <div className="w-full mt-0">
                        <select
                            className="select select-bordered w-full mt-0"
                            value={currentListItemId || ""}
                            onChange={e => setListItem(e.target.value)}
                            required={eventType === cardType}
                            disabled={eventType !== cardType}
                        >
                            <option value="" disabled>Select {listLabel}</option>
                            {listItems?.map((item => (
                                <option key={`${listLabel}_${item.id}`} value={item.id}>
                                    {item.name}
                                </option>)))}
                        </select>
                    </div>)}
            </div>);
    };

    return (
        <>
            {getCard(
                "LOCAL EVENT",
                <>Local competition such as league meets. Churches outside the district must select <i>Eligible Events in All Districts/Regions</i> to see the event.</>,
                "Any church in any district.",
                EventType.Local,
                EventPublishType.Regular,
                false,
                "District",
                districtId,
                setDistrictId,
                filteredDistricts)}
            {getCard(
                "NATIONAL TOURNAMENT",
                <>Tournament such as Gobblefest or the Snow Bowl.</>,
                "Any church in any district.",
                EventType.Tournament,
                EventPublishType.Tournament,
                false)}
            {getCard(
                "DISTRICT FINALS",
                <>District Finals using official eligibility rules.</>,
                "Any church in the District.",
                EventType.DistrictFinal,
                EventPublishType.Finals,
                true,
                "District",
                districtId,
                setDistrictId,
                filteredDistricts)}
            {getCard(
                "REGIONAL FINALS",
                <>Regional Finals using official eligibility rules.</>,
                "Any church in the Region.",
                EventType.RegionalFinal,
                EventPublishType.Finals,
                true,
                "Region",
                regionId,
                setRegionId,
                filteredRegions)}
            {getCard(
                "NATIONAL FINALS",
                <>National Finals using official eligibility rules.</>,
                "Any church in any district.",
                EventType.NationalFinal,
                EventPublishType.Finals,
                true)}
        </>);
};
