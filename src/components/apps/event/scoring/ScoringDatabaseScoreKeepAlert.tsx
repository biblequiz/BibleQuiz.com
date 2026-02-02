import FontAwesomeIcon from "components/FontAwesomeIcon";

interface Props {
    isScoreKeep?: boolean;
}

export default function ScoringDatabaseScoreKeepAlert({ isScoreKeep }: Props) {
    if (!isScoreKeep) {
        return null;
    }
    return (
        <div role="alert" className="alert alert-warning mt-4 w-full">
            <FontAwesomeIcon icon="fas faTriangleExclamation" />
            <div>
                Since this database is uploaded by ScoreKeep, you can only make limited changes to its settings
                here. Make your changes in ScoreKeep and re-upload the database to apply them.
            </div>
        </div>);
}