import { Church } from './ChurchesService';
import { Address } from './models/Address';
import { RemoteServiceModelBase, RemoteServiceUrlBase, RemoteServiceUtility, type RemoteServicePage } from './RemoteServiceUtility';
import type { AuthManager } from "../AuthManager";
import { DataTypeHelpers } from 'utils/DataTypeHelpers';

const URL_ROOT_PATH = "/api/People";

/**
 * Wrapper for the People service.
 */
export class PeopleService {

    /**
     * Retrieves the existing people.
     *
     * @param auth AuthManager to use for authentication.
     * @param id Id for the person.
     * @param includeChurch Indicates whether the church will be populated on the entity.
     */
    public static getPerson(
        auth: AuthManager,
        id: string,
        includeChurch: boolean = false): Promise<Person> {

        return RemoteServiceUtility.getSingle<Person>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            id,
            RemoteServiceUtility.getFilteredUrlParameters({ c: includeChurch }));
    }

    /**
     * Retrieves the existing people.
     *
     * @param auth AuthManager to use for authentication.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     * @param parentType Type of parent.
     * @param parentId Id for the parent of the person.
     * @param searchText Text to search for churches.
     * @param excludeScope Exclude any person with this permission scope for the same parent id.
     * @param includeChurch Indicates whether the church will be populated on the entity.
     * @param includeOnlyUnapprovedPeople Include only the unapproved people.
     * @param includeOnlyPotentialDuplicates Include only the potential duplicates.
     * @param includeOnlyUsers Include only users.
     * @param excludePeopleWithoutEmail Exclude the people who don't have an e-mail address.
     * @param eventId Event Id to use to infer permissions about the person.
     * @param includeAllUsers Value indicating whether users from all regions and districts should be included.
     */
    public static getPeople(
        auth: AuthManager,
        pageSize: number,
        pageNumber: number,
        parentType: PersonParentType,
        parentId: string | null,
        searchText: string | null = null,
        excludeWithScope: boolean = false,
        includeChurch: boolean = false,
        includeOnlyUnapprovedPeople: boolean = false,
        includeOnlyPotentialDuplicates: boolean = false,
        includeOnlyUsers: boolean = false,
        excludePeopleWithoutEmail: boolean = false,
        eventId: string | null = null,
        includeAllUsers: boolean = false): Promise<RemoteServicePage<Person>> {

        return RemoteServiceUtility.getMany<RemoteServicePage<Person>>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            pageSize,
            pageNumber,
            true, // Indicates the count should be included.
            RemoteServiceUtility.getFilteredUrlParameters({
                pt: parentType,
                pid: parentId,
                s: null == searchText || 0 == searchText.trim().length ? null : searchText,
                es: excludeWithScope,
                c: includeChurch,
                emo: excludePeopleWithoutEmail,
                unapp: includeOnlyUnapprovedPeople,
                dupe: includeOnlyPotentialDuplicates,
                uo: includeOnlyUsers,
                allu: includeAllUsers,
                eid: eventId
            }));
    }

    /**
     * Creates a new person.
     *
     * @param auth AuthManager to use for authentication.
     * @param person Person to be created.
     * @param eventId Id to use for permissions to create this person.
     */
    public static create(
        auth: AuthManager,
        person: Person,
        eventId: string | null = null): Promise<Person> {

        return RemoteServiceUtility.executeHttpRequest<Person>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            RemoteServiceUtility.getFilteredUrlParameters({ eid: eventId }),
            person);
    }

    /**
     * Updates an existing person.
     *
     * @param auth AuthManager to use for authentication.
     * @param person Person to be updated.
     * @param mergeWithPersonId Id for a person to merge into this one. The value have already been set on person.
     * @param eventId Id to use for permissions to create this person.
     */
    public static update(
        auth: AuthManager,
        person: Person,
        mergeWithPersonId: string | null = null,
        eventId: string | null = null): Promise<Person> {

        return new Promise<Person>((resolve, reject) =>
            RemoteServiceUtility.executeHttpRequest<Person>(
                auth,
                "PUT",
                RemoteServiceUrlBase.Registration,
                `${URL_ROOT_PATH}/${person.Id}`,
                RemoteServiceUtility.getFilteredUrlParameters({ mid: mergeWithPersonId, eid: eventId }),
                person)
                .then(p => {
                    auth.refreshPersonIfCurrentUser(p);
                    resolve(p);
                })
                .catch(reject));
    }
}

/**
 * Person.
 */
export class Person extends RemoteServiceModelBase<string> {

    /**
     * Gets or sets the first name for this user.
     */
    public FirstName!: string;

    /**
     * Gets or sets the last name for this user.
     */
    public LastName!: string;

    /**
     * Gets or sets the e-mail address for this person.
     */
    public Email!: string;

    /**
     * Gets or sets the phone number for this person.
     */
    public PhoneNumber!: string | null;

    /**
     * Gets or sets the address for this person.
     */
    public PhysicalAddress!: Address | null;

    /**
     * Gets the date of birth for this user.
     */
    public DateOfBirth!: string | null;

    /**
     * Gets or sets the current grade for the person.
     */
    public readonly CurrentGrade!: number | null;

    /**
     * Gets or sets the district for the person.
     */
    public DistrictId!: string;

    /**
     * Gets or sets the current church for the person.
     */
    public CurrentChurchId!: string | null;

    /**
     * Gets the current church for the person (if requested by the caller).
     */
    public CurrentChurch!: Church | null;

    /**
     * Gets or sets the ID for the default competition type.
     */
    public DefaultCompetitionTypeId!: string | null;

    /**
     * Gets or sets a value indicating whether this person should be notified on registration changes.
     */
    public NotifyOnRegistrationChanges!: boolean | null;

    /**
     * Gets a value indicating whether the person is a user.
     */
    public readonly IsUser!: boolean;

    /**
     * Gets a value indicating whether the person's identity is being validated.
     */
    public readonly IsValidatingIdentity!: boolean;

    /**
     * Calculates the age of a person based on birthdate as of a specific date.
     * 
     * @param birthdate Birthdate of the person (if any).
     * @param asOf Date of the event.
     */
    public static calculateAge(birthdate: string | null, asOf: string): number | null {

        if (null != birthdate) {

            let dob: Date | null = DataTypeHelpers.parseDateOnly(birthdate);
            let otherDate: Date | null = DataTypeHelpers.parseDateOnly(asOf);

            if (null == dob || null == otherDate) {
                return null;
            }

            let age: number = otherDate.getFullYear() - dob.getFullYear();
            if (otherDate.getMonth() < dob.getMonth() ||
                (otherDate.getMonth() == dob.getMonth() && otherDate.getDate() < dob.getDate())) {
                age--;
            }

            return age;
        }

        return null;
    }
}

/**
 * Type of parent for a person.
 */
export enum PersonParentType {

    /**
     * All people in an organization.
     */
    Organization = 0,

    /**
     * Applies to all people in a region.
     */
    Region = 1,

    /**
     * Applies to all people in a district.
     */
    District = 2,

    /**
     * Applies to all people in a church.
     */
    Church = 3,

    /**
     * Applies to all people registered for a meet.
     */
    Meet = 4,
}

/**
 * Role of a person.
 */
export enum PersonRole {

    /**
     * Person can be a quizzer.
     */
    Quizzer = 0,

    /**
     * Person can be a coach.
     */
    Coach = 1,

    /**
     * Person can be an official.
     */
    Official = 2,

    /**
     * Person can be an attendee.
     */
    Attendee = 3,
}