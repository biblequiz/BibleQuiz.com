import { useEffect, useState } from "react";
import regions from "data/regions.json";
import districts from "data/districts.json";
import { EventPublishType } from "types/services/EventsService";

interface Props {
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
    regionId,
    setRegionId,
    districtId,
    setDistrictId,
    publishType,
    setPublishType,
    isOfficial,
    setIsOfficial }: Props) {

    const [eventType, setEventType] = useState<EventType | undefined>();

    useEffect(() => {
        switch (publishType) {
            case EventPublishType.Regular:
                if (districtId) {
                    setEventType(EventType.Local);
                }
                break;
            case EventPublishType.Tournament:
                setEventType(EventType.Tournament);
                break;
            case EventPublishType.Finals:
                if (districtId) {
                    setEventType(EventType.DistrictFinal);
                }
                else if (regionId) {
                    setEventType(EventType.RegionalFinal);
                }
                else {
                    setEventType(EventType.NationalFinal);
                }

                break;
        }
    }, [regionId, districtId, publishType, isOfficial]);

    return (
        <div className="flex flex-wrap gap-4">
            <div
                className="card w-90 card-sm shadow-sm border-2 border-solid mt-0 relative"
            >
                <div className="card-body p-2 pl-4">
                    <label className="label text-wrap">
                        <input
                            type="radio"
                            name="EventType"
                            className="radio radio-info"
                            checked={eventType === EventType.Local}
                            onChange={() => {
                                setEventType(EventType.Local);
                                setPublishType(EventPublishType.Regular);
                                setIsOfficial(false);
                            }}
                            required
                        />
                        <span className="text-md">
                            <b>LOCAL EVENT</b>
                        </span>
                    </label>
                    <p className="text-sm mt-0">
                        Local competition such as league meets. Churches outside the district must select <i>Eligible Events in All Districts/Regions</i> to see the event.
                    </p>
                    <select
                        className="select select-bordered w-full mt-0"
                        value={districtId || ""}
                        onChange={e => setDistrictId(e.target.value)}
                        required={eventType === EventType.Local}
                    >
                        <option value="" disabled>Select District</option>
                        {districts.map((district => (
                            <option key={`district_${district.id}`} value={district.id}>
                                {district.name}
                            </option>)))}
                    </select>
                    <p className="text-sm">
                        <b><i>Who can register?</i></b> Any church in any district.
                    </p>
                </div>
            </div>

            <div
                className="card w-90 card-sm shadow-sm border-2 border-solid mt-0 relative"
            >
                <div className="card-body p-2 pl-4">
                    <label className="label text-wrap">
                        <input
                            type="radio"
                            name="EventType"
                            className="radio radio-info"
                            checked={eventType === EventType.Tournament}
                            onChange={() => {
                                setEventType(EventType.Tournament);
                                setPublishType(EventPublishType.Tournament);
                                setIsOfficial(false);
                            }}
                            required
                        />
                        <span className="text-md">
                            <b>NATIONAL TOURNAMENT</b>
                        </span>
                    </label>
                    <p className="text-sm mt-0">
                        Tournament such as Gobblefest or the Snow Bowl.
                    </p>
                    <p className="text-sm">
                        <b><i>Who can register?</i></b> Any church in any district.
                    </p>
                </div>
            </div>
        </div>);
};
