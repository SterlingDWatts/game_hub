'use strict';

const atlasSearchURL = 'https://www.boardgameatlas.com/api';
const atlasClientId = 'client_id=wGoq3sNRE5';
const bggSearchURL = 'https://www.boardgamegeek.com/xmlapi2';

function makeNameString(gameJson) {
    const name = [gameJson.name];
    const names = name.concat(gameJson.names).reverse();
    return names.join();
}

function displaySearchResults(responseJson) {
    $('.results').empty();
    $('.results').append('<ul></ul>');

    const games = responseJson.games;

    for (let i = 0; i < games.length; i++) {
        const names = makeNameString(games[i])
        const htmlString = `<li><img src='${games[i].images.thumb}'><a href='#' data-names='${names}'>${games[i].name}</a></li>`;
        $('.results ul').append(htmlString);
    }

    $('.links').addClass('hidden');
    $('.results').removeClass('hidden');
}

function getSearchResults(searchTerm) {
    // use fetch to get search results from Board Game Atlas

    const url = atlasSearchURL + '/search?name=' + encodeURIComponent(searchTerm) + '&order_by=popularity&' + atlasClientId;

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
        const searchTerm = $('input').val();
        getSearchResults(searchTerm);
    })
}

function displayGameInfo(title, picture, description, average, usersrated, rank) {
    // 
    $('.results').empty();
    $('.results').append(
        `<h3>${title}</h3><img src='${picture}' height='200'><p>Overall Rank: ${rank} | Average Rating: ${average} | Out of ${usersrated} ratings</p><p>${description}</p>`
        )
}

function showGame(responseText) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');

    try {
        const game = xmlDoc.getElementsByTagName('item')[0];
        const title = game.getElementsByTagName('name')[0].getAttribute('value');
        const picture = game.getElementsByTagName('image')[0].textContent;
        const description = game.getElementsByTagName('description')[0].textContent.replace(/&#10;/g, '<br>');
        const average = game.getElementsByTagName('average')[0].getAttribute('value');
        const usersrated = game.getElementsByTagName('usersrated')[0].getAttribute('value');
        const rank = game.getElementsByTagName('rank')[0].getAttribute('value');
        console.log(title, picture, description, average, usersrated, rank);
        displayGameInfo(title, picture, description, average, usersrated, rank);
    }
    catch {
        console.log('No game with that ID. Honestly, I dont even know how you got to this option');
    }
}

function findBestMatch(games, searchTerm) {
    let bestMatch = 0;
    let highestScore = 0;
    console.log(`The searchTerm is ${searchTerm}`);
    console.log(games);
    for (let i = 0; i < games.length; i++) {
        const gameNameToCheck = games[i];
        console.log(gameNameToCheck);
    }
}

function getId(responseText, searchTerm, gameNames) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    try {
        const games = xmlDoc.getElementsByTagName('item');
        
        if (games.length > 1) {
            findBestMatch(games, searchTerm);
        }

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
    catch {
        console.log('There are no games with that name.\n');
        console.log(gameNames, `\n'gameNames' has ${gameNames.length} options in it.`);
        if (gameNames.length > 0) {
            console.log(`We are going to run 'getGameInfo()' again. This time searching for ${gameNames[gameNames.length -1]}\nWish me luck!`)
            getGameInfo(gameNames);
        }
    }
}

function getGameInfo(gameNames) {

    const searchTerm = gameNames.pop();
    const url = bggSearchURL + '/search?query=' + encodeURIComponent(searchTerm) + '&type=boardgame,boardgameaccessory,boardgameexpansion';
    console.log(url);

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText =>  {
            getId(responseText, searchTerm, gameNames);
        })
        .catch(err => {
            console.log(err);   
        });
}

function handleClickGame() {
    // listen for click on link for a game

    $('.results').on('click', 'ul a', function(e) {
        e.preventDefault();
        const names = $(this).attr('data-names').split(',');
        getGameInfo(names);
    })
}

function loadStartFunctions() {
    // run event listeners

    handleSubmit();
    handleClickGame();
}

$(loadStartFunctions());