interface EventScopeBadgeProps {
    scope: 'district' | 'region' | 'nation';
    label?: string | null;
};

export default function EventListWrapper({ scope, label }: EventScopeBadgeProps) {

    switch (scope) {
        case 'nation':
            const nationLabel: string = null != label
                ? `National Event`
                : "NATIONAL";
            return <span className="badge badge-m badge-warning" style={{ marginRight: "4px" }}>{nationLabel}</span>
        case 'region':
            const regionLabel: string = label
                ? `${label} Region`
                : "REGION";
            return <span className="badge badge-m badge-info" style={{ marginRight: "4px" }}>{regionLabel}</span>
        case 'district':
            const districtLabel: string = label
                ? `${label} District`
                : "DISTRICT";
            return <span className="badge badge-m badge-success" style={{ marginRight: "4px" }}>{districtLabel}</span>;
        default:
            return null;
    }
}