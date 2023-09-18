import allPages from '/pages.json' assert {type: 'json'};
import allQuizzers from '/quizzers.json' assert {type: 'json'};
import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js'

// Pre-process the quizzers.
function getSeasonHtml(urls) {
    const seasons = Object.keys(urls);

    let html = "";
    let initialSeason = -1;
    let lastSeason = -1;
    let eventCount = 0;
    for (let i = 0; i < seasons.length; i++) {
        const season = Number.parseInt(seasons[i]);
        eventCount += urls[season].length;

        if (-1 == initialSeason) {
            initialSeason = season;
            lastSeason = season;
        }
        else if (season == lastSeason + 1) {
            lastSeason++;
        }
        else {
            let rangeHtml = initialSeason == lastSeason
                ? initialSeason.toString()
                : `${initialSeason} - ${lastSeason}`;

            if (html.length > 0) {
                html += ", ";
            }

            html += rangeHtml;

            initialSeason = season;
            lastSeason = season;
        }
    }

    let remainingRangeHtml = initialSeason == lastSeason
        ? initialSeason.toString()
        : `${initialSeason} - ${lastSeason}`;

    if (html.length > 0) {
        html += ", ";
    }

    html += remainingRangeHtml;

    return { events: eventCount, html: html };
}

const indexedQuizzers = {};
for (let i = 0; i < allQuizzers.length; i++) {
    const quizzer = allQuizzers[i];

    // Update the index for this quizzer.
    let quizzersForLetter = indexedQuizzers[quizzer.l];
    if (!quizzersForLetter) {
        quizzersForLetter = [];
        indexedQuizzers[quizzer.l] = quizzersForLetter;
    }

    quizzersForLetter.push(quizzer);

    // Pre-process the seasons.
    let eventCount = 0;
    let seasonHtml = "";
    if (quizzer.t) {
        const seasonInfo = getSeasonHtml(quizzer.t);
        seasonHtml = `<i>TBQ:</i> ${seasonInfo.html}`;
        eventCount += seasonInfo.events;
    }

    if (quizzer.j) {
        const seasonInfo = getSeasonHtml(quizzer.j);
        if (seasonHtml.length > 0) {
            seasonHtml += "<br />";
        }

        seasonHtml += `<i>JBQ:</i> ${seasonInfo.html}`;
        eventCount += seasonInfo.events;
    }

    quizzer.seasonHtml = seasonHtml;
    quizzer.eventCount = eventCount;

    // Pre-process the names.
    let nameHtml = quizzer.n;
    if (quizzer.on && quizzer.on.length > 0) {
        for (let n = 0; n < quizzer.on.length; n++) {
            nameHtml += `<br /><i>${quizzer.on[n]}</i>`;
        }
    }

    quizzer.nameHtml = nameHtml;
}

// Capture the controls.
const searchBox = document.getElementById('search-input');
const listTabs = document.getElementById("list-tabs");
const resultsTableBody = document.getElementById('results-table-body');

const scoresModal = document.getElementById('scores-modal');
const scoresModalTitle = document.getElementById('scores-modal-title');
const scoresModalTableBody = document.getElementById('scores-modal-table-body');
const scoresModalClose = document.getElementById('scores-modal-close');

// Setup the handler for when the tab changes.
let currentTabLetter = "";
export function changeTabLetter(newTabLetter) {
    if (currentTabLetter !== newTabLetter) {
        if (currentTabLetter.length > 0) {
            document.getElementById("tab" + currentTabLetter).className = "";
        }

        currentTabLetter = newTabLetter;

        document.getElementById("tab" + currentTabLetter).className = "is-active";

        updateSearchResult();
    }
}

changeTabLetter("A");

// Configure the search index.
const fuseOptions = {
    shouldSort: false,
    includeScore: true,
    ignoreLocation: true,
    keys: ["n"],
    threshold: 0.4
};

const fuseIndex = new Fuse(allQuizzers, fuseOptions);

function updateSearchResult() {

    // Generate the list of quizzers.
    let results;
    let isNestedItem;
    const text = searchBox.value;
    if (!text || text.length == 0) {
        listTabs.style.display = "";
        results = indexedQuizzers[currentTabLetter] || [];
        isNestedItem = false;
    }
    else {
        listTabs.style.display = "none";
        results = fuseIndex.search(text);
        if (results.length > 0) {

            results.sort((a, b) => {
                if (a.score < b.score) {
                    return -1;
                }
                else if (a.score > b.score) {
                    return 1;
                }
                else {
                    return 0;
                }
            });

            isNestedItem = true;
        }
    }

    // Update the HTML.
    resultsTableBody.innerHTML = "";
    if (results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const quizzer = isNestedItem ? results[i].item : results[i];

            // Create the names cell.
            const nameLink = document.createElement("a");
            nameLink.style.cursor = "pointer";
            nameLink.onclick = () => showQuizzerScores(quizzer);
            nameLink.innerHTML = quizzer.nameHtml;

            const nameCell = document.createElement("td");
            nameCell.appendChild(nameLink);

            // Create the Seasons cell.
            const seasonsCell = document.createElement("td");
            seasonsCell.innerHTML = quizzer.seasonHtml;

            // Create the Events Cell.
            const eventsCell = document.createElement("td");
            eventsCell.style.textAlign = "right";
            eventsCell.innerText = quizzer.eventCount;

            const row = document.createElement("tr");
            row.appendChild(nameCell);
            row.appendChild(seasonsCell);
            row.appendChild(eventsCell);

            resultsTableBody.appendChild(row);
        }
    }
    else {
        const cell = document.createElement("td");
        cell.colSpan = 2;
        cell.style.textAlign = "center";
        cell.innerHTML = "<i>No matching Quizzers can be found.</i>";

        const row = document.createElement("tr");
        row.appendChild(cell);

        resultsTableBody.appendChild(row);
    }
}

function addUrlRows(season, type, urlPrefix, urls) {
    for (let i = 0; i < urls.length; i++) {

        const url = urlPrefix + urls[i];

        const pageLink = document.createElement("a");
        pageLink.href = url;
        pageLink.target = "_blank";
        pageLink.innerText = allPages[url];

        const externalLink = document.createElement("i");
        externalLink.className = "fas fa-external-link-alt";

        const pageCell = document.createElement("td");
        pageCell.appendChild(pageLink);
        pageCell.appendChild(document.createTextNode(" "));
        pageCell.appendChild(externalLink);

        const typeCell = document.createElement("td");
        typeCell.innerText = type;

        const seasonCell = document.createElement("td");
        seasonCell.innerHTML = season || "&nbsp;";

        const row = document.createElement("tr");
        row.appendChild(pageCell);
        row.appendChild(typeCell);
        row.appendChild(seasonCell);
        scoresModalTableBody.appendChild(row);
    }
}

function showQuizzerScores(quizzer) {

    const closeModal = (e) => {
        if (e.keyCode === 27) {
            scoresModal.classList.remove("is-active");
            window.removeEventListener("onkeydown", closeModal);
        }
    };

    window.onkeydown = closeModal;

    let name = quizzer.n;
    if (quizzer.on) {
        name += ` (${quizzer.on.join(', ')})`;
    }

    scoresModalTitle.innerText = `${name} - ${quizzer.eventCount} Event(s)`;

    scoresModalTableBody.innerHTML = "";
    if (quizzer.t) {
        for (const season in quizzer.t) {
            addUrlRows(season, "TBQ", `/history/${season}/`, quizzer.t[season]);
        }
    }

    if (quizzer.j) {
        for (const season in quizzer.j) {
            addUrlRows(season, "JBQ", `/jbq/${season}/`, quizzer.j[season]);
        }
    }

    if (quizzer.o) {
        addUrlRows(null, "Other", "", quizzer.o);
    }

    scoresModal.classList.add("is-active");
}

// Update the event handlers.
searchBox.onchange = updateSearchResult;
searchBox.onkeyup = e => {
    if (e.keyCode === 13 || e.keyCode === 10) {
        updateSearchResult();
    }
};

scoresModalClose.onclick = () => scoresModal.classList.remove("is-active");

window.changeTabLetter = changeTabLetter;