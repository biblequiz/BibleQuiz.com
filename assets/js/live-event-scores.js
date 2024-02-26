import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js'

function initializeLiveEvents() {

    const loadingPane = $("#loadingPane");
    const resultsPane = $("#resultsPane");
    const errorPane = $("#errorPane");

    $(document.body).css("overflow-x", "scroll");

    // Configure search.
    let searchIndex = null;
    let searchIndexSource = null;
    const searchRow = resultsPane.find("#searchRow");
    const searchDropdown = resultsPane.find("#searchDropdown");
    const searchBox = resultsPane
        .find("#searchBox")
        .change(null, e => {
            searchTeamsAndQuizzers(searchBox.val());
        })
        .focus(null, e => {
            e.stopPropagation();
            searchTeamsAndQuizzers(searchBox.val());
        })
        .click(null, e => {
            e.stopPropagation();
            searchTeamsAndQuizzers(searchBox.val());
        });

    const searchQuizzerElements = {
        container: getByAndRemoveId(searchDropdown, "quizzerResults")
    };

    searchQuizzerElements.noResultsTemplate = getByAndRemoveId(searchQuizzerElements.container, "noResultsTemplate")
        .remove()
        .get(0);
    searchQuizzerElements.resultTemplate = getByAndRemoveId(searchQuizzerElements.container, "resultTemplate")
        .remove()
        .get(0);

    const searchTeamElements = {
        container: getByAndRemoveId(searchDropdown, "teamResults")
    };

    searchTeamElements.noResultsTemplate = getByAndRemoveId(searchTeamElements.container, "noResultsTemplate")
        .remove()
        .get(0);
    searchTeamElements.resultTemplate = getByAndRemoveId(searchTeamElements.container, "resultTemplate")
        .remove()
        .get(0);

    resultsPane
        .find("#searchButton")
        .click(null, e => searchTeamsAndQuizzers(searchBox.val()));

    const searchHighlightedElements = [];

    // Capture the templates.
    const statsTemplate = document.getElementById("statsTemplate");
    const scheduleTemplate = document.getElementById("schedulesTemplate");
    statsTemplate.remove();
    scheduleTemplate.remove();

    // Setup the modal dialog.
    const teamModalContainer = $("#teamModal");
    const teamModalTitle = $("#teamModalTitle");
    const teamModalBody = $("#teamModalBody");

    $("#teamModalClose").click(
        null,
        e => teamModalContainer.removeClass("is-active"));

    $(document).keydown(null, e => {
        if (e.code === 'Escape') {
            teamModalContainer.removeClass("is-active");
        }
    });

    $(".modal-background").click(
        null,
        e => teamModalContainer.removeClass("is-active"));

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
    const ScheduleViewType = {
        Team: "Team",
        Room: "Room",
        Grid: "Grid"
    };

    let isStatsReport = false;
    let currentScheduleView = ScheduleViewType.Team;

    // Configure the tabs.
    const schedulesTab = $("#schedulesTab")
        .click(null, e => {
            if (isStatsReport) {
                changeSelectedTab("schedule", ScheduleViewType.Team);
            }
        });

    const schedulesViewTab_Team = $("#scheduleViewTab_Team")
        .click(null, e => {
            if (ScheduleViewType.Team !== currentScheduleView) {
                changeSelectedTab("schedule", ScheduleViewType.Team);
            }
        });

    const schedulesViewTab_Room = $("#scheduleViewTab_Room")
        .click(null, e => {
            if (ScheduleViewType.Room !== currentScheduleView) {
                changeSelectedTab("schedule", ScheduleViewType.Room);
            }
        });

    const schedulesViewTab_Grid = $("#scheduleViewTab_Grid")
        .click(null, e => {
            if (ScheduleViewType.Grid !== currentScheduleView) {
                changeSelectedTab("schedule", ScheduleViewType.Grid);
            }
        });

    const statsTab = $("#statsTab")
        .click(
            null,
            e => {
                if (!isStatsReport) {
                    changeSelectedTab("stats", null);
                }
            });

    // Parse the URL.
    const eventId = parseUrl();
    if (!eventId) {
        return;
    }

    const originalHash = window.location.hash;
    window.location.hash = "";

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
        if (url.get("tab") == "stats") {
            isStatsReport = true;

            statsTab.addClass("is-active");
        }
        else {
            isStatsReport = false;

            switch (url.get("view")) {
                case ScheduleViewType.Room:
                    schedulesViewTab_Room.addClass("is-active");
                    currentScheduleView = ScheduleViewType.Room;
                    searchRow.hide();
                    break;

                case ScheduleViewType.Grid:
                    schedulesViewTab_Grid.addClass("is-active");
                    currentScheduleView = ScheduleViewType.Grid;
                    searchRow.show();
                    break;

                default:
                    schedulesViewTab_Team.addClass("is-active");
                    currentScheduleView = ScheduleViewType.Team;
                    searchRow.show();
                    break;
            }

            schedulesTab.addClass("is-active");
        }

        return parsedEventId;
    }

    function changeSelectedTab(newTab, tabView) {

        let url = new URL(window.location.href);
        url.search = `?eventId=${eventId}&tab=${newTab}`;
        if (tabView != null) {
            url.search += `&view=${tabView}`;
        }

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

    function openMatchScoresheet(label, databaseId, meetId, matchId, roomId) {

        teamModalTitle
            .empty()
            .append($("<button />")
                .addClass(["button", "is-primary", "hide-on-print"])
                .append($("<i />").addClass(["fas", "fa-sync-alt"]))
                .click(null, e => {
                    openMatchScoresheet(label, databaseId, meetId, matchId, roomId);
                }))
            .append("&nbsp;")
            .append(label);

        teamModalBody
            .empty()
            .append($("<p />")
                .append($("<b />").text("Retrieving the Match's Scores ...")))
            .append($("<progress />")
                .addClass(["progress", "is-medium", "is-primary"])
                .attr("max", 100)
                .text("30%"));

        teamModalContainer.addClass("is-active");

        // Load the in-room scores.
        fetch(`https://scores.biblequiz.com/Events/${eventId}/Reports/${databaseId}/Scores/${meetId}/${matchId}/${roomId}?m=true`)
            .then(response => response.text())
            .then(html => {
                teamModalBody.html(html);
            })
            .catch((err) => {

                console.log('Failed to retrieve the scoring report.', err);

                teamModalBody
                    .empty()
                    .append($("<div />")
                        .addClass(["notification", "is-error"])
                        .text("Failed to retrieve the in-room scores"));
            });
    }

    function ordinalWithSuffix(number) {
        const tens = number % 10;
        const hundreds = number % 100;

        if (tens == 1 && hundreds != 11) {
            return number + "st";
        }
        else if (tens == 2 && hundreds != 12) {
            return number + "nd";
        }
        else if (tens == 3 && hundreds != 13) {
            return number + "rd";
        }

        return number + "th";
    }

    function cloneTemplate(template, newTagName = null) {
        const newNode = $(`<${newTagName ?? template.tagName} />`);

        // Clone the node.
        const clone = template.tagName == "TEMPLATE"
            ? template.content.cloneNode(true)
            : template.cloneNode(true);

        // Copy the attributes.
        const clonedElement = newNode.get(0);
        const attributes = template.attributes;
        for (let i = 0; i < attributes.length; i++) {
            const attribute = attributes[i];
            if (attribute.name == "id") {
                continue;
            }

            clonedElement.setAttribute(attribute.name, attribute.value);
        }

        // Clone the children.
        const clonedChildren = clone.childNodes;
        while (clonedChildren.length > 0) {

            // When a child is appended, it is removed from clonedChildren.
            newNode.append(clonedChildren[0]);
        }

        return newNode;
    }

    function getByAndRemoveId(templateContainer, id) {
        const element = templateContainer
            .find(`#${id}`)
            .removeProp("id");
        if (null == element || 0 == element.length) {
            throw `Unable to locate ${id} under ${templateContainer}`;
        }

        return element;
    }

    function searchTeamsAndQuizzers(text) {

        // If there is no text, remove the drop down.
        if (null == text || 0 == text.length) {
            searchDropdown.removeClass("is-active");
            return;
        }

        // Ensure the search index is initialized.
        if (null == searchIndex) {
            searchIndex = {
                quizzers: new Fuse(
                    searchIndexSource.quizzers,
                    {
                        shouldSort: false,
                        includeScore: true,
                        ignoreLocation: true,
                        keys: ["name"],
                        threshold: 0.4
                    }),
                teams: new Fuse(
                    searchIndexSource.teams,
                    {
                        shouldSort: false,
                        includeScore: true,
                        ignoreLocation: true,
                        keys: ["name", "church"],
                        threshold: 0.4
                    }),
            };
        }

        // Search both the search indexes.
        const quizzerResults = searchIndex.quizzers.search(text);
        const teamResults = searchIndex.teams.search(text);

        function sortSearchResults(a, b) {
            if (a.score < b.score) {
                return -1;
            }
            else if (a.score > b.score) {
                return 1;
            }
            else {
                return 0;
            }
        }

        function selectSearchElement(event) {
            event.stopPropagation();
            searchDropdown.removeClass("is-active");

            const elements = event.data;
            elements.scroll.get(0).scrollIntoView(true);

            for (let element of searchHighlightedElements) {
                element.removeClass("search-highlight");
            }

            searchHighlightedElements.splice(0);

            for (let element of elements.highlight) {
                searchHighlightedElements.push(element);
                element.addClass("search-highlight");
            }
        }

        quizzerResults.sort(sortSearchResults);
        teamResults.sort(sortSearchResults);

        // Empty the exisiting elements.
        searchQuizzerElements.container.empty();
        searchTeamElements.container.empty();

        // Append the quizzers.
        let quizzerCount = Math.min(quizzerResults.length, 8);
        if (quizzerCount > 0) {

            for (let i = 0; i < quizzerCount; i++) {

                const quizzer = quizzerResults[i].item;

                const linkItem = cloneTemplate(searchQuizzerElements.resultTemplate)
                    .click({ scroll: quizzer.scrollToElement, highlight: quizzer.highlightElements }, selectSearchElement);

                getByAndRemoveId(linkItem, "name").text(quizzer.name);
                getByAndRemoveId(linkItem, "meet").text(quizzer.meet);
                getByAndRemoveId(linkItem, "team").text(quizzer.team);
                getByAndRemoveId(linkItem, "church").text(quizzer.church);

                searchQuizzerElements.container.append(linkItem);
            }
        }
        else {
            searchQuizzerElements.container.append(cloneTemplate(searchQuizzerElements.noResultsTemplate));
        }

        // Append the teams.
        let teamCount = Math.min(teamResults.length, 8);
        if (teamCount > 0) {

            for (let i = 0; i < teamCount; i++) {

                const team = teamResults[i].item;

                const linkItem = cloneTemplate(searchTeamElements.resultTemplate)
                    .click({ scroll: team.scrollToElement, highlight: team.highlightElements }, selectSearchElement);

                getByAndRemoveId(linkItem, "name").text(team.name);
                getByAndRemoveId(linkItem, "meet").text(team.meet);
                getByAndRemoveId(linkItem, "church").text(team.church);

                searchTeamElements.container.append(linkItem);
            }
        }
        else {
            searchTeamElements.container.append(cloneTemplate(searchTeamElements.noResultsTemplate));
        }

        searchDropdown.addClass("is-active");
    }

    function formatElementTextSizes(elements, isSingleTeam) {

        for (let i = 0; i < elements.length; i++) {

            const addClasses = [];
            const removeClasses = [];

            let originalSizeClassName = null;
            let updatedSizeClassName = null;

            for (const className of elements.get(i).classList) {
                if (!isSingleTeam) {
                    if (className.endsWith("-if-not-single-team")) {
                        removeClasses.push(className);
                        addClasses.push(className.substr(0, className.length - "-if-not-single-team".length));
                    }
                    else if (className.endsWith("-if-single-team")) {
                        removeClasses.push(className.substr(0, className.length - "-if-single-team".length));
                    }
                }
                else {

                    if (className.endsWith("-if-single-team")) {
                        updatedSizeClassName = className.substr(0, className.length - "-if-single-team".length);
                    }
                    else if (className.startsWith("is-size-")) {
                        const size = className.substr("is-size-".length, 1);
                        if (!isNaN(size)) {
                            originalSizeClassName = className;
                        }
                    }
                    else if (className.startsWith("is-")) {
                        const size = className.substr("is-".length, 1);
                        if (!isNaN(size)) {
                            originalSizeClassName = className;
                        }
                    }
                }
            }

            if (originalSizeClassName != null && updatedSizeClassName != null) {
                removeClasses.push(originalSizeClassName);
                addClasses.push(updatedSizeClassName);
                addClasses.push(originalSizeClassName + "-if-not-single-team");
            }

            if (addClasses.length > 0 || removeClasses.length > 0) {
                $(elements.get(i))
                    .addClass(addClasses)
                    .removeClass(removeClasses);
            }
        }
    }

    // Retrieve the score report that contains all the information about the event.
    fetch(`https://scores.biblequiz.com/api/Events/${eventId}/ScoringReport`)
        .then(response => response.json())
        .then(report => {

            if (report.Message) {
                errorPane.text(report.Message);
                errorPane.show();
                loadingPane.hide();
                return;
            }

            // Reset the search.
            searchIndexSource = { quizzers: [], teams: [] };
            searchIndex = null;

            // Update the title of the page.
            $(document).prop("title", report.EventName);
            $("#pageTitle").text(report.EventName);

            // Initialize the table of contents.
            const tableOfContentsMeets = $("<ul />")
                .addClass("menu-list");

            // Process each meet.
            const template = isStatsReport ? statsTemplate : scheduleTemplate;

            if (isStatsReport) {

                // The schedule view tabs don't make sense for the Stats report.
                $("#scheduleViewTabs").remove();
            }

            let isFirstMeet = true;
            for (let meet of report.Report.Meets) {

                // Clone the template so it is available.
                const meetCell = cloneTemplate(template, "div")
                    .addClass("meet-cell");

                if (isFirstMeet) {
                    isFirstMeet = false;
                }
                else {
                    meetCell.css("page-break-before", "always");

                    if (!isStatsReport) {
                        meetCell
                            .prepend($("<hr />").addClass("hide-on-print"));
                    }
                }

                // Add the title to the results pane and start formatting the table of contents.
                const titleAnchorId = `${meet.DatabaseId}_${meet.MeetId}`;

                const tocEntry = $("<li />")
                    .addClass("schedule-link")
                    .append($("<a />")
                        .attr("href", `#${titleAnchorId}`)
                        .text(meet.Name));

                getByAndRemoveId(meetCell, "meetName")
                    .prop("id", titleAnchorId)
                    .text(meet.Name);
                getByAndRemoveId(meetCell, "lastUpdated")
                    .text(meet.LastUpdated);

                // Generate the actual report from the data.
                if (isStatsReport) {

                    const noScoresWarning = getByAndRemoveId(meetCell, "noScoresWarning");
                    if (meet.RankedTeams) {
                        noScoresWarning.remove();

                        // Update the print menu.
                        getByAndRemoveId(meetCell, "print_TeamsAndQuizzers")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                quizzersContainer.css("break-before", "page");

                                window.print();

                                quizzersContainer.css("break-before", "auto");
                                allMeetCells.removeClass("hide-on-print");
                            });

                        getByAndRemoveId(meetCell, "print_TeamsOnly")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                quizzersContainer.addClass("hide-on-print");

                                window.print();

                                quizzersContainer.removeClass("hide-on-print");
                                allMeetCells.removeClass("hide-on-print");
                            });

                        getByAndRemoveId(meetCell, "print_QuizzersOnly")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                teamsContainer.addClass("hide-on-print");

                                window.print();

                                teamsContainer.removeClass("hide-on-print");
                                allMeetCells.removeClass("hide-on-print");
                            });
                    }
                    else {
                        getByAndRemoveId(meetCell, "statsPrintButton").remove();
                    }

                    // Update the progress.
                    const meetProgressBanner_Completed = getByAndRemoveId(meetCell, "meetProgress_IsCompleted");
                    const meetProgressBanner_Mismatch = getByAndRemoveId(meetCell, "meetProgress_IsMismatched");
                    if (meet.RankedTeams && (meet.HasScoringCompleted || meet.HasRoomCompletionMismatch)) {

                        getByAndRemoveId(meet.HasScoringCompleted ? meetProgressBanner_Completed : meetProgressBanner_Mismatch, "meetProgressLabel")
                            .text(meet.ScoringProgressMessage);

                        (meet.HasScoringCompleted ? meetProgressBanner_Mismatch : meetProgressBanner_Completed).remove();
                    }
                    else {
                        meetProgressBanner_Completed.remove();
                        meetProgressBanner_Mismatch.remove();
                    }

                    // Create the Teams table.
                    const teamsAnchorId = `${titleAnchorId}_teams`;

                    const teamsContainer = getByAndRemoveId(meetCell, "teamsSection")
                        .prop("id", teamsAnchorId);

                    let hasTie = false;
                    if (!meet.RankedTeams) {
                        teamsContainer.remove();
                    }
                    else {
                        if (meet.TeamRankingLabel) {
                            getByAndRemoveId(teamsContainer, "teamRankingLabel")
                                .text(meet.TeamRankingLabel);
                        }
                        else {
                            teamsContainer
                                .find("#teamRankingRow")
                                .remove();
                        }

                        // Build the Teams table.
                        const teamTableBody = getByAndRemoveId(teamsContainer, "teamsTableBody");
                        const teamTableRowTemplate = getByAndRemoveId(teamTableBody, "tableRow")
                            .remove()
                            .get(0);

                        for (let i = 0; i < meet.RankedTeams.length; i++) {

                            const team = meet.Teams[meet.RankedTeams[i]];

                            const tableRow = cloneTemplate(teamTableRowTemplate);

                            // Calculate the rank cell, including a tie.
                            const rankCell = getByAndRemoveId(tableRow, "rankColumn");
                            if (team.Scores.IsTie) {
                                hasTie = true;
                                rankCell.append($("<b />")
                                    .text(`*${team.Scores.Rank}`));
                            }
                            else {
                                rankCell.text(team.Scores.Rank);
                            }

                            const highlightName = getByAndRemoveId(tableRow, "nameColumn").text(`${team.Name} (${team.ChurchName})`);
                            getByAndRemoveId(tableRow, "winColumn").text(team.Scores.Wins);
                            getByAndRemoveId(tableRow, "lossColumn").text(team.Scores.Losses);
                            getByAndRemoveId(tableRow, "winPercentageColumn").text(`${team.Scores.WinPercentage}%`);
                            getByAndRemoveId(tableRow, "totalColumn").text(team.Scores.TotalPoints);
                            getByAndRemoveId(tableRow, "averageColumn").append(team.Scores.AveragePoints ? team.Scores.AveragePoints : "&nbsp;");
                            getByAndRemoveId(tableRow, "quizOutColumn").append(team.Scores.QuizOuts ? team.Scores.QuizOuts : "&nbsp;");
                            getByAndRemoveId(tableRow, "quizOutPercentageColumn").append(team.Scores.QuestionCorrectPercentage ? `${team.Scores.WinPercentage}%` : "&nbsp;");
                            getByAndRemoveId(tableRow, "question30sColumn").append(team.Scores.Correct30s ? team.Scores.Correct30s : "&nbsp;");
                            getByAndRemoveId(tableRow, "question20sColumn").append(team.Scores.Correct20s ? team.Scores.Correct20s : "&nbsp;");
                            getByAndRemoveId(tableRow, "question10sColumn").append(team.Scores.Correct10s ? team.Scores.Correct10s : "&nbsp;");

                            // Update the search index.
                            searchIndexSource.teams.push({
                                name: team.Name,
                                church: team.ChurchName,
                                meet: meet.Name,
                                scrollToElement: tableRow,
                                highlightElements: [highlightName]
                            });

                            teamTableBody.append(tableRow);
                        }
                    }

                    const teamTieBreakingRow = getByAndRemoveId(teamsContainer, "teamTieBreakingRow");
                    if (!hasTie) {
                        teamTieBreakingRow.remove();
                    }

                    // Create the Quizzers table.
                    const quizzersAnchorId = `${titleAnchorId}_quizzers`;

                    const quizzersContainer = getByAndRemoveId(meetCell, "quizzersSection")
                        .prop("id", quizzersAnchorId);

                    hasTie = false;
                    if (!meet.RankedQuizzers) {
                        quizzersContainer.remove();
                    }
                    else {
                        if (meet.QuizzerRankingLabel) {
                            getByAndRemoveId(quizzersContainer, "quizzerRankingLabel")
                                .text(meet.QuizzerRankingLabel);
                        }
                        else {
                            quizzersContainer
                                .find("#quizzersRankingRow")
                                .remove();
                        }

                        // Build the Quizzers table.
                        const quizzerTableBody = getByAndRemoveId(quizzersContainer, "quizzersTableBody");
                        const quizzerTableRowTemplate = getByAndRemoveId(quizzerTableBody, "tableRow")
                            .remove()
                            .get(0);

                        for (let i = 0; i < meet.RankedQuizzers.length; i++) {

                            const quizzer = meet.Quizzers[meet.RankedQuizzers[i]]

                            const tableRow = cloneTemplate(quizzerTableRowTemplate);

                            // Calculate the rank cell, including a tie.
                            const rankCell = getByAndRemoveId(tableRow, "rankColumn");
                            if (quizzer.Scores.IsTie) {
                                hasTie = true;
                                rankCell.append($("<b />")
                                    .text(`*${quizzer.Scores.Rank}`));
                            }
                            else {
                                rankCell.text(quizzer.Scores.Rank);
                            }

                            const highlightName = getByAndRemoveId(tableRow, "nameColumn").text(quizzer.Name);
                            getByAndRemoveId(tableRow, "teamNameColumn").text(`${quizzer.TeamName} (${quizzer.ChurchName})`);
                            getByAndRemoveId(tableRow, "totalColumn").text(quizzer.Scores.TotalPoints);
                            getByAndRemoveId(tableRow, "averageColumn").append(quizzer.Scores.AveragePoints ? quizzer.Scores.AveragePoints : "&nbsp;");
                            getByAndRemoveId(tableRow, "quizOutColumn").append(quizzer.Scores.QuizOuts ? quizzer.Scores.QuizOuts : "&nbsp;");
                            getByAndRemoveId(tableRow, "quizOutPercentageColumn").append(quizzer.Scores.QuestionCorrectPercentage ? `${quizzer.Scores.QuestionCorrectPercentage}%` : "&nbsp;");
                            getByAndRemoveId(tableRow, "question30sColumn").append(quizzer.Scores.Correct30s ? quizzer.Scores.Correct30s : "&nbsp;");
                            getByAndRemoveId(tableRow, "question20sColumn").append(quizzer.Scores.Correct20s ? quizzer.Scores.Correct20s : "&nbsp;");
                            getByAndRemoveId(tableRow, "question10sColumn").append(quizzer.Scores.Correct10s ? quizzer.Scores.Correct10s : "&nbsp;");

                            // Update the search index.
                            searchIndexSource.quizzers.push({
                                name: quizzer.Name,
                                team: quizzer.TeamName,
                                church: quizzer.ChurchName,
                                meet: meet.Name,
                                scrollToElement: tableRow,
                                highlightElements: [highlightName]
                            });

                            quizzerTableBody.append(tableRow);
                        }
                    }

                    const quizzersTieBreakingRow = getByAndRemoveId(quizzersContainer, "quizzerTieBreakingRow");
                    if (!hasTie) {
                        quizzersTieBreakingRow.remove();
                    }

                    // Update the table of contents.
                    if (meet.RankedTeams || meet.RankedQuizzers) {
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
                }
                else {

                    const scheduleGridTableContainer = getByAndRemoveId(meetCell, "scheduleGrid");

                    const teamCards = getByAndRemoveId(meetCell, "teamCards");
                    const scheduleTeamTableBody = getByAndRemoveId(scheduleGridTableContainer, "scheduleTeamTableBody");

                    // Capture the data needed for the report.
                    let isRoomReport;
                    let isCardReport;
                    let cardItems;
                    switch (currentScheduleView) {
                        case ScheduleViewType.Room:
                            cardItems = meet.Rooms;
                            isRoomReport = true;
                            isCardReport = true;

                            scheduleGridTableContainer.remove();
                            break;

                        case ScheduleViewType.Grid:
                            cardItems = meet.Teams;
                            isCardReport = false;
                            isRoomReport = false;

                            // Configure the table.
                            const teamTableHeaderRow = getByAndRemoveId(scheduleGridTableContainer, "scheduleTeamTableHeaderRow");
                            const teamTableHeaderCellTemplate = getByAndRemoveId(teamTableHeaderRow, "matchItem")
                                .remove()
                                .get(0);

                            const teamTableFooter = getByAndRemoveId(scheduleGridTableContainer, "scheduleTeamTableFooter");
                            const tableFooterRow = getByAndRemoveId(teamTableFooter, "tableRow");
                            const tableFooterCellTemplate = getByAndRemoveId(tableFooterRow, "matchItem")
                                .remove()
                                .get(0);

                            let hasAnyMatchTimes = false;
                            for (let match of meet.Matches) {

                                // Add the match to the header.
                                const headerCell = cloneTemplate(teamTableHeaderCellTemplate)
                                    .text(match.Id);
                                teamTableHeaderRow.append(headerCell);

                                // Add the time to the footer.
                                const footerCell = cloneTemplate(tableFooterCellTemplate);

                                const matchTime = match.MatchTime;
                                if (matchTime) {
                                    hasAnyMatchTimes = true;
                                    footerCell.text(matchTime);
                                }
                                else {
                                    footerCell.append("&nbsp");
                                }

                                tableFooterRow.append(footerCell);
                            }

                            // If there aren't any times, remove the footer.
                            if (!hasAnyMatchTimes) {
                                teamTableFooter.remove();
                            }

                            teamCards.remove();
                            break;

                        default:
                            cardItems = meet.Teams;
                            isCardReport = true;
                            isRoomReport = false;

                            scheduleGridTableContainer.remove();
                            break;
                    }

                    // Update the print menu.
                    const printScheduleAndScores = getByAndRemoveId(meetCell, "print_ScheduleAndScores")
                        .click(null, e => {
                            allMeetCells.addClass("hide-on-print");
                            meetCell.removeClass("hide-on-print");

                            window.print();

                            allMeetCells.removeClass("hide-on-print");
                        });

                    const printScheduleOnly = getByAndRemoveId(meetCell, "print_ScheduleOnly")
                        .click(null, e => {
                            allMeetCells.addClass("hide-on-print");
                            meetCell.removeClass("hide-on-print");
                            resultsPane.addClass("blank-schedule");
                            allScheduleOnlyCells.removeClass("hide-on-print");

                            window.print();

                            allScheduleOnlyCells.addClass("hide-on-print");
                            resultsPane.removeClass("blank-schedule");
                            allMeetCells.removeClass("hide-on-print");
                        });

                    const printScheduleSingleTeam = getByAndRemoveId(meetCell, "print_ScheduleSingleTeam");
                    if (isCardReport && !isRoomReport) {

                        getByAndRemoveId(meetCell, "print_ScheduleAndScores_TeamPerPage")
                            .click(null, e => {

                                allIsFullIfSingleTeamElements
                                    .removeClass("is-half")
                                    .addClass("is-full");

                                allShowIfTeamCells.css("break-after", "page");

                                formatElementTextSizes(allResizableIfSingleTeamElements, true);

                                printScheduleAndScores.triggerHandler("click");

                                formatElementTextSizes(allResizableIfSingleTeamElements, false);

                                allShowIfTeamCells.css("break-after", "");

                                allIsFullIfSingleTeamElements
                                    .removeClass("is-full")
                                    .addClass("is-half");
                            });

                        getByAndRemoveId(meetCell, "print_ScheduleOnly_TeamPerPage")
                            .click(null, e => {

                                allIsFullIfSingleTeamElements
                                    .removeClass("is-half")
                                    .addClass("is-full");

                                allShowIfTeamCells.css("break-after", "page");

                                formatElementTextSizes(allResizableIfSingleTeamElements, true);

                                printScheduleOnly.triggerHandler("click");

                                formatElementTextSizes(allResizableIfSingleTeamElements, false);

                                allShowIfTeamCells.css("break-after", "");

                                allIsFullIfSingleTeamElements
                                    .removeClass("is-full")
                                    .addClass("is-half");
                            });
                    }
                    else {
                        printScheduleSingleTeam.remove();
                    }

                    // Build the cards.
                    const teamCardTemplate = getByAndRemoveId(isCardReport ? teamCards : scheduleTeamTableBody, "cardTemplate")
                        .remove()
                        .get(0);

                    const teamCardSpacerTemplate = getByAndRemoveId(teamCards, "spacerTemplate")
                        .remove()
                        .get(0);

                    for (let i = 0; i < cardItems.length; i++) {

                        const team = cardItems[i];

                        const teamCardOrRow = cloneTemplate(teamCardTemplate);

                        // Add the team information.
                        const highlightTeamName = getByAndRemoveId(teamCardOrRow, isCardReport ? "teamName" : "nameColumn")
                            .text(team.Name);
                        if (!isRoomReport) {

                            // Update the search index.
                            searchIndexSource.teams.push({
                                name: team.Name,
                                church: team.ChurchName,
                                meet: meet.Name,
                                scrollToElement: teamCardOrRow,
                                highlightElements: [highlightTeamName]
                            });
                        }

                        if (isCardReport) {

                            teamCards.append(teamCardOrRow);
                            if (i < cardItems.length - 1) {
                                teamCards.append(cloneTemplate(teamCardSpacerTemplate));
                            }

                            // Add team specific processing.
                            const churchNameRow = getByAndRemoveId(teamCardOrRow, "churchName");
                            const statsRow = getByAndRemoveId(teamCardOrRow, "statsRow");
                            if (isRoomReport) {
                                churchNameRow.remove();
                                statsRow.remove();
                            }
                            else {
                                churchNameRow.text(team.ChurchName);

                                // Add the ranking information (if present).
                                if (meet.RankedTeams) {
                                    getByAndRemoveId(teamCardOrRow, "rankLabel")
                                        .text(`${ordinalWithSuffix(team.Scores.Rank)}${team.Scores.IsTie ? '*' : ''}`);
                                    getByAndRemoveId(teamCardOrRow, "recordLabel")
                                        .text(`${team.Scores.Wins}-${team.Scores.Losses}`);
                                    getByAndRemoveId(teamCardOrRow, "pointsLabel")
                                        .text(team.Scores.TotalPoints);
                                    getByAndRemoveId(teamCardOrRow, "averageLabel")
                                        .text(team.Scores.AveragePoints);
                                }
                                else {
                                    statsRow.remove();
                                }
                            }
                        }
                        else {
                            const rankColumn = getByAndRemoveId(teamCardOrRow, "rankColumn");

                            if (meet.RankedTeams) {

                                rankColumn
                                    .text(`${team.Scores.Rank}${team.Scores.IsTie ? '*' : ''}`);

                                getByAndRemoveId(teamCardOrRow, "winColumn").text(team.Scores.Wins);
                                getByAndRemoveId(teamCardOrRow, "lossColumn").text(team.Scores.Losses);
                                getByAndRemoveId(teamCardOrRow, "totalColumn").text(team.Scores.TotalPoints);
                                getByAndRemoveId(teamCardOrRow, "averageColumn").text(team.Scores.AveragePoints);
                            }
                            else {
                                rankColumn.append("&nbsp;");
                            }

                            scheduleTeamTableBody.append(teamCardOrRow);
                        }

                        // Add the match items.
                        const matchesList = isCardReport ? getByAndRemoveId(teamCardOrRow, "matchList") : teamCardOrRow;
                        const matchItemTemplate = getByAndRemoveId(isCardReport ? matchesList : teamCardOrRow, "matchItem")
                            .remove()
                            .get(0);

                        let matchIndex = 0;
                        for (let match of team.Matches) {

                            const matchId = meet.Matches[matchIndex].Id;
                            let matchTeam = null;
                            if (match && isRoomReport) {
                                matchTeam = meet.Teams[match.Team1];
                                match = matchTeam.Matches[matchIndex];
                            }

                            const matchListItem = cloneTemplate(matchItemTemplate);
                            if (match) {

                                const scheduleLabel = getByAndRemoveId(matchListItem, "scheduleLabel");
                                const statsLabel = getByAndRemoveId(matchListItem, "statsLabel");
                                const statsLink = getByAndRemoveId(statsLabel, "statsLink");
                                const liveEventLabel = getByAndRemoveId(matchListItem, "liveEventLabel");

                                const isLiveMatch = match.CurrentQuestion && meet.RankedTeams;

                                if (isCardReport) {
                                    // Determine the prefix before each match.
                                    let scheduleText = [];
                                    if (isRoomReport) {
                                        scheduleText.push(`"${matchTeam.Name}"`);
                                    }

                                    scheduleText.push("vs.");
                                    let scoreText = null;
                                    if (meet.RankedTeams) {

                                        scoreText = [];

                                        if (isRoomReport) {
                                            scoreText.push(`"${matchTeam.Name}"`);
                                        }

                                        switch (match.Result) {
                                            case "W":
                                                scoreText.push(`${isRoomReport ? 'w' : 'W'}on against`);
                                                break;
                                            case "L":
                                                scoreText.push(`${isRoomReport ? 'l' : 'L'}ost to`);
                                                break;
                                            default:
                                                if (!match.CurrentQuestion && null != match.Score) {
                                                    scoreText.push(`${isRoomReport ? 'p' : 'P'}layed`);
                                                }
                                                else if (isLiveMatch) {
                                                    scoreText.push(`${isRoomReport ? 'p' : 'P'}laying`);
                                                }
                                                else {
                                                    // There is no score because this match hasn't been played yet.
                                                    scoreText = null;
                                                }

                                                break;
                                        }
                                    }

                                    // Append the other team name and scores.
                                    if (match.OtherTeam || 0 == match.OtherTeam) {

                                        const teamText = `"${meet.Teams[match.OtherTeam].Name}"`;
                                        scheduleText.push(teamText);

                                        if (scoreText) {
                                            scoreText.push(teamText);

                                            if (isLiveMatch) {
                                                if (!isRoomReport) {
                                                    scoreText.push(`in ${match.Room}`);
                                                }
                                            }
                                            else {
                                                scoreText.push(`${match.Score} to ${meet.Teams[match.OtherTeam].Matches[matchIndex].Score}`);
                                            }
                                        }
                                    }
                                    else {

                                        scheduleText.push("\"BYE TEAM\"");

                                        if (scoreText) {
                                            scoreText.push(`\"BYE TEAM\" ${match.Score}`);
                                        }
                                    }

                                    // Add the scheduled room and time.
                                    if (!isRoomReport) {
                                        scheduleText.push(`in ${match.Room}`);
                                    }

                                    const matchTime = meet.Matches[matchIndex].MatchTime;
                                    if (matchTime) {
                                        scheduleText.push(`@ ${matchTime}`);
                                    }

                                    // Output the schedule text for all scenarios.
                                    scheduleLabel
                                        .text(scheduleText.join(" "));

                                    // If there isn't a score, no link is required AND there's no need to hide the schedule during printing.
                                    if (!scoreText) {
                                        statsLabel.text(scheduleText.join(" "));
                                    }
                                    else {

                                        statsLink.text(scoreText.join(" "));

                                        if (isLiveMatch) {
                                            getByAndRemoveId(liveEventLabel, "questionNumber")
                                                .text(match.CurrentQuestion);
                                        }
                                        else {
                                            liveEventLabel.remove();
                                        }
                                    }
                                }
                                else {
                                    scheduleLabel.append(match.Room);
                                    statsLink.append(match.Room);

                                    if (isLiveMatch) {
                                        getByAndRemoveId(liveEventLabel, "questionNumber").text(match.CurrentQuestion);
                                    }
                                    else {

                                        if (meet.RankedTeams && null != match.Score) {
                                            statsLink.append(
                                                $("<font />")
                                                    .attr("color", match.Result === "W" ? "blue" : (match.Result === "L" ? "red" : "black"))
                                                    .text(` ~ ${match.Score}`));
                                        }

                                        liveEventLabel.remove();
                                    }
                                }

                                if (meet.RankedTeams) {
                                    statsLink.click(
                                        null,
                                        e => openMatchScoresheet(`Match ${matchId} in ${match.Room} @ ${meet.Name}`, meet.DatabaseId, meet.MeetId, matchId, match.RoomId))
                                }
                            }
                            else {
                                matchListItem.text(isCardReport ? "BYE" : "--");
                            }

                            matchesList.append(matchListItem);

                            matchIndex++;
                        }

                        if (isCardReport) {

                            // Build the list of coaches.
                            const coachContainer = getByAndRemoveId(teamCardOrRow, "coachContainer");
                            if (!isRoomReport && team.CoachName) {
                                getByAndRemoveId(coachContainer, "coachLabel")
                                    .empty()
                                    .text(team.CoachName);
                            }
                            else {
                                coachContainer.remove();
                            }

                            // Build the list of quizzers.
                            const quizzersContainer = getByAndRemoveId(teamCardOrRow, "quizzersContainer");
                            if (!isRoomReport && team.Quizzers.length > 0) {

                                const quizzerElements = getByAndRemoveId(quizzersContainer, "quizzersLabel")
                                    .empty();

                                let isFirstQuizzer = true;
                                for (let quizzerId of team.Quizzers) {

                                    if (isFirstQuizzer) {
                                        isFirstQuizzer = false;
                                    }
                                    else {
                                        quizzerElements.append(" | ");
                                    }

                                    const quizzerName = meet.Quizzers[quizzerId].Name;
                                    const quizzerElement = $("<span />").text(quizzerName);
                                    quizzerElements.append(quizzerElement);

                                    // Update the search index.
                                    searchIndexSource.quizzers.push({
                                        name: quizzerName,
                                        team: team.Name,
                                        church: team.ChurchName,
                                        meet: meet.Name,
                                        scrollToElement: teamCardOrRow,
                                        highlightElements: [highlightTeamName, quizzerElement]
                                    });
                                }
                            }
                            else {
                                quizzersContainer.remove();
                            }
                        }
                    }

                    if (!isCardReport) {

                        const scheduleIndividualsTableBody = getByAndRemoveId(scheduleGridTableContainer, "scheduleIndividualTableBody");
                        const individualRowTemplate = getByAndRemoveId(scheduleIndividualsTableBody, "cardTemplate")
                            .remove()
                            .get(0);

                        for (let i = 0; i < meet.Teams.length; i++) {

                            const team = meet.Teams[i];
                            const individualsRow = cloneTemplate(individualRowTemplate);

                            const teamAndCoachColumn = getByAndRemoveId(individualsRow, "teamAndCoachColumn")
                                .append($("<strong />").text(team.Name));
                            if (team.CoachName) {
                                teamAndCoachColumn
                                    .append("<br />")
                                    .append($("<span />").text(team.CoachName));
                            }

                            const column1 = getByAndRemoveId(individualsRow, "quizzerColumn1");
                            const column2 = getByAndRemoveId(individualsRow, "quizzerColumn2");
                            if (team.Quizzers.length > 0) {

                                // Append the first column.
                                const column1Count = Math.ceil(team.Quizzers.length / 2);
                                for (let i = 0; i < column1Count; i++) {
                                    if (i > 0) {
                                        column1.append("<br />");
                                    }

                                    column1.append($("<span />").text(meet.Quizzers[team.Quizzers[i]].Name));
                                }

                                if (team.Quizzers.length > column1Count) {
                                    for (let i = column1Count; i < team.Quizzers.length; i++) {
                                        if (i > column1Count) {
                                            column2.append("<br />");
                                        }

                                        column2.append($("<span />").text(meet.Quizzers[team.Quizzers[i]].Name));
                                    }
                                }
                                else {
                                    column1.attr("colspan", 2);
                                    column2.remove();
                                }
                            }
                            else {
                                column2.remove();
                                column1.attr("colspan", 2);
                            }

                            scheduleIndividualsTableBody.append(individualsRow);
                        }
                    }

                    // If there is no ranking, remove all the columns that would have been hidden for a schedule. The table only displays a schedule.
                    if (!meet.RankedTeams) {
                        scheduleGridTableContainer.find(".hide-if-schedule").remove();
                        scheduleGridTableContainer
                            .find(".show-if-schedule")
                            .removeClass(["show-if-schedule", "hide-on-print"]);
                    }
                }

                resultsPane.append(meetCell);
                tableOfContentsMeets.append(tocEntry);
            }

            // Capture all the meet cells.
            const allMeetCells = $(".meet-cell");
            const allScheduleOnlyCells = $(".show-if-schedule");
            const allShowIfTeamCells = $(".show-if-single-team");
            const allIsFullIfSingleTeamElements = $(".is-full-if-single-team");
            const allResizableIfSingleTeamElements = $(".is-3-if-single-team,.is-4-if-single-team,.is-5-if-single-team,.is-6-if-single-team,.is-7-if-single-team,.is-size-3-if-single-team,.is-size-4-if-single-team,.is-size-5-if-single-team,.is-size-6-if-single-team,.is-size-7-if-single-team");

            // Add the elements to the table of contents.
            $("#pageTOC")
                .append($("<p />")
                    .addClass("menu-label")
                    .text("Results"))
                .append(tableOfContentsMeets);

            // Persist the last position when unloading or changing the visibility of the page.
            const storageKey = `${eventId}-last-position`;
            window.addEventListener("visibilitychange", e => {
                localStorage.setItem(
                    storageKey,
                    JSON.stringify({ x: window.scrollX, y: window.scrollY, time: new Date(), isStats: isStatsReport, view: currentScheduleView }));
            });

            window.addEventListener("beforeunload", e => {
                localStorage.setItem(
                    storageKey,
                    JSON.stringify({ x: window.scrollX, y: window.scrollY, time: new Date(), isStats: isStatsReport, view: currentScheduleView }));
            });

            makeDropdownsClickable();

            resultsPane.show();
            loadingPane.hide();
            errorPane.hide();

            // Now that the UI has been updated, attempt to scroll to the last position (if it didn't happen too long ago).
            let isScrolled = false;
            const lastPositionJson = localStorage.getItem(storageKey);
            if (lastPositionJson) {
                try {
                    const lastPosition = JSON.parse(lastPositionJson);
                    if (null != lastPosition) {
                        const x = lastPosition.x;
                        const y = lastPosition.y;
                        const isStats = lastPosition.isStats;
                        const lastView = lastPosition.view;
                        const time = lastPosition.time;
                        if (null != x && null != y && null != time && null != isStats && isStats === isStatsReport && currentScheduleView === lastView &&
                            Date.parse(time) < new Date(new Date().getTime() + 120000)) {
                            window.scrollTo(x, y);
                            isScrolled = true;
                        }
                    }
                } catch {
                    // Ignore this error.
                }

                // Remove the item from the local storage regardless of whether it is still valid.
                localStorage.removeItem(storageKey);
            }

            if (!isScrolled) {
                window.location.hash = originalHash;
            }
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