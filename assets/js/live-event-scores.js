function loadLiveEventsFromCurrentHash() {

    const loadingPane = document.getElementById("loadingPane");
    const detailsPane = document.getElementById("resultsPane");
    const errorPane = document.getElementById("errorPane");

    loadingPane.style.display = "";
    detailsPane.style.display = "none";
    errorPane.style.display = "none";

    // Normalize the route for processing.
    const currentHash = window.location.hash;
    if (!currentHash || !currentHash.startsWith("#/")) {
        errorPane.style.display = "";
        loadingPane.style.display = "none";
        return;
    }

    // Start the chain of processing for the URL.
    const urlParts = currentHash.split('/');
    if (2 == urlParts.length) {
        ensureMainTableIsLoaded(
            urlParts[1],
            urlParts,
            p => loadingPane.style.display = "none");
    }
    else if (urlParts.length > 3) {

        const eventId = urlParts[1];
        const databaseId = urlParts[2];
        const meetId = urlParts[4];

        switch (urlParts[3]) {
            case "Schedule":
                {
                    const reportUrl = buildDetailedReportUrl(
                        eventId,
                        databaseId,
                        meetId,
                        urlParts.length > 5 ? urlParts[5] : null, // Team ID
                        false, // Include Scores
                        false); // Include Current Question

                    this.ensureMainTableIsLoaded(
                        eventId,
                        urlParts,
                        p => renderHtmlReport(eventId, databaseId, "Schedule", true, reportUrl, urlParts, p => loadingPane.style.display = "none"));
                }
                break;

            case "Scores":
                {
                    const reportUrl = ["/", eventId, "/Databases/", databaseId, "/Reports/", meetId, "/Scores"].join("");
                    this.ensureMainTableIsLoaded(
                        eventId,
                        urlParts,
                        p => renderHtmlReport(eventId, databaseId, null, false, reportUrl, urlParts, p => loadingPane.style.display = "none"));
                }
                break;

            case "Dashboard":
                {
                    const reportUrl = buildDetailedReportUrl(
                        eventId,
                        databaseId,
                        meetId,
                        urlParts.length > 5 ? urlParts[5] : null, // Team ID
                        true, // Include Scores
                        true); // Include Current Question

                    this.ensureMainTableIsLoaded(
                        eventId,
                        urlParts,
                        p => renderHtmlReport(eventId, databaseId, "Dashboard", true, reportUrl, urlParts, p => loadingPane.style.display = "none"));
                }
                break;

            case "RoomScores":
                {
                    if (urlParts.length > 6) {
                        const reportUrl = ["/", eventId, "/Databases/", databaseId, "/Reports/", meetId, "/Scores/", urlParts[5], "/", urlParts[6]].join("");

                        this.ensureMainTableIsLoaded(
                            eventId,
                            urlParts,
                            p => renderHtmlReport(eventId, databaseId, null, false, reportUrl, urlParts, p => loadingPane.style.display = "none"));
                    }
                    else {
                        errorPane.innerHTML = "Incorrect URL for the Room Report.";
                        errorPane.style.display = "";
                    }
                }
                break;

            default:

                loadingPane.style.display = "none";

                errorPane.innerHTML = "Unable to render this type of report.";
                errorPane.style.display = "";
                break;
        }
    }
    else {
        loadingPane.style.display = "none";

        errorPane.innerHTML = "Check your URL and try again.";
        errorPane.style.display = "";
    }
}

function ensureMainTableIsLoaded(eventId, urlParts, callback) {

    const mainTablePane = document.getElementById("mainTablePane");
    const loadingPane = document.getElementById("loadingPane");
    const errorPane = document.getElementById("errorPane");

    // If the pane is already showing, there's nothing to retrieve.
    if (mainTablePane.style.display != "none") {
        callback(urlParts);
        return;
    }

    // Retrieve the latest information for the table.
    mainTablePane.style.display = "none";

    fetch("https://registration.biblequiz.com/api/Events/" + eventId + "/Reports")
        .then(response => response.json())
        .then(data => {
            const eventTitle = document.getElementById("eventTitle");
            const mainTable = document.getElementById("mainTable");

            eventTitle.innerText = data.EventName;

            if (data.Meets) {
                const urlBase = "#/" + eventId;

                for (let i = 0; i < data.Meets.length; i++) {

                    const meet = data.Meets[i];
                    const row = mainTable.tBodies[0].insertRow(i);

                    // Add the name cell
                    row.insertCell(0).innerText = meet.Label;

                    // Build the schedule cell.
                    const scheduleCell = row.insertCell(1);
                    scheduleCell.className = "has-text-centered";
                    if (meet.HasSchedule) {
                        const linkUrl = urlBase + "/" + meet.DatabaseId + "/Schedule/" + meet.MeetId;
                        scheduleCell.innerHTML = "<a href=\"" + linkUrl + "\" class=\"button is-primary\"><i class=\"far fa-calendar-alt\"></i>&nbsp;Schedule</a>";
                    }
                    else {
                        scheduleCell.innerHTML = "&nbsp;";
                    }

                    // Build the Scores cell.
                    const scoreSummaryCell = row.insertCell(2);
                    scoreSummaryCell.className = "has-text-centered";

                    const scoreDetailsCell = row.insertCell(3);
                    scoreDetailsCell.className = "has-text-centered";

                    if (meet.HasScores) {
                        const summaryLinkUrl = urlBase + "/" + meet.DatabaseId + "/Scores/" + meet.MeetId;
                        scoreSummaryCell.innerHTML = "<a href=\"" + summaryLinkUrl + "\" class=\"button is-primary\"><i class=\"fas fa-stopwatch\"></i>&nbsp;Score Summary</a>";

                        const detailsLinkUrl = urlBase + "/" + meet.DatabaseId + "/Dashboard/" + meet.MeetId;
                        scoreDetailsCell.innerHTML = "<a href=\"" + detailsLinkUrl + "\" class=\"button is-primary\"><i class=\"fas fa-stopwatch\"></i>&nbsp;Score Details</a>";
                    }
                    else {
                        scoreSummaryCell.innerHTML = "&nbsp;";
                        scoreDetailsCell.innerHTML = "&nbsp;";
                    }
                }
            }

            mainTablePane.style.display = "";

            callback(urlParts);

        }).catch((err) => {

            console.log('Failed to retrieve the meets table.', err);

            errorPane.style.display = "Failed to retrieve the Event Details.";
            errorPane.style.display = "";
            loadingPane.style.display = "none";
            mainTablePane.style.display = "none";
        });
}

function renderHtmlReport(eventId, databaseId, teamFragment, includeQrCode, url, urlParts, callback) {

    const resultsPane = document.getElementById("resultsPane");
    const loadingPane = document.getElementById("loadingPane");
    const errorPane = document.getElementById("errorPane");

    resultsPane.style.display = "none";

    fetch("https://registration.biblequiz.com/api/Events" + url)
        .then(response => response.json())
        .then(data => {

            const linkPathBase = ["#/", eventId, "/", databaseId].join("");

            let html = data.Html;
            if (null == html || 0 == html.length) {
                html = "<div class=\"has-text-centered\"><i>No reports are available yet.</i></div>";
                includeQrCode = false;
            }
            else {
                if (null != data.LinkTokens) {
                    for (let token in data.LinkTokens) {
                        const linkInfo = data.LinkTokens[token];

                        const link = null == linkInfo.TeamId
                            ? [linkPathBase, "/RoomScores/", linkInfo.MeetId, "/", linkInfo.MatchId, "/", linkInfo.RoomId].join("")
                            : [linkPathBase, "/", teamFragment, "/", linkInfo.MeetId, "/", linkInfo.TeamId].join("");

                        html = html.replaceAll(token, link);
                    }
                }
            }

            resultsPane.innerHTML = html;

            if (includeQrCode) {
                const codeElement = document.getElementById("qrcode");
                if (codeElement) {
                    new QRCode(codeElement, {
                        text: window.location.origin + window.location.pathname + "#/" + eventId,
                        width: 100,
                        height: 100
                    });
                }
            }

            callback(urlParts);

            resultsPane.style.display = "";

        }).catch((err) => {

            console.log('Failed to retrieve the HTML report.', err);

            errorPane.innerHTML = "Failed to retrieve the HTML report.";
            errorPane.style.display = "";
            loadingPane.style.display = "none";
            resultsPane.style.display = "none";
        });
}

function buildDetailedReportUrl(eventId, databaseId, meetId, teamId, includeScores, includeCurrentQuestion) {

    const urlSegments = ["/", eventId, "/Databases/", databaseId, "/Reports/", meetId, "/Detailed"];

    urlSegments.push("?qrid=qrcode");
    if (null != teamId && (typeof (teamId) != "string" || 0 != teamId.length)) {
        urlSegments.push("&tid=" + encodeURIComponent(teamId));
    }

    if (includeScores) {
        urlSegments.push("&s=true");
    }

    if (includeCurrentQuestion) {
        urlSegments.push("&q=true");
    }

    return urlSegments.join("");
}

// Registers the event handler to handle changing the URL.
window.onhashchange = loadLiveEventsFromCurrentHash;