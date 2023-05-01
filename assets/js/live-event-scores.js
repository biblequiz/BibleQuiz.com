import axios from 'axios';

function loadEventScores(id) {
    const loadingPane = document.getElementById("loadingPane");
    const resultsPane = document.getElementById("resultsPane");
    loadingPane.style.display = "";
    resultsPane.style.display = "none";

    alert("Load Scores for " + id);
}