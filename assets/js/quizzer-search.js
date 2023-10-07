import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@6.6.2/dist/fuse.esm.js'

// Pre-process the quizzers.
function getSeasonHtml(urls) {
    const seasons = Object.keys(urls);

    let html = "";
    let initialSeason = -1;
    let lastSeason = -1;
    let pageCount = 0;
    for (let i = 0; i < seasons.length; i++) {
        const season = Number.parseInt(seasons[i]);
        pageCount += urls[season].length;

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

    return { pages: pageCount, html: html };
}

const allQuizzersAndPages = await (await fetch('/quizzerIndex.json')).json();
const allQuizzers = allQuizzersAndPages.quizzers;
const allPages = allQuizzersAndPages.pages;

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
    let pageCount = 0;
    let seasonHtml = "";
    if (quizzer.t) {
        if (quizzer.t.s) {
            const seasonInfo = getSeasonHtml(quizzer.t.s);
            seasonHtml = `<i>TBQ:</i> ${seasonInfo.html}`;
            pageCount += seasonInfo.pages;
        }

        if (quizzer.t.n) {
            pageCount += quizzer.t.n.length;
        }
    }

    if (quizzer.j) {
        if (quizzer.j.s) {
            const seasonInfo = getSeasonHtml(quizzer.j.s);
            if (seasonHtml.length > 0) {
                seasonHtml += "<br />";
            }

            seasonHtml += `<i>JBQ:</i> ${seasonInfo.html}`;
            pageCount += seasonInfo.pages;
        }

        if (quizzer.j.n) {
            pageCount += quizzer.j.n.length;
        }
    }

    quizzer.seasonHtml = seasonHtml;
    quizzer.pageCount = pageCount;

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
const searchButton = document.getElementById("search-button");
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
            const pagesCell = document.createElement("td");
            pagesCell.style.textAlign = "right";
            pagesCell.innerText = quizzer.pageCount;

            const row = document.createElement("tr");
            row.appendChild(nameCell);
            row.appendChild(seasonsCell);
            row.appendChild(pagesCell);

            resultsTableBody.appendChild(row);
        }
    }
    else {
        const cell = document.createElement("td");
        cell.colSpan = 3;
        cell.style.textAlign = "center";
        cell.innerHTML = "<i>No matching Quizzers can be found.</i>";

        const row = document.createElement("tr");
        row.appendChild(cell);

        resultsTableBody.appendChild(row);
    }
}

function addUrlRows(season, type, pageIds) {
    for (let i = 0; i < pageIds.length; i++) {

        const page = allPages[pageIds[i]];
        const url = page.u;

        const pageLink = document.createElement("a");
        pageLink.href = url;
        pageLink.target = "_blank";
        pageLink.innerText = page.t;

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

    window.onkeyup = closeModal;

    let name = quizzer.n;
    if (quizzer.on) {
        name += ` (${quizzer.on.join(', ')})`;
    }

    scoresModalTitle.innerText = `${name} - ${quizzer.pageCount} Page(s)`;

    scoresModalTableBody.innerHTML = "";
    if (quizzer.t) {
        if (quizzer.t.s) {
            for (const season in quizzer.t.s) {
                addUrlRows(season, "TBQ", quizzer.t.s[season]);
            }
        }

        if (quizzer.t.n) {
            addUrlRows(null, "TBQ", quizzer.t.n);
        }
    }

    if (quizzer.j) {
        if (quizzer.j.s) {
            for (const season in quizzer.j.s) {
                addUrlRows(season, "JBQ", quizzer.j.s[season]);
            }
        }

        if (quizzer.j.n) {
            addUrlRows(null, "JBQ", quizzer.j.n);
        }
    }

    scoresModal.classList.add("is-active");
}

// Update the event handlers.
searchBox.onchange = updateSearchResult;
searchButton.onclick = updateSearchResult;
searchBox.onkeyup = e => {
    if (e.keyCode === 13 || e.keyCode === 10) {
        updateSearchResult();
    }
};

scoresModalClose.onclick = () => scoresModal.classList.remove("is-active");

window.changeTabLetter = changeTabLetter;