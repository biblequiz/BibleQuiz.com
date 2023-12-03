function initializeLiveEvents() {

    const loadingPane = $("#loadingPane");
    const resultsPane = $("#resultsPane");
    const errorPane = $("#errorPane");

    $(document.body).css("overflow-x", "scroll")

    // Apply classes to hide certain elements of the page when printing.
    $("#pageHeader").addClass("hide-on-print");
    $("#pageHero").addClass("hide-on-print");
    $("#pageFooter").addClass("hide-on-print");

    const pageColumns = $("#pageContentColumns").children();
    if (2 == pageColumns.length) {

        pageColumns[0].classList.add("hide-on-print");

        for (let originalClassName of pageColumns[1].classList) {

            if (originalClassName.startsWith("is-")) {

                const newClassNameParts = originalClassName.split("-");
                if (newClassNameParts.length > 1) {

                    // Check to see if there's an extra column in the layout.
                    if (newClassNameParts[1] == "8") {
                        newClassNameParts[1] = "9";

                        pageColumns[1].classList.remove(originalClassName);
                        pageColumns[1].classList.add(newClassNameParts.join("-"));
                    }

                    newClassNameParts[1] = "12";

                    const newClassName = newClassNameParts.join("-");

                    window.addEventListener("beforeprint", () => {
                        pageColumns[1].classList.remove(originalClassName);
                        pageColumns[1].classList.add(newClassName);
                    });

                    window.addEventListener("afterprint", (e) => {
                        pageColumns[1].classList.remove(newClassName);
                        pageColumns[1].classList.add(originalClassName);
                    });
                }
            }
        }
    }

    // Parse the URL.
    let selectedTab;
    let isStatsReport = false;

    // Configure the tabs.
    const schedulesTab = $("#schedulesTab")
        .click(null, e => {
            if (isStatsReport) {
                changeSelectedTab("schedule");
            }
        });

    const statsTab = $("#statsTab")
        .click(
            null,
            e => {
                if (!isStatsReport) {
                    changeSelectedTab("stats");
                }
            });

    // Parse the URL.
    const eventId = parseUrl();
    if (!eventId) {
        return;
    }

    const originalHash = window.location.hash;
    window.location.hash = null;

    function parseUrl() {

        // Check whether the hash is using the legacy format where the event id is included in the URL.
        // If it is, the user needs to be redirected to the new format of the page.
        // TODO: Remove this check once all the users have been removed.
        const currentHash = window.location.hash;
        if (currentHash && currentHash.startsWith("#/")) {
            const urlParts = window.location.hash.split('/');
            if (urlParts.length == 2) {

                let newUrl = new URL(window.location.href);
                newUrl.search = `?eventId=${urlParts[1]}`;
                newUrl.hash = "";

                window.location.href = newUrl.href;
                return;
            }
        }

        // Parse the event ID from the URL.
        const url = new URLSearchParams(window.location.search);
        const parsedEventId = url.get("eventId");
        if (!parsedEventId) {

            errorPane.text("No event was specified in the URL.");

            errorPane.show();
            resultsPane.hide();
            loadingPane.hide();

            return null;
        }

        // Capture the selected tab from the URL.
        selectedTab = url.get("tab");
        if (selectedTab == "stats") {
            isStatsReport = true;

            statsTab.addClass("is-active");
        }
        else {
            selectedTab = "schedule";
            isStatsReport = false;

            schedulesTab.addClass("is-active");
        }

        return parsedEventId;
    }

    function changeSelectedTab(newTab) {

        let url = new URL(window.location.href);
        url.search = `?eventId=${eventId}&tab=${newTab}`;

        if (!isStatsReport) {
            url.hash = url.hash
                .replace("_teams", "")
                .replace("_quizzers", "");
        }

        window.location.href = url.href;
    }

    function makeDropdownsClickable() {

        const dropdownElements = $(".dropdown:not(.is-hoverable)");

        dropdownElements.click(
            null,
            event => {
                event.stopPropagation();
                event.currentTarget.classList.toggle("is-active");
            });

        $(document).click(
            null,
            event => {
                dropdownElements.removeClass("is-active");
            });
    }

    // Retrieve the score report that contains all the information about the event.
    fetch(`https://scores.biblequiz.com/api/Events/${eventId}/ScoringReport`)
        .then(response => response.json())
        .then(report => {

            // Update the title of the page.
            $(document).prop("title", report.EventName);
            $("#pageTitle").text(report.EventName);

            // Initialize the table of contents.
            const tableOfContentsMeets = $("<ul />")
                .addClass("menu-list");

            // Process each meet.
            let isFirstMeet = true;
            for (let meet of report.Report.Meets) {

                if (isFirstMeet) {
                    isFirstMeet = false;
                }
                else {
                    resultsPane.append($("<div />")
                        .addClass("meet-cell")
                        .css("page-break-after", "always"));
                }

                // Add the title to the results pane and start formatting the table of contents.
                const titleAnchorId = `${meet.DatabaseId}_${meet.MeetId}`;

                const printMenu = $("<div />")
                    .addClass("dropdown-content");

                const meetCell = $("<div />")
                    .addClass("meet-cell")
                    .append($("<div />")
                        .addClass(["columns", "is-mobile", "mt-2"])
                        .append($("<div />")
                            .addClass(["column", "is-four-fifths"])
                            .append($("<h2 />")
                                .addClass(["title", "is-3"])
                                .prop("id", titleAnchorId)
                                .text(meet.Name))
                            .append($("<p />")
                                .addClass(["subtitle", "is-7"])
                                .append($("<i />").text(`Last Updated: ${meet.LastUpdated}`))))
                        .append($("<div />")
                            .addClass(["column", "is-one-fifth", "has-text-right", "hide-on-print"])
                            .append($("<div />")
                                .addClass(["dropdown", "is-right"])
                                .append($("<div />")
                                    .addClass("dropdown-trigger")
                                    .append($("<button />")
                                        .addClass(["button", "is-primary"])
                                        .append($("<i />").addClass(["fas", "fa-print"])))
                                    .append($("<div />")
                                        .addClass("dropdown-menu")
                                        .append(printMenu))))));

                const tocEntry = $("<li />")
                    .addClass("schedule-link")
                    .append($("<a />")
                        .attr("href", `#${titleAnchorId}`)
                        .text(meet.Name));

                // Generate the actual report from the data.
                if (isStatsReport) {

                    // Create the Teams table.
                    const teamsAnchorId = `${titleAnchorId}_teams`;

                    meetCell.append($("<h3 />")
                        .prop("id", teamsAnchorId)
                        .text("Teams"));

                    meetCell.append($("<div />").text("Teams Table"));

                    // Create the Quizzers table.
                    const quizzersAnchorId = `${titleAnchorId}_quizzers`;

                    meetCell.append($("<h3 />")
                        .prop("id", quizzersAnchorId)
                        .text("Quizzers"));

                    meetCell.append($("<div />").text("Quizzers Table"));

                    // Update the table of contents.
                    tocEntry.append(
                        $("<ul />")
                            .append($("<li />")
                                .append($("<a />")
                                    .attr("href", `#${teamsAnchorId}`)
                                    .text("Teams")))
                            .append($("<li />")
                                .append($("<a />")
                                    .attr("href", `#${quizzersAnchorId}`)
                                    .text("Quizzers"))));
                }
                else {

                    printMenu
                        .append($("<a />")
                            .addClass("dropdown-item")
                            .text("Schedule and Scores")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");

                                window.print();

                                allMeetCells.removeClass("hide-on-print");
                            }))
                        .append($("<a />")
                            .addClass("dropdown-item")
                            .text("Schedule Only")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                resultsPane.addClass("blank-schedule");

                                window.print();

                                resultsPane.removeClass("blank-schedule");
                                allMeetCells.removeClass("hide-on-print");
                            }));

                    // Build the header for the table.
                    const tableHeaderRow = $("<tr />");

                    if (meet.RankedTeams) {
                        tableHeaderRow.append($("<th />")
                            .addClass(["hide-if-schedule", "has-text-right"])
                            .attr("width", "3%")
                            .text("#"));
                    }

                    tableHeaderRow
                        .append($("<th />")
                            .attr("width", "33%")
                            .text("Team (Church)"));

                    if (meet.RankedTeams) {
                        tableHeaderRow
                            .append($("<th />")
                                .addClass(["hide-if-schedule", "has-text-right"])
                                .attr("width", "30")
                                .text("W"))
                            .append($("<th />")
                                .addClass(["hide-if-schedule", "has-text-right"])
                                .attr("width", "30")
                                .text("L"))
                            .append($("<th />")
                                .addClass(["hide-if-schedule", "has-text-right"])
                                .attr("width", "55")
                                .text("Total"))
                            .append($("<th />")
                                .addClass(["hide-if-schedule", "has-text-right"])
                                .attr("width", "55")
                                .text("Avg"));
                    }

                    let hasMatchTimes = false;
                    for (let match of meet.Matches) {
                        tableHeaderRow.append($("<th />")
                            .addClass("has-text-centered")
                            .text(match.Id));

                        if (match.MatchTime) {
                            hasMatchTimes = true;
                        }
                    }

                    // Build the body.
                    const tableBody = $("<tbody />");
                    for (let i = 0; i < meet.Teams.length; i++) {

                        const team = meet.RankedTeams
                            ? meet.Teams[meet.RankedTeams[i]]
                            : meet.Teams[i];

                        const tableRow = $("<tr />");

                        if (meet.RankedTeams) {

                            let rank = team.Scores.Rank;
                            if (team.Scores.Rank.IsTie) {
                                rank += "*";
                            }

                            tableRow.append($("<td />")
                                .addClass(["hide-if-schedule", "has-text-right"])
                                .text(rank));
                        }

                        tableRow.append($("<td />").text(`${team.Name} (${team.ChurchName})`));

                        if (meet.RankedTeams) {
                            tableRow
                                .append($("<td />")
                                    .addClass(["hide-if-schedule", "has-text-right"])
                                    .text(team.Scores.Wins))
                                .append($("<td />")
                                    .addClass(["hide-if-schedule", "has-text-right"])
                                    .text(team.Scores.Losses))
                                .append($("<td />")
                                    .addClass(["hide-if-schedule", "has-text-right"])
                                    .text(team.Scores.TotalPoints))
                                .append($("<td />")
                                    .addClass(["hide-if-schedule", "has-text-right"])
                                    .text(team.Scores.AveragePoints));
                        }

                        for (let match of team.Matches) {

                            const matchCell = $("<td />")
                                .append($("<font />")
                                    .attr("color", "grey")
                                    .text(match ? match.Room : "--"));

                            if (match && meet.RankedTeams) {

                                let cellColor;
                                switch (match.Result) {
                                    case "W":
                                        cellColor = "blue";
                                        break;
                                    case "L":
                                        cellColor = "red";
                                        break;
                                    default:
                                        cellColor = "black";
                                        break;
                                }

                                if (match.CurrentQuestion || match.Score || 0 == match.Score) {
                                    matchCell.append(
                                        $("<font />")
                                            .addClass("hide-if-schedule")
                                            .attr("color", cellColor)
                                            .text(match.CurrentQuestion ? ` [#${match.CurrentQuestion}]` : ` ~ ${match.Score}`));
                                }
                            }

                            tableRow.append(matchCell);
                        }

                        tableBody.append(tableRow);
                    }

                    // Build the footer (if there are match times).
                    const table = $("<table />")
                        .addClass(["table", "is-striped", "is-fullwidth", "is-bordered", "is-narrow"])
                        .append($("<thead />").append(tableHeaderRow))
                        .append(tableBody);

                    if (hasMatchTimes) {
                        const tableFooterRow = $("<tr />");

                        if (meet.RankedTeams) {
                            tableFooterRow.append($("<th />")
                                .addClass("hide-if-schedule")
                                .append("&nbsp;"));
                        }

                        tableFooterRow.append($("<th />").text("Planned Start"));

                        if (meet.RankedTeams) {
                            tableFooterRow
                                .append($("<th />")
                                    .addClass("hide-if-schedule")
                                    .append("&nbsp;"))
                                .append($("<th />")
                                    .addClass("hide-if-schedule")
                                    .append("&nbsp;"))
                                .append($("<th />")
                                    .addClass("hide-if-schedule")
                                    .append("&nbsp;"))
                                .append($("<th />")
                                    .addClass("hide-if-schedule")
                                    .append("&nbsp;"));
                        }

                        for (let match of meet.Matches) {
                            tableFooterRow.append($("<th />")
                                .addClass("has-text-centered")
                                .text(match.MatchTime));
                        }

                        table.append($("<tfoot />").append(tableFooterRow))
                    }

                    // Create the schedule table.
                    meetCell.append(table);
                }

                resultsPane.append(meetCell);
                tableOfContentsMeets.append(tocEntry);
            }

            // Capture all the meet cells.
            const allMeetCells = $(".meet-cell");

            // Add the elements to the table of contents.
            $("#pageTOC")
                .append($("<p />")
                    .addClass("menu-label")
                    .text("Results"))
                .append(tableOfContentsMeets);

            // Reset the hash to its original value now that the form is completely loaded.
            window.location.hash = originalHash;

            makeDropdownsClickable();

            resultsPane.show();
            loadingPane.hide();
            errorPane.hide();
        })
        .catch((err) => {

            console.log('Failed to retrieve the scoring report.', err);

            // Reset the hash to its original value to avoid losing the URL.
            window.location.hash = originalHash;

            errorPane.show();
            resultsPane.hide();
            loadingPane.hide();
        });
}

window.addEventListener("load", e => {
    initializeLiveEvents();
});