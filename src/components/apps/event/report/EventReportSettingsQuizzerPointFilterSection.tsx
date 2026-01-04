import type { EventReportQuizzerPointFilterInfo } from "./EventReportSettingsSection";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import EventReportPointValueFilterSelector from "./EventReportPointValueFilterSelector";

interface Props {
    info: EventReportQuizzerPointFilterInfo;
    setInfo: (info: EventReportQuizzerPointFilterInfo) => void;
    isDisabled: boolean;
}

export default function EventReportSettingsQuizzerPointFilterSection({
    info,
    setInfo,
    isDisabled }: Props) {

    return (
        <div className="mt-0 ml-2">

            <div className="divider mt-0 mb-0" />

            <h5 className="mt-2 mb-0">
                <FontAwesomeIcon icon="fas faFilter" />&nbsp;Point Value Filter
            </h5>
            <p className="mt-0 mb-2">
                You can choose to include only a specific point values (e.g., only include 10-point column) or filter to a specific number answered correctly. For example,
                you may want to have a special type of award for quizzers who answered at least 15 10-point questions; in this example, you would enter <i>15</i> into the <i>Min Correct</i>
                for <i>10-point questions</i>. For the average score, decimals are allowed and question specific filters will be excluded.
            </p>
            <p className="mt-0 mb-4">
                If <i>any</i> of the filters match, the score will be included.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <EventReportPointValueFilterSelector
                    label="Filter on Average"
                    filter={info.averagePoints}
                    setFilter={newFilter => setInfo({
                        ...info,
                        averagePoints: newFilter
                    })}
                    isAllowed={true}
                    isDisabled={isDisabled} />
                <EventReportPointValueFilterSelector
                    label="Include 10-Point Questions"
                    filter={info.p10}
                    setFilter={newFilter => setInfo({
                        ...info,
                        p10: newFilter
                    })}
                    isAllowed={info.averagePoints === null}
                    isDisabled={isDisabled} />
                <EventReportPointValueFilterSelector
                    label="Include 20-Point Questions"
                    filter={info.p20}
                    setFilter={newFilter => setInfo({
                        ...info,
                        p20: newFilter
                    })}
                    isAllowed={info.averagePoints === null}
                    isDisabled={isDisabled} />
                <EventReportPointValueFilterSelector
                    label="Include 30-Point Questions"
                    filter={info.p30}
                    setFilter={newFilter => setInfo({
                        ...info,
                        p30: newFilter
                    })}
                    isAllowed={info.averagePoints === null}
                    isDisabled={isDisabled} />
            </div>
        </div>);
}