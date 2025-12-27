import type { AuthManager } from "../AuthManager";
import { RemoteServiceUrlBase, RemoteServiceUtility } from './RemoteServiceUtility'
import { type Person } from './PeopleService';

const URL_ROOT_PATH = "/api/Email";

/**
 * Wrapper for the Email service.
 */
export class EmailService {

    /**
     * Get recipients matching the type or id.
     *
     * @param auth AuthManager to use for authentication.
     * @param type Type of recipient.
     * @param eventId Id for the event (if appropriate).
     */
    public static getRecipients(
        auth: AuthManager,
        type: EmailRecipientType,
        eventId: string | null): Promise<Person[]> {

        return RemoteServiceUtility.executeHttpRequest<Person[]>(
            auth,
            "GET",
            RemoteServiceUrlBase.Registration,
            URL_ROOT_PATH,
            RemoteServiceUtility.getFilteredUrlParameters({
                r: EmailRecipientType[type],
                eid: eventId
            }));
    }

    /**
     * Sends a new e-mail message.
     *
     * @param auth AuthManager to use for authentication.
     * @param message Message to be sent.
     */
    public static send(
        auth: AuthManager,
        message: EmailMessage): Promise<EmailResult> {

        return RemoteServiceUtility.executeHttpRequest<EmailResult>(
            auth,
            "POST",
            RemoteServiceUrlBase.Registration,
            `${URL_ROOT_PATH}/Send`,
            null,
            message);
    }
}

/**
 * Message to be sent.
 */
export class EmailMessage {

    /**
     * Initializes a new instance of the EmailMessage class.
     * 
     * @param subject Subject of the message.
     * @param title Title of the message.
     * @param body HTML formatted body of the message.
     */
    public constructor(subject: string, title: string, body: string) {
        this.Subject = subject;
        this.Title = title;
        this.MessageBody = body;
    }

    /**
     * Gets or sets event id associated with RecipientType.
     */
    public RecipientEventId: string | null = null;

    /**
     * Gets or sets the type of recipient. This property can be null when Recipients is set.
     */
    public RecipientType: EmailRecipientType | null = null;

    /**
     * Gets or sets the ids for the recipients of the message. This property can be null when RecipientType is set.
     */
    public Recipients: string[] | null = null;

    /**
     * Gets or sets the subject of the message.
     */
    public Subject: string;

    /**
     * Gets or sets the title of the message.
     */
    public Title: string;

    /**
     * Gets or sets the HTML formatted body of the message.
     */
    public MessageBody: string;
}

/**
 * Represents a specific type of e-mail recipient.
 */
export enum EmailRecipientType {

    /**
     * Churches that are eligible for a specific event.
     */
    EventRegionOrDistrict,

    /**
     * Administrators for the event.
     */
    EventAdministrators,

    /**
     * Coaches, officials, quizzers, and attendees registered for a specific event.
     */
    RegisteredPeople,

    /**
     * Coaches registered for a specific event.
     */
    RegisteredCoaches,

    /**
     * Churches registered for a specific event.
     */
    RegisteredChurches,

    /**
     * Officials registered for a specific event.
     */
    RegisteredOfficials,

    /**
     * Quizzers registered for a specific event.
     */
    RegisteredQuizzers,

    /**
     * Attendees registered for a specific event.
     */
    RegisteredAttendees,

    /**
     * Developers of the system.
     */
    Developers,
}

/**
 * Result of sending an e-mailing.
 */
export class EmailResult {

    /**
     * Gets or sets the number of recipients of the message.
     */
    public readonly Recipients!: number;
}