import settings from 'data/generated/questionGenerator.json';
import { DuplicateQuestionMode, QuestionLanguage, QuestionPointValueRules, QuestionPositionRequirement, QuestionSelectionCriteria, QuestionTypeFilter } from 'types/services/QuestionGeneratorService';
import type { JbqQuestionGeneratorSettings } from 'types/QuestionGeneratorSettings';

interface Props {
    criteria: QuestionSelectionCriteria;
}

const GENERATOR_SETTINGS = settings as JbqQuestionGeneratorSettings;

const formatPointList = (pointValues: number[] | null) => {
    if (!pointValues) {
        return null;
    }

    const counts: Record<number, number> = {};

    for (const value of pointValues) {
        counts[value] = (counts[value] || 0) + 1;
    }

    return formatCountList(counts);
}

const formatCountList = (counts: Record<number, number> | null) => {

    if (!counts) {
        return null;
    }

    const labels: string[] = [];

    for (const pointValue of [10, 20, 30]) {
        if (counts[pointValue]) {
            labels.push(`${counts[pointValue]} x ${pointValue}-point`);
        }
    }

    if (labels.length > 0) {
        return labels.join(", ");
    }

    return null;
}

const formatPointValueRule = (rule: QuestionPointValueRules | null) => {
    if (!rule) {
        return null;
    }

    const parts: string[] = [];
    if (!rule.AllowConsecutive) {
        parts.push("No Consecutive");
    }

    if (rule.First === rule.Last) {
        switch (rule.Last) {
            case QuestionPositionRequirement.Required:
                parts.push("Required as First and Last Question");
                break;
            case QuestionPositionRequirement.NotAllowed:
                parts.push("Cannot be First or Last Question");
                break;
        }
    }
    else {
        switch (rule.First) {
            case QuestionPositionRequirement.Required:
                parts.push("Required as First Question");
                break;
            case QuestionPositionRequirement.NotAllowed:
                parts.push("Cannot be First Question");
                break;
        }

        switch (rule.Last) {
            case QuestionPositionRequirement.Required:
                parts.push("Required as Last Question");
                break;
            case QuestionPositionRequirement.NotAllowed:
                parts.push("Cannot be Last Question");
                break;
        }
    }

    if (rule.PerHalfCount) {
        parts.push(`At least ${rule.PerHalfCount} per half`);
    }

    if (parts.length === 0) {
        return "Allowed in any position";
    }

    return parts.join(", ");
}

export default function CriteriaSummary({ criteria }: Props) {

    const regularQuestionCounts = formatCountList(criteria.PointValueCounts);
    const regularQuestionOverride = formatPointList(criteria.RegularPointOverride);
    const substituteQuestionCounts = formatPointList(criteria.SubstituteQuestions);
    const overtimeQuestionCounts = formatCountList(criteria.OvertimeQuestions);

    return (
        <div className="fieldset bg-base-100 border-base-300 rounded-box border p-4">
            <div className="mt-0">
                <strong>Season: </strong> {criteria.Season} ({QuestionLanguage[criteria.Language]})
            </div>
            <div className="mt-0">
                <strong>Round(s): </strong> {criteria.Matches}
            </div>
            <div className="mt-0">
                <strong>Template: </strong> {criteria.Rules}
            </div>
            {criteria.QuestionTypes !== QuestionTypeFilter.All && (
                <div className="mt-0">
                    <strong>Filter: </strong>
                    {criteria.QuestionTypes === QuestionTypeFilter.QuotationOnly ? "Quotation Only" : "No Quotations"}
                </div>)}
            <div className="mt-0">
                <strong>Duplicates: </strong>
                {criteria.Duplicates === DuplicateQuestionMode.NoDuplicates
                    ? "Use all questions before repeating any questions."
                    : "Allow questions to repeat in different matches."}
            </div>
            {regularQuestionCounts && (
                <div className="mt-0">
                    <strong>Point Value Count(s): </strong>
                    {regularQuestionCounts}
                </div>)}
            {regularQuestionOverride && (
                <div className="mt-0">
                    <strong>Point Value Order: </strong>
                    {regularQuestionOverride}
                </div>)}
            {substituteQuestionCounts && (
                <div className="mt-0">
                    <strong>Substitute Questions (randomly selected): </strong>
                    {substituteQuestionCounts}
                </div>)}
            {overtimeQuestionCounts && (
                <div className="mt-0">
                    <strong>Overtime Question Count(s): </strong>
                    {overtimeQuestionCounts}
                </div>)}
            {criteria.PointValueRules && (
                <div className="mt-0">
                    <strong>Point Value Rules: </strong>
                    {[10, 20, 30].map(pointValue => {

                        const description = formatPointValueRule(criteria.PointValueRules![pointValue]);
                        if (!description) {
                            return null;
                        }

                        return (
                            <span key={`pv-separator-${pointValue}`}>
                                <br />
                                <span key={`pv-rules-${pointValue}`}>
                                    <span className="italic">{pointValue}-point: </span><span>{description}</span>
                                </span>
                            </span>
                        );
                    })}
                </div>)}
            {criteria.CategoryGroups && (
                <div className="mt-0">
                    <strong>Category Groups: </strong>
                    {criteria.CategoryGroups.map((group, index) => (
                        <span key={`category-group-${group}`}>
                            {index > 0 && ", "}
                            Group #{group}
                        </span>
                    ))}
                </div>)}
            {criteria.Categories && (
                <div className="mt-0">
                    <strong>Categories: </strong>
                    {criteria.Categories.length === GENERATOR_SETTINGS.OrderedCategoryKeys.length && (
                        <span>All Categories</span>)}
                    {criteria.Categories.length !== GENERATOR_SETTINGS.OrderedCategoryKeys.length &&
                        criteria.Categories.map((categoryKey, index) => (
                            <span key={`category-${categoryKey}`}>
                                {index > 0 && ", "}
                                {GENERATOR_SETTINGS.CategoryLabels[categoryKey] || categoryKey}
                            </span>
                        ))}
                </div>)}
            {criteria.QuestionRanges && (
                <div className="mt-0">
                    <strong>Question Ranges: </strong>
                    {criteria.QuestionRanges.map((range, index) => (
                        <span key={`question-range-${range.Start}-${range.End}`}>
                            {index > 0 && ", "}
                            {range.Start}-{range.End}
                        </span>
                    ))}
                </div>)}
        </div>);
}