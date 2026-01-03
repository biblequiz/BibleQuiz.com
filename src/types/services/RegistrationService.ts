import { RemoteServiceModelBase, RemoteServiceUrlBase, RemoteServiceUtility, type RemoteServicePage } from './RemoteServiceUtility';
import { Person, PersonRole } from "./PeopleService";
import type { AuthManager } from "../AuthManager";
import type { PaymentEntry } from './EventsService';

const URL_ROOT_PATH = "/api/Registration";

/**
 * Wrapper for the Registration service.
 */
export class RegistrationService {

    /**
     * Retrieves the registrations for a specific event.
     *
     * @param auth AuthManager to use for authentication.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     * @param eventId Id for the event (optional).
     * @param churchId Id for the church (optional).
     * @param typeId Id for the type.
     * @param mapToEventId Id for the event to map any registrations to (optional).
     * @param excludeApprovalsEventId Id for an event with approvals where the approved teams should be excluded (if any).
     */
    public static getRegistrations(
        auth: AuthManager,
        pageSize: number,
        pageNumber: number,
        eventId?: string,
        churchId?: string,
        typeId?: string,
        mapToEventId?: string,
        excludeApprovalsEventId?: string): Promise<RemoteServicePage<Registration>> {

        return RemoteServiceUtility.getMany<RemoteServicePage<Registration>>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            pageSize,
            pageNumber,
            true,
            RemoteServiceUtility.getFilteredUrlParameters({
                eid: eventId,
                cid: churchId,
                mevid: mapToEventId,
                tid: typeId,
                appeid: excludeApprovalsEventId
            }));
    }

    /**
     * Retrieves events with eligible teams.
     *
     * @param auth AuthManager to use for authentication.
     * @param pageSize Size of the page.
     * @param pageNumber Page number to retrieve (starts at 0).
     * @param eventId Id for the event registrations are being approved for.
     * @param regionId Id for the region (if any).
     * @param districtId Id for the district (if any).
     */
    public static getEligibleEvents(
        auth: AuthManager,
        eventId: string,
        pageSize: number,
        pageNumber: number,
        regionId: string,
        districtId: string): Promise<RemoteServicePage<RegistrationSearchResult>> {

        return RemoteServiceUtility.getMany<RemoteServicePage<RegistrationSearchResult>>(
            auth,
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/EligibleEvents`,
            pageSize,
            pageNumber,
            true,
            RemoteServiceUtility.getFilteredUrlParameters({
                eid: eventId,
                rid: regionId,
                did: districtId,
            }));
    }

    /**
     * Gets a single Registration based on the id of the church.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param churchId Id for the church.
     * @param mapToEventId Id for a mapped event.
     * @param includeOnlyApprovedTeams Indicates only approved teams should be included.
     * @param refreshPayments Indicates whether payments should be refreshed.
     */
    public static getRegistrationByChurchId(
        auth: AuthManager,
        eventId: string,
        churchId: string,
        mapToEventId?: string,
        includeOnlyApprovedTeams?: boolean,
        refreshPayments?: boolean): Promise<Registration | null> {

        return RemoteServiceUtility.getManyWithConvert<RemoteServicePage<Registration>, Registration | null>(
            auth,
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            result => 0 == result.Items.length
                ? null
                : result.Items[0],
            1, // Page Size
            0, // Page Number
            false,
            RemoteServiceUtility.getFilteredUrlParameters({
                eid: eventId,
                cid: churchId,
                mevid: mapToEventId,
                apponly: includeOnlyApprovedTeams,
                rp: refreshPayments,
                forms: true,
            }));
    }

    /**
     * Creates or updates an existing church's registration.
     *
     * @param auth AuthManager to use for authentication.
     * @param registration Registration to be updated.
     */
    public static createOrUpdateChurch(
        auth: AuthManager,
        registration: Registration): Promise<Registration> {

        return RemoteServiceUtility.executeHttpRequest<Registration>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            null,
            registration);
    }

    /**
     * Creates a new or Updates an existing team's registration.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the team's event.
     * @param churchId Id for the team's church.
     * @param version Current version for the registration.
     * @param team Registration to be updated.
     */
    public static createOrUpdateTeam(
        auth: AuthManager,
        eventId: string,
        churchId: string,
        version: number,
        team: RegistrationTeam): Promise<RegistrationTeamResult> {

        return RemoteServiceUtility.executeHttpRequest<RegistrationTeamResult>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Teams`,
            RemoteServiceUtility.getFilteredUrlParameters({
                eid: eventId,
                cid: churchId,
                ver: version
            }),
            team);
    }

    /**
     * Deletes an existing team's registration.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the team's event.
     * @param churchId Id for the team's church.
     * @param version Current version for the registration.
     * @param id Id for the team to be deleted. Specifying null will cause ALL teams to be deleted.
     */
    public static deleteTeam(
        auth: AuthManager,
        eventId: string,
        churchId: string,
        version: number,
        id?: string): Promise<RegistrationTeamResult> {

        return RemoteServiceUtility.executeHttpRequest<RegistrationTeamResult>(
            auth,
            "DELETE",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Teams${id ? `/${id}` : ""}`,
            RemoteServiceUtility.getFilteredUrlParameters({
                eid: eventId,
                cid: churchId,
                ver: version
            }))
    }

    /**
     * Updates the church's balance entries.
     *
     * @param auth AuthManager to use for authentication.
     * @param eventId Id for the event.
     * @param churchId Id for the church.
     * @param entries Replacement payment entries.
     */
    public static updateChurchBalanceEntries(
        auth: AuthManager,
        eventId: string,
        churchId: string,
        entries: PaymentEntry[]): Promise<boolean> {

        return RemoteServiceUtility.executeHttpRequest<boolean>(
            auth,
            "PUT",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Balance`,
            RemoteServiceUtility.getFilteredUrlParameters({
                eid: eventId,
                cid: churchId
            }),
            entries);
    }
}

/**
 * Registration information for a single church.
 */
export class Registration extends RemoteServiceModelBase<string> {

    /**
     * Gets or sets the Id for the event.
    **/
    public EventId!: string;

    /**
     * Gets a description of the event.
     */
    public readonly EventDescription!: string;

    /**
     * Gets or sets the Id for the church.
    **/
    public ChurchId!: string;

    /**
     * Gets the name of the church.
     */
    public readonly ChurchName!: string;

    /**
     * Gets the location of the church.
     */
    public readonly ChurchLocation!: string;

    /**
     * Gets or sets the officials.
    **/
    public Officials!: RegistrationOfficial[];

    /**
     * Gets or sets the individuals.
    **/
    public Individuals!: RegistrationPerson[];

    /**
     * Gets or sets the attendees.
    **/
    public Attendees!: RegistrationPerson[];

    /**
     * Gets the teams for the registration.
    **/
    public readonly Teams!: RegistrationTeam[];

    /**
     * Gets or sets the forms associated with this church.
     */
    public Forms!: RegistrationForm[];

    /**
     * Gets the current user retrieving this registration.
     */
    public readonly CurrentUser!: Person | null;

    /**
     * Gets the calculated payment for this registration (if any).
     */
    public readonly CalculatedPayment!: number;

    /**
     * Gets the payment balance for this registration (if any).
     */
    public readonly PaymentBalance!: number;

    /**
     * Gets the payment balance not yet cleared by the financial processing (if any).
     */
    public readonly PendingPaymentBalance!: number;

    /**
     * Gets or sets the current version of the registration.
     */
    public Version!: number;
}

/**
 * Represents search results for a registration.
 */
export class RegistrationSearchResult extends RemoteServiceModelBase<string> {
    /**
     * Gets a description of the event.
     */
    public readonly EventDescription!: string;

    /**
     * Gets the number of teams associated with the search.
     */
    public readonly TeamCount!: number;
}

/**
 * Registration for a team from a church.
 */
export class RegistrationTeam extends RemoteServiceModelBase<string> {
    /**
     * Gets or sets the name of the team.
    **/
    public Name!: string;

    /**
     * Gets or sets the people for this team.
    **/
    public People!: RegistrationPerson[];

    /**
     * Gets or sets the fields for the team.
    **/
    public Fields!: Record<string, string | null>;

    /**
     * Gets or sets a value indicating whether this is a generated name.
     */
    public IsGeneratedName!: boolean;

    /**
     * Gets an Id for the church.
     */
    public readonly ChurchId!: string;

    /**
     * Gets a description for the church.
     */
    public readonly ChurchName!: string;

    /**
     * Gets or sets the division associated with this team (if any).
     */
    public DivisionId!: string;

    /**
     * Gets the persistent team identifier (if known or being set).
     */
    public PersistentId!: string | null;

    /**
     * Gets or sets the Id for the point of contact.
     */
    public PointOfContactId!: string | null;

    /**
     * Gets the point of contact for this team.
     */
    public readonly PointOfContact!: Person | null;

    /**
     * Gets the calculated payment for this team (if any).
     */
    public readonly CalculatedPayment!: number;

    /**
     * Gets or sets the version of the team.
     */
    public Version!: number | null;
}

/**
 * Individual person registered for some role for a church.
 */
export class RegistrationPerson extends RemoteServiceModelBase<string> {

    /**
     * Gets or sets the id of the person linked to this registration.
    **/
    public PersonId!: string;

    /**
     * Gets the person associated with PersonId.
     */
    public readonly Person!: Person;

    /**
     * Gets the person's age for this event (if the birthdate is known).
     */
    public Age!: number | null;

    /**
     * Gets or sets the role for this person.
    **/
    public Role!: PersonRole;

    /**
     * Gets or sets the field values for this person.
    **/
    public Fields!: Record<string, string | null>;
}

/**
 * Individual official registrated for a church.
 */
export class RegistrationOfficial extends RegistrationPerson {

    /**
     * Gets or sets the ordered list of role preferences.
    **/
    RolePreferences!: OfficialRole[];

    /**
     * Gets or sets the preferred division for this official. If it is null, then the offical can be placed in any of the divisions.
     */
    DivisionId!: string | null;
}

/**
 * Status of a form completion for a person.
 */
export class RegistrationForm {

    /**
     * Gets the name for the person.
     */
    public readonly PersonName!: string;

    /**
     * Gets the waiver code for this person.
     */
    public readonly WaiverCode!: string;

    /**
     * Gets the name of the form.
     */
    public readonly FormName!: string;

    /**
     * Gets a value indicating whether the form is tracked.
     */
    public readonly IsTracked!: boolean;

    /**
     * Gets a value indicating whether the form is required.
     */
    public readonly IsRequired!: boolean;

    /**
     * Gets a value indicating whether this is a waiver.
     */
    public readonly IsWaiver!: boolean;

    /**
     * Gets the URL for the waiver.
     */
    public readonly Url!: string;

    /**
     * Gets or sets the ID of the person for the form.
     */
    public PersonId!: string;

    /**
     * Gets or sets the id of the form.
     */
    public FormId!: string;

    /**
     * Gets or sets the date the form was completed.
     */
    public CompletedDate!: string | null;
}

/**
 * Result of the team registration.
 */
export class RegistrationTeamResult {

    /**
     * Gets the ID for the registration (if any still exists).
     */
    public readonly RegistrationId!: string | null;

    /**
     * Gets the Team associated with the result.
     */
    public readonly Team!: RegistrationTeam | null;

    /**
     * Gets the list of existing people.
     */
    public readonly ExistingPeopleIds!: IdRolePair[];

    /**
     * Gets the list of existing team names.
     */
    public readonly ExistingTeamNames!: string[];

    /**
     * Gets the updated list of forms for all members of the church.
     */
    public readonly ChurchForms!: RegistrationForm[] | null;

    /**
     * Gets the updated calculated payment for the entire registration.
     */
    public CalculatedRegistrationPayment!: number;

    /**
     * Gets the new version associated with the entire registration.
     */
    public readonly NewVersion!: number | null;
}

/**
 * Pair of Id and PersonRole.
 */
export class IdRolePair extends RemoteServiceModelBase<string> {

    /**
     * Gets the role for the pair.
     */
    public Role!: PersonRole;

    /**
     * Generates a key for a pair.
     * 
     * @param id Id for the pair.
     * @param role Role for the pair.
     */
    public static generateKey(id: string, role: PersonRole): string {
        return role + "|" + id;
    }

    /**
     * Checks whether the key is for the role.
     * 
     * @param key Key to check.
     * @param role Role to check.
     */
    public static isRoleKey(key: string, role: PersonRole): boolean {
        return (key.substring(0, 2) == role + "|");
    }

    /**
     * Parses the current object into a pair.
     * 
     * @param key Key to parse.
     */
    public static parse(key: string): IdRolePair {

        let parts: string[] = key.split("|");

        let newPair: IdRolePair = new IdRolePair();
        newPair.Id = parts[1];
        newPair.Role = <PersonRole>parseInt(parts[0]);

        return newPair;
    }
}

/**
 * Role of an official.
 */
export enum OfficialRole {
    /**
     * Quizmaster.
    **/
    Quizmaster,

    /**
     * Judge.
    **/
    Judge,

    /**
     * Scorekeeper.
    **/
    Scorekeeper,

    /**
     * Timekeeper.
    **/
    Timekeeper,
}