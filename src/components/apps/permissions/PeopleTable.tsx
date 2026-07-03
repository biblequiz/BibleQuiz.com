import { useEffect, useState } from 'react';
import { PeopleService, PersonParentType, type Person } from 'types/services/PeopleService';
import { AuthService } from 'types/services/AuthService';
import type { AuthManager } from 'types/AuthManager';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ConfirmationDialog from 'components/ConfirmationDialog';
import PersonDialog from 'components/PersonDialog';
import PaginationControl from './PaginationControl';

interface Props {
    searchText: string;
    districtId?: string;
    allDistricts: boolean;
    unapprovedOnly: boolean;
    potentialDuplicates: boolean;
    usersOnly: boolean;
    auth: AuthManager;
    canImpersonate: boolean;
    onMergeSelect?: (person: Person) => void;
    currentMergePersonId?: string | null;
}

export default function PeopleTable({
    searchText,
    districtId,
    allDistricts,
    unapprovedOnly,
    potentialDuplicates,
    usersOnly,
    auth,
    canImpersonate,
    onMergeSelect,
    currentMergePersonId
}: Props) {
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | undefined>(undefined);
    const [pageNumber, setPageNumber] = useState<number>(0);
    const [pageCount, setPageCount] = useState<number>(0);
    const [impersonatingId, setImpersonatingId] = useState<string | undefined>(undefined);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [editingPerson, setEditingPerson] = useState<Person | null>(null);

    useEffect(() => {
        loadPeople();
    }, [searchText, districtId, allDistricts, unapprovedOnly, potentialDuplicates, usersOnly, pageNumber, auth]);

    const loadPeople = async () => {
        setIsLoading(true);
        try {
            const parentId = allDistricts ? null : (districtId || null);
            const page = await PeopleService.getPeople(
                auth,
                25,
                pageNumber,
                PersonParentType.District,
                parentId,
                searchText || null,
                false,
                true,
                unapprovedOnly,
                potentialDuplicates,
                usersOnly
            );
            setPeople(page.Items || []);
            setPageCount(page.PageCount || 0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImpersonate = async () => {
        if (!impersonatingId) return;
        try {
            await AuthService.impersonate(auth, impersonatingId);
            window.location.assign('/');
        } catch (err) {
            setError((err as any).message || 'Failed to impersonate user');
            setShowConfirmation(false);
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
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Church</th>
                            {canImpersonate && <th>&nbsp;</th>}
                            <th>&nbsp;</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                    <tbody>
                        {people.length === 0 ? (
                            <tr>
                                <td colSpan={canImpersonate ? 6 : 5} className="text-center text-base-content/60">
                                    No people found
                                </td>
                            </tr>
                        ) : (
                            people.map(person => (
                                <tr key={person.Id}>
                                    <td>{person.FirstName}</td>
                                    <td>{person.LastName}</td>
                                    <td>{person.CurrentChurch?.Name}</td>
                                    {canImpersonate && (
                                        <td className="text-right">
                                            {person.IsUser && (
                                                <button
                                                    className="btn btn-secondary btn-sm mt-0 mb-0"
                                                    onClick={() => {
                                                        if (person.Id) {
                                                            setImpersonatingId(person.Id);
                                                            setShowConfirmation(true);
                                                        }
                                                    }}
                                                    title="Impersonate"
                                                >
                                                    <FontAwesomeIcon icon="fas faUserSecret" />
                                                </button>)}
                                        </td>
                                    )}
                                    <td className="text-right">
                                        <button
                                            className={`btn btn-sm text-white mt-0 mb-0 ${currentMergePersonId === person.Id
                                                ? 'btn-warning'
                                                : 'btn-primary'}`}
                                            onClick={() => onMergeSelect?.(person)}
                                            title="Select for merge"
                                        >
                                            <FontAwesomeIcon icon="fas faCompressAlt" />
                                        </button>
                                    </td>
                                    <td className="text-right">
                                        <button
                                            className="btn btn-ghost btn-sm mt-0 mb-0"
                                            onClick={() => setEditingPerson(person)}
                                            title="Edit person settings"
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
                <PaginationControl
                    currentPage={pageNumber}
                    pages={pageCount}
                    setPage={setPageNumber}
                    isLoading={isLoading}
                />
            )}

            {/* Person Settings Dialog */}
            {editingPerson && (
                <PersonDialog
                    title="Update Person"
                    existingPerson={editingPerson}
                    parentType={PersonParentType.District}
                    parentId={allDistricts ? null : (districtId ?? null)}
                    onClose={(updatedPerson) => {
                        setEditingPerson(null);
                        if (updatedPerson) {
                            loadPeople();
                        }
                    }}
                />
            )}

            {/* Impersonation Confirmation */}
            {showConfirmation && (
                <ConfirmationDialog
                    title="Confirm Impersonation"
                    yesLabel="Impersonate"
                    onYes={handleImpersonate}
                    noLabel="Cancel"
                    onNo={() => {
                        setShowConfirmation(false);
                        setImpersonatingId(undefined);
                    }}
                >
                    <p>Impersonating a person means you will be accessing the system as if you were that person, including any permissions and behaviors with the following exceptions:</p>
                    <ul className="list-disc list-inside space-y-1 my-2">
                        <li>Your name will appear in any logs.</li>
                        <li>A button will appear in the banner to allow impersonation to stop at any time.</li>
                        <li>Unable to impersonate another user.</li>
                        <li>Cannot make changes to permissions of users.</li>
                    </ul>
                    <p>Are you sure you want to continue?</p>
                </ConfirmationDialog>
            )}
        </div>
    );
}
