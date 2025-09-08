import { QuestionGeneratorService, type QuestionSelectionCriteria } from 'types/services/QuestionGeneratorService';
import TemplateSelectorItem from './TemplateSelectorItem';
import React, { useEffect, useState } from 'react';
import { AuthManager } from 'types/AuthManager';
import type { RemoteServiceError } from 'types/services/RemoteServiceUtility';
import FontAwesomeIcon from 'components/FontAwesomeIcon';

interface Props {
    customTemplates: Record<string, QuestionSelectionCriteria> | null;
    setCustomTemplates: (newTemplates: Record<string, QuestionSelectionCriteria> | null) => void;

    currentTemplate: string | null;
    setCurrentTemplate: (template: string) => void;

    setIsLoadingTemplates: (isLoadingTemplates: boolean) => void;
    setDialogTemplateId: (id: string | null) => void;
}

export default function CustomTemplateSelector({
    customTemplates,
    setCustomTemplates,
    currentTemplate,
    setCurrentTemplate,
    setIsLoadingTemplates,
    setDialogTemplateId }: Props) {

    const auth = AuthManager.useNanoStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoading, setIsLoading] = useState(!customTemplates);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    useEffect(
        () => {
            if (!customTemplates && !loadingError) {

                setIsLoadingTemplates(true);

                QuestionGeneratorService.getTemplates(auth)
                    .then(t => {

                        // Ensure the selected template exists.
                        if (currentTemplate) {
                            const templateIds = Object.keys(t);
                            if (templateIds.length > 0 && !t[currentTemplate]) {
                                setCurrentTemplate(templateIds[0]);
                            }
                        }

                        setCustomTemplates(t);
                        setIsLoading(false);
                        setIsLoadingTemplates(false);
                    })
                    .catch((error: RemoteServiceError) => {
                        setLoadingError(error.message);
                        setIsLoading(false);
                        setIsLoadingTemplates(false);
                    });
            }
        }, [auth, customTemplates]);

    if (isLoading) {
        return (
            <div className="gap-2 flex justify-center">
                <span className="loading loading-spinner loading-lg"></span>
                <span className="italic">Loading your templates ...</span>
            </div>);
    }
    else if (loadingError) {
        return (
            <div className={`alert alert-error flex flex-col`}>
                <div className="flex-1 gap-2">
                    <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />
                    <span>{loadingError}</span>
                </div>
            </div>);
    }

    const handleView = async (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.preventDefault();
        event.stopPropagation();

        setDialogTemplateId(id);
    };

    const handleDelete = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
        event.preventDefault();
        event.stopPropagation();

        setIsProcessing(true);

        QuestionGeneratorService.deleteTemplate(auth, id)
            .then(() => {
                if (customTemplates) {
                    // Filter out the deleted template from the object
                    const { [id]: deletedTemplate, ...remainingTemplates } = customTemplates;
                    setCustomTemplates(remainingTemplates);
                }
            })
            .finally(() => {
                setIsProcessing(false);
            });
    };

    const templateIds = Object.keys(customTemplates!);
    if (templateIds.length === 0) {
        return (
            <div className="text-center text-md italic">
                You haven't saved any templates yet.
            </div>);
    }

    return templateIds.map(key => {
        const template = customTemplates![key];
        return (
            <TemplateSelectorItem
                key={`mytemplate-${key}`}
                template={key}
                isSelected={currentTemplate === key}
                onChangeWithCustom={setCurrentTemplate}
                title={template.Title}>
                <button
                    type="button"
                    disabled={isProcessing}
                    className="btn btn-success btn-sm mt-0 mr-2"
                    onClick={e => handleView(e, key)}>
                    <FontAwesomeIcon icon="fas faEye" />
                    <span>View Settings</span>
                </button>
                <button
                    type="button"
                    disabled={isProcessing}
                    onClick={e => handleDelete(e, key)}
                    className="btn btn-error btn-sm mt-0">
                    <FontAwesomeIcon icon="fas faTrashAlt" />
                    <span>Delete</span>
                </button>
            </TemplateSelectorItem>);
    });
}