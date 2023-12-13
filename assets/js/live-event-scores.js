function initializeLiveEvents() {

    const loadingPane = $("#loadingPane");
    const resultsPane = $("#resultsPane");
    const errorPane = $("#errorPane");

    $(document.body).css("overflow-x", "scroll");

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

            // Update the title of the page.
            $(document).prop("title", report.EventName);
            $("#pageTitle").text(report.EventName);

            // Initialize the table of contents.
            const tableOfContentsMeets = $("<ul />")
                .addClass("menu-list");

            // Process each meet.
            const template = isStatsReport ? statsTemplate : scheduleTemplate;

            let isFirstMeet = true;
            for (let meet of report.Report.Meets) {

                if (isStatsReport && !meet.RankedTeams) {
                    // If there is no ranking, the scores aren't enabled for this meet.
                    continue;
                }

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

                    // Update the progress.
                    const meetProgressBanner_Completed = getByAndRemoveId(meetCell, "meetProgress_IsCompleted");
                    const meetProgressBanner_Mismatch = getByAndRemoveId(meetCell, "meetProgress_IsMismatched");
                    if (meet.HasScoringCompleted || meet.HasScoringCompleted) {

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
                    let hasTie = false;
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

                        getByAndRemoveId(tableRow, "nameColumn").text(`${team.Name} (${team.ChurchName})`);
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

                        teamTableBody.append(tableRow);
                    }

                    const teamTieBreakingRow = getByAndRemoveId(teamsContainer, "teamTieBreakingRow");
                    if (!hasTie) {
                        teamTieBreakingRow.remove();
                    }

                    // Create the Quizzers table.
                    const quizzersAnchorId = `${titleAnchorId}_quizzers`;

                    const quizzersContainer = getByAndRemoveId(meetCell, "quizzersSection")
                        .prop("id", quizzersAnchorId);

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
                    hasTie = false;
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

                        getByAndRemoveId(tableRow, "nameColumn").text(quizzer.Name);
                        getByAndRemoveId(tableRow, "teamNameColumn").text(`${quizzer.TeamName} (${quizzer.ChurchName})`);
                        getByAndRemoveId(tableRow, "totalColumn").text(quizzer.Scores.TotalPoints);
                        getByAndRemoveId(tableRow, "averageColumn").append(quizzer.Scores.AveragePoints ? quizzer.Scores.AveragePoints : "&nbsp;");
                        getByAndRemoveId(tableRow, "quizOutColumn").append(quizzer.Scores.QuizOuts ? quizzer.Scores.QuizOuts : "&nbsp;");
                        getByAndRemoveId(tableRow, "quizOutPercentageColumn").append(quizzer.Scores.QuestionCorrectPercentage ? `${quizzer.Scores.QuestionCorrectPercentage}%` : "&nbsp;");
                        getByAndRemoveId(tableRow, "question30sColumn").append(quizzer.Scores.Correct30s ? quizzer.Scores.Correct30s : "&nbsp;");
                        getByAndRemoveId(tableRow, "question20sColumn").append(quizzer.Scores.Correct20s ? quizzer.Scores.Correct20s : "&nbsp;");
                        getByAndRemoveId(tableRow, "question10sColumn").append(quizzer.Scores.Correct10s ? quizzer.Scores.Correct10s : "&nbsp;");

                        quizzerTableBody.append(tableRow);
                    }

                    const quizzersTieBreakingRow = getByAndRemoveId(quizzersContainer, "quizzerTieBreakingRow");
                    if (!hasTie) {
                        quizzersTieBreakingRow.remove();
                    }

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
                    // Update the print menu.
                    getByAndRemoveId(meetCell, "print_ScheduleAndScores")
                        .click(null, e => {
                            allMeetCells.addClass("hide-on-print");
                            meetCell.removeClass("hide-on-print");

                            window.print();

                            allMeetCells.removeClass("hide-on-print");
                        });

                    getByAndRemoveId(meetCell, "print_ScheduleOnly")
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

                    const teamCards = getByAndRemoveId(meetCell, "teamCards");
                    const teamCardTemplate = getByAndRemoveId(teamCards, "cardTemplate")
                        .remove()
                        .get(0);

                    // Build the team cards.
                    for (let i = 0; i < meet.Teams.length; i++) {

                        const team = meet.Teams[i];

                        const teamCard = cloneTemplate(teamCardTemplate);

                        // Add the team information.
                        getByAndRemoveId(teamCard, "teamName")
                            .text(team.Name);
                        getByAndRemoveId(teamCard, "churchName")
                            .text(team.ChurchName);

                        teamCards.append(teamCard);

                        // Add the ranking information (if present).
                        const statsRow = getByAndRemoveId(teamCard, "statsRow");
                        if (meet.RankedTeams) {
                            getByAndRemoveId(teamCard, "rankLabel")
                                .text(`${ordinalWithSuffix(team.Scores.Rank)}${team.Scores.IsTie ? '*' : ''}`);
                            getByAndRemoveId(teamCard, "recordLabel")
                                .text(`${team.Scores.Wins}-${team.Scores.Losses}`);
                            getByAndRemoveId(teamCard, "pointsLabel")
                                .text(team.Scores.TotalPoints);
                            getByAndRemoveId(teamCard, "averageLabel")
                                .text(team.Scores.AveragePoints);
                        }
                        else {
                            statsRow.remove();
                        }

                        // Add the match items.
                        const matchesList = getByAndRemoveId(teamCard, "matchList");
                        const matchItemTemplate = getByAndRemoveId(matchesList, "matchItem")
                            .remove()
                            .get(0);

                        let matchIndex = 0;
                        for (let match of team.Matches) {

                            const matchId = meet.Matches[matchIndex].Id;

                            const matchListItem = cloneTemplate(matchItemTemplate);
                            if (match) {

                                const isLiveMatch = match.CurrentQuestion && meet.RankedTeams;

                                // Determine the prefix before each match.
                                let scheduleText = ["vs."];
                                let scoreText = null;
                                if (meet.RankedTeams) {

                                    scoreText = [];
                                    switch (match.Result) {
                                        case "W":
                                            scoreText.push("Won against");
                                            break;
                                        case "L":
                                            scoreText.push("Lost to");
                                            break;
                                        default:
                                            if (!match.CurrentQuestion && null != match.Score) {
                                                scoreText.push("Played");
                                            }
                                            else if (isLiveMatch) {
                                                scoreText.push("Playing");
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
                                            scoreText.push(`in ${match.Room}`);
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
                                scheduleText.push(`in ${match.Room}`);
                                const matchTime = meet.Matches[matchIndex].MatchTime;
                                if (matchTime) {
                                    scheduleText.push(`@ ${matchTime}`);
                                }

                                // Output the schedule text for all scenarios.
                                getByAndRemoveId(matchListItem, "scheduleLabel")
                                    .text(scheduleText.join(" "));

                                // If there isn't a score, no link is required AND there's no need to hide the schedule during printing.
                                const statsLabel = getByAndRemoveId(matchListItem, "statsLabel");
                                if (!scoreText) {
                                    statsLabel.text(scheduleText.join(" "));
                                }
                                else {

                                    getByAndRemoveId(statsLabel, "statsLink")
                                        .click(null, e => openMatchScoresheet(`Match ${matchId} in ${match.Room} @ ${meet.Name}`, meet.DatabaseId, meet.MeetId, matchId, match.RoomId))
                                        .text(scoreText.join(" "));

                                    const liveEventLabel = getByAndRemoveId(matchListItem, "liveEventLabel");
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
                                matchListItem.text("BYE");
                            }

                            matchesList.append(matchListItem);

                            matchIndex++;
                        }

                        // Build the list of quizzers.
                        const quizzers = [];
                        for (let quizzerId of team.Quizzers) {
                            quizzers.push(meet.Quizzers[quizzerId].Name);
                        }

                        const quizzersContainer = getByAndRemoveId(teamCard, "quizzersContainer");
                        if (quizzers.length > 0) {
                            getByAndRemoveId(quizzersContainer, "quizzersLabel")
                                .text(quizzers.join(" | "));
                        }
                        else {
                            quizzersContainer.remove();
                        }
                    }
                }

                resultsPane.append(meetCell);
                tableOfContentsMeets.append(tocEntry);
            }

            // Capture all the meet cells.
            const allMeetCells = $(".meet-cell");
            const allScheduleOnlyCells = $(".show-if-schedule");

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
                    JSON.stringify({ x: window.scrollX, y: window.scrollY, time: new Date(), isStats: isStatsReport }));
            });

            window.addEventListener("beforeunload", e => {
                localStorage.setItem(
                    storageKey,
                    JSON.stringify({ x: window.scrollX, y: window.scrollY, time: new Date(), isStats: isStatsReport }));
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
                        const time = lastPosition.time;
                        if (null != x && null != y && null != time && null != isStats && isStats === isStatsReport &&
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