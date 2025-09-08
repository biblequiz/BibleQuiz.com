import { AuthManager } from 'types/AuthManager';
import { useState, useRef, useEffect } from "react";
import { QuestionGeneratorService, QuestionOutputFormat, QuestionSelectionCriteria } from 'types/services/QuestionGeneratorService';
import FontAwesomeIcon from "../../FontAwesomeIcon";
import FormatSelector, { DEFAULT_COLUMN, DEFAULT_FONT, DEFAULT_SIZE } from './FormatSelector';
import { sharedGlobalStatusToast } from "utils/SharedState";

interface Props {
    templateId: string | null;
    criteria: QuestionSelectionCriteria;
    onClose: (criteria: QuestionSelectionCriteria | null) => void;
}

export default function SaveAsTemplateDialog({ templateId, criteria, onClose }: Props) {

    const auth = AuthManager.useNanoStore();

    const [title, setTitle] = useState<string>(criteria.Title || "");
    const [overwrite, setOverwrite] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSaving(true);

        criteria.Id = overwrite ? templateId : null;
        criteria.Title = title;

        if (!overwrite) {
            criteria.Id = null;
        }

        sharedGlobalStatusToast.set({
            type: "success",
            title: "Saving...",
            message: "We are saving the template now ...",
            showLoading: true,
            keepOpen: true,
        });

        const newCriteria = await QuestionGeneratorService.createOrUpdateTemplate(
            auth,
            criteria);

        onClose(newCriteria);
        setIsSaving(false);
    };

    return (
        <dialog className="modal" open>
            <div className="modal-box w-11/12 max-w-full md:w-3/4 lg:w-1/2">
                <h3 className="font-bold text-xl">Save as Template</h3>
                <form method="dialog" className="gap-2" onSubmit={handleSubmit}>
                    <div className="w-full mt-0">
                        <label className="label">
                            <span className="label-text font-medium">Title</span>
                            <span className="label-text-alt text-error">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Enter title for the template"
                            className="input input-bordered w-full"
                            maxLength={80}
                            required
                        />
                    </div>
                    {templateId && (
                        <div className="w-full">
                            <label className="label text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="question-category"
                                    className="checkbox checkbox-sm checkbox-info"
                                    checked={overwrite}
                                    onChange={e => setOverwrite(e.target.checked)} />
                                Overwrite existing template
                            </label>
                        </div>)}
                    <div className="flex gap-2 justify-end">
                        <button
                            type="submit"
                            className="btn btn-success mb-4 mt-0"
                            disabled={isSaving}
                        >
                            <FontAwesomeIcon icon="fas faFloppyDisk" classNames={["mr-2"]} />
                            Save
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary mb-4 mt-0"
                            disabled={isSaving}
                            onClick={() => onClose(null)}
                        >
                            <FontAwesomeIcon icon="fas faCircleXmark" classNames={["mr-2"]} />
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </dialog>);
}