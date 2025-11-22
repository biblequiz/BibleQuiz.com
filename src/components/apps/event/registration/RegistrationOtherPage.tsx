import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useOutletContext } from "react-router-dom";
import RegistrationPageForm from "./RegistrationPageForm";
import { useState } from "react";
import { sharedDirtyWindowState } from "utils/SharedState";

interface Props {
}

export interface RegistrationOtherInfo {
    isHidden: boolean;
    isHiddenFromLiveEvents: boolean;
}

export default function RegistrationOtherPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        other,
        setOther } = useOutletContext<RegistrationProviderContext>();

    // TODO: Add extended registration dates.

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/money`}>

            <div className="w-full ml-2 mt-1 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isHidden"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={other.isHidden}
                        onChange={e => {
                            setOther({ ...other, isHidden: e.target.checked });
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Hide this event from the registration portal.
                    </span>
                </label>
            </div>

            <div className="w-full ml-2 mt-1 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="isHiddenFromLiveEvents"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={other.isHiddenFromLiveEvents}
                        onChange={e => {
                            setOther({ ...other, isHiddenFromLiveEvents: e.target.checked });
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Hide from the Upcoming & Live section of BibleQuiz.com?
                    </span>
                </label>
            </div>
        </RegistrationPageForm>);
}