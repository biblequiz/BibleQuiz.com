interface EventScopeBadgeProps {
    scope: 'district' | 'region' | 'nation';
    label?: string | null;
};

export default function EventListWrapper({ scope, label }: EventScopeBadgeProps) {

    switch (scope) {
        case 'nation':
            return <span className="badge badge-m badge-warning" style={{ marginRight: "4px" }}>{label ?? "NATIONAL"}</span>
        case 'region':
            return <span className="badge badge-m badge-info" style={{ marginRight: "4px" }}>{label ?? "REGION"}</span>
        case 'district':
            return <span className="badge badge-m badge-success" style={{ marginRight: "4px" }}>{label ?? "DISTRICT"}</span>;
        default:
            return null;
    }
}