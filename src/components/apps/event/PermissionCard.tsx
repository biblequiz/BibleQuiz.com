import FontAwesomeIcon from "components/FontAwesomeIcon";
import { PersonPermissionGrantReason, PersonPermissionStatus, type PersonPermission } from "types/services/PermissionsService";

interface Props {
    permission: PersonPermission;
    onRemove: () => void;
    isRemoving: boolean;
}

export default function PermissionCard({
    permission,
    onRemove,
    isRemoving }: Props) {
    return (
        <div
            className="card live-events-card w-full lg:w-60 card-sm shadow-sm border-2 border-solid mt-0 relative"
        >
            <div className="card-body flex flex-col justify-center">
                <h2 className="card-title mb-0 mt-1">
                    {permission.Requestor.FirstName} {permission.Requestor.LastName}
                </h2>
                <div className="w-full mt-0">
                    <b>Status:</b> {PersonPermissionStatus[permission.Status]} ({PersonPermissionGrantReason[permission.GrantReason]})
                </div>
                <div className="w-full mt-0">
                    <button
                        type="button"
                        className="btn btn-error text-white w-full mt-0 mb-0 pt-1 pb-1"
                        onClick={() => onRemove()}
                        disabled={isRemoving}>
                        <FontAwesomeIcon icon="fas faTrash" />
                        Remove Permission
                    </button>
                </div>
            </div>
        </div>);
}