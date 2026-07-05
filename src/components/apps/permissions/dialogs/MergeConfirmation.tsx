import ConfirmationDialog from 'components/ConfirmationDialog';

interface Props {
    title: string;
    itemType: 'person' | 'church';
    firstItem: string;
    secondItem: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function MergeConfirmation({
    title,
    itemType,
    firstItem,
    secondItem,
    onConfirm,
    onCancel
}: Props) {
    return (
        <ConfirmationDialog
            title={title}
            yesLabel="Merge"
            onYes={onConfirm}
            noLabel="Cancel"
            onNo={onCancel}
        >
            <div className="space-y-3">
                <p className="font-semibold text-error">
                    Any changes made as part of merging CANNOT be undone.
                </p>
                <p>
                    You are about to merge:
                </p>
                <div className="bg-base-200 p-3 rounded space-y-2">
                    <div>
                        <strong>1st {itemType}:</strong> {firstItem}
                    </div>
                    <div>
                        <strong>2nd {itemType}:</strong> {secondItem}
                    </div>
                </div>
                <p>
                    Please proceed carefully. This action will combine the records.
                </p>
            </div>
        </ConfirmationDialog>
    );
}
