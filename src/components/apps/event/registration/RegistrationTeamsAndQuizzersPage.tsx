import { useState } from "react";
import type { RegistrationProviderContext } from "../RegistrationProvider";
import { useOutletContext } from "react-router-dom";
import RegistrationPageForm from "./RegistrationPageForm";
import { sharedDirtyWindowState } from "utils/SharedState";

interface Props {
}

export interface RegistrationTeamsAndQuizzersInfo {
    minTeamMembers: number;
    maxTeamMembers: number;
    requireTeamCoaches: boolean;
    allowCustomTeamNames: boolean;
    allowIndividuals: boolean;
}

export default function RegistrationTeamsAndQuizzersPage({ }: Props) {
    const {
        rootEventUrl,
        saveRegistration,
        teamsAndQuizzers,
        setTeamsAndQuizzers } = useOutletContext<RegistrationProviderContext>();

    const [minTeamMembers, setMinTeamMembers] = useState(teamsAndQuizzers.minTeamMembers);
    const [maxTeamMembers, setMaxTeamMembers] = useState(teamsAndQuizzers.maxTeamMembers);
    const [requireTeamCoaches, setRequireTeamCoaches] = useState(teamsAndQuizzers.requireTeamCoaches);
    const [allowCustomTeamNames, setAllowCustomTeamNames] = useState(teamsAndQuizzers.allowCustomTeamNames);
    const [allowIndividuals, setAllowIndividuals] = useState(teamsAndQuizzers.allowIndividuals);

    return (
        <RegistrationPageForm
            rootEventUrl={rootEventUrl}
            persistFormToEventInfo={() => {
                setTeamsAndQuizzers({
                    ...teamsAndQuizzers,
                    minTeamMembers,
                    maxTeamMembers,
                    requireTeamCoaches,
                    allowCustomTeamNames,
                    allowIndividuals
                });
            }}
            saveRegistration={saveRegistration}
            previousPageLink={`${rootEventUrl}/registration/general`}
            nextPageLink={`${rootEventUrl}/registration/officials`}>

            <h5 className="mb-0">Team Requirements</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 mt-0 mb-0">
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Min Team Members</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        name="minTeamMembers"
                        type="number"
                        className="input w-full"
                        min={1}
                        max={8}
                        value={minTeamMembers}
                        onChange={e => {
                            setMinTeamMembers(e.target.valueAsNumber);
                            sharedDirtyWindowState.set(true);
                        }}
                        required
                    />
                </div>
                <div className="w-full mt-0">
                    <label className="label">
                        <span className="label-text font-medium">Max Team Members</span>
                        <span className="label-text-alt text-error">*</span>
                    </label>
                    <input
                        name="minTeamMembers"
                        type="number"
                        className="input w-full"
                        min={1}
                        max={8}
                        value={maxTeamMembers}
                        onChange={e => {
                            setMaxTeamMembers(e.target.valueAsNumber);
                            sharedDirtyWindowState.set(true);
                        }}
                        required
                    />
                </div>
            </div>

            <div className="w-full ml-2 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="requireCoach"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={requireTeamCoaches}
                        onChange={e => {
                            setRequireTeamCoaches(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Each team must have at least one coach.
                    </span>
                </label>
            </div>

            <div className="w-full ml-2 mt-1">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="allowCustomTeamNames"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={allowCustomTeamNames}
                        onChange={e => {
                            setAllowCustomTeamNames(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Teams can specify their own names. If unchecked, the name will be automatically generated based
                        on the name of the church.
                    </span>
                </label>
            </div>

            <h5 className="mb-0">Can others register?</h5>
            <div className="w-full ml-2 mt-1 mb-0">
                <label className="label text-wrap">
                    <input
                        type="checkbox"
                        name="allowIndividuals"
                        className="checkbox checkbox-sm checkbox-info"
                        checked={allowIndividuals}
                        onChange={e => {
                            setAllowIndividuals(e.target.checked);
                            sharedDirtyWindowState.set(true);
                        }}
                    />
                    <span>
                        Individuals can register outside of a team (e.g. individual tournament).
                    </span>
                </label>
            </div>
        </RegistrationPageForm>);
}