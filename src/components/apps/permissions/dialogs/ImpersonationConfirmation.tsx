import ConfirmationDialog from 'components/ConfirmationDialog';

interface Props {
    personName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ImpersonationConfirmation({
    personName,
    onConfirm,
    onCancel
}: Props) {
    return (
        <ConfirmationDialog
            title="Confirm Impersonation"
            yesLabel="Impersonate"
            onYes={onConfirm}
            noLabel="Cancel"
            onNo={onCancel}
        >
            <div className="space-y-3">
                <p>
                    Impersonating <strong>{personName}</strong> means you will be accessing the system as if you were that person, 
                    including any permissions and behaviors with the following exceptions:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your name will appear in any logs.</li>
                    <li>A button will appear in the banner to allow impersonation to stop at any time.</li>
                    <li>Unable to impersonate another user.</li>
                    <li>Cannot make changes to permissions of users.</li>
                </ul>
                <p className="font-semibold text-warning">
                    Are you sure you want to continue?
                </p>
            </div>
        </ConfirmationDialog>
    );
}
