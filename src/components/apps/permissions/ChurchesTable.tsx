import { useEffect, useState } from 'react';
import { ChurchesService, type Church } from 'types/services/ChurchesService';
import { PermissionsService, PersonPermissionScope, PersonPermissionType, type PersonPermission } from 'types/services/PermissionsService';
import { PersonParentType, type Person } from 'types/services/PeopleService';
import type { AuthManager } from 'types/AuthManager';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ChurchSettingsDialog from 'components/ChurchSettingsDialog';
import ConfirmationDialog from 'components/ConfirmationDialog';
import PersonLookupDialog from 'components/PersonLookupDialog';
import Pagination from 'components/Pagination';

interface Props {
    searchText: string;
    districtId?: string;
    allDistricts: boolean;
    potentialDuplicates: boolean;
    manuallyAdded: boolean;
    auth: AuthManager;
    canMergeAndImpersonate: boolean;
    onMergeSelect?: (church: Church) => void;
    currentMergeChurchId?: string | null;
    refreshToken?: number;
}

export default function ChurchesTable({
    searchText,
    districtId,
    allDistricts,
    potentialDuplicates,
    manuallyAdded,
    auth,
    canMergeAndImpersonate,
    onMergeSelect,
    currentMergeChurchId,
    refreshToken = 0
}: Props) {
    const [churches, setChurches] = useState<Church[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [editingChurch, setEditingChurch] = useState<Church | null>(null);
    const [viewingPermissionsChurchId, setViewingPermissionsChurchId] = useState<string | null>(null);
    const [viewingPermissionsChurchName, setViewingPermissionsChurchName] = useState<string>('');
    const [churchPermissions, setChurchPermissions] = useState<PersonPermission[]>([]);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [showAddPermissionDialog, setShowAddPermissionDialog] = useState(false);
    const [addingPermissionToChurchId, setAddingPermissionToChurchId] = useState<string | null>(null);
    const [selectedPermissionPerson, setSelectedPermissionPerson] = useState<Person | null>(null);
    const [selectedPermissionCompetitionType, setSelectedPermissionCompetitionType] = useState<string | null>(null);
    const [isProcessingDialog, setIsProcessingDialog] = useState<boolean>(false);
    const [permissionDialogError, setPermissionDialogError] = useState<string>();

    useEffect(() => {
        loadChurches();
    }, [searchText, districtId, allDistricts, potentialDuplicates, manuallyAdded, pageNumber, auth, refreshToken]);

    const loadChurches = async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const page = await ChurchesService.getChurches(
                auth,
                25,
                pageNumber,
                searchText || null,
                undefined,
                allDistricts ? undefined : districtId,
                undefined, // ChurchResultFilter.IncludeAuthorized
                manuallyAdded,
                potentialDuplicates
            );
            setChurches(page.Items || []);
            setPageCount(page.PageCount || 0);
        } catch (err) {
            setError((err as any).message || 'Failed to load churches');
        } finally {
            setIsLoading(false);
        }
    };

    const loadChurchPermissions = async (churchId: string) => {
        setPermissionsLoading(true);
        try {
            const page = await PermissionsService.getPermissions(
                auth,
                100,
                0,
                PersonPermissionScope.Church,
                undefined,
                undefined,
                churchId
            );
            setChurchPermissions(page.Items || []);
        } catch (err) {
            setError((err as any).message || 'Failed to load permissions');
        } finally {
            setPermissionsLoading(false);
        }
    };

    const handleViewPermissions = (church: Church) => {
        if (church.Id) {
            setViewingPermissionsChurchId(church.Id);
            setViewingPermissionsChurchName(church.Name || '');
            loadChurchPermissions(church.Id);
        }
    };

    const handleClosePermissionsDialog = () => {
        setViewingPermissionsChurchId(null);
        setViewingPermissionsChurchName('');
        setChurchPermissions([]);
        setShowAddPermissionDialog(false);
        setAddingPermissionToChurchId(null);
        setSelectedPermissionPerson(null);
        setSelectedPermissionCompetitionType(null);
        setPermissionDialogError(undefined);
        setIsProcessingDialog(false);
    };

    const handleAddPermissionToChurch = async (person: Person) => {
        if (!addingPermissionToChurchId) return;
        try {
            await PermissionsService.createOrUpdate(
                auth,
                PersonPermissionScope.Church,
                PersonPermissionType.Administrator,
                person.Id || '',
                selectedPermissionCompetitionType,
                undefined,
                addingPermissionToChurchId
            );
            setShowAddPermissionDialog(false);
            setSelectedPermissionPerson(null);
            setSelectedPermissionCompetitionType(null);
            setPermissionDialogError(undefined);
            // Reload permissions for the church
            if (addingPermissionToChurchId) {
                loadChurchPermissions(addingPermissionToChurchId);
            }
        } catch (err) {
            setPermissionDialogError((err as any).message || 'Failed to add permission');
        }
    };

    const handleRemovePermission = async (permissionId: string) => {
        setIsProcessingDialog(true);
        try {
            await PermissionsService.delete(auth, permissionId);
            setChurchPermissions(prev => prev.filter(p => p.Id !== permissionId));
            setIsProcessingDialog(false);
        } catch (err) {
            setPermissionDialogError((err as any).message || 'Failed to remove permission');
            setIsProcessingDialog(false);
        }
    };

    if (isLoading) return <div className="text-center py-8"><span className="loading loading-spinner loading-lg"></span></div>;

    return (
        <div className="space-y-4">
            {error && (
                <div role="alert" className="alert alert-error">
                    <FontAwesomeIcon icon="fas faCircleExclamation" />
                    <span>{error}</span>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th>Church</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {churches.length === 0 ? (
                            <tr>
                                <td colSpan={2} className="text-center text-base-content/60">
                                    No churches found
                                </td>
                            </tr>
                        ) : (
                            churches.map(church => (
                                <tr key={church.Id}>
                                    <td>
                                        {church.Name} ({church.PhysicalAddress?.City}, {church.PhysicalAddress?.State})
                                    </td>
                                    <td className="text-right space-x-2">
                                        <button
                                            className="btn btn-info btn-sm text-white mt-0 mb-0"
                                            onClick={() => handleViewPermissions(church)}
                                            title="View people with permissions"
                                        >
                                            <FontAwesomeIcon icon="fas faLock" />
                                        </button>
                                        {canMergeAndImpersonate && (
                                            <button
                                                className={`btn btn-sm mt-0 mb-0 ${
                                                    currentMergeChurchId === church.Id
                                                        ? 'btn-warning'
                                                        : 'btn-primary'
                                                }`}
                                                onClick={() => onMergeSelect?.(church)}
                                                title="Select for merge"
                                            >
                                                <FontAwesomeIcon icon="fas faCompressAlt" />
                                            </button>
                                        )}
                                        <button
                                            className="btn btn-ghost btn-sm mt-0 mb-0"
                                            onClick={() => setEditingChurch(church)}
                                            title="Edit church settings"
                                        >
                                            <FontAwesomeIcon icon="fas faCog" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pageCount > 1 && (
                <Pagination
                    currentPage={pageNumber}
                    pages={pageCount}
                    setPage={setPageNumber}
                    isLoading={isLoading}
                />
            )}

            {/* Church Settings Dialog */}
            {editingChurch && (
                <ChurchSettingsDialog
                    title={`Edit: ${editingChurch.Name}`}
                    church={editingChurch}
                    onSave={(church) => {
                        setEditingChurch(null);
                        if (church) {
                            loadChurches();
                        }
                    }}
                />
            )}

            {/* Church Permissions Dialog */}
            {viewingPermissionsChurchId && (
                <>
                    {!showAddPermissionDialog ? (
                        <ConfirmationDialog
                            title={`Administrators for ${viewingPermissionsChurchName}`}
                            yesLabel="Close"
                            onYes={handleClosePermissionsDialog}
                            noLabel={undefined}
                            onNo={handleClosePermissionsDialog}
                        >
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {permissionDialogError && (
                                    <div role="alert" className="alert alert-error">
                                        <FontAwesomeIcon icon="fas faCircleExclamation" />
                                        <span>{permissionDialogError}</span>
                                    </div>
                                )}
                                
                                <div>
                                    <button
                                        className="btn btn-primary btn-sm mt-0 mb-0"
                                        onClick={() => {
                                            setAddingPermissionToChurchId(viewingPermissionsChurchId);
                                            setShowAddPermissionDialog(true);
                                        }}
                                        disabled={permissionsLoading}
                                    >
                                        <FontAwesomeIcon icon="fas faPlus" />
                                        Add Permission
                                    </button>
                                </div>

                                {permissionsLoading ? (
                                    <div className="text-center py-4">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </div>
                                ) : churchPermissions.length === 0 ? (
                                    <p className="text-base-content/70">No administrators assigned to this church.</p>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="font-semibold text-sm mb-3">People with permissions:</p>
                                        <ul className="space-y-2">
                                            {churchPermissions.map(perm => (
                                                <li key={perm.Id} className="text-sm p-3 bg-base-200 rounded flex justify-between items-center">
                                                    <span>
                                                        {perm.Requestor.FirstName} {perm.Requestor.LastName}
                                                        {perm.CompetitionTypeId && (
                                                            <span className="text-xs ml-2 badge badge-sm">
                                                                {perm.CompetitionTypeId === 'agjbq' ? 'JBQ' : 'TBQ'}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <button
                                                        className="btn btn-error btn-xs mt-0 mb-0"
                                                        onClick={() => {
                                                            if (perm.Id) handleRemovePermission(perm.Id);
                                                        }}
                                                        disabled={permissionsLoading || isProcessingDialog}
                                                    >
                                                        <FontAwesomeIcon icon="fas faTrash" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </ConfirmationDialog>
                    ) : (
                        /* Add Permission Dialog */
                        addingPermissionToChurchId && (
                            <PersonLookupDialog
                                title="Add Administrator"
                                description="Select a person to add as an administrator for this church"
                                parentType={PersonParentType.Church}
                                parentId={addingPermissionToChurchId}
                                onSelect={(person) => {
                                    if (!person) {
                                        setShowAddPermissionDialog(false);
                                        setSelectedPermissionPerson(null);
                                        return;
                                    }

                                    setSelectedPermissionPerson(person);
                                    void handleAddPermissionToChurch(person);
                                }}
                            />
                        )
                    )}
                </>
            )}
        </div>
    );
}
