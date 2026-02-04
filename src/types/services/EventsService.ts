import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceModelBase, RemoteServiceUtility, type RemoteServicePage } from './RemoteServiceUtility'
import { Address } from './models/Address';
import { PersonRole, type Person } from './PeopleService';

const URL_ROOT_PATH = "/api/Events";

/**
 * Wrapper for the Events service.
 */
export class EventsService {

  /**
   * Retrieves the events.
   *
   * @param auth AuthManager to use for authentication.
   * @param pageSize Size of the page.
   * @param pageNumber Page number to retrieve (starts at 0).
   * @param typeId ID for the type.
   * @param churchId ID for the church.
   * @param districtId ID for the district.
   * @param filter Filter for the events.
   * @param searchText Text to search for events.
   * @param includeDatabasesOnly Include only meets with databases.
   * @param includeScoresOnly Include only meets with schedules or scores.
   * @param includeDistrict Include District Events.
   * @param includeRegion Include Regional Events.
   * @param includeNation Include National Events.
   * @param includeTimePeriod Filter for the event's time periods to return.
   * @param includeOnlyAuthorized Includes only events the current user is authorized to view.
   * @param season Include only events from the season.
   * @param excludeEventId Excludes a specific event id.
   * @param regionId Id for the region.
   * 
   * @returns Array of results.
   */
  public static getEvents(
    auth: AuthManager,
    pageSize: number,
    pageNumber: number,
    typeId: string | null,
    churchId: string | null,
    regionId: string | null,
    districtId: string | null,
    filter: EventFilter,
    searchText: string,
    includeDatabasesOnly: boolean,
    includeScoresOnly: boolean,
    includeDistrict: boolean,
    includeRegion: boolean,
    includeNation: boolean,
    includeTimePeriod: EventTimePeriod | null,
    includeOnlyAuthorized: boolean | null,
    season: number | null,
    excludeEventId: string | null): Promise<{ events: EventInfo[], timePeriod: EventTimePeriod, pageCount: number }[]> {

    return RemoteServiceUtility.getManyWithConvert<EventDashboard, { events: EventInfo[], timePeriod: EventTimePeriod, pageCount: number }[]>(
      auth,
      RemoteServiceUrlBase.Registration,
      URL_ROOT_PATH,
      dashboard => {
        const results: { events: EventInfo[], timePeriod: EventTimePeriod, pageCount: number }[] = [];
        if (dashboard.Past) {
          const page = dashboard.Past;
          results.push({ events: page.Items, timePeriod: EventTimePeriod.Past, pageCount: page.PageCount ?? 0 });
        }

        if (dashboard.CurrentAndFuture) {
          const page = dashboard.CurrentAndFuture;
          results.push({ events: page.Items, timePeriod: EventTimePeriod.Future, pageCount: page.PageCount ?? 0 });
        }

        return results;
      },
      pageSize,
      pageNumber,
      true, // Indicates the count should be included.
      RemoteServiceUtility.getFilteredUrlParameters({
        f: filter,
        ct: typeId,
        cid: churchId,
        rid: regionId,
        did: districtId,
        s: searchText,
        incdb: includeDatabasesOnly,
        incs: includeScoresOnly,
        incd: includeDistrict,
        incr: includeRegion,
        incn: includeNation,
        inca: includeOnlyAuthorized,
        tp: includeTimePeriod,
        seas: season,
        exclid: excludeEventId
      }));
  }

  /**
   * Gets a single Event based on the id.
   *
   * @param auth AuthManager to use for authentication.
   * @param id Id for the entry.
   */
  public static getEvent(
    auth: AuthManager,
    id: string): Promise<EventInfo> {

    return RemoteServiceUtility.getSingle<EventInfo>(
      auth,
      RemoteServiceUrlBase.Registration,
      URL_ROOT_PATH,
      id);
  }

  /**
   * Gets a single Event's summary based on the id.
   *
   * @param auth AuthManager to use for authentication.
   * @param id Id for the event.
   */
  public static getEventSummary(
    auth: AuthManager,
    id: string,
    churchId?: string,
    resetEmpty?: boolean): Promise<EventSummary> {

    return RemoteServiceUtility.executeHttpRequest<EventSummary>(
      auth,
      "POST",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${id}/Summary`,
      RemoteServiceUtility.getFilteredUrlParameters({
        cid: churchId,
        resempt: resetEmpty ?? false
      }));
  }

  /**
   * Gets a single Event's Registration Approvals based on the id.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   */
  public static getEventApprovals(
    auth: AuthManager,
    eventId: string): Promise<EventRegistrationApproval[]> {

    return RemoteServiceUtility.getManyWithConvert<RemoteServicePage<EventRegistrationApproval>, EventRegistrationApproval[]>(
      auth,
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/Approvals`,
      page => page.Items);
  }

  /**
   * Copies registrations from sourceId to targetId, replacing the existing registrations.
   *
   * @param auth AuthManager to use for authentication.
   * @param sourceId Id for the event containing the registrations.
   * @param targetId Id for the event where the registrations should be copied.
   */
  public static replaceRegistrations(
    auth: AuthManager,
    sourceId: string,
    targetId: string): Promise<number> {

    return RemoteServiceUtility.executeHttpRequest<number>(
      auth,
      "POST",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${targetId}/CopyRegistrations`,
      RemoteServiceUtility.getFilteredUrlParameters({
        sid: sourceId
      }));
  }

  /**
   * Creates a new event.
   *
   * @param auth AuthManager to use for authentication.
   * @param event Event to be created.
   * @param clonePermissionsFromEventId Clone permissions from the specified event.
   */
  public static create(
    auth: AuthManager,
    event: EventInfo,
    clonePermissionsFromEventId: string | null = null): Promise<EventInfo> {

    return RemoteServiceUtility.executeHttpRequest<EventInfo>(
      auth,
      "POST",
      RemoteServiceUrlBase.Registration,
      URL_ROOT_PATH,
      RemoteServiceUtility.getFilteredUrlParameters({
        cepid: clonePermissionsFromEventId
      }),
      event);
  }

  /**
   * Updates an existing event.
   *
   * @param auth AuthManager to use for authentication.
   * @param event Event to be updated.
   */
  public static update(
    auth: AuthManager,
    event: EventInfo): Promise<EventInfo> {

    return RemoteServiceUtility.executeHttpRequest<EventInfo>(
      auth,
      "PUT",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${event.Id}`,
      undefined,
      event);
  }

  /**
   * Creates a new event.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event being deleted.
   */
  public static delete(
    auth: AuthManager,
    eventId: string): Promise<void> {

    return RemoteServiceUtility.executeHttpRequestWithoutResponse(
      auth,
      "DELETE",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}`);
  }

  /**
   * Creates or updates an Event Registration Approvals.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * @param newOrExistingApprovals Approvals to be created or updated.
   */
  public static createOrUpdateApprovals(
    auth: AuthManager,
    eventId: string,
    newOrExistingApprovals: EventRegistrationApproval[]): Promise<EventRegistrationApproval[]> {

    return RemoteServiceUtility.executeHttpRequest<EventRegistrationApproval[]>(
      auth,
      "PUT",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/Approvals`,
      undefined,
      newOrExistingApprovals);
  }

  /**
   * Deletes an existing Event Registration Approval.
   *
   * @param auth AuthManager to use for authentication.
   * @param eventId Id for the event.
   * @param churchId Id for the church (if a church level approval).
   * @param teamId Id for the team (if a team level approval).
   */
  public static deleteApproval(
    auth: AuthManager,
    eventId: string,
    churchId: string | null,
    teamId: string | null): Promise<void> {

    return RemoteServiceUtility.executeHttpRequestWithoutResponse(
      auth,
      "DELETE",
      RemoteServiceUrlBase.Registration,
      `${URL_ROOT_PATH}/${eventId}/Approvals`,
      RemoteServiceUtility.getFilteredUrlParameters({
        cid: churchId,
        tid: teamId
      }));
  }
}

/**
 * Represents the registration status for an event.
 */
export enum EventRegistrationStatus {

  /**
   * Registration is open.
   */
  Open = "Open",

  /**
   * Registration is open with restrictions.
   */
  OpenWithRestrictions = "OpenWithRestrictions",

  /**
   * Registration opens in the future.
   */
  FutureOpen = "FutureOpen",

  /**
   * Registration is already closed.
   */
  AlreadyClosed = "AlreadyClosed"
}

/**
 * Dashboard of Events.
 */
class EventDashboard {

  /**
   * Gets the list of past events.
   */
  public readonly Past!: RemoteServicePage<EventInfo> | null;

  /**
   * Gets the list of current and future events.
   */
  public readonly CurrentAndFuture!: RemoteServicePage<EventInfo> | null;
}

/**
 * Filter for the time periods returned from the server.
 */
export enum EventTimePeriod {

  /**
   * Include only past events.
   */
  Past = "Past",

  /**
   * Include only current and future events.
   */
  Future = "Future"
}

/**
 * Event information.
 */
export class EventInfo extends RemoteServiceModelBase<string> {

  /**
   * Icon paths for competition types.
   */
  public static readonly CompetitionTypeIconPaths: { [name: string]: any } = {
    agjbq: "/images/jbq-small.png",
    agtbq: "/images/tbq-small.png"
  };

  /**
   * Gets or sets the name of this Meet.
   **/
  public Name!: string;

  /**
   * Gets or sets the subtitle for the event.
   **/
  public Subtitle!: string;

  /**
   * Gets or sets the description for the event.
   **/
  public Description!: string;

  /**
   * Gets the ID for the region.
   */
  public RegionId!: string | null;

  /**
   * Gets the name of the region.
   */
  public readonly RegionName!: string | null;

  /**
   * Gets the ID for the district.
   */
  public DistrictId!: string | null;

  /**
   * Gets the name of the district.
   */
  public readonly DistrictName!: string | null;

  /**
   * Gets or sets the eligibility for teams registering for this event.
   */
  public Eligibility!: EventEligibility;

  /**
   * Gets or sets the type of event.
   */
  public TypeId!: string;

  /**
   * Gets the label for the type.
   */
  public readonly TypeLabel!: string;

  /**
   * Gets or sets the date registration begins.
   */
  public RegistrationStartDate!: string;

  /**
   * Gets or sets the date registration ends.
   */
  public RegistrationEndDate!: string;

  /**
   * Gets or sets the extended date registration ends for attendees (if different than RegistrationEndDate).
   */
  public ExtendedAttendeesEndDate!: string | null;

  /**
   * Gets or sets the extended date registration ends for officials (if different than RegistrationEndDate).
   */
  public ExtendedOfficialsEndDate!: string | null;

  /**
   * Gets or sets the start date for the event.
   **/
  public StartDate!: string;

  /**
   * Gets or sets the end date for the event.
   **/
  public EndDate!: string;

  /**
   * Gets the start date when scoring can be uploaded from EZScore.
   */
  public readonly ScoringStartDate!: string | null;

  /**
   * Gets the end date when scoring can be uploaded from EZScore.
   */
  public readonly ScoringEndDate!: string | null;

  /**
   * Gets or sets the name of the location.
   **/
  public LocationName!: string;

  /**
   * Gets or sets the location for the event.
   **/
  public Location!: Address;

  /**
   * Gets or sets the ScoringCode for the event.
  **/
  public ScoringCode!: string | null;

  /**
   * Gets or sets a value indicating whether the event should be published to BibleQuiz.com's archives.
   */
  public PublishToArchives!: boolean;

  /**
   * Gets or sets a value indicating how the event should be published in BibleQuiz.com's archives. If PublishToArchives is false, this will be ignored.
   */
  public PublishType!: EventPublishType;

  /**
   * Gets or sets the list of the divisions for this event.
   */
  public Divisions!: EventDivision[];

  /**
   * Gets or sets the list of fields to be displayed for the event.
   */
  public Fields!: EventField[];

  /**
   * Gets or sets the list of external forms for this event.
   */
  public Forms!: EventExternalForm[];

  /**
   * Gets or sets the minimum number of people allowed on a team.
   */
  public MinTeamMembers!: number;

  /**
   * Gets or sets the maximum number of people allowed on a team.
   */
  public MaxTeamMembers!: number;

  /**
   * Gets or sets a value indicating whether the competition is official.
   */
  public IsOfficial!: boolean;

  /**
   * Gets or sets a value indicating whether payment will be calculated.
   */
  public CalculatePayment!: boolean;

  /**
   * Gets or sets a value indicating whether payment will be calculated.
   */
  public TrackPayments!: boolean;

  /**
   * Gets or sets the type of fee for the meet.
   */
  public AutomatedFeeType!: EventPaymentFeeType | null;

  /**
   * Gets or sets a value indicating an automated payment descriptor. If this is set, automated payments are supported.
   */
  public AutomatedPaymentDescriptor!: string | null;

  /**
   * Gets or sets the name of the payee.
   */
  public PayeeName!: string | null;

  /**
   * Gets or sets the e-mail of the payee.
   */
  public PayeeEmail!: string | null;

  /**
   * Gets or sets the address of the payee.
   */
  public PayeeAddress!: Address | null;

  /**
   * Gets or sets the per church cost (if any).
   */
  public PerChurchCost!: number | null;

  /**
   * Gets or sets the per team cost (if any).
   */
  public PerTeamCost!: number | null;

  /**
   * Gets or sets the role payment calculations associated with this meet in parsed form. If null, no payment calculation will be done.
   */
  public RolePayment!: EventRolePayment | null;

  /**
   * Gets or sets requirements for the point of contact fields.
   */
  public RequiredPointOfContactFields!: RequiredPersonFields;

  /**
   * Gets or sets the role payment calculations associated with this meet in parsed form. If null, no payment calculation will be done.
   */
  public RequiredRoleFields!: EventRoleFields;

  /**
   * Gets a value indicating whether the current user has permissions to manage this event.
   */
  public readonly IsOwner!: boolean;

  /**
   * Gets the link to the event in the archive.
   */
  public readonly ArchiveLink!: string | null;

  /**
   * Gets a value indicating whether this event is in the past.
   */
  public readonly IsInPast!: boolean;

  /**
   * Gets the status of registration.
   */
  public readonly RegistrationStatus!: EventRegistrationStatus;

  /// Gets any restrictions for registration. If null, no additional restrictions exist.
  /// </summary>
  public readonly RegistrationRestrictions!: EventRestrictions | null;

  /**
   * Gets a value indicating whether the current user has any registrations for this event.
   */
  public readonly IsRegistered!: boolean;

  /**
   * Gets a value indicating whether there are any registrations. If this is null, the server didn't calculate the value.
   */
  public readonly HasAnyRegistrations!: boolean | null;

  /**
   * Gets or sets a value indicating whether this event requires judges.
   */
  public HasJudges!: boolean;

  /**
   * Gets or sets a value indicating whether this event requires scorekeepers.
   */
  public HasScorekeepers!: boolean;

  /**
   * Gets or sets a value indicating whether this event requires timekeepers.
   */
  public HasTimekeepers!: boolean;

  /**
   * Gets or sets a value indicating whether team names can be specified.
   */
  public AllowTeamNames!: boolean;

  /**
   * Gets or sets a value indicating whether an individual can be registered without being attached to a team.
   */
  public AllowIndividuals!: boolean;

  /**
   * Gets or sets a value indicating whether an attendee can be registered without being attached to a team.
   */
  public AllowAttendees!: boolean;

  /**
   * Gets or sets a value indicating whether each team must have at least one coach.
   */
  public RequireTeamCoaches!: boolean;

  /**
   * Value indicating whether this event has databases.
   */
  public readonly HasDatabases!: boolean;

  /**
   * Value indicating whether there are schedule or scores for this database.
   */
  public readonly HasScheduleOrScores!: boolean;

  /**
   * Gets or sets a value indicating whether this meet is hidden.
   */
  public IsHidden!: boolean;

  /**
   * Gets or sets a value indicating whether this meet is hidden from live events on BibleQuiz.com.
   */
  public IsHiddenFromLiveEvents!: boolean;
}

/**
 * Scope of an EventField.
 */
export enum EventEligibility {

  /** 
   * Any team within the <see cref="Meet.Scope"/> is eligible.
   */
  Open = 0,

  /**
   * Each church must be approved before the church can create a registration.
   */
  ChurchApproval = 1,

  /**
   * Each team must be approved before the team can create a registration.
   */
  TeamApproval = 2
}

/**
 * Type of payment fee to charge with automated payments.
 */
export enum EventPaymentFeeType {

  /**
   * Adds 3% to the total fee and rounds up to the nearest dollar.
   */
  PlusThree = 0,

  /**
   * Adds 5% to to the total fee and rounds up to the nearest dollar.
   */
  PlusFive = 1
}

/**
 * Represents payment information about a person with overrides.
 */
export class EventPersonPayment {

  /**
   * Gets or sets the cost associated with this person.
   */
  public Cost!: number;

  /**
   * Gets or sets the overrides associated with this person's payment.
   */
  public Overrides!: EventFieldPaymentOverride[] | null;
}

/**
 * Type of event for publishing to the archives.
 */
export enum EventPublishType {

  /**
   * Competition is a regular competition.
   */
  Regular,

  /**
   * Competition is a finals.
   */
  Finals,

  /**
   * Competition is a tournament.
   */
  Tournament
}

/**
 * Required person fields for a role.
 */
export type EventRoleFields = { [name: string]: RequiredPersonFields };

/**
 * Payment settings for a role.
 */
export type EventRolePayment = { [name: string]: EventPersonPayment };

/**
 * Represents a division for an Event.
 */
export class EventDivision extends RemoteServiceModelBase<string> {

  /**
   * Gets or sets the abbreviation of this division.
   */
  Abbreviation!: string;

  /**
   * Gets or sets the label of this division.
   */
  Label!: string;
}

/**
 * Required fields for people.
 **/
export enum RequiredPersonFields {

  /**
   * No required fields.
   **/
  None = 0,

  /**
   * Birthdate is required.
   **/
  DateOfBirth = 1 << 0,

  /**
   * E-mail is required.
   **/
  Email = 1 << 1,

  /**
   * Phone Number is required.
   **/
  PhoneNumber = 1 << 2,

  /**
   * Address is required.
   **/
  Address = 1 << 3
}

/**
 * Represents a form for an event.
 */
export class EventExternalForm extends RemoteServiceModelBase<string> {

  /**
   * Gets or sets the label for the form.
   */
  public Label!: string;

  /**
   * Gets or sets the list of roles where this form applies.
   */
  public Roles!: PersonRole[];

  /**
   * Gets or sets a value indicating whether the form is required.
   */
  public IsRequired!: boolean;

  /**
   * Gets or sets a value indicating whether this form is tracked.
   */
  public IsTracked!: boolean;

  /**
   * Gets or sets a value to restrict the form to minors.
   */
  public IsMinorOnly!: boolean;

  /**
   * Gets or sets an optional HTML description.
   */
  public DescriptionHtml!: string;

  /**
   * Gets or sets the URL for the form.
   */
  public Url!: string;

  /**
   * Gets or sets HTML for Release of Liability (if this is a waiver).
   */
  public WaiverHtml!: string;
}

/**
 * Fields to be used for an Event.
 */
export class EventField extends RemoteServiceModelBase<string> {

  /** 
   * Value separator for list values.
   */
  public static readonly ListValueSeparator: string = "~";

  /**
   * Gets or sets the type of control for this field.
   */
  public ControlType!: EventFieldControlType;

  /**
   * Gets or sets the type of data for this field.
   */
  public DataType!: EventFieldDataType;

  /**
   * Gets or sets the visibility of the field.
   */
  public Visibility!: EventFieldVisibility;

  /**
   * Gets or sets the scopes where this field applies.
   */
  public Scopes!: EventFieldScopes;

  /**
   * Gets or sets the label of this field.
   */
  public Label!: string;

  /**
   * Gets or sets the caption for this field (if any).
   */
  public Caption?: string | null;

  /**
   * Gets or sets the values for this field.
   */
  public Values?: string[] | null;

  /**
   * Gets or sets a value indicating whether this field is required.
   */
  public IsRequired!: boolean;

  /**
   * Gets or sets the minimum value for this field if the field is a number.
   */
  public MinNumberValue?: number | null;

  /**
   * Gets or sets the maximum value for this field if the field is a number.
   */
  public MaxNumberValue?: number | null;

  /**
   * Gets or sets the maximum number of items if the field is a list.
   */
  public MaxCount?: number | null;

  /**
   * Gets or sets the amount to apply to the payment if this field is selected. It will not be applied
   * if the PaymentUnselectValue is selected.
   */
  public PaymentIfSelected?: number | null;

  /**
   * Gets or sets the list of scopes payment applies to if this field is selected and PaymentIfSelected is specified.
   * If the scope isn't in the list, no payment will be required.
   */
  public PaymentScopes?: EventFieldScopes | null;

  /**
   * Gets or sets the value (if any) that indicates the field is unselected and shouldn't be considered for payment.
   */
  public PaymentUnselectValue?: string | null;

  /**
   * Gets or sets the list of overrides for payment for this field (if any).
   */
  public PaymentOverrides?: EventFieldPaymentOverride[] | null;

  /**
   * Determines whether the type is a team-only field.
   * 
   * @param type Type of control.
   */
  public static IsTeamOnlyField(type: EventFieldControlType): boolean {
    return (EventFieldControlType.HtmlCheckbox == type || EventFieldControlType.MultilineTextbox == type);
  }

  /**
   * Determines whether the control type supports payment.
   * 
   * @param controlType Type of control.
   * @param dataType Type of data.
   * @param isRequired Indicates whether the field is required.
   */
  public static SupportsPayment(controlType: EventFieldControlType, dataType: EventFieldDataType, isRequired: boolean): boolean {

    switch (controlType) {
      case EventFieldControlType.GradeList:
      case EventFieldControlType.HtmlCheckbox:
      case EventFieldControlType.MultilineTextbox:
        return false;

      case EventFieldControlType.Textbox:
        return EventFieldDataType.Number == dataType;

      case EventFieldControlType.Checkbox:
        return !isRequired;

      case EventFieldControlType.DropdownList:
      case EventFieldControlType.RadioButton:
      case EventFieldControlType.MultiItemCheckbox:
        return true;

      default:
        throw Error("EventFieldControlType = " + controlType);
    }
  }

  /**
   * Gets the scope for role.
   * 
   * @param role Role of the person.
   */
  public static GetScope(role: PersonRole): EventFieldScopes {
    switch (role) {
      case PersonRole.Quizzer:
        return EventFieldScopes.Quizzer;
      case PersonRole.Coach:
        return EventFieldScopes.Coach;
      case PersonRole.Official:
        return EventFieldScopes.Official;
      case PersonRole.Attendee:
        return EventFieldScopes.Attendee;
      default:
        throw Error("PersonRole = " + role);
    }
  }
}

/**
 * Represents an override for the cost of a meet field.
 */
export class EventFieldPaymentOverride {

  /**
   * Gets or sets the cost for the payment rule.
   */
  public Cost!: number;

  /**
   * Gets or sets the minimum age (if any) for this cost.
   */
  public MinAge!: number | null;

  /**
   * Gets or sets the maximum age (if any) for this cost.
   */
  public MaxAge!: number | null;

  /**
   * Generates a label for the age range of this override.
   * 
   * @param override Override to use when generating the label.
   */
  public static generateAgeLabel(override: EventFieldPaymentOverride): string {

    if (null != override.MinAge && null != override.MaxAge) {
      return override.MinAge + "-" + override.MaxAge;
    }
    else if (null != override.MinAge) {
      return override.MinAge + "+";
    }
    else {
      return "0-" + override.MaxAge;
    }
  }
}

/**
 * Scope of an EventField.
 */
export enum EventFieldScopes {

  /**
   * No scopes selected.
   */
  None = 0,

  /**
   * Field will be displayed at the team level.
   */
  Team = 1 << 1,

  /**
   * Field will be displayed at the quizzer level.
   */
  Quizzer = 1 << 2,

  /**
   * Field will be displayed at the coach level.
   */
  Coach = 1 << 3,

  /**
   * Field will be displayed at the official level.
   */
  Official = 1 << 4,

  /**
   * Field will be displayed at the attendee level.
   */
  Attendee = 1 << 5,
}

/**
 * Type of control for EventField.
 */
export enum EventFieldControlType {

  /**
   * Checkbox.
   */
  Checkbox,

  /**
   * Dropdown list.
   */
  DropdownList,

  /**
   * Grade dropdown list.
   */
  GradeList,

  /**
   * Radio Button.
   */
  RadioButton,

  /**
   * Textbox.
   */
  Textbox,

  /**
   * Checkbox with an HTML caption.
   */
  HtmlCheckbox,

  /**
   * Multiline textbox.
   */
  MultilineTextbox,

  /*
   * Multi-item checkbox.
   */
  MultiItemCheckbox
}

/**
 * Type of data for EventField.
 */
export enum EventFieldDataType {

  /**
   * True / false
   */
  Boolean,

  /**
   * Date.
   */
  Date,

  /**
   * Number.
   */
  Number,

  /**
   * Text.
   */
  Text,

  /**
   * List of Text.
   */
  TextList,
}

/**
 * Visibility for a EventField.
 */
export enum EventFieldVisibility {

  /**
   * Read/write for the person doing the registration.
   */
  ReadWrite,

  /**
   * Field is visible to the person doing the registration, but can only be changed by the meet administrator.
   */
  ReadOnly,

  /**
   * Field is only visible to the meet administrator.
   */
  AdminOnly,
}


/**
 * Represents restrictions for registering for an event.
 */
export class EventRestrictions {

  /**
   * Gets the last date when any registration may occur.
   */
  public readonly LastRegistrationDate!: string;

  /**
   * Gets a value indicating whether teams or individuals can change.
   */
  public readonly CanTeamsChange!: boolean;

  /**
   * Gets a value indicating whether officials can change.
   */
  public readonly CanOfficialsChange!: boolean;

  /**
   * Gets a value indicating whether officials can change.
   */
  public readonly CanAttendeesChange!: boolean;

  /**
   * Gets a value indicating whether there is a maximum team count.
   */
  public readonly HasMaxTeamCount!: boolean;

  /**
   * Gets a value indicating whether only specific teams are allowed to register.
   */
  public readonly OnlySpecificTeams!: boolean;
}

/**
 * Filters for events.
 */
export enum EventFilter {

  /**
   * Display only events within the Church's Nation, Region, or District.
   */
  MyDistrictRegionNation = 0,

  /**
   * Display events in other Regions and Districts open to the Church's registration.
   */
  OtherEligible = 1,

  /**
   * Display all events.
   */
  All = 2
}

/**
  * Represents an summary of an event.
**/
export class EventSummary {

  /**
    * Gets the name of this Event.
    */
  public readonly Name!: string;

  /**
   * Gets the id for the Type.
   */
  public readonly TypeId!: string;

  /**
    * Gets the label for the Type.
    */
  public readonly TypeLabel!: string;

  /**
    * Gets the start date for the event.
    */
  public readonly StartDate!: string;

  /**
    * Gets the end date for the event.
    */
  public readonly EndDate!: string;

  /**
   * Gets the start date of registration for the event.
   */
  public readonly RegistrationStartDate!: string;

  /**
    * Gets the name of the location.
    */
  public readonly LocationName!: string;

  /**
    * Gets the location for the event.
    */
  public readonly Location!: Address;

  /**
    * Gets a value indicating whether the competition is official.
    */
  public readonly IsOfficial!: boolean;

  /**
   * Gets or sets a value indicating whether this event requires judges.
   */
  public readonly HasJudges!: boolean;

  /**
    * Gets a value indicating whether this event requires scorekeepers.
    */
  public readonly HasScorekeepers!: boolean;

  /**
    * Gets a value indicating whether this event requires timekeepers.
    */
  public readonly HasTimekeepers!: boolean;

  /**
    * Gets a value indicating whether an individual can be registered without being attached to a church.
    */
  public readonly AllowIndividuals!: boolean;

  /**
   * Gets a value indicating whether there is payment information.
   */
  public readonly HasPayment!: boolean;

  /**
   * Gets a value indicating payment balances should be tracked.
   */
  public readonly HasPaymentBalance!: boolean;

  /**
   * Gets the last date this was refreshed.
   */
  public readonly RefreshDate!: string;

  /**
    * Gets the summary of churches registered for this event (may be null).
    */
  public readonly Churches!: EventChurchSummary[];

  /**
    * Gets the summary of teams registered in specific divisions for this event (may be null).
    */
  public readonly TeamDivisions!: EventDivisionSummary[] | null;

  /**
    * Gets the summary of teams registered (if there are no divisions) for this event (may be null).
    */
  public readonly Teams!: EventTeamSummary[];

  /**
   * Gets the ordered list of fields for teams.
   */
  public readonly TeamFields!: EventFieldSummary[];

  /**
    * Gets the summary of quizzers and coaches registered for this event.
    */
  public readonly QuizzersAndCoaches!: EventPersonSummary[];

  /**
   * Gets the ordered list of fields for quizzers and coaches.
   */
  public readonly QuizzerAndCoachFields!: EventFieldSummary[];

  /**
    * Gets the summary of officials registered.
    */
  public readonly Officials!: EventOfficialSummary[];

  /**
   * Gets the ordered list of fields for officials.
   */
  public readonly OfficialFields!: EventFieldSummary[];

  /**
    * Gets the summary of attendees registered (may be null).
    */
  public readonly Attendees!: EventPersonSummary[];

  /**
   * Gets the ordered list of fields for attendees (may be null).
   */
  public readonly AttendeeFields!: EventFieldSummary[];
}

/**
  * Represents an summary of a church.
**/
export class EventChurchSummary {

  /**
    * Gets the Id for the church.
    */
  public readonly Id!: string;

  /**
    * Gets the name of the church.
    */
  public readonly ChurchName!: string;

  /**
    * Gets the location of the church.
    */
  public readonly ChurchLocation!: Address;

  /**
    * Gets the list of coaches for the team.
    */
  public readonly CoachNames!: string[];

  /**
    * Gets the list of divisions and number of teams in those divisions.
    */
  public readonly Divisions!: { [name: string]: number } | null;

  /**
    * Gets the number of teams registered.
    */
  public readonly TeamCount!: number;

  /**
    * Gets the number of officials registered.
    */
  public readonly OfficialCount!: number;

  /**
   * Gets the calculated payment for this church (if any).
   */
  public readonly CalculatedPayment!: number;

  /**
   * Gets the calculated payment just for this church (if any).
   */
  public readonly ChurchOnlyCalculatedPayment!: number;

  /**
   * Gets the payment balance for this church (if any).
   */
  public readonly PaymentBalance!: number;

  /**
   * Gets the list of payment entries making up the PaymentBalance property.
   */
  public readonly PaymentEntries!: PaymentEntry[] | null;

  /**
   * Gets the pending payments for this church (if any).
   */
  public readonly PendingPayments!: number;

  /**
   * Gets the list of validation errors.
   */
  public readonly ValidationErrors!: string[] | null;

  /**
   * Gets the last date this church registration was modified.
   */
  public readonly LastModified!: string;
}

/**
  * Represents an summary of a division.
**/
export class EventDivisionSummary {

  /**
   * Gets the Id for the division.
   */
  Id!: string;

  /**
    * Gets the name of the division.
    */
  Name!: string;

  /**
    * Gets the list of teams for this division (may be null).
  **/
  Teams!: EventTeamSummary[];
}

/**
  * Represents an summary of a team.
**/
export class EventTeamSummary {

  /**
    * Gets the id of the team.
    */
  public readonly Id!: string;

  /**
    * Gets the name of the team.
    */
  public readonly Name!: string;

  /**
   * Gets the id for the team's church.
   */
  public readonly ChurchId!: string;

  /**
    * Gets the name of the church.
    */
  public readonly ChurchName!: string;

  /**
    * Gets the location of the church.
    */
  public readonly ChurchLocation!: Address;

  /**
   * Gets the point of contact for the team.
   */
  public readonly PointOfContact!: Person | null;

  /**
   * Gets the calculated payment for this team (if any).
   */
  public readonly CalculatedPayment!: number;

  /**
   * Gets the list of validation errors.
   */
  public readonly ValidationErrors!: string[] | null;

  /**
   * Gets a list of the missing fields for the point of contact.
   */
  public readonly MissingPointOfContactFields!: string[] | null;

  /**
   * Gets the last date this team registration was modified.
   */
  public readonly LastModified!: string;

  /**
    * Gets the people for this team.
    */
  public readonly People!: EventPersonSummary[];

  /**
    * Gets the fields for the team.
    */
  public readonly Fields!: { [name: string]: string };

  /**
   * Gets the list of field costs for the church.
   */
  public readonly FieldCosts!: { [name: string]: number };
}

/**
 * Represents an summary of a person.
 */
export class EventPersonSummary {

  /**
   * Gets the id of the person.
   */
  public readonly Id!: string;

  /**
    * Gets the name of the person.
    */
  public readonly PersonName!: string;

  /**
   * Gets the e-mail address for the person.
   */
  public readonly Email!: string;

  /**
   * Gets the phone number for the person (if required).
   */
  public readonly PhoneNumber!: string | null;

  /**
   * Gets the address for the person (if required).
   */
  public readonly Address!: Address | null;

  /**
    * Gets the waiver code for the person.
    */
  public readonly WaiverCode!: string;

  /**
   * Gets the id for the division (if any).
   */
  public readonly DivisionId!: string | null;

  /**
   * Gets the name of the person's team (if any).
   */
  public readonly TeamName!: string;

  /**
   * Gets the id for the person's church.
   */
  public readonly ChurchId!: string;

  /**
    * Gets the name of the person's church.
    */
  public readonly ChurchName!: string;

  /**
    * Gets the location of the person's church.
    */
  public readonly ChurchLocation!: Address;

  /**
    * Gets the role for this person.
    */
  public readonly Role!: PersonRole;

  /**
   * Gets the age of the quizzer. If this isn't a quizzer, it will be null.
   */
  public readonly QuizzerAge!: number | null;

  /**
   * Gets the list of forms for this person.
   */
  public readonly Forms!: EventPersonFormSummary[];

  /**
   * Gets the calculated payment for this person (if any).
   */
  public readonly CalculatedPayment!: number;

  /**
   * Gets the list of validation errors.
   */
  public readonly ValidationErrors!: string[] | null;

  /**
   * Gets the last date this person registration was modified.
   */
  public readonly LastModified!: string;

  /**
    * Gets the field values for this person.
    */
  public readonly Fields!: { [name: string]: string };

  /**
   * Gets the list of field costs for the person.
   */
  public readonly FieldCosts!: { [name: string]: number };

  /**
   * Gets a list of the missing fields.
   */
  public readonly MissingFields!: string[] | null;
}

/**
 * Represents an summary of an official.
 */
export class EventOfficialSummary extends EventPersonSummary {

  /**
   * Gets the official's ordered preference as a quizmaster.
   */
  QuizmasterPref!: number | null;

  /**
    * Gets the official's ordered preference as a judge.
    */
  JudgePref!: number | null;

  /**
    * Gets the official's ordered preference as a scorekeeper.
    */
  ScorekeeperPref!: number | null;

  /**
    * Gets the official's ordered preference as a timekeeper.
    */
  TimekeeperPref!: number | null;

  /**
   * Gets the preferred division for this official. If it is null, then the offical can be placed in any of the divisions.
   */
  DivisionPref!: string | null;
}

/**
 * Represents metadata about fields.
 */
export class EventFieldSummary {

  /**
   * Gets the id for the field.
   */
  public readonly Id!: string;

  /**
   * Gets the label of this field.
   */
  public readonly Label!: string;

  /**
   * Gets the data type for the field.
   */
  public readonly DataType!: EventFieldDataType;

  /**
   * Gets a value indicating whether the field is required.
   */
  public readonly IsRequired!: boolean;

  /**
   *  Gets the possible values for the field (if list field).
   */
  public readonly PossibleValues!: string[] | null;
}

/**
 * Represents an summary of a field.
 */
export class EventFieldValueSummary {

  /**
   * Gets the type of data for this field.
   */
  DataType!: EventFieldDataType;

  /**
   * Gets the label of this field.
   */
  Label!: string;

  /**
   * Gets the value for this field.
   */
  Value!: string;
}


/**
 * Represents an summary of a form for person.
 */
export class EventPersonFormSummary {

  /**
   * Gets the id of the form.
   */
  public readonly FormId!: string;

  /**
   * Gets the name of the form.
   */
  public readonly FormName!: string;

  /**
   * Gets a value indicating whether the form is required.
   */
  public readonly IsRequired!: boolean;

  /**
   * Gets the URL for the waiver.
   */
  public readonly Url!: string;

  /**
   * Gets the date the form was completed.
   */
  public readonly CompletedDate!: string | null;
}

/**
 * Represents a specific approval for an event.
 */
export class EventRegistrationApproval extends RemoteServiceModelBase<string> {

  /**
   * Gets or sets a church for this approval.
   */
  public ChurchId!: string | null;

  /**
   * Gets the name of the church.
   */
  public readonly ChurchName!: string | null;

  /**
   * Gets the location of the church.
   */
  public readonly ChurchLocation!: string | null;

  /**
   * Gets or sets a team from a previous meet for this approval (if the approval applies at the team level).
   */
  public TeamId!: string | null;

  /**
   * Gets the name of the team (if set).
   */
  public readonly TeamName!: string | null;

  /**
   * Gets or sets the number of teams that have been approved. This is ignored when TeamId is set.
   */
  public Teams!: number | null;
}

/**
 * Payment Entry.
 */
export class PaymentEntry {

  /**
   * Gets or sets the identifier for the entry.
   */
  public Id!: string | null;

  /**
   * Gets or sets the date for the entry.
   */
  public EntryDate!: string;

  /**
   * Gets or sets the description of the entry.
   */
  public Description!: string;

  /**
   * Gets or sets the amount for the entry.
   */
  public Amount!: number;

  /**
   * Gets a value indicating whether this entry is from an Automated system.
   */
  public readonly IsAutomated!: boolean;

  /**
   * Gets a value indicating whether this transaction is pending.
   */
  public readonly IsPending!: boolean;

  /**
   * Gets the URL for the receipt of this transaction.
   */
  public readonly AutomatedReceiptUrl!: string;
}