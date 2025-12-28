import { useState } from "react";
import { AuthManager } from "types/AuthManager";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import RichTextEditor from "components/RichTextEditor";
import { EmailMessage, EmailRecipientType, EmailResult, EmailService } from "types/services/EmailService";
import { PersonParentType, type Person } from "types/services/PeopleService";
import PersonLookupDialog from "components/PersonLookupDialog";
import { DataTypeHelpers } from "utils/DataTypeHelpers";

interface Props {
    eventId?: string,
    eventName?: string,
    types: EmailRecipientType[],
    messageTitle: string,
    subjectPrefix?: string,
    messagePrefixHtml?: string
}

export default function EmailForm({
    eventId,
    eventName,
    types,
    messageTitle,
    subjectPrefix = "",
    messagePrefixHtml = "" }: Props) {

    const auth = AuthManager.useNanoStore();

    const [recipients, setRecipients] = useState<Person[]>([]);
    const [subject, setSubject] = useState<string>("");
    const [body, setBody] = useState<string>("");
    const [isAddingRecipient, setIsAddingRecipient] = useState(false);
    const [isAddingType, setIsAddingType] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [lastResult, setLastResult] = useState<EmailResult | undefined>(undefined);
    const [hasCopiedAddresses, setHasCopiedAddresses] = useState(false);

    const addRecipients = (people: Person[]) => {
        const mergedRecipients: Record<string, Person> = {};
        for (const recipient of recipients) {
            mergedRecipients[recipient.Id!] = recipient;
        }

        for (const person of people) {
            mergedRecipients[person.Id!] = person;
        }

        setRecipients(Object.values(mergedRecipients));
    };

    const isDisabled = isAddingRecipient || isAddingType || isSending;

    const getAddButton = (type: EmailRecipientType) => {
        let label: string;
        switch (type) {
            case EmailRecipientType.Developers:
            case EmailRecipientType.EventAdministrators:
                if (1 != types.length) {
                    throw Error(`${EmailRecipientType[type]} can only be selected when there is a single type.`);
                }
                return null;

            case EmailRecipientType.EventRegionOrDistrict:
                label = "People in Event Region/District";
                break;
            case EmailRecipientType.RegisteredChurches:
                label = "Churches";
                break;
            case EmailRecipientType.RegisteredQuizzers:
                label = "Quizzers";
                break;
            case EmailRecipientType.RegisteredCoaches:
                label = "Coaches";
                break;
            case EmailRecipientType.RegisteredOfficials:
                label = "Officials";
                break;
            default:
                throw Error(`Not Implemented: EmailRecipientType = ${EmailRecipientType[type]}`);
        }
        return (
            <button
                type="button"
                key={`add-${type}`}
                className="btn btn-sm btn-outline mt-0"
                onClick={() => {
                    setIsAddingType(true);
                    EmailService.getRecipients(
                        auth,
                        type,
                        eventId!)
                        .then(people => {
                            addRecipients(people);
                            setIsAddingType(false);
                            setError(undefined);
                            setLastResult(undefined);
                        })
                        .catch(err => {
                            setError(err.message ?? "An error occurred while retrieving recipients.");
                            setIsAddingType(false);
                            setLastResult(undefined);
                        });
                }}
                disabled={isDisabled}
            >
                <FontAwesomeIcon icon="fas faPlus" />
                {label}
            </button >);
    }

    const useRecipientType = types.length === 1 &&
        (types[0] === EmailRecipientType.Developers || types[0] === EmailRecipientType.EventAdministrators);

    return (
        <>
            <div className="w-full max-w-6xl mx-auto">
                {error && (
                    <div className="alert alert-warning rounded-2xl mb-4">
                        <div
                            className="w-full"
                            dangerouslySetInnerHTML={{ __html: error }} />
                    </div>)}
                {lastResult !== undefined && (
                    <div className="alert alert-success rounded-2xl mb-4">
                        <div className="w-full">
                            Successfully sent e-mail to {lastResult.Recipients} recipient(s).
                        </div>
                    </div>)}
                <div className="space-y-4">
                    {!useRecipientType && (
                        <>
                            {recipients.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {
                                        recipients.map((recipient, index) => {
                                            const key = `recipient-${recipient.Id}`;

                                            return (
                                                <div className="badge badge-primary mt-0" key={key}>
                                                    <span>
                                                        {recipient.FirstName} {recipient.LastName}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-xs text-primary-content hover:bg-primary-focus rounded-full w-4 h-4 min-h-0 p-0 mt-0"
                                                        onClick={() => {
                                                            const clonedRecipients = [...recipients];
                                                            clonedRecipients.splice(index, 1);
                                                            setRecipients(clonedRecipients);
                                                        }}
                                                        disabled={isDisabled}
                                                        aria-label={`Remove ${recipient.FirstName} ${recipient.LastName}`}
                                                    >
                                                        <FontAwesomeIcon icon="fas faX" />
                                                    </button>
                                                </div>);
                                        })}
                                </div>)}
                            <button
                                type="button"
                                className="btn btn-sm btn-outline"
                                onClick={() => setIsAddingRecipient(true)}
                                disabled={isDisabled}
                            >
                                <FontAwesomeIcon icon="fas faPlus" />
                                Add Recipient
                            </button>
                            <div className="flex flex-wrap gap-2">
                                {types.map(t => getAddButton(t))}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-ghost mt-0"
                                    onClick={async () => {
                                        const addresses = recipients
                                            .map(p => `"${p.FirstName} ${p.LastName}" <${p.Email}>`)
                                            .join("; ");
                                        await navigator.clipboard.writeText(addresses);

                                        if (!hasCopiedAddresses) {
                                            setHasCopiedAddresses(true);
                                            setTimeout(() => setHasCopiedAddresses(false), 5000);
                                        }
                                    }}
                                >
                                    <FontAwesomeIcon icon={`fas ${hasCopiedAddresses ? "faCheck" : "faCopy"}`} />
                                    Copy Addresses
                                </button>
                            </div>
                        </>)}

                    <div className="form-control">
                        <input
                            type="text"
                            placeholder="Subject"
                            className="input input-bordered w-full"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            disabled={isDisabled}
                        />
                    </div>

                    <RichTextEditor
                        text={body}
                        setText={setBody}
                        disabled={isDisabled}
                    />

                    {eventId && eventName && (
                        <button
                            type="button"
                            className="btn btn-sm btn-info"
                            onClick={() => setBody(`${body}<p><a href="https://registration.biblequiz.com/#/Registration/${eventId}">${eventName}</a></p>`)}
                            disabled={isDisabled}
                        >
                            <FontAwesomeIcon icon="fas faPlus" />
                            Registration Link
                        </button>)}

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-success"
                            disabled={isDisabled || recipients.length === 0 || !subject || !body}
                            onClick={() => {
                                setIsSending(true);

                                const message = new EmailMessage(
                                    DataTypeHelpers.isNullOrEmpty(subjectPrefix)
                                        ? subject
                                        : `${subjectPrefix} ${subject}`,
                                    messageTitle,
                                    messagePrefixHtml ? messagePrefixHtml + body : body);
                                if (useRecipientType) {
                                    message.RecipientType = types[0];
                                }
                                else {
                                    message.Recipients = recipients.map(r => r.Id!);
                                }

                                message.RecipientEventId = eventId ?? null;

                                EmailService.send(
                                    auth,
                                    message)
                                    .then(result => {
                                        setError(undefined);
                                        setIsSending(false);
                                        setLastResult(result);
                                    })
                                    .catch(err => {
                                        setError(err.message ?? "An error occurred while sending the e-mail message.");
                                        setIsSending(false);
                                        setLastResult(undefined);
                                    });
                            }}
                        >
                            Send E-mail Message
                        </button>
                    </div>
                </div>
            </div>
            {isAddingRecipient && (
                <PersonLookupDialog
                    title="Find Person"
                    description="Individuals without e-mail address have been excluded."
                    parentType={PersonParentType.Organization}
                    excludeIds={new Set<string>(recipients.map(p => p.Id!))}
                    excludePeopleWithoutEmail={true}
                    onSelect={p => {
                        if (p) {
                            addRecipients([p]);
                        }

                        setIsAddingRecipient(false);
                        setError(undefined);
                    }}
                />)
            }
        </>);
}