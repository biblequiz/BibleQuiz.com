function initializeLiveEvents() {

    const loadingPane = $("#loadingPane");
    const resultsPane = $("#resultsPane");
    const errorPane = $("#errorPane");

    $(document.body).css("overflow-x", "scroll");

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

                if (isStatsReport && !meet.RankedTeams) {
                    // If there is no ranking, the scores aren't enabled for this meet.
                    continue;
                }

                if (isFirstMeet) {
                    isFirstMeet = false;
                }
                else {
                    resultsPane.append($("<div />")
                        .addClass("meet-cell")
                        .css("page-break-after", "always"));

                    if (!isStatsReport) {
                        resultsPane.append($("<hr />").addClass("hide-on-print"));
                    }
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

                    printMenu
                        .append($("<a />")
                            .addClass("dropdown-item")
                            .text("Teams & Quizzers")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                quizzersContainer.css("break-before", "page");

                                window.print();

                                quizzersContainer.css("break-before", "auto");
                                allMeetCells.removeClass("hide-on-print");
                            }))
                        .append($("<a />")
                            .addClass("dropdown-item")
                            .text("Teams Only")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                quizzersContainer.addClass("hide-on-print");

                                window.print();

                                quizzersContainer.removeClass("hide-on-print");
                                allMeetCells.removeClass("hide-on-print");
                            }))
                        .append($("<a />")
                            .addClass("dropdown-item")
                            .text("Quizzers Only")
                            .click(null, e => {
                                allMeetCells.addClass("hide-on-print");
                                meetCell.removeClass("hide-on-print");
                                teamsContainer.addClass("hide-on-print");

                                window.print();

                                teamsContainer.removeClass("hide-on-print");
                                allMeetCells.removeClass("hide-on-print");
                            }));

                    if (meet.HasRoomCompletionMismatch || meet.HasScoringCompleted) {
                        meetCell.append($("<div />")
                            .addClass(["notification", meet.HasScoringCompleted ? "is-success" : "is-warning"])
                            .append($("<strong />").text(`${meet.HasScoringCompleted ? "COMPLETE" : "IN PROGRESS"}: ${meet.ScoringProgressMessage}`)));
                    }

                    // Create the Teams table.
                    const teamsAnchorId = `${titleAnchorId}_teams`;

                    const teamsContainer = $("<div />").append(
                        $("<h3 />")
                            .css("margin-top", "0px")
                            .prop("id", teamsAnchorId)
                            .text("Teams"));

                    if (meet.TeamRankingLabel) {
                        teamsContainer.append($("<div />")
                            .addClass("is-size-6")
                            .append($("<i />")
                                .append($("<strong />").text("Team Report:"))
                                .append(` ${meet.TeamRankingLabel}`)));
                    }

                    // Build the Teams table.
                    let hasTie = false;
                    const teamTableBody = $("<tbody />");
                    for (let i = 0; i < meet.RankedTeams.length; i++) {

                        const team = meet.Teams[meet.RankedTeams[i]]

                        const tableRow = $("<tr />");

                        // Calculate the rank cell, including a tie.
                        const rankCell = $("<td />").addClass("has-text-right");
                        if (team.Scores.IsTie) {
                            hasTie = true;
                            rankCell.append($("<b />")
                                .text(`*${team.Scores.Rank}`));
                        }
                        else {
                            rankCell.text(team.Scores.Rank);
                        }

                        tableRow.append(rankCell);

                        tableRow
                            .append($("<td />").text(`${team.Name} (${team.ChurchName})`))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .text(team.Scores.Wins))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .text(team.Scores.Losses))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .text(`${team.Scores.WinPercentage}%`))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .text(team.Scores.TotalPoints))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(team.Scores.AveragePoints ? team.Scores.AveragePoints : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(team.Scores.QuizOuts ? team.Scores.QuizOuts : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(team.Scores.QuestionCorrectPercentage ? `${team.Scores.WinPercentage}%` : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(team.Scores.Correct30s ? team.Scores.Correct30s : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(team.Scores.Correct20s ? team.Scores.Correct20s : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(team.Scores.Correct10s ? team.Scores.Correct10s : "&nbsp;"));

                        teamTableBody.append(tableRow);
                    }

                    teamsContainer.append(
                        $("<table />")
                            .addClass(["table", "is-striped", "is-fullwidth", "is-bordered", "is-narrow"])
                            .append($("<thead />")
                                .append($("<tr />")
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "30")
                                        .text("#"))
                                    .append($("<th />")
                                        .attr("width", "33%")
                                        .text("Team (Church)"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "30")
                                        .text("W"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "30")
                                        .text("L"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "65")
                                        .text("W%"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "65")
                                        .text("Total"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "65")
                                        .text("Avg"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("QO"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("Q%"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("30s"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("20s"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("10s"))))
                            .append(teamTableBody));

                    if (hasTie) {
                        teamsContainer.append($("<div />")
                            .append($("<font />")
                                .attr("size", 2)
                                .append($("<i />").text("* Tie couldn't be broken by tie breaking rules."))));
                    }

                    meetCell.append(teamsContainer);

                    // Create the Quizzers table.
                    const quizzersAnchorId = `${titleAnchorId}_quizzers`;

                    const quizzersContainer = $("<div />").append(
                        $("<h3 />")
                            .prop("id", quizzersAnchorId)
                            .text("Quizzers"));

                    if (meet.QuizzerRankingLabel) {
                        quizzersContainer.append($("<div />")
                            .addClass("is-size-6")
                            .append($("<i />")
                                .append($("<strong />").text("Individual Report:"))
                                .append(` ${meet.QuizzerRankingLabel}`)));
                    }

                    // Build the Quizzers table.
                    hasTie = false;
                    const quizzerTableBody = $("<tbody />");
                    for (let i = 0; i < meet.RankedQuizzers.length; i++) {

                        const quizzer = meet.Quizzers[meet.RankedQuizzers[i]]

                        const tableRow = $("<tr />");

                        // Calculate the rank cell, including a tie.
                        const rankCell = $("<td />").addClass("has-text-right");
                        if (quizzer.Scores.IsTie) {
                            hasTie = true;
                            rankCell.append($("<b />")
                                .text(`*${quizzer.Scores.Rank}`));
                        }
                        else {
                            rankCell.text(quizzer.Scores.Rank);
                        }

                        tableRow.append(rankCell);

                        tableRow
                            .append($("<td />").text(quizzer.Name))
                            .append($("<td />").text(`${quizzer.TeamName} (${quizzer.ChurchName})`))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .text(quizzer.Scores.TotalPoints))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(quizzer.Scores.AveragePoints ? quizzer.Scores.AveragePoints : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(quizzer.Scores.QuizOuts ? quizzer.Scores.QuizOuts : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(quizzer.Scores.QuestionCorrectPercentage ? `${quizzer.Scores.QuestionCorrectPercentage}%` : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(quizzer.Scores.Correct30s ? quizzer.Scores.Correct30s : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(quizzer.Scores.Correct20s ? quizzer.Scores.Correct20s : "&nbsp;"))
                            .append($("<td />")
                                .addClass("has-text-right")
                                .append(quizzer.Scores.Correct10s ? quizzer.Scores.Correct10s : "&nbsp;"));

                        quizzerTableBody.append(tableRow);
                    }

                    quizzersContainer.append(
                        $("<table />")
                            .addClass(["table", "is-striped", "is-fullwidth", "is-bordered", "is-narrow"])
                            .append($("<thead />")
                                .append($("<tr />")
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "30")
                                        .text("#"))
                                    .append($("<th />")
                                        .text("Quizzer"))
                                    .append($("<th />")
                                        .text("Team (Church)"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "65")
                                        .text("Total"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "65")
                                        .text("Avg"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("QO"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("Q%"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("30s"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("20s"))
                                    .append($("<th />")
                                        .addClass("has-text-right")
                                        .attr("width", "45")
                                        .text("10s"))))
                            .append(quizzerTableBody));

                    if (hasTie) {
                        quizzersContainer.append($("<div />")
                            .append($("<font />")
                                .attr("size", 2)
                                .append($("<i />").text("* Tie couldn't be broken by tie breaking rules."))));
                    }

                    meetCell.append(quizzersContainer);

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

                    const teamCells = $("<div />")
                        .addClass(["columns", "is-multiline"]);

                    meetCell.append(teamCells);

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

                    let hasMatchTimes = false;
                    for (let match of meet.Matches) {
                        if (match.MatchTime) {
                            hasMatchTimes = true;
                            break;
                        }
                    }

                    for (let i = 0; i < meet.Teams.length; i++) {

                        const team = meet.Teams[i];

                        const teamCard = $("<div />")
                            .addClass(["column", "is-half", "team-card", "p-3"])
                            .append($("<p />")
                                .addClass(["title", "is-5"])
                                .text(team.Name))
                            .append($("<p />")
                                .addClass(["subtitle", "is-7"])
                                .text(team.ChurchName));

                        teamCells.append(teamCard);

                        if (meet.RankedTeams) {

                            teamCard.append(
                                $("<div />")
                                    .addClass(["columns", "is-mobile", "is-centered", "mt-2", "hide-if-schedule"])
                                    .append($("<div />")
                                        .addClass(["column", "is-one-fifth", "has-text-centered", "team-card-right-border"])
                                        .append($("<span />")
                                            .addClass(["title", "is-5"])
                                            .text(`${ordinalWithSuffix(team.Scores.Rank)}${team.Scores.IsTie ? '*' : ''}`))
                                        .append($("<br />"))
                                        .append($("<i />")
                                            .addClass(["subtitle", "is-6"])
                                            .text("PLACE")))
                                    .append($("<div />")
                                        .addClass(["column", "is-one-fifth", "has-text-centered", "team-card-right-border"])
                                        .append($("<span />")
                                            .addClass(["title", "is-5"])
                                            .text(`${team.Scores.Wins}-${team.Scores.Losses}`))
                                        .append($("<br />"))
                                        .append($("<i />")
                                            .addClass(["subtitle", "is-6"])
                                            .text("RECORD")))
                                    .append($("<div />")
                                        .addClass(["column", "is-one-fifth", "has-text-centered", "team-card-right-border"])
                                        .append($("<span />")
                                            .addClass(["title", "is-5"])
                                            .text(team.Scores.TotalPoints))
                                        .append($("<br />"))
                                        .append($("<i />")
                                            .addClass(["subtitle", "is-6"])
                                            .text("PTS")))
                                    .append($("<div />")
                                        .addClass(["column", "is-one-fifth", "has-text-centered"])
                                        .append($("<span />")
                                            .addClass(["title", "is-5"])
                                            .text(team.Scores.AveragePoints))
                                        .append($("<br />"))
                                        .append($("<i />")
                                            .addClass(["subtitle", "is-6"])
                                            .text("AVG"))));

                            let rank = team.Scores.Rank;
                            if (team.Scores.IsTie) {
                                rank += "*";
                            }
                        }

                        const matchesList = $("<ol />")
                            .addClass("is-size-7");
                        teamCard.append(matchesList);

                        let matchIndex = 0;
                        for (let match of team.Matches) {

                            const matchId = meet.Matches[matchIndex].Id;

                            const matchListItem = $("<li />");
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
                                if (hasMatchTimes) {
                                    scheduleText.push(`@ ${meet.Matches[matchIndex].MatchTime}`);
                                }

                                // If there isn't a score, no link is required AND there's no need to hide the schedule during printing.
                                if (!scoreText) {
                                    matchListItem.text(scheduleText.join(" "));
                                }
                                else {

                                    const matchScoreContainer = $("<div />")
                                        .addClass("hide-if-schedule")
                                        .append($("<a />")
                                            .addClass("hide-if-schedule")
                                            .click(null, e => openMatchScoresheet(`Match ${matchId} in ${match.Room} @ ${meet.Name}`, meet.DatabaseId, meet.MeetId, matchId, match.RoomId))
                                            .text(scoreText.join(" ")));

                                    if (isLiveMatch) {
                                        matchScoreContainer
                                            .append("<br />")
                                            .append($("<i />")
                                                .append($("<i />").addClass(["fas", "fa-broadcast-tower"]))
                                                .append("&nbsp;")
                                                .append(`Question #${match.CurrentQuestion}`));
                                    }

                                    matchListItem
                                        .append($("<div />")
                                            .addClass("show-if-schedule")
                                            .text(scheduleText.join(" ")))
                                        .append(matchScoreContainer);
                                }
                            }
                            else {
                                matchListItem.text("BYE");
                            }

                            matchesList.append(matchListItem);

                            matchIndex++;
                        }

                        const quizzers = [];
                        for (let quizzerId of team.Quizzers) {
                            quizzers.push(meet.Quizzers[quizzerId].Name);
                        }

                        if (quizzers.length > 0) {
                            teamCard.append(
                                $("<p />")
                                    .addClass("is-size-7")
                                    .append($("<b />").text("Quizzers: "))
                                    .append(quizzers.join(" | ")));
                        }
                    }
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