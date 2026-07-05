/**
 * Format competition type ID to human-readable text
 */
export function formatCompetitionType(competitionTypeId: string | null | undefined): string {
    if (!competitionTypeId) return 'All';
    if (competitionTypeId === 'agjbq') return 'JBQ Only';
    if (competitionTypeId === 'agtbq') return 'TBQ Only';
    return competitionTypeId;
}
