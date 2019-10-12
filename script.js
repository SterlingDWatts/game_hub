'use strict';

/*
function getNames(responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    console.log(xmlDoc)
    const gameIds = xmlDoc.getElementsByTagName('item');
    const gameNames = xmlDoc.getElementsByTagName('name');
    const ulArray = [];

    for (let i = 0; i < gameIds.length; i++) {
        const id = gameIds[i].getAttribute('id');
        const gameName = gameNames[i].getAttribute('value');
        const string = `<li data-id=${id}>${gameName}</li>`;
        
        // .getAttribute('value');
        ulArray.push(string);
    }

    console.log(ulArray);
    displaySearchResults(ulArray.join(''));
}

function getSearchResults(query) {
    // use fetch() to GET search results from Board Game Geek API

    const url = searchURL + '/search?query=' + query;
    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText);
        })
        .then(responseText => {
            getNames(responseText);
        })
        .catch(err => {
            console.log(err);
        })
}
*/

const atlasSearchURL = 'https://www.boardgameatlas.com/api';
const atlasClientId = 'client_id=wGoq3sNRE5';
const bggSearchURL = 'https://www.boardgamegeek.com/xmlapi2';

function displaySearchResults(responseJson) {
    $('.results ul').empty();

    const games = responseJson.games;

    for (let i = 0; i < games.length; i++) {
        const htmlString = `<li><img src='${games[i].images.thumb}'><a href='#'>${games[i].name}</a></li>`;
        $('.results ul').append(htmlString);
    }

    $('.links').addClass('hidden');
    $('.results').removeClass('hidden');
}

function getSearchResults(searchTerm) {
    // use fetch to get search results from Board Game Atlas

    const url = atlasSearchURL + '/search?name=' + searchTerm + '&order_by=popularity&' + atlasClientId;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error(response.statusText)
        })
        .then(responseJson => displaySearchResults(responseJson))
        .catch(err => console.log(err))
}

function handleSubmit() {
    // listen for submit and run functions for search

    $('form').on('submit', function(e) {
        e.preventDefault();
        const searchTerm = encodeURIComponent($('input').val());
        getSearchResults(searchTerm);
    })
}

function displayGameInfo(title, picture, description) {
    // 
    $('.results ul').empty();
    $('.results').append(`<h3>${title}</h3><img src='${picture}' height='200'><p>${description}</p>`)
    console.log(title, picture, description);
}

function showGame(responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    const title = xmlDoc.getElementsByTagName('name')[0].getAttribute('value');
    const picture = xmlDoc.getElementsByTagName('image')[0].textContent;
    const description = xmlDoc.getElementsByTagName('description')[0].textContent;

    displayGameInfo(title, picture, description);
}

function getId(responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    const gameId = xmlDoc.getElementsByTagName('item')[0].getAttribute('id');
    let url = bggSearchURL + '/thing?id=' + gameId + '&stats=1';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => showGame(responseText))
        .catch(err => console.log(err));
}

function getGameInfo(gameName) {
    let url = bggSearchURL + '/search?query=' + gameName + '&exact=1&type=boardgame,boardgameaccessory,boardgameexpansion';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText =>  getId(responseText))
        .catch(err => console.log(err));
}

function handleClickGame() {
    // listen for click on link for a game

    $('.results ul').on('click', 'a', function(e) {
        e.preventDefault();
        const gameName = encodeURIComponent($(this).html());
        getGameInfo(gameName);
    })
}

function loadStartFunctions() {
    // run event listeners

    handleSubmit();
    handleClickGame();
}

$(loadStartFunctions());