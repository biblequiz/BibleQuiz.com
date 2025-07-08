import { icon, type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

// Eagerly import all icon libraries
import * as BrandIcons from "@fortawesome/free-brands-svg-icons";
import * as RegularIcons from "@fortawesome/free-regular-svg-icons";
import * as SolidIcons from "@fortawesome/free-solid-svg-icons";

interface Props {
    icon: string;
    classNames?: string[] | null;
    ariaLabel?: string | null;
}

export default function FontAwesomeIcon(inputProps: Props) {

    const iconName: string = inputProps.icon;
    if (!iconName) {
        throw new Error("icon property not set.");
    }

    const iconSegments: string[] = iconName.split(" ");
    if (iconSegments.length !== 2) {
        throw new Error(
            `Invalid icon format: ${iconName}. Expected format is "prefix iconName".`,
        );
    }

    let resolvedIcon: IconDefinition | null = null;
    switch (iconSegments[0]) {
        case "fab":
        case "fa-brands":
            resolvedIcon = BrandIcons[
                iconSegments[1] as keyof typeof BrandIcons
            ] as IconDefinition;
            break;
        case "far":
        case "fa-regular":
            resolvedIcon = RegularIcons[
                iconSegments[1] as keyof typeof RegularIcons
            ] as IconDefinition;
            break;
        case "fas":
        case "fa-solid":
            resolvedIcon = SolidIcons[
                iconSegments[1] as keyof typeof SolidIcons
            ] as IconDefinition;
            break;
        default:
            throw new Error(
                `Invalid icon prefix: ${iconSegments[0]}. Expected "fab", "far", or "fas".`,
            );
    }

    if (!resolvedIcon) {
        throw new Error(
            `Icon not found: ${iconSegments[1]}. If you copied the name from FontAwesome.com, make sure to remove all the dashes and make the character after the dash upper case (e.g., "fa-battle-net" becomes "faBattleNet").`,
        );
    }

    const html = icon(resolvedIcon, { classes: inputProps.classNames || [] }).html;

    return (
        <span
            dangerouslySetInnerHTML={{ __html: html[0] }}
        />
    );
}