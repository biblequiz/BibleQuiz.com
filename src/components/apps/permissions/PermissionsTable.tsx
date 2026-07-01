import { useEffect, useState } from 'react';
import { PermissionsService, PersonPermissionScope, PersonPermissionType, type PersonPermission } from 'types/services/PermissionsService';
import { PersonParentType } from 'types/services/PeopleService';
import type { AuthManager } from 'types/AuthManager';
import type { Person } from 'types/services/PeopleService';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ConfirmationDialog from 'components/ConfirmationDialog';
import PersonLookupDialog from 'components/PersonLookupDialog';
import PaginationControl from './PaginationControl';
import { formatCompetitionType } from 'utils/CompetitionTypeFormatter';

interface Props {
    scope: PersonPermissionScope;
    regionId?: string;
    districtId?: string;
    searchText: string;
    auth: AuthManager;
}

export default function PermissionsTable({
    scope,
    regionId,
    districtId,
    searchText,
    auth
}: Props) {
    const [permissions, setPermissions] = useState<PersonPermission[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [dialogState, setDialogState] = useState<'none' | 'adding' | 'confirming'>('none');
    const [deletingId, setDeletingId] = useState<string | undefined>(undefined);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [selectedCompetitionType, setSelectedCompetitionType] = useState<string | null>(null);

    useEffect(() => {
        loadPermissions();
    }, [scope, regionId, districtId, searchText, pageNumber, auth]);

    const loadPermissions = async () => {
        setIsLoading(true);
        setError(undefined);
        try {
            const page = await PermissionsService.getPermissions(
                auth,
                25,
                pageNumber,
                scope,
                regionId,
                districtId
            );
            setPageCount(page.PageCount ?? 0);
            setPermissions(page.Items);
        } catch (err) {
            setError((err as any).message || 'Failed to load permissions');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (permissionId: string) => {
        try {
            await PermissionsService.delete(auth, permissionId);
            setPermissions(prev => prev.filter(p => p.Id !== permissionId));
            setDialogState('none');
        } catch (err) {
            setError((err as any).message || 'Failed to delete permission');
        }
    };

    const handleAddPermission = async () => {
        if (!selectedPerson) return;
        try {
            await PermissionsService.createOrUpdate(
                auth,
                scope,
                PersonPermissionType.Administrator,
                selectedPerson.Id || '',
                selectedCompetitionType,
                regionId,
                districtId
            );
            setDialogState('none');
            setSelectedPerson(null);
            setSelectedCompetitionType(null);
            await loadPermissions();
        } catch (err) {
            setError((err as any).message || 'Failed to add permission');
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

            <div className="mb-4">
                <button
                    className="btn btn-primary btn-sm mt-0 mb-0"
                    onClick={() => {
                        setDialogState('adding');
                        setSelectedPerson(null);
                        setSelectedCompetitionType(null);
                    }}
                >
                    <FontAwesomeIcon icon="fas faPlus" />
                    Add Permission
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra">
                    <thead>
                        <tr>
                            <th>Person</th>
                            <th>Competition Type</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center text-base-content/60">
                                    No permissions found
                                </td>
                            </tr>
                        ) : (
                            permissions.map(perm => (
                                <tr key={perm.Id}>
                                    <td>{perm.Requestor.FirstName} {perm.Requestor.LastName}</td>
                                    <td>{formatCompetitionType(perm.CompetitionTypeId)}</td>
                                    <td className="text-right space-x-2">
                                        <button
                                            className="btn btn-error btn-sm text-white mt-0 mb-0"
                                            onClick={() => {
                                                if (perm.Id) {
                                                    setDeletingId(perm.Id);
                                                    setDialogState('confirming');
                                                }
                                            }}
                                        >
                                            <FontAwesomeIcon icon="fas faTrash" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pageCount > 1 && (
                <PaginationControl
                    currentPage={pageNumber}
                    pages={pageCount}
                    setPage={setPageNumber}
                    isLoading={isLoading}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {dialogState === 'confirming' && deletingId && (
                <ConfirmationDialog
                    title="Delete Permission"
                    yesLabel="Delete"
                    onYes={() => handleDelete(deletingId)}
                    noLabel="Cancel"
                    onNo={() => setDialogState('none')}
                >
                    <p>Are you sure you want to remove this permission? This action cannot be undone.</p>
                </ConfirmationDialog>
            )}

            {/* Add Permission Dialog - Lookup */}
            {dialogState === 'adding' && !selectedPerson && (
                <PersonLookupDialog
                    title="Add Administrator"
                    description="Select a person to add as an administrator"
                    parentType={PersonParentType.Organization}
                    onSelect={(person) => {
                        if (person) {
                            setSelectedPerson(person);
                        } else {
                            setDialogState('none');
                        }
                    }}
                />
            )}

            {/* Add Permission Dialog - Competition Type */}
            {dialogState === 'adding' && selectedPerson && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-lg font-bold">Set Competition Type</h3>
                        <div className="alert alert-info">
                            <span>{selectedPerson.FirstName} {selectedPerson.LastName}</span>
                        </div>
                        <label className="form-control">
                            <div className="label">
                                <span className="label-text">Competition Type</span>
                            </div>
                            <select
                                className="select select-bordered"
                                value={selectedCompetitionType || ''}
                                onChange={(e) => setSelectedCompetitionType(e.target.value || null)}
                            >
                                <option value="">All</option>
                                <option value="agjbq">JBQ Only</option>
                                <option value="agtbq">TBQ Only</option>
                            </select>
                        </label>
                        <div className="flex gap-2 justify-end">
                            <button
                                className="btn btn-ghost btn-sm mt-0 mb-0"
                                onClick={() => {
                                    setSelectedPerson(null);
                                    setSelectedCompetitionType(null);
                                    setDialogState('adding');
                                }}
                            >
                                Back
                            </button>
                            <button
                                className="btn btn-primary btn-sm mt-0 mb-0"
                                onClick={handleAddPermission}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
