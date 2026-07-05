import { useEffect, useState } from 'react';
import { AuthManager } from 'types/AuthManager';
import { PeopleService, Person, PersonParentType } from 'types/services/PeopleService';
import {
    PermissionsService,
    PersonPermission,
    PersonPermissionScope,
    PersonPermissionStatus,
    PersonPermissionType,
} from 'types/services/PermissionsService';
import { AuthService, UserIdentity, UserIdentityType } from 'types/services/AuthService';
import { sharedGlobalStatusToast } from 'utils/SharedState';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';
import PersonDialog from 'components/PersonDialog';
import ConfirmationDialog from 'components/ConfirmationDialog';
import FontAwesomeIcon from 'components/FontAwesomeIcon';

interface Props {
    isReadOnly: boolean;
}

const COMPETITION_TYPES = [
    { id: 'agjbq', label: 'Junior Bible Quiz (JBQ)', icon: '/assets/logos/jbq/jbq-logo.png' },
    { id: 'agtbq', label: 'Teen Bible Quiz (TBQ)', icon: '/assets/logos/tbq/tbq-logo.png' },
];

function identityTypeLabel(type: UserIdentityType): string {
    switch (type) {
        case UserIdentityType.BibleQuizUsers: return 'BibleQuiz.com Users';
        case UserIdentityType.Facebook: return 'Facebook';
        case UserIdentityType.Google: return 'Google';
        case UserIdentityType.UserNamePassword: return 'E-mail & Password';
        default: return 'Unknown';
    }
}

export default function ProfilePage({ isReadOnly }: Props) {
    const authManager = AuthManager.useNanoStore();
    const auth = authManager;
    const userProfile = authManager.userProfile;

    const [person, setPerson] = useState<Person | null>(null);
    const [permissions, setPermissions] = useState<PersonPermission[]>([]);
    const [identities, setIdentities] = useState<UserIdentity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingPerson, setIsEditingPerson] = useState(false);
    const [isSavingPreferences, setIsSavingPreferences] = useState(false);
    const [deletingPermissionId, setDeletingPermissionId] = useState<string | null>(null);
    const [deletingIdentityId, setDeletingIdentityId] = useState<string | null>(null);

    useEffect(() => {
        if (!userProfile?.personId) return;

        setIsLoading(true);

        Promise.all([
            PeopleService.getPerson(auth, userProfile.personId, true),
            PermissionsService.getMyPermissions(auth, 500, 0),
            AuthService.getIdentities(auth),
        ])
            .then(([loadedPerson, permissionsPage, loadedIdentities]) => {
                setPerson(loadedPerson);
                setPermissions(permissionsPage.Items);
                setIdentities(loadedIdentities);
            })
            .catch((error: Error) => {
                sharedGlobalStatusToast.set({
                    type: 'error',
                    title: 'Unable to Load Profile',
                    message: error?.message || 'An error occurred while loading your profile.',
                    timeout: 10000,
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [userProfile?.personId]);

    async function savePreferences(updated: Person): Promise<void> {
        setIsSavingPreferences(true);
        try {
            const saved = await PeopleService.update(auth, updated);
            setPerson(saved);
        } catch (error) {
            sharedGlobalStatusToast.set({
                type: 'error',
                title: 'Unable to Save Preferences',
                message: (error as Error)?.message || 'An error occurred while saving your preferences.',
                timeout: 10000,
            });
        } finally {
            setIsSavingPreferences(false);
        }
    }

    async function handleDeletePermission(id: string): Promise<void> {
        try {
            await PermissionsService.delete(auth, id);
            setPermissions(prev => prev.filter(p => p.Id !== id));
        } catch (error) {
            sharedGlobalStatusToast.set({
                type: 'error',
                title: 'Unable to Delete Permission',
                message: (error as Error)?.message || 'An error occurred while deleting the permission.',
                timeout: 10000,
            });
        } finally {
            setDeletingPermissionId(null);
        }
    }

    async function handleDeleteIdentity(id: string): Promise<void> {
        try {
            await AuthService.deleteIdentity(auth, id);
            setIdentities(prev => prev.filter(i => i.Id !== id));
        } catch (error) {
            sharedGlobalStatusToast.set({
                type: 'error',
                title: 'Unable to Delete Identity',
                message: (error as Error)?.message || 'An error occurred while deleting the identity.',
                timeout: 10000,
            });
        } finally {
            setDeletingIdentityId(null);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-xl" />&nbsp; Loading Profile ...
            </div>
        );
    }

    if (!person) {
        return (
            <div className="alert alert-error">
                <FontAwesomeIcon icon="fas faExclamationTriangle" />
                Unable to load your profile.
            </div>
        );
    }

    const competitionType = COMPETITION_TYPES.find(t => t.id === person.DefaultCompetitionTypeId);

    const addressParts: string[] = [];
    if (person.PhysicalAddress) {
        if (person.PhysicalAddress.StreetAddress) {
            addressParts.push(person.PhysicalAddress.StreetAddress);
        }
        if (person.PhysicalAddress.City) {
            addressParts.push(person.PhysicalAddress.City);
        }
        const stateZip = [
            person.PhysicalAddress.State,
            person.PhysicalAddress.ZipCode != null
                ? DataTypeHelpers.formatZipCode(person.PhysicalAddress.ZipCode)
                : null,
        ]
            .filter(Boolean)
            .join(' ');
        if (stateZip) {
            addressParts.push(stateZip);
        }
    }

    const deletingPermission = deletingPermissionId
        ? permissions.find(p => p.Id === deletingPermissionId) ?? null
        : null;
    const deletingIdentity = deletingIdentityId
        ? identities.find(i => i.Id === deletingIdentityId) ?? null
        : null;

    return (
        <div className="space-y-8">

            {/* ── Personal Details & Preferences ── */}
            <section>
                <h5 className="text-lg font-semibold mb-4">
                    <FontAwesomeIcon icon="fas faAddressCard" />&nbsp; Personal Details &amp; Preferences
                </h5>

                {isReadOnly && (
                    <div className="alert alert-warning mb-4">
                        <FontAwesomeIcon icon="fas faUserSecret" />
                        You are impersonating <strong>{userProfile?.displayName}</strong>. Profile editing is disabled.
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="mt-0 mb-0">
                        <dl className="space-y-1 text-sm">
                            <div>
                                <dt className="inline font-semibold">Name: </dt>
                                <dd className="inline">{person.FirstName} {person.LastName}</dd>
                            </div>
                            <div>
                                <dt className="inline font-semibold">E-mail Address: </dt>
                                <dd className="inline">
                                    {person.Email ?? <em>None</em>}
                                </dd>
                            </div>
                            <div>
                                <dt className="inline font-semibold">Church: </dt>
                                <dd className="inline">
                                    {person.CurrentChurch
                                        ? `${person.CurrentChurch.Name} (${person.CurrentChurch.PhysicalAddress.City}, ${person.CurrentChurch.PhysicalAddress.State})`
                                        : <em>None</em>}
                                </dd>
                            </div>
                            <div>
                                <dt className="inline font-semibold">Date of Birth: </dt>
                                <dd className="inline">
                                    {person.DateOfBirth
                                        ? DataTypeHelpers.formatDate(person.DateOfBirth)
                                        : <em>None</em>}
                                </dd>
                            </div>
                            <div>
                                <dt className="inline font-semibold">Phone Number: </dt>
                                <dd className="inline">
                                    {person.PhoneNumber || <em>None</em>}
                                </dd>
                            </div>
                            <div>
                                <dt className="inline font-semibold">Address: </dt>
                                <dd className="inline">
                                    {addressParts.length > 0
                                        ? addressParts.join(', ')
                                        : <em>None</em>}
                                </dd>
                            </div>
                        </dl>
                        {!isReadOnly && (
                            <button
                                type="button"
                                className="btn btn-primary mt-4"
                                onClick={() => setIsEditingPerson(true)}
                            >
                                Edit My Details
                            </button>
                        )}
                    </div>

                    <div className="mt-0 mb-0">
                        <div className="form-control mt-0 mb-0">
                            <label className="label" htmlFor="defaultCompetitionType">
                                <span className="label-text font-semibold">Default Type of Event</span>
                            </label>
                            <div className="flex items-center gap-3">
                                {competitionType && (
                                    <img
                                        className="mt-0 mb-0"
                                        src={competitionType.icon}
                                        alt={competitionType.label}
                                        width={24}
                                        height={24}
                                    />
                                )}
                                <select
                                    id="defaultCompetitionType"
                                    className="select select-bordered w-full max-w-xs mt-0 mb-0"
                                    value={person.DefaultCompetitionTypeId ?? ''}
                                    disabled={isReadOnly || isSavingPreferences}
                                    onChange={async (e) => {
                                        const value = e.target.value || null;
                                        const updated = Object.assign(new Person(), person, {
                                            DefaultCompetitionTypeId: value,
                                        });
                                        await savePreferences(updated);
                                    }}
                                >
                                    <option value="">None</option>
                                    {COMPETITION_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    className="checkbox"
                                    checked={person.NotifyOnRegistrationChanges ?? false}
                                    disabled={isReadOnly || isSavingPreferences}
                                    onChange={async (e) => {
                                        const updated = Object.assign(new Person(), person, {
                                            NotifyOnRegistrationChanges: e.target.checked,
                                        });
                                        await savePreferences(updated);
                                    }}
                                />
                                <span className="label-text whitespace-normal">
                                    Send me an e-mail when any of my registrations or events change (if I am an owner).
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <hr />

            {/* ── Permissions ── */}
            <section>
                <h5 className="text-lg font-semibold mb-4">
                    <FontAwesomeIcon icon="fas faShieldHalved" />&nbsp; Permissions
                </h5>
                {permissions.length === 0 ? (
                    <p className="text-base-content/60 italic">No permissions assigned.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Label</th>
                                    <th>Scope</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permissions.map(permission => (
                                    <tr key={permission.Id}>
                                        <td>{permission.Label}</td>
                                        <td>{PersonPermissionScope[permission.Scope]}</td>
                                        <td>{permission.CompetitionTypeLabel} {PersonPermissionType[permission.Type]}</td>
                                        <td>{PersonPermissionStatus[permission.Status]}</td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-error btn-square text-white shrink-0"
                                                disabled={isReadOnly}
                                                onClick={() => setDeletingPermissionId(permission.Id!)}
                                            >
                                                <FontAwesomeIcon icon="fas faTrash" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <hr />

            {/* ── Identities ── */}
            <section>
                <h5 className="text-lg font-semibold mb-4">
                    <FontAwesomeIcon icon="fas faLock" />&nbsp; Identities
                </h5>
                {identities.length === 0 ? (
                    <p className="text-base-content/60 italic">No identities found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Email</th>
                                    <th>&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                {identities.map(identity => (
                                    <tr key={identity.Id}>
                                        <td>{identityTypeLabel(identity.Type)}</td>
                                        <td>{identity.EmailAddress}</td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-error btn-square text-white shrink-0"
                                                disabled={isReadOnly || identities.length <= 1}
                                                title={identities.length <= 1
                                                    ? 'Cannot remove your only identity'
                                                    : undefined}
                                                onClick={() => setDeletingIdentityId(identity.Id!)}
                                            >
                                                <FontAwesomeIcon icon="fas faTrash" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ── Dialogs ── */}
            {isEditingPerson && (
                <PersonDialog
                    title="Edit My Details"
                    existingPerson={person}
                    parentType={PersonParentType.Organization}
                    parentId={null}
                    onClose={(saved) => {
                        setIsEditingPerson(false);
                        if (saved) setPerson(saved);
                    }}
                />
            )}

            {deletingPermission && (
                <ConfirmationDialog
                    title="Delete Permission"
                    yesLabel="Delete"
                    onYes={() => handleDeletePermission(deletingPermission.Id!)}
                    noLabel="Cancel"
                    onNo={() => setDeletingPermissionId(null)}
                >
                    <p>
                        Are you sure you want to delete the <strong>{deletingPermission.Label}</strong> permission?
                    </p>
                </ConfirmationDialog>
            )}

            {deletingIdentity && (
                <ConfirmationDialog
                    title="Delete Identity"
                    yesLabel="Delete"
                    onYes={() => handleDeleteIdentity(deletingIdentity.Id!)}
                    noLabel="Cancel"
                    onNo={() => setDeletingIdentityId(null)}
                >
                    <p>
                        Are you sure you want to delete the <strong>{deletingIdentity.EmailAddress}</strong> identity?
                    </p>
                </ConfirmationDialog>
            )}
        </div>
    );
}
