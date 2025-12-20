import { EventExternalForm } from "types/services/EventsService";
import { useState } from "react";
import RichTextEditor from "components/RichTextEditor";
import { sharedDirtyWindowState } from "utils/SharedState";
import { DataTypeHelpers } from "utils/DataTypeHelpers";
import { PersonRole } from "types/services/PeopleService";

interface Props {
    allowAttendees: boolean;
    form: EventExternalForm;
    getLabelValidityMessage: (label: string) => string | null;
}

function trimAndUpdateRequiredState(
    fieldValue: string | null | undefined,
    setFieldValue: (value: string) => void): string {

    const trimmed = DataTypeHelpers.trimToNull(fieldValue) ?? "";
    if (trimmed !== fieldValue) {
        setFieldValue(trimmed);
    }

    return trimmed;
}

const DESCRIPTION_HTML_TEMPLATE = `All registrants <b>MUST</b> complete the waiver form. No paper waivers will be accepted on site.`;
const FORM_WAIVER_HTML_TEMPLATE = `
<h4 style="margin-bottom:0px">GENERAL</h4>
<p>
    I represent that I am either the person above, or the parent/legal guardian of the individual. If I am the parent or legal guardian of the individual,
    I hereby consent to the foregoing on his or her behalf.
</p>
<p>
    In the case of a minor, the parent or legal guardian is responsible for designating an on-site emergency contact to act in case of emergency. Parents,
    legal guardians, and designated representatives are responsible to have student medical records or knowledge thereof. Designated representatives must
    carry authorized parental/legal guardian consent <i>in writing</i>.
</p>
<h4 style="margin-bottom:0px">LIABILITY RELEASE</h4>
<p>
    I understand and agree that neither the event's coordinators or volunteers, nor the General Council of the Assemblies of God, or any of their affiliated
    entities or individuals, directors, officers, employees, agents, volunteers, or any other representatives thereof shall incur any financial responsibility
    of liability whatsoever, for any such injury or damage resulting from this individual's participation at the event, however caused, whether due to
    negligence or any other acts of any person.
</p>
<h4 style="margin-bottom:0px">MEDICAL TREATMENT AUTHORIZATION</h4>
<p>
    I understand that I will be notified in the case of a medical emergency involving this individual. However, in the event that I cannot be reached, I
    authorize the calling of a doctor and the providing of necessary medical services in the event this individual is injured or becomes ill. I authorize any
    official event staff or volunteer team member to make emergency medical care decisions on behalf of this individual, if required by law or a health care provider.
    I understand that the event staff, or any of their agents, employees, or volunteers, will not be responsible for medical expenses incurred on the basis of
    this authorization.
</p>
<p>
    I agree to notify the event coordinators in the event of any health changes which would restrict this individual's participation in any activities. I also
    understand that the event staff and volunteers reserve the right to restrict this individual from any activity that they do not feel is within the physical
    capabilities of this individual.
</p>
<h4 style="margin-bottom: 0px">MODEL RELEASE</h4>
<p>
    For good and valuable consideration, the receipt and sufficiency of which is hereby acknowledged, I hereby grant to the National Youth Ministries
    of the Assemblies of God, the National Kids Ministries of the Assemblies of God, the General Council of the Assemblies of God, or any of their affiliated
    entities or individuals, directors, officers, employees, agents, volunteers, or any other representatives thereof the absolute and unqualified right and
    permission to copyright (in its own name or otherwise), reproduce, publish, distribute and otherwise use or exploit, photographs, motion pictures and
    other audiovisual works (including works recorded in digital media) of me or in which I may be included whether taken in a studio or elsewhere, alone or
    in conjunction with other persons or characters, in any part of the world, and to make similar uses of any reproductions of my voice. This authorization
    and consent includes any use of such photographs, motion pictures, audiovisual works or voice reproductions without regard to any distortion, alteration,
    or retouching whether intentional or otherwise. The use and exploitation hereunder may be in any medium now or thereafter known or developed for
    illustration, promotion, advertising, trade or any other purpose whatsoever, whether accompanied by printed matter or otherwise.
</p>
<p>
    I hereby waive any opportunity or right which I may have to inspect or approve the finished photographs, films, tapes, or digital data, the use to which
    they may be put, any copy, photographs, illustrations or other material used in connection therewith or the final product in which they may be used or
    incorporated.
</p>
<p>
    I hereby waive, release and discharge from any claim, demand, action or suit which I may have or which may be derived through me for libel, defamation,
    invasion of privacy or any violation of any right to publicity or any other right which I may have arising out of the publication or use of such
    photographs, motion pictures, audiovisual works and voice reproductions.
</p>
<p>
    I hereby warrant that I have the full right and authority to execute this Release; that I have read and understand the above Release; that I am executing
    this Release as my own free act and deed; and that this Release shall be binding upon me, my heirs, legal representatives and assigns.
</p>`;

export default function EventFormCardBody({ allowAttendees, form, getLabelValidityMessage }: Props) {

    const [isExternalUrl, setIsExternalUrl] = useState(() => DataTypeHelpers.isNullOrEmpty(form.WaiverHtml) || !DataTypeHelpers.isNullOrEmpty(form.Url));
    const [label, setLabel] = useState(form.Label);
    const [formRoles, setFormRoles] = useState(form.Roles);
    const [isRequired, setIsRequired] = useState(form.IsRequired);
    const [isTracked, setIsTracked] = useState(form.IsTracked);
    const [isMinorOnly, setIsMinorOnly] = useState(form.IsMinorOnly);
    const [descriptionHtml, setDescriptionHtml] = useState(() => DataTypeHelpers.isNullOrEmpty(form.DescriptionHtml) ? DESCRIPTION_HTML_TEMPLATE : form.DescriptionHtml);
    const [url, setUrl] = useState(form.Url);
    const [waiverHtml, setWaiverHtml] = useState(form.WaiverHtml);

    const getScopeCheckbox = (role: PersonRole, labelText: string) => {

        const isChecked = formRoles.findIndex(r => r === role) > -1;

        return (
            <label className="label ml-2 mt-0">
                <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-info"
                    checked={isChecked}
                    onChange={e => {
                        const newRoles: PersonRole[] = e.target.checked
                            ? [...formRoles, role]
                            : formRoles.filter(r => r !== role);

                        setFormRoles(newRoles);
                        form.Roles = newRoles;

                        sharedDirtyWindowState.set(true);
                    }}
                />
                <span>
                    {labelText}
                </span>
            </label>);
    };

    return (
        <>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Label</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <input
                    type="text"
                    className="input input-info w-full mt-0"
                    value={label}
                    onChange={e => {
                        e.target.setCustomValidity("");
                        setLabel(e.target.value);
                    }}
                    onBlur={e => {
                        const validityMessage = getLabelValidityMessage(label);
                        (e.target as HTMLInputElement).setCustomValidity(
                            validityMessage || "");

                        form.Label = trimAndUpdateRequiredState(label, setLabel);
                        sharedDirtyWindowState.set(true);
                    }}
                    maxLength={100}
                    required
                />
            </div>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Type</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <select
                    className="select select-info w-full mt-0"
                    value={isExternalUrl ? 0 : 1}
                    onChange={e => {
                        const newIsExternalUrl = parseInt(e.target.value) == 0;
                        setIsExternalUrl(newIsExternalUrl);
                        if (newIsExternalUrl) {
                            setWaiverHtml("");
                            form.WaiverHtml = "";
                        }
                        else {
                            setUrl("");
                            form.Url = "";

                            if (DataTypeHelpers.isNullOrEmpty(waiverHtml)) {
                                setWaiverHtml(FORM_WAIVER_HTML_TEMPLATE);
                                form.WaiverHtml = FORM_WAIVER_HTML_TEMPLATE;
                            }
                        }
                        sharedDirtyWindowState.set(true);
                    }}
                    required>
                    <option value={0}>External Form (e.g. Google Forms)</option>
                    <option value={1}>Waiver</option>
                </select>
            </div>
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Show For</span>
                    <span className="label-text-alt text-error">*</span>
                </label>
                <div className="rounded-md border-primary border-1 border-dashed mt-0 relative p-2 mt-0">
                    {getScopeCheckbox(PersonRole.Quizzer, "Quizzer")}
                    {getScopeCheckbox(PersonRole.Coach, "Coach")}
                    {getScopeCheckbox(PersonRole.Official, "Official")}
                    {allowAttendees && getScopeCheckbox(PersonRole.Attendee, "Attendee")}
                </div>
            </div>
            {isExternalUrl && (
                <>
                    <div className="w-full mt-0">
                        <label className="label mb-0">
                            <span className="label-text font-medium text-sm">URL</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="url"
                            className="input input-info w-full mt-0"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onBlur={() => {
                                form.Url = trimAndUpdateRequiredState(url, setUrl);
                                sharedDirtyWindowState.set(true);
                            }}
                            maxLength={255}
                            required
                        />
                    </div>
                    <div className="w-full mt-0">
                        <label className="label ml-2 mt-0">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={isTracked}
                                onChange={e => {
                                    setIsTracked(e.target.checked);
                                    form.IsTracked = e.target.checked;
                                    sharedDirtyWindowState.set(true);
                                }}
                            />
                            <span>
                                Completion is Tracked
                            </span>
                        </label>
                        <label className="label ml-2 mt-0">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={isRequired}
                                onChange={e => {
                                    setIsRequired(e.target.checked);
                                    form.IsRequired = e.target.checked;
                                    sharedDirtyWindowState.set(true);
                                }}
                            />
                            <span>
                                Form is Required
                            </span>
                        </label>
                    </div>
                </>
            )}
            <div className="w-full mt-0">
                <label className="label mb-0">
                    <span className="label-text font-medium text-sm">Description / Intro</span>
                </label>
                <RichTextEditor
                    text={descriptionHtml}
                    setText={newText => {
                        setDescriptionHtml(newText);
                        form.DescriptionHtml = newText;
                        sharedDirtyWindowState.set(true);
                    }}
                />
            </div>
            {!isExternalUrl && (
                <>
                    <div className="w-full mt-0">
                        <label className="label ml-2 mt-0">
                            <input
                                type="checkbox"
                                className="checkbox checkbox-sm checkbox-info"
                                checked={isMinorOnly}
                                onChange={e => {
                                    setIsMinorOnly(e.target.checked);
                                    form.IsMinorOnly = e.target.checked;
                                    sharedDirtyWindowState.set(true);
                                }}
                            />
                            <span>
                                Only required for minors
                            </span>
                        </label>
                    </div>
                    <div className="w-full mt-0">
                        <label className="label mb-0">
                            <span className="label-text font-medium text-sm">Waiver Text</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <RichTextEditor
                            text={waiverHtml}
                            setText={newText => {
                                setWaiverHtml(newText);
                                form.WaiverHtml = newText;
                                sharedDirtyWindowState.set(true);
                            }}
                        />
                    </div>
                </>
            )}
        </>);
}