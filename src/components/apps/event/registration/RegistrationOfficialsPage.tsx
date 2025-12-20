import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useOutletContext } from "react-router-dom";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";

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
    const [extendedOfficialsEndDate, setExtendedOfficialsEndDate] = useState(officialsAndAttendees.extendedOfficialsEndDate || general.registrationEndDate);
    const [allowExtendedAttendees, setAllowExtendedAttendees] = useState(!!officialsAndAttendees.extendedAttendeesEndDate);
    const [extendedAttendeesEndDate, setExtendedAttendeesEndDate] = useState(officialsAndAttendees.extendedAttendeesEndDate || general.registrationEndDate);

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
                    type="date"
                    className="input w-full"
                    value={extendedOfficialsEndDate || undefined}
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
                    min={general.registrationStartDate}
                    max={general.endDate}
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
                            type="date"
                            className="input w-full"
                            value={extendedAttendeesEndDate || undefined}
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
                            min={general.registrationStartDate}
                            max={general.endDate}
                            required={allowExtendedAttendees}
                            disabled={!allowExtendedAttendees}
                        />
                    </>
                )}
            </div>
        </RegistrationPageForm >);
}