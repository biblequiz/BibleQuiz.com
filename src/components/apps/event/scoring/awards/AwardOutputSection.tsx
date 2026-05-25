import { useState, useCallback } from "react";
import FontAwesomeIcon from "components/FontAwesomeIcon";
import type { AuthManager } from "types/AuthManager";
import {
    AwardType,
    type DatabaseAwardsOutput,
    type DatabaseAwardsTemplate
} from "types/services/DatabasesService";
import AwardTemplatesDialog from "./AwardTemplatesDialog";

interface Props {
    auth: AuthManager;
    eventId: string;
    databaseId: string;
    type: AwardType;
    typeName: string;
    icon: string;
    output: DatabaseAwardsOutput;
    datesLabel: string;
    hasAnyCheckedMeets: boolean;
    isIndividual: boolean;
    disabled: boolean;
    onOutputChange: (output: DatabaseAwardsOutput) => void;
    onGenerateReport: (link: string) => void;
}

type RankingOption = "default" | "10s" | "20s" | "30s" | "report";
type IncludeOption = "all" | "top";

export default function AwardOutputSection({
    auth,
    eventId,
    databaseId,
    type,
    typeName,
    icon,
    output,
    datesLabel,
    hasAnyCheckedMeets,
    isIndividual,
    disabled,
    onOutputChange,
    onGenerateReport
}: Props) {
    // State
    const [rankingOption, setRankingOption] = useState<RankingOption>("default");
    const [selectedReportId, setSelectedReportId] = useState<string>(output.Reports[0]?.Id || "");
    const [includeOption, setIncludeOption] = useState<IncludeOption>("all");
    const [topN, setTopN] = useState<number>(10);
    const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);

    // Handle template selection
    const handleTemplateChange = (templateId: string) => {
        onOutputChange({
            ...output,
            TemplateId: templateId
        });
    };

    // Handle templates dialog close
    const handleTemplatesDialogClose = useCallback((updatedOutput: DatabaseAwardsOutput) => {
        setShowTemplatesDialog(false);
        onOutputChange(updatedOutput);
    }, [onOutputChange]);

    // Build report link with parameters
    const buildReportLink = useCallback((baseLink: string): string => {
        let link = baseLink;

        // Add dates parameter
        link += `?d=${encodeURIComponent(datesLabel)}`;

        // Add ranking parameter
        if (rankingOption !== "default") {
            if (rankingOption === "report" && selectedReportId) {
                link += `&rid=${selectedReportId}`;
            } else if (rankingOption === "10s") {
                link += `&pv=10`;
            } else if (rankingOption === "20s") {
                link += `&pv=20`;
            } else if (rankingOption === "30s") {
                link += `&pv=30`;
            }
        }

        // Add top N parameter
        if (includeOption === "top" && topN > 0) {
            link += `&t=${topN}`;
        }

        return link;
    }, [datesLabel, rankingOption, selectedReportId, includeOption, topN]);

    // Handle generate report
    const handleGenerateReport = (format: "word" | "pdf" | "excel") => {
        if (!hasAnyCheckedMeets) {
            return;
        }

        if (!datesLabel.trim()) {
            return;
        }

        let baseLink: string;
        switch (format) {
            case "word":
                baseLink = output.WordReportLink;
                break;
            case "pdf":
                baseLink = output.PdfReportLink;
                break;
            case "excel":
                baseLink = output.ExcelReportLink;
                break;
        }

        const link = buildReportLink(baseLink);
        onGenerateReport(link);
    };

    // Render template name with owner
    const getTemplateDisplayName = (template: DatabaseAwardsTemplate): string => {
        if (!template.IsDefault && template.OwnerName) {
            return `${template.Name} (${template.OwnerName})`;
        }
        return template.Name;
    };

    return (
        <div className="card border-2 border-primary/40 mt-0">
            <div className="card-body">
                <h3 className="card-title text-lg">
                    <FontAwesomeIcon icon={icon} />
                    {typeName}
                </h3>

                {/* Template Selection */}
                <div className="form-control mb-0 mt-0">
                    <label className="label">
                        <span className="label-text font-semibold">Template</span>
                    </label>
                    <div className="space-y-1">
                        {output.AllTemplates.map(template => (
                            <label key={template.Id} className="flex items-center gap-2 cursor-pointer mt-0 mb-4">
                                <input
                                    type="radio"
                                    name={`template_${AwardType[type]}`}
                                    className="radio radio-sm radio-primary"
                                    checked={output.TemplateId === template.Id}
                                    onChange={() => handleTemplateChange(template.Id)}
                                    disabled={disabled}
                                />
                                <span className="text-sm">{getTemplateDisplayName(template)}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Ranking Options */}
                <div className="form-control mb-0 mt-0">
                    <label className="label">
                        <span className="label-text font-semibold">Ranking</span>
                    </label>
                    <div className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer mt-0 mb-2">
                            <input
                                type="radio"
                                name={`ranking_${AwardType[type]}`}
                                className="radio radio-sm radio-primary"
                                checked={rankingOption === "default"}
                                onChange={() => setRankingOption("default")}
                                disabled={disabled}
                            />
                            <span className="text-sm">
                                By {isIndividual ? "Individual" : "Team"} Rank
                            </span>
                        </label>

                        {/* Individual-specific ranking options */}
                        {isIndividual && (
                            <>
                                <label className="flex items-center gap-2 cursor-pointer mt-0 mb-2">
                                    <input
                                        type="radio"
                                        name={`ranking_${AwardType[type]}`}
                                        className="radio radio-sm radio-primary"
                                        checked={rankingOption === "10s"}
                                        onChange={() => setRankingOption("10s")}
                                        disabled={disabled}
                                    />
                                    <span className="text-sm">By 10s</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer mt-0 mb-2">
                                    <input
                                        type="radio"
                                        name={`ranking_${AwardType[type]}`}
                                        className="radio radio-sm radio-primary"
                                        checked={rankingOption === "20s"}
                                        onChange={() => setRankingOption("20s")}
                                        disabled={disabled}
                                    />
                                    <span className="text-sm">By 20s</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer mt-0 mb-2">
                                    <input
                                        type="radio"
                                        name={`ranking_${AwardType[type]}`}
                                        className="radio radio-sm radio-primary"
                                        checked={rankingOption === "30s"}
                                        onChange={() => setRankingOption("30s")}
                                        disabled={disabled}
                                    />
                                    <span className="text-sm">By 30s</span>
                                </label>
                            </>
                        )}

                        {/* By Report option (only if reports exist) */}
                        {output.Reports.length > 0 && (
                            <div className="space-y-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`ranking_${AwardType[type]}`}
                                        className="radio radio-sm radio-primary"
                                        checked={rankingOption === "report"}
                                        onChange={() => setRankingOption("report")}
                                        disabled={disabled}
                                    />
                                    <span className="text-sm">By Report</span>
                                </label>
                                {rankingOption === "report" && (
                                    <select
                                        className="select select-bordered select-sm w-full ml-6"
                                        value={selectedReportId}
                                        onChange={e => setSelectedReportId(e.target.value)}
                                        disabled={disabled}
                                    >
                                        {output.Reports.map(report => (
                                            <option key={report.Id} value={report.Id}>
                                                {report.Name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Include Options */}
                <div className="form-control mb-0 mt-0">
                    <label className="label">
                        <span className="label-text font-semibold">Include</span>
                    </label>
                    <div className="space-y-1 mb-0 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer mt-0 mb-2">
                            <input
                                type="radio"
                                name={`include_${AwardType[type]}`}
                                className="radio radio-sm radio-primary"
                                checked={includeOption === "all"}
                                onChange={() => setIncludeOption("all")}
                                disabled={disabled}
                            />
                            <span className="text-sm">
                                Include All {isIndividual ? "Individuals" : "Teams"}
                            </span>
                        </label>
                        <div className="flex items-center gap-2 mt-0 mb-0">
                            <label className="flex items-center gap-2 cursor-pointer mt-0 mb-0">
                                <input
                                    type="radio"
                                    name={`include_${AwardType[type]}`}
                                    className="radio radio-sm radio-primary"
                                    checked={includeOption === "top"}
                                    onChange={() => setIncludeOption("top")}
                                    disabled={disabled}
                                />
                                <span className="text-sm">Include Only Top:</span>
                            </label>
                            <input
                                type="number"
                                className="input input-bordered input-sm w-16 mt-0 mb-0"
                                min={1}
                                max={99}
                                value={topN}
                                onChange={e => setTopN(parseInt(e.target.value) || 10)}
                                disabled={disabled || includeOption !== "top"}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm mt-0 mb-0"
                        onClick={() => handleGenerateReport("word")}
                        disabled={disabled || !hasAnyCheckedMeets || !datesLabel.trim()}
                        title="Generate Word File"
                    >
                        <FontAwesomeIcon icon="fas faFileWord" />
                        Word
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm mt-0 mb-0"
                        onClick={() => handleGenerateReport("pdf")}
                        disabled={disabled || !hasAnyCheckedMeets || !datesLabel.trim()}
                        title="Generate PDF File"
                    >
                        <FontAwesomeIcon icon="fas faFilePdf" />
                        PDF
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary btn-sm mt-0 mb-0"
                        onClick={() => handleGenerateReport("excel")}
                        disabled={disabled || !hasAnyCheckedMeets || !datesLabel.trim()}
                        title="Generate Excel File"
                    >
                        <FontAwesomeIcon icon="fas faFileExcel" />
                        Excel
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm mt-0 mb-0"
                        onClick={() => setShowTemplatesDialog(true)}
                        disabled={disabled}
                        title="Manage Templates"
                    >
                        <FontAwesomeIcon icon="fas faFileUpload" />
                        Templates
                    </button>
                </div>

                {/* Validation warnings */}
                {!hasAnyCheckedMeets && (
                    <div className="alert alert-warning mt-4">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span className="text-sm">No divisions selected. Please select at least one division.</span>
                    </div>
                )}
                {hasAnyCheckedMeets && !datesLabel.trim() && (
                    <div className="alert alert-warning mt-4">
                        <FontAwesomeIcon icon="fas faTriangleExclamation" />
                        <span className="text-sm">Dates label is required to generate awards.</span>
                    </div>
                )}
            </div>

            {/* Templates Dialog */}
            {showTemplatesDialog && (
                <AwardTemplatesDialog
                    auth={auth}
                    eventId={eventId}
                    databaseId={databaseId}
                    type={type}
                    typeName={typeName}
                    output={output}
                    onClose={handleTemplatesDialogClose}
                />
            )}
        </div>
    );
}