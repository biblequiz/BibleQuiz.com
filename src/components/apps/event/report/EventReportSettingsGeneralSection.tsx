import { useMemo, useState } from "react";
import regions from "data/regions.json";
import districts from "data/districts.json";
import type { EventReportGeneralInfo } from "./EventReportSettingsSection";
import type { AuthManager } from "types/AuthManager";
import { filterToAuthorizedRegions, filterToAuthorizedDistricts } from "types/RegionAndDistricts";
import { ReportType } from "types/services/DatabaseReportsService";

interface Props {
    auth: AuthManager;
    info: EventReportGeneralInfo;
    eventType: string;
    setInfo: (info: EventReportGeneralInfo) => void;

    allowScope: boolean;
    setReportTitle: (title: string, isReport: boolean) => void;

    isDisabled: boolean;
}

export default function EventReportSettingsGeneralSection({
    auth,
    info,
    eventType,
    setInfo,
    allowScope,
    setReportTitle,
    isDisabled }: Props) {

    const [name, setName] = useState(info.name);
    const [regionId, setRegionId] = useState<string | null>(info.regionId);
    const [districtId, setDistrictId] = useState<string | null>(info.districtId);
    const [isVisible, setIsVisible] = useState(info.isVisible);
    const [reportType, setReportType] = useState(info.reportType);

    const filteredRegions = useMemo(
        () => filterToAuthorizedRegions(auth, regions, eventType, regionId),
        [auth, eventType]);

    const filteredDistricts = useMemo(
        () => filterToAuthorizedDistricts(auth, districts, eventType, districtId),
        [auth, eventType]);

    const handleScopeChanged = (e: React.ChangeEvent<HTMLSelectElement>) => {

        const selectedValue = e.target.value;

        let newRegionId: string | null = null;
        let newDistrictId: string | null = null;
        if (selectedValue) {
            const parts: string[] = selectedValue.split('_');
            if (parts.length > 0) {
                newRegionId = parts[0];
            }

            if (parts.length > 1) {
                newDistrictId = parts[1];
            }
        }

        setRegionId(newRegionId);
        setDistrictId(newDistrictId);

        setInfo({
            ...info,
            regionId: newRegionId,
            districtId: newDistrictId,
        });
    };

    const handleTypeChanged = (e: React.ChangeEvent<HTMLInputElement>) => {

        const selectedValue = ReportType[e.target.value as keyof typeof ReportType];
        setReportType(selectedValue);
        setInfo({
            ...info,
            reportType: selectedValue,
        });
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0 mb-0">
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium text-sm">Name</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        name="name"
                        type="text"
                        className="input w-full"
                        value={name}
                        minLength={1}
                        maxLength={60}
                        placeholder="Name of your report"
                        onChange={e => {
                            setName(e.target.value);
                            setReportTitle(e.target.value?.trim() || "New Report", true);
                        }}
                        onBlur={() => setInfo({ ...info, name: name?.trim() })}
                        disabled={isDisabled}
                        required
                    />
                </div>
                {allowScope && (
                    <div className="w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium text-sm">Eligible Events</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <select
                            name="type"
                            className="select select-bordered w-full mt-0"
                            onChange={handleScopeChanged}
                            value={districtId ? `${regionId}_${districtId}` : (regionId ? `${regionId}` : "")}
                            disabled={isDisabled}>
                            <option value="">
                                All Districts
                            </option>
                            <option value="" disabled>
                                ----------------------
                            </option>
                            {filteredRegions.map((region) => (
                                <option key={`reg_${region.id}`} value={region.id}>
                                    {region.name} Region
                                </option>
                            ))}
                            <option value="" disabled>
                                ----------------------
                            </option>
                            {filteredDistricts.map((district) => (
                                <option key={`dis_${district.id}`} value={`${district.regionId}_${district.id}`}>
                                    {district.name} District
                                </option>
                            ))}
                        </select>
                    </div>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0 mb-0">
                <div className="w-full mt-2 flex flex-wrap gap-2">
                    <label className="label text-wrap mt-0">
                        <input
                            type="radio"
                            name="reportType"
                            className="radio radio-sm radio-info"
                            value={ReportType.Teams}
                            checked={reportType === ReportType.Teams}
                            onChange={handleTypeChanged}
                        />
                        <span className="text-sm">
                            Teams Only
                        </span>
                    </label>
                    <label className="label text-wrap mt-0">
                        <input
                            type="radio"
                            name="reportType"
                            className="radio radio-sm radio-info"
                            value={ReportType.Quizzers}
                            checked={reportType === ReportType.Quizzers}
                            onChange={handleTypeChanged}
                        />
                        <span className="text-sm">
                            Quizzers Only
                        </span>
                    </label>
                    <label className="label text-wrap mt-0">
                        <input
                            type="radio"
                            name="reportType"
                            className="radio radio-sm radio-info"
                            value={ReportType.TeamsAndQuizzers}
                            checked={reportType === ReportType.TeamsAndQuizzers}
                            onChange={handleTypeChanged}
                        />
                        <span className="text-sm">
                            Teams & Quizzers
                        </span>
                    </label>
                </div>
                <div className="w-full mt-2">
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            name="isVisible"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={isVisible}
                            onChange={e => {
                                const newChecked = e.target.checked;
                                setIsVisible(newChecked);
                                setInfo({ ...info, isVisible: newChecked });
                            }}
                            disabled={isDisabled}
                        />
                        <span className="text-sm">
                            Show on BibleQuiz.com?
                        </span>
                    </label>
                </div>
            </div>
        </>);
}