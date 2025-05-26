export default function EventListWrapper(props: {scope: 'district' | 'region' | 'nation'}) {

    switch (props.scope) {
        case 'nation':
            return <span className="sl-badge caution medium astro-avdet4wd" style={{marginRight: "4px"}}>NATIONAL</span>;
        case 'region':
            return <span className="sl-badge note medium astro-avdet4wd" style={{marginRight: "4px"}}>REGIONAL</span>;
        case 'district':
            return <span className="sl-badge success medium astro-avdet4wd" style={{marginRight: "4px"}}>DISTRICT</span>;
        default:
            return null;
    }
}