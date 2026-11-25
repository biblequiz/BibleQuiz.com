import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useOutletContext } from "react-router-dom";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";
import { useCustomValidity } from "utils/useCustomValidity";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
}

export interface RegistrationOfficialsAndAttendeesInfo {
    extendedOfficialsEndDate: string | null;
    extendedAttendeesEndDate: string | null;
    allowJudges: boolean;
    allowScorekeepers: boolean;
    allowTimekeepers: boolean;
    allowAttendees: boolean;
}

// An extended date has to be after registration closes, so start on the following day.
const getDefaultExtendedDate = (registrationEndDate: string): string => {
    const parsed = DataTypeHelpers.parseDateOnly(registrationEndDate);
    if (!parsed) {
        return registrationEndDate;
    }

    parsed.setDate(parsed.getDate() + 1);
    return DataTypeHelpers.formatDate(parsed, "yyyy-MM-dd") ?? registrationEndDate;
};

export default function RegistrationOfficialsPage({ }: Props) {
    const {
        context,
        isSaving,
        general,
        officialsAndAttendees,
        setOfficialsAndAttendees } = useOutletContext<RegistrationProviderContext>();

    const [allowJudges, setAllowJudges] = useState(officialsAndAttendees.allowJudges);
    const [allowScorekeepers, setAllowScorekeepers] = useState(officialsAndAttendees.allowScorekeepers);
    const [allowTimekeepers, setAllowTimekeepers] = useState(officialsAndAttendees.allowTimekeepers);
    const [allowAttendees, setAllowAttendees] = useState(officialsAndAttendees.allowAttendees);
    const [allowExtendedOfficials, setAllowExtendedOfficials] = useState(!!officialsAndAttendees.extendedOfficialsEndDate);
    const [extendedOfficialsEndDate, setExtendedOfficialsEndDate] = useState(officialsAndAttendees.extendedOfficialsEndDate || getDefaultExtendedDate(general.registrationEndDate));
    const [allowExtendedAttendees, setAllowExtendedAttendees] = useState(!!officialsAndAttendees.extendedAttendeesEndDate);
    const [extendedAttendeesEndDate, setExtendedAttendeesEndDate] = useState(officialsAndAttendees.extendedAttendeesEndDate || getDefaultExtendedDate(general.registrationEndDate));

    // The server requires an extended date to fall after the end of registration and no later than
    // the first day of the event. A date equal to the end of registration (the default) is rejected.
    const getExtendedDateMessage = (isAllowed: boolean, value: string): string | null => {
        if (!isAllowed || !value) {
            return null;
        }

        if (general.registrationEndDate && value <= general.registrationEndDate) {
            return `The extended date must be after the regular last day to register (${general.registrationEndDate}).`;
        }

        if (general.startDate && value > general.startDate) {
            return `The extended date can't be after the first day of the event (${general.startDate}).`;
        }

        return null;
    };

    const extendedOfficialsRef = useCustomValidity<HTMLInputElement>(
        getExtendedDateMessage(allowExtendedOfficials, extendedOfficialsEndDate));
    const extendedAttendeesRef = useCustomValidity<HTMLInputElement>(
        getExtendedDateMessage(allowExtendedAttendees && allowAttendees, extendedAttendeesEndDate));

    return (
        <RegistrationPageForm
            context={context}
            isSaving={isSaving}
            persistFormToEventInfo={() => {
                setOfficialsAndAttendees({
                    ...officialsAndAttendees,
                    allowJudges,
                    allowScorekeepers,
                    allowTimekeepers,
                    allowAttendees,
                    extendedOfficialsEndDate: allowExtendedOfficials ? extendedOfficialsEndDate : null,
                    extendedAttendeesEndDate: allowExtendedAttendees ? extendedAttendeesEndDate : null,
                });
            }}
            previousPageLink={`${context.rootEventUrl}/registration/teamsAndQuizzers`}
            nextPageLink={`${context.rootEventUrl}/registration/requiredFields`}>

            <h5 className="mb-0">Roles for Officials</h5>
            <p className="mb-0">
                Will you officially designate officials with the following roles or will these
                be covered by existing officials (e.g. Quizmaster and Judge)?
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 mt-0 mb-0">
                <div className="w-full mt-0">
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            name="allowJudges"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={allowJudges}
                            onChange={e => {
                                setAllowJudges(e.target.checked);
                                sharedDirtyWindowState.set(true);
                            }}
                        />
                        <span>
                            Judge
                        </span>
                    </label>
                </div>
                <div className="w-full mt-0">
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            name="allowScorekeepers"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={allowScorekeepers}
                            onChange={e => {
                                setAllowScorekeepers(e.target.checked);
                                sharedDirtyWindowState.set(true);
                            }}
                        />
                        <span>
                            Scorekeeper
                        </span>
                    </label>
                </div>
                <div className="w-full mt-0">
                    <label className="label text-wrap">
                        <input
                            type="checkbox"
                            name="allowTimekeepers"
                            className="checkbox checkbox-sm checkbox-info"
                            checked={allowTimekeepers}
                            onChange={e => {
                                setAllowTimekeepers(e.target.checked);
                                sharedDirtyWindowState.set(true);
                            }}
                        />
                        <span>
                            Timekeeper
                        </span>
                    </label>
                </div>
            </div>

            <h5 className="mb-0">Can others register?</h5>
            <div className="w-full ml-2 mt-1 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="allowAttendees"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={allowAttendees}
                        onChange={e => {
                            setAllowAttendees(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Attendees (i.e., non-quizzers) can register for a church.
                    </span>
                </label>
            </div>

            <h5 className="mb-0">Are there extended registration dates?</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={allowExtendedOfficials}
                        onChange={e => {
                            setAllowExtendedOfficials(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Officials can register after the main registration period.
                    </span>
                </label>
                <input
                    ref={extendedOfficialsRef}
                    type="date"
                    className="input w-full"
                    value={extendedOfficialsEndDate || ""}
                    onChange={e => {
                        setExtendedOfficialsEndDate(e.target.value);
                    }}
                    onBlur={e => {
                        setOfficialsAndAttendees({
                            ...officialsAndAttendees,
                            extendedOfficialsEndDate: e.target.value,
                        });
                        sharedDirtyWindowState.set(true);
                    }}
                    required={allowExtendedOfficials}
                    disabled={!allowExtendedOfficials}
                />
                {allowAttendees && (
                    <>
                        <label className="label text-wrap">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={allowExtendedAttendees}
                                onChange={e => {
                                    setAllowExtendedAttendees(e.target.checked);
                                    sharedDirtyWindowState.set(true);
                                }}
                            />
                            <span>
                                Attendees can register after the main registration period.
                            </span>
                        </label>
                        <input
                            ref={extendedAttendeesRef}
                            type="date"
                            className="input w-full"
                            value={extendedAttendeesEndDate || ""}
                            onChange={e => {
                                setExtendedAttendeesEndDate(e.target.value);
                            }}
                            onBlur={e => {
                                setOfficialsAndAttendees({
                                    ...officialsAndAttendees,
                                    extendedAttendeesEndDate: e.target.value,
                                });
                                sharedDirtyWindowState.set(true);
                            }}
                            required={allowExtendedAttendees}
                            disabled={!allowExtendedAttendees}
                        />
                    </>
                )}
            </div>
        </RegistrationPageForm >);
}