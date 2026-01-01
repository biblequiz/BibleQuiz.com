import { EventField, EventFieldDataType, EventFieldSummary, EventPersonSummary, EventTeamSummary, PaymentEntry, type EventChurchSummary, type EventSummary } from 'types/services/EventsService';
import RegistrationReceiptPaymentRow from './RegistrationReceiptPaymentRow';
import { DataTypeHelpers } from 'utils/DataTypeHelpers';
import type { JSX } from 'react';
import FontAwesomeIcon from 'components/FontAwesomeIcon';
import { PersonRole } from 'types/services/PeopleService';

interface Props {
    eventSummary: EventSummary;
    churchSummary: EventChurchSummary;
    entries: PaymentEntry[];
    isEditable: boolean;
    includeDetails: boolean;
    editEntry: (entry: PaymentEntry) => void;
}

const appendTeamSectionRowsAndCalculateTotal = (
    rows: JSX.Element[],
    eventSummary: EventSummary,
    churchSummary: EventChurchSummary,
    includeDetails: boolean): number => {

    let total = 0;

    const teamRows: JSX.Element[] = [];
    if (eventSummary.TeamDivisions) {
        for (const division of eventSummary.TeamDivisions) {
            for (const team of division.Teams) {
                if (team.ChurchId === churchSummary.Id) {
                    total += appendTeamRowsAndCalculateTotal(
                        teamRows,
                        `division-${division.Id}`,
                        eventSummary,
                        team,
                        includeDetails,
                        1);
                }
            }
        }
    }
    else if (eventSummary.Teams) {
        for (const team of eventSummary.Teams) {
            total += appendTeamRowsAndCalculateTotal(
                teamRows,
                "teams",
                eventSummary,
                team,
                includeDetails,
                1);
        }
    }

    if (teamRows.length > 0) {
        rows.push(getTitleRow("teams", "Teams"));
        appendChildRows(rows, teamRows);
    }

    return total;
}

const appendTeamRowsAndCalculateTotal = (
    rows: JSX.Element[],
    parentKey: string,
    eventSummary: EventSummary,
    team: EventTeamSummary,
    includeDetails: boolean,
    level: number): number => {

    let teamTotal: number | undefined = team.CalculatedPayment;

    const teamLabel = team.Name;

    const teamRows: JSX.Element[] = [];
    const rowKey = `${parentKey}-team-${team.Id}`;

    teamTotal -= appendPeopleRowsAndCalculateTotal(
        teamRows,
        rowKey,
        eventSummary.QuizzerAndCoachFields,
        team.People,
        includeDetails,
        level + 1);

    teamTotal -= appendFieldRowsAndCalculateTotal(
        teamRows,
        rowKey,
        eventSummary.TeamFields,
        team.Fields,
        team.FieldCosts,
        includeDetails,
        level + 1);

    if (teamRows.length > 0) {

        if (teamTotal) {

            // Insert as the first item.
            teamRows.splice(0, 0, getItemAndAmountRow(
                `${rowKey}-cost`,
                level + 1,
                "Team Registration Fee",
                teamTotal));
        }

        teamRows.push(
            getSubtotalRow(
                rowKey,
                teamLabel,
                team.CalculatedPayment,
                level + 1));

        teamTotal = undefined;
    }

    rows.push(getItemAndAmountRow(
        rowKey,
        level,
        <i>{teamLabel}</i>,
        teamTotal));

    appendChildRows(rows, teamRows);

    appendValidationErrorRows(
        rows,
        rowKey,
        "team",
        team.ValidationErrors,
        includeDetails,
        level + 1);

    return team.CalculatedPayment;
}

const appendPeopleSectionRowsAndCalculateTotal = (
    rows: JSX.Element[],
    title: string,
    fields: EventFieldSummary[],
    people: EventPersonSummary[],
    includeDetails: boolean,
    level: number): number => {

    const rowKey = `people-${title}`;
    const peopleRows: JSX.Element[] = [];
    const total = appendPeopleRowsAndCalculateTotal(
        peopleRows,
        rowKey,
        fields,
        people,
        includeDetails,
        level + 1);

    if (peopleRows.length > 0) {
        rows.push(getTitleRow(rowKey, title));
        appendChildRows(rows, peopleRows);
    }

    return total;
}

const appendPeopleRowsAndCalculateTotal = (
    rows: JSX.Element[],
    parentKey: string,
    fields: EventFieldSummary[],
    people: EventPersonSummary[],
    includeDetails: boolean,
    level: number): number => {

    let total = 0;

    if (null != people) {
        for (const person of people) {
            total += appendPersonRowsAndCalculateTotal(
                rows,
                parentKey,
                fields,
                person,
                includeDetails,
                level);
        }
    }

    return total;
}

const appendPersonRowsAndCalculateTotal = (
    rows: JSX.Element[],
    parentKey: string,
    fields: EventFieldSummary[],
    person: EventPersonSummary,
    includeDetails: boolean,
    level: number): number => {

    const personLabel = `${person.PersonName} (${PersonRole[person.Role]})`;
    const rowKey = `${parentKey}-person-${person.Id}`;

    let personTotal: number | undefined = person.CalculatedPayment;
    const personRows: JSX.Element[] = [];

    if (includeDetails) {

        personTotal -= appendFieldRowsAndCalculateTotal(
            personRows,
            rowKey,
            fields,
            person.Fields,
            person.FieldCosts,
            includeDetails,
            level + 1);

        if (personRows.length > 0) {

            if (personTotal) {

                // Insert as the first item.
                personRows.splice(0, 0, getItemAndAmountRow(
                    `${rowKey}-cost`,
                    level,
                    `${PersonRole[person.Role]} Registration Fee`,
                    personTotal));
            }

            personRows.push(
                getSubtotalRow(
                    rowKey,
                    personLabel,
                    person.CalculatedPayment,
                    level + 1));

            personTotal = undefined;
        }
    }

    rows.push(getItemAndAmountRow(
        rowKey,
        level,
        personLabel,
        personTotal));

    appendChildRows(rows, personRows);

    appendValidationErrorRows(
        rows,
        rowKey,
        PersonRole[person.Role],
        person.ValidationErrors,
        includeDetails,
        level + 1);

    return person.CalculatedPayment;
}

const appendFieldRowsAndCalculateTotal = (
    rows: JSX.Element[],
    parentKey: string,
    fields: EventFieldSummary[],
    fieldValues: Record<string, string>,
    fieldCosts: Record<string, number>,
    includeDetails: boolean,
    level: number): number => {

    let total: number = 0;

    for (const field of fields) {
        const cost: number = fieldCosts[field.Id] ?? 0;
        const value: string = fieldValues[field.Id];

        if (null != value) {
            if (includeDetails) {
                let fieldLabel: string = field.Label;
                switch (field.DataType) {
                    case EventFieldDataType.Number:
                        fieldLabel += ` x ${value}`;
                        break;
                    case EventFieldDataType.Boolean:
                        fieldLabel += `: ${"1" == value ? "YES" : "NO"}`;
                        break;
                    case EventFieldDataType.TextList:
                        fieldLabel += `: ${value.replace(EventField.ListValueSeparator, ", ")}`;
                        break;
                    default:
                        fieldLabel += `: ${value}`;
                        break;
                }

                rows.push(getItemAndAmountRow(
                    `${parentKey}-field-${field.Id}`,
                    level,
                    fieldLabel,
                    cost));
            }

            total += cost;
        }
    }

    return total;
}

const appendValidationErrorRows = (
    rows: JSX.Element[],
    parentKey: string,
    scope: string,
    errors: string[] | null,
    includeDetails: boolean,
    level: number): void => {

    if (errors && includeDetails) {
        for (let i = 0; i < errors.length; i++) {
            rows.push((
                <tr key={`${parentKey}-error-${scope}-${i}`}>
                    <td
                        className="p-0 tooltip tooltip-error"
                        colSpan={2}
                        data-tip="Pricing mismatches typically occur due to errors when an event was first setup (e.g. creator of event entered incorrect per person cost). When the error is corrected, this error will occur. Go back to the Registration page and you will be prompted to accept the change in pricing."
                        style={{ paddingLeft: getLeftPadding(level) }}>
                        <FontAwesomeIcon icon="fa faQuestionCircle" />
                        <span className="text-red-600 font-bold">ERROR:</span> {errors[i]}
                    </td>
                </tr>));
        }
    }
}

const appendChildRows = (rows: JSX.Element[], childRows: JSX.Element[]): void => {
    for (const childRow of childRows) {
        rows.push(childRow);
    }
}

const getTitleRow = (key: string, title: string): JSX.Element => {
    return (
        <tr key={`title-${key}`}>
            <td className="font-bold uppercase p-0 pl-4" colSpan={2}>{title}</td>
        </tr>);
}

const getItemAndAmountRow = (
    key: string,
    level: number,
    textElement: JSX.Element | string,
    amount?: number): JSX.Element => {

    return (
        <tr key={key}>
            <td
                className="p-0"
                colSpan={amount === undefined ? 2 : undefined}
                style={{ paddingLeft: getLeftPadding(level) }}>
                {textElement}
            </td>
            {amount !== undefined && (
                <td className="text-right p-0 pr-4">
                    {DataTypeHelpers.formatDollars(amount)}
                </td>)}
        </tr>);
}

const getSubtotalRow = (
    parentKey: string,
    title: string,
    amount: number,
    level: number): JSX.Element => {

    return (
        <tr key={`${parentKey}-subtotal`}>
            <td
                className="font-bold italic uppercase p-0"
                style={{ paddingLeft: getLeftPadding(level) }}>
                Subtotal for {title}
            </td>
            <td className="text-right p-0 pr-4">{DataTypeHelpers.formatDollars(amount)}</td>
        </tr>);
}

const getLeftPadding = (level: number): number => 16 + (level * 8);

export default function RegistrationReceipt({
    eventSummary,
    churchSummary,
    entries,
    isEditable,
    includeDetails,
    editEntry }: Props) {

    let paymentsTotal = 0;
    const entryRows = entries.length > 0
        ? entries.map((entry, index) => {
            paymentsTotal += entry.Amount;
            return (
                <RegistrationReceiptPaymentRow
                    key={`payment-${entry.Id || -index}`}
                    isEditable={isEditable}
                    entry={entry}
                    onEdit={() => editEntry(entry)}
                />);
        })
        : (
            <tr>
                <td className="text-center italic" colSpan={2}>No payment entries found.</td>
            </tr>);

    // Calculate the registration costs.
    let costTotal = 0;
    let rows: JSX.Element[] = [];

    if (churchSummary.ChurchOnlyCalculatedPayment > 0) {
        costTotal += churchSummary.ChurchOnlyCalculatedPayment;
        rows.push(getItemAndAmountRow(
            "church-fee",
            0,
            `${churchSummary.ChurchName} Church Registration Fee`,
            churchSummary.ChurchOnlyCalculatedPayment));
    }

    costTotal += appendTeamSectionRowsAndCalculateTotal(
        rows,
        eventSummary,
        churchSummary,
        includeDetails);

    costTotal += appendPeopleSectionRowsAndCalculateTotal(
        rows,
        "Individuals",
        eventSummary.QuizzerAndCoachFields,
        eventSummary.QuizzersAndCoaches.filter(person => !person.TeamName && person.ChurchId === churchSummary.Id),
        includeDetails,
        0);

    costTotal += appendPeopleSectionRowsAndCalculateTotal(
        rows,
        "Officials",
        eventSummary.OfficialFields,
        eventSummary.Officials.filter(person => person.ChurchId === churchSummary.Id),
        includeDetails,
        0);

    costTotal += appendPeopleSectionRowsAndCalculateTotal(
        rows,
        "Attendees",
        eventSummary.AttendeeFields,
        eventSummary.Attendees.filter(person => person.ChurchId === churchSummary.Id),
        includeDetails,
        0);

    appendValidationErrorRows(
        rows,
        `church-errors-${churchSummary.Id}`,
        "Church",
        churchSummary.ValidationErrors,
        includeDetails,
        0);

    return (
        <div className="overflow-x-auto">
            <table className="table table-zebra">
                <thead>
                    <tr>
                        <th className="p-0">Item</th>
                        <th className="text-right p-0 pr-4">Cost</th>
                    </tr>
                </thead>
                <tbody>
                    {eventSummary.HasPaymentBalance && (
                        <>
                            {getTitleRow("payments", "Payments & Fees")}
                            {entryRows}
                            {entries.length > 0 && getSubtotalRow("payments-subtotal", "Payments & Fees", -paymentsTotal, 1)}
                        </>
                    )}
                    {rows}
                </tbody>
                <tfoot>
                    <tr>
                        <td className="p-0 pl-4">TOTAL CHURCH REGISTRATION COST</td>
                        <td className="text-right p-0 pr-4">{DataTypeHelpers.formatDollars(Math.max(costTotal - paymentsTotal, 0))}</td>
                    </tr>
                </tfoot>
            </table>
        </div>);
}