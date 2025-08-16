import { useState } from "react";
import { useStore } from "@nanostores/react";
import { sharedAuthManager } from "../utils/SharedState";
import ChurchLookup from "./ChurchLookup";
import regions from "../data/regions.json";
import districts from "../data/districts.json";

interface Props {
}

interface ChurchScopeInfo {
    selectedValue: string;
    regionId: string;
    districtId: string | null;
}

export default function ProfilePersonDetails({ }: Props) {

    const authManager = useStore(sharedAuthManager);

    const existingProfile = authManager.userProfile?.authTokenProfile;

    const [firstName, setFirstName] = useState(existingProfile?.firstName || "");
    const [lastName, setLastName] = useState(existingProfile?.lastName || "");
    const [email, setEmail] = useState(existingProfile?.email || "");
    const [competitionType, setCompetitionType] = useState("");
    const [churchScope, setChurchScope] = useState<ChurchScopeInfo | null>(null);
    const [churchId, setChurchId] = useState("");
    const [termsAgreed, setTermsAgreed] = useState(false);

    function selectRegionOrDistrict(selectedValue: string): void {

        let regionId: string | null = null;
        let districtId: string | null = null;
        if (selectedValue) {
            const parts: string[] = selectedValue.split('_');
            if (parts.length > 0) {
                regionId = parts[0];
            }

            if (parts.length > 1) {
                districtId = parts[1];
            }
        }

        if (!regionId) {
            setChurchScope(null);
        }
        else {
            setChurchScope({
                selectedValue: selectedValue,
                regionId: regionId,
                districtId: districtId
            });
        }
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        event.stopPropagation();

        alert("Test");
    }

    return (
        <form id="registrationForm" className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full mt-4">
                    <label className="label">
                        <span className="label-text font-medium">First Name</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="text"
                        name="firstName"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        className="input input-bordered w-full"
                        required
                    />
                </div>
                <div className="w-full">
                    <label className="label">
                        <span className="label-text font-medium">Last Name</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        type="text"
                        name="lastName"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        className="input input-bordered w-full"
                        required
                    />
                </div>
            </div>
            <div className="w-full">
                <label className="label">
                    <span className="label-text font-medium">Email Address</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="input input-bordered w-full"
                    required
                />
            </div>
            <div className="w-full">
                <label className="label">
                    <span className="label-text font-medium">Church Location</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <div>
                    <select
                        className="select select-bordered w-full"
                        value={churchScope?.selectedValue || ""}
                        onChange={e => selectRegionOrDistrict(e.target.value)}
                        required
                    >
                        <option value="" disabled>
                            Select Region or District
                        </option>
                        {regions.map((region) => (
                            <option key={`reg_${region.id}`} value={region.id}>
                                {region.name}: {region.states.join(", ")}
                            </option>
                        ))}
                        <option value="" disabled>
                            ----------------------
                        </option>
                        {districts.map((district) => (
                            <option key={`dis_${district.id}`} value={`${district.regionId}_${district.id}`}>
                                {district.name}: {district.states.join(", ")}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {churchScope && (
                <div className="w-full">
                    <label className="label">
                        <span className="label-text font-medium">Church</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <ChurchLookup
                        regionId={churchScope.regionId}
                        districtId={churchScope.districtId ?? undefined}
                        onSelect={church => setChurchId(church.id)}
                        required
                    />
                </div>)}
            <div className="w-full">
                <label className="label">
                    <span className="label-text font-medium">Default Type of Competition</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <div>
                    <select
                        className="select select-bordered w-full"
                        value={competitionType}
                        onChange={e => setCompetitionType(e.target.value)}
                        required
                    >
                        <option value="agjbq">Junior Bible Quiz (JBQ)</option>
                        <option value="agtbq">Teen Bible Quiz (TBQ)</option>
                    </select>
                </div>
            </div>
            <div className="w-full">
                <label className="cursor-pointer flex items-center gap-2">
                    <input
                        type="checkbox"
                        className="checkbox"
                        checked={termsAgreed}
                        onChange={e => setTermsAgreed(e.target.checked)}
                        required
                    />
                    <span>
                        I agree to the <a href="/terms" target="_blank" className="link">Terms &amp;
                            Conditions</a> and <a href="/privacy" target="_blank" className="link">PrivacyPolicy</a>
                        <span className="text-danger"> *</span>
                    </span>
                </label>
            </div>
            <div className="flex justify-end flex-wrap">
                <button
                    type="submit"
                    className="btn btn-primary mt-4"
                    disabled={!firstName || !lastName || !email || !churchId || !termsAgreed}
                >
                    Complete Profile
                </button>
                <button
                    type="button"
                    className="btn btn-warning ml-2"
                    onClick={() => authManager.logout()}
                >
                    Sign Out & Change User
                </button>
            </div>
        </form>);
}