import { useState } from 'react';
import { PeopleService } from 'types/services/PeopleService';
import { ChurchesService } from 'types/services/ChurchesService';
import type { AuthManager } from 'types/AuthManager';
import type { Person } from 'types/services/PeopleService';
import type { Church } from 'types/services/ChurchesService';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ConfirmationDialog from 'components/ConfirmationDialog';

interface Props {
    canShow: boolean;
    mergeType: 'people' | 'church';
    firstItem?: Person | Church | null;
    secondItem?: Person | Church | null;
    onClear: (item: 'first' | 'second' | 'all') => void;
    auth: AuthManager;
    onMergeComplete?: () => void;
}

export default function MergePanel({
    canShow,
    mergeType,
    firstItem,
    secondItem,
    onClear,
    auth,
    onMergeComplete
}: Props) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);

    if (!canShow || !firstItem || !secondItem) return null;

    const getItemDisplay = (item: Person | Church | null) => {
        if (!item) return '';
        if ('CurrentChurch' in item) {
            // It's a Person
            return `${(item as Person).FirstName} ${(item as Person).LastName}`;
        } else {
            // It's a Church
            return `${(item as Church).Name}`;
        }
    };

    const handleMerge = async () => {
        if (!firstItem || !secondItem) return;
        setIsMerging(true);
        setError(undefined);
        try {
            if (mergeType === 'people') {
                const firstPerson = firstItem as Person;
                const secondPerson = secondItem as Person;
                await PeopleService.update(auth, firstPerson, secondPerson.Id);
            } else {
                const firstChurch = firstItem as Church;
                const secondChurch = secondItem as Church;
                await ChurchesService.update(auth, firstChurch, secondChurch.Id);
            }
            setIsConfirming(false);
            onClear('all');
            onMergeComplete?.();
        } catch (err) {
            setError((err as any).message || 'Failed to merge');
            setIsConfirming(false);
        } finally {
            setIsMerging(false);
        }
    };

    return (
        <>
            <div className="card bg-base-200 shadow-md">
                <div className="card-body">
                    <h3 className="card-title">
                        <FontAwesomeIcon icon="fas faCompressAlt" />
                        Merge {mergeType === 'people' ? 'People' : 'Churches'}
                    </h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        {mergeType === 'people'
                            ? 'Select two people from the list below to merge them. The first person will keep all records from both.'
                            : 'Select two churches from the list below to merge them. The first church will keep all records from both.'}
                    </p>

                    {error && (
                        <div role="alert" className="alert alert-error mb-4">
                            <FontAwesomeIcon icon="fas faCircleExclamation" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div>
                            <label className="label">
                                <span className="label-text">First {mergeType === 'people' ? 'Person' : 'Church'}</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={getItemDisplay(firstItem)}
                                    className="input input-bordered flex-1"
                                    disabled
                                />
                                <button
                                    className="btn btn-ghost"
                                    title="Clear"
                                    onClick={() => onClear('first')}
                                >
                                    <FontAwesomeIcon icon="fas faXmark" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">Second {mergeType === 'people' ? 'Person' : 'Church'}</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    value={getItemDisplay(secondItem)}
                                    className="input input-bordered flex-1"
                                    disabled
                                />
                                <button
                                    className="btn btn-ghost"
                                    title="Clear"
                                    onClick={() => onClear('second')}
                                >
                                    <FontAwesomeIcon icon="fas faXmark" />
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn btn-warning text-white w-full"
                            onClick={() => setIsConfirming(true)}
                            disabled={isMerging}
                        >
                            <FontAwesomeIcon icon="fas faCompressAlt" />
                            Merge
                        </button>
                    </div>
                </div>
            </div>

            {isConfirming && (
                <ConfirmationDialog
                    title={`Merge ${mergeType === 'people' ? 'People' : 'Churches'}`}
                    yesLabel="Merge"
                    onYes={handleMerge}
                    noLabel="Cancel"
                    onNo={() => setIsConfirming(false)}
                >
                    <p className="font-bold mb-2">
                        ⚠️ This action CANNOT be undone. Any changes made as part of merging cannot be reversed.
                    </p>
                    <p className="mb-4">
                        {mergeType === 'people'
                            ? `${getItemDisplay(firstItem)} will be merged into ${getItemDisplay(secondItem)}`
                            : `${getItemDisplay(firstItem)} will be merged into ${getItemDisplay(secondItem)}`}
                    </p>
                    <p>Are you sure you want to continue?</p>
                </ConfirmationDialog>
            )}
        </>
    );
}
