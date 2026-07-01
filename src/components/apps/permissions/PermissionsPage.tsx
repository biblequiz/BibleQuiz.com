import { useState, useEffect } from 'react';
import { AuthManager } from 'types/AuthManager';
import { PersonPermissionScope } from 'types/services/PermissionsService';
import type { Person } from 'types/services/PeopleService';
import type { Church } from 'types/services/ChurchesService';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import ScopeSelector from './ScopeSelector';
import SearchAndFilterBar from './SearchAndFilterBar';
import PermissionsTable from './PermissionsTable';
import ChurchesTable from './ChurchesTable';
import PeopleTable from './PeopleTable';
import MergePanel from './MergePanel';

interface Props {
}

export default function PermissionsPage({ }: Props) {
    const authManager = AuthManager.useNanoStore();
    const auth = authManager;
    const userProfile = authManager.userProfile;

    // Hide the loading fallback once React component mounts
    useEffect(() => {
        const fallback = document.getElementById('permissions-fallback');
        if (fallback) {
            fallback.style.display = 'none';
        }
    }, []);

    const [currentScope, setCurrentScope] = useState<PersonPermissionScope | null>(PersonPermissionScope.Church);
    
    // Search and filter state
    const [searchText, setSearchText] = useState<string>('');
    const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<string | undefined>(undefined);
    const [checkboxStates, setCheckboxStates] = useState({
        allDistricts: false,
        unapprovedOnly: false,
        potentialDuplicates: false,
        usersOnly: false,
        manuallyAdded: false
    });
    const [mergeFirstPerson, setMergeFirstPerson] = useState<Person | null>(null);
    const [mergeSecondPerson, setMergeSecondPerson] = useState<Person | null>(null);
    const [mergeFirstChurch, setMergeFirstChurch] = useState<Church | null>(null);
    const [mergeSecondChurch, setMergeSecondChurch] = useState<Church | null>(null);

    // Check authorization
    if (!auth || !userProfile) {
        return (
            <div role="alert" className="alert alert-error">
                <FontAwesomeIcon icon="fas faCircleExclamation" />
                <span>Authentication required</span>
            </div>
        );
    }

    const hasPermissions = !!userProfile.organizationPermission ||
        (userProfile.regionPermissions && Object.keys(userProfile.regionPermissions).length > 0) ||
        (userProfile.districtPermissions && Object.keys(userProfile.districtPermissions).length > 0) ||
        (userProfile.churchPermissions && userProfile.churchPermissions.size > 0);
    const hasOrganizationPermission = userProfile.organizationPermission !== null;
    const canMergeAndImpersonate = hasOrganizationPermission && !userProfile.organizationPermission?.Restriction;

    if (!hasPermissions) {
        return (
            <div role="alert" className="alert alert-warning">
                <FontAwesomeIcon icon="fas faTriangleExclamation" />
                <span>You do not have permission to access this page.</span>
            </div>
        );
    }

    type CheckboxKey = keyof typeof checkboxStates;

    const handleCheckboxChange = (key: CheckboxKey) => {
        setCheckboxStates(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleMergePerson = (person: Person) => {
        if (mergeFirstPerson?.Id === person.Id) {
            setMergeFirstPerson(null);
        } else if (mergeSecondPerson?.Id === person.Id) {
            setMergeSecondPerson(null);
        } else if (!mergeFirstPerson) {
            setMergeFirstPerson(person);
        } else if (!mergeSecondPerson) {
            setMergeSecondPerson(person);
        }
    };

    const handleMergeChurch = (church: Church) => {
        if (mergeFirstChurch?.Id === church.Id) {
            setMergeFirstChurch(null);
        } else if (mergeSecondChurch?.Id === church.Id) {
            setMergeSecondChurch(null);
        } else if (!mergeFirstChurch) {
            setMergeFirstChurch(church);
        } else if (!mergeSecondChurch) {
            setMergeSecondChurch(church);
        }
    };

    const handleClearMerge = (type: 'people' | 'church', item: 'first' | 'second' | 'all') => {
        if (type === 'people') {
            if (item === 'first' || item === 'all') setMergeFirstPerson(null);
            if (item === 'second' || item === 'all') setMergeSecondPerson(null);
        } else {
            if (item === 'first' || item === 'all') setMergeFirstChurch(null);
            if (item === 'second' || item === 'all') setMergeSecondChurch(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Scope Selector */}
            <ScopeSelector
                currentScope={currentScope}
                onScopeChange={setCurrentScope}
                userProfile={userProfile}
            />

            {/* Search and Filter Bar */}
            <SearchAndFilterBar
                searchText={searchText}
                onSearchChange={setSearchText}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                selectedDistrict={selectedDistrict}
                onDistrictChange={setSelectedDistrict}
                checkboxStates={checkboxStates}
                onCheckboxChange={handleCheckboxChange}
                currentScope={currentScope}
                userProfile={userProfile}
            />

            {/* Content based on scope */}
            <div className="space-y-4">
                {currentScope === PersonPermissionScope.Organization && (
                    <PermissionsTable
                        scope={PersonPermissionScope.Organization}
                        regionId={selectedRegion}
                        districtId={selectedDistrict}
                        searchText={searchText}
                        auth={auth}
                    />
                )}
                {currentScope === PersonPermissionScope.Region && (
                    <PermissionsTable
                        scope={PersonPermissionScope.Region}
                        regionId={selectedRegion}
                        districtId={selectedDistrict}
                        searchText={searchText}
                        auth={auth}
                    />
                )}
                {currentScope === PersonPermissionScope.District && (
                    <PermissionsTable
                        scope={PersonPermissionScope.District}
                        regionId={selectedRegion}
                        districtId={selectedDistrict}
                        searchText={searchText}
                        auth={auth}
                    />
                )}
                {currentScope === PersonPermissionScope.Church && (
                    <>
                        {canMergeAndImpersonate && (
                            <MergePanel
                                canShow={true}
                                mergeType="church"
                                firstItem={mergeFirstChurch}
                                secondItem={mergeSecondChurch}
                                onClear={(item) => handleClearMerge('church', item)}
                                auth={auth}
                                onMergeComplete={() => window.location.reload()}
                            />
                        )}
                        <ChurchesTable
                            searchText={searchText}
                            districtId={selectedDistrict}
                            allDistricts={checkboxStates.allDistricts}
                            potentialDuplicates={checkboxStates.potentialDuplicates}
                            manuallyAdded={checkboxStates.manuallyAdded}
                            auth={auth}
                            canMergeAndImpersonate={canMergeAndImpersonate}
                            onMergeSelect={handleMergeChurch}
                            currentMergeChurchId={mergeFirstChurch?.Id || mergeSecondChurch?.Id}
                        />
                    </>
                )}
                {currentScope === null && (
                    <>
                        <MergePanel
                            canShow={canMergeAndImpersonate}
                            mergeType="people"
                            firstItem={mergeFirstPerson}
                            secondItem={mergeSecondPerson}
                            onClear={(item) => handleClearMerge('people', item)}
                            auth={auth}
                            onMergeComplete={() => window.location.reload()}
                        />
                        <PeopleTable
                            searchText={searchText}
                            districtId={selectedDistrict}
                            allDistricts={checkboxStates.allDistricts}
                            unapprovedOnly={checkboxStates.unapprovedOnly}
                            potentialDuplicates={checkboxStates.potentialDuplicates}
                            usersOnly={checkboxStates.usersOnly}
                            auth={auth}
                            canImpersonate={canMergeAndImpersonate}
                            onMergeSelect={handleMergePerson}
                            currentMergePersonId={mergeFirstPerson?.Id || mergeSecondPerson?.Id}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
