export interface NavigationLink {
    label: string;
    href: string;
    description?: string;
}

export interface NavigationColumn {
    label: string;
    links: NavigationLink[];
}

export interface NavigationMenu {
    label: string;
    href: string;
    columns: NavigationColumn[];
}

export const programLinks: NavigationLink[] = [
    {
        label: "Junior Bible Quiz",
        href: "/jbq/",
        description: "Bible Quiz for children in grades 1-6.",
    },
    {
        label: "Teen Bible Quiz",
        href: "/tbq/",
        description: "Bible Quiz for middle and high school students.",
    },
];

export const audienceLinks: NavigationLink[] = [
    { label: "Quizzers", href: "/for-you/quizzers/" },
    { label: "Parents", href: "/for-you/parents/" },
    { label: "Coaches", href: "/for-you/coaches/" },
    {
        label: "Event Coordinators",
        href: "/for-you/event-coordinators/",
    },
];

export const publicNavigationMenus: NavigationMenu[] = [
    {
        label: "Programs",
        href: "/programs/",
        columns: [
            {
                label: "Choose a Program",
                links: programLinks,
            },
        ],
    },
    {
        label: "For You",
        href: "/for-you/",
        columns: [
            {
                label: "Choose Your Role",
                links: audienceLinks,
            },
        ],
    },
];

export const footerLinks: NavigationColumn[] = [
    {
        label: "Explore",
        links: [
            { label: "Events & Scores", href: "/" },
            { label: "Programs", href: "/programs/" },
            { label: "For You", href: "/for-you/" },
            { label: "Resources", href: "/resources/" },
        ],
    },
    {
        label: "Tools",
        links: [
            { label: "Apps", href: "/apps/" },
            { label: "Quizzer Search", href: "/quizzer-search/" },
            { label: "Downloads", href: "/resources/downloads/" },
            { label: "Subscribe", href: "/subscribe/" },
        ],
    },
    {
        label: "About",
        links: [
            { label: "News", href: "/news/" },
            { label: "Terms", href: "/terms/" },
            { label: "Privacy", href: "/privacy/" },
        ],
    },
];
