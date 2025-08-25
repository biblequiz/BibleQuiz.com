import { useNavigate, useParams } from "react-router-dom";
import { AuthManager } from "../../../types/AuthManager";
import { useEffect, useState } from "react";
import { QuestionGeneratorService, QuestionOutputFormat, QuestionSelectionCriteria } from "../../../types/services/QuestionGeneratorService";
import LoadingPlaceholder from "../../LoadingPlaceholder";
import FontAwesomeIcon from "../../FontAwesomeIcon";
import CriteriaSummary from "./CriteriaSummary";
import FormatSelector, { DEFAULT_COLUMN, DEFAULT_FONT, DEFAULT_SIZE } from "./FormatSelector";

interface Props {
}

export default function PrintPage({ }: Props) {

    const auth = AuthManager.useNanoStore();
    const navigate = useNavigate();
    const { setId } = useParams<{ setId: string }>();

    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [font, setFont] = useState<string>(DEFAULT_FONT);
    const [fontSize, setFontSize] = useState<number>(DEFAULT_SIZE);
    const [columns, setColumns] = useState<number>(DEFAULT_COLUMN);

    const [latestError, setLatestError] = useState<string | null>(null);
    const [previousSet, setPreviousSet] = useState<QuestionSelectionCriteria | null>(null);

    useEffect(() => {
        if (!setId) {
            return;
        }

        setPreviousSet(null);
        setLatestError(null);

        QuestionGeneratorService.getPreviousSetCriteria(auth, setId)
            .then(previousSet => {
                setPreviousSet(previousSet);
            })
            .catch(error => {
                setLatestError(error.message);
            });
    }, [setId]);

    if (!previousSet) {
        return (<LoadingPlaceholder text="Loading configuration for set ..." isItalic={true} />);
    }
    else if (latestError) {
        return (
            <div className={`alert alert-error flex flex-col`}>
                <p className="text-sm">
                    <FontAwesomeIcon icon="fas faCircleExclamation" classNames={["mr-2"]} />&nbsp;
                    <b>Failed to Retrieve Sets: </b>{latestError}
                </p>
            </div>);
    }

    const handleDownload = async (event: React.MouseEvent<HTMLButtonElement>, format: QuestionOutputFormat) => {
        event.preventDefault();

        setIsDownloading(true);

        await QuestionGeneratorService.downloadGeneratedFile(
            auth,
            setId!,
            format,
            font,
            fontSize,
            columns)
            .catch(error => setLatestError(error));

        setIsDownloading(false);
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-primary mb-4"
                disabled={isDownloading}
                onClick={() => navigate("/")}
            >
                <FontAwesomeIcon icon="fas faArrowLeft" classNames={["mr-2"]} />
                Back to Generator
            </button>
            <h3 className="mt-0">{previousSet.Title}</h3>
            <CriteriaSummary criteria={previousSet} />
            <h5>Format PDF</h5>
            <FormatSelector
                font={font}
                setFont={setFont}
                size={fontSize}
                setSize={setFontSize}
                columns={columns}
                setColumns={setColumns}
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    className="btn btn-primary mb-4 mt-0"
                    disabled={isDownloading}
                    onClick={e => handleDownload(e, QuestionOutputFormat.Pdf)}
                >
                    <FontAwesomeIcon icon="fas faFilePdf" classNames={["mr-2"]} />
                    Download PDF
                </button>
                <button
                    type="button"
                    className="btn btn-primary mb-4 mt-0"
                    disabled={isDownloading}
                    onClick={e => handleDownload(e, QuestionOutputFormat.ScoreKeep)}
                >
                    <FontAwesomeIcon icon="fas faFileDownload" classNames={["mr-2"]} />
                    Download ScoreKeep File
                </button>
            </div>
        </>);
}