'use strict';

const atlasSearchURL = 'https://www.boardgameatlas.com/api';
const atlasClientId = 'client_id=wGoq3sNRE5';
const bggSearchURL = 'https://www.boardgamegeek.com/xmlapi2';

function toXMLDoc(responseText) {
    // convert text to XML Doc

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    return xmlDoc;
}

function makeStringOfIds(xmlDoc) {
    // iterate over items in Doc, extract IDS, join them into one long string

    const gamesXML = xmlDoc.getElementsByTagName('item');
    
    const idsArray = [];
    for (let i = 0; i < gamesXML.length; i++) {
        idsArray.push(gamesXML[i].getAttribute('id'));
    }
    const idsString = idsArray.join();
    return idsString;
}

function sortByPopularity(gamesXML) {
    const games = [];
    const seen = [];

    for (let i = 0; i < gamesXML.length; i++) {
        const id = gamesXML[i].getAttribute('id');
        if (!seen.includes(id)) {
            seen.push(id);
            games.push({
                index: i,
                numOfRatings: gamesXML[i].getElementsByTagName('usersrated')[0].getAttribute('value')
            })
        } 
    }

    games.sort((a, b) => b.numOfRatings - a.numOfRatings);
    return games;
}

function displaySearchResults(responseText) {
    // make xml doc of response, loop through games

    const xmlDoc = toXMLDoc(responseText);
    const games = xmlDoc.getElementsByTagName('item');

    const orderByPopularity = sortByPopularity(games);
    console.log(xmlDoc);

    $('.results').html('<ul></ul>');

    for (let i = 0; i < orderByPopularity.length; i++) {
        const index = orderByPopularity[i].index;
        const name = games[index].getElementsByTagName('name')[0].getAttribute('value');
        const thumb = games[index].getElementsByTagName('thumbnail')[0].innerHTML;
        const aveRating = games[index].getElementsByTagName('average')[0].getAttribute('value');
        const id = games[index].getAttribute('id');
        $('.results ul').append(
            `<li class="results-item">
                <img src='${thumb}' height='75' alt='${name} box artwork'>
                <a href='' class='game' data-id='${id}'>${name}</a>
                <br>
                <span>Average Rating: ${aveRating}</span>
            </li>`
        );
    }

    $('.results').removeClass('hidden');
    $('.links').addClass('hidden');
}

function getSearchResultsFromIds(responseText) {
    // use fetch to get search results from ids from Board Game Geek
    
    const xmlDoc = toXMLDoc(responseText);
    const idsString = makeStringOfIds(xmlDoc);

    const url = bggSearchURL + '/thing?id=' + idsString + '&stats=1';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => displaySearchResults(responseText))
        .catch(e => console.log(e))
}

function getSearchIds(searchTerm) {
    // use fetch to get ids of search results from Board Game Geek

    const url = bggSearchURL + '/search?query=' + encodeURIComponent(searchTerm) + '&type=boardgame,boardgameexpansion'

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => getSearchResultsFromIds(responseText))
        .catch(err => console.log(err))
}

function handleSubmitSearch() {
    // listen for submit and run function for search

    $('form').on('submit', function(e) {
        e.preventDefault();
        const searchTerm = $('input').val().toLowerCase();
        getSearchIds(searchTerm);
    })
}

function displayGameInfo(game) {
    //  clear the results, build html for game info and populate it with arguments passed in

    $('.results').empty();
    $('.results').append(
        `<h2>${game.name}</h2>
        <img src='${game.picture}' height='200'>
        <p>Overall Rank: ${game.rank} | Average Rating: ${game.average} | Out of ${game.usersrated} ratings</p>
        <p>Age: ${game.minAge}+ | Playtime: ${game.playTime} minutes | Number of Players: ${game.minPlayers}-${game.maxPlayers}</p>
        <br>
        <p>${game.description}</p>
        <br>
        <h3>Categories</h3>
        <ul class='categories'></ul>
        <h3>Mechanics</h3>
        <ul class='mechanics'></ul>
        <h3>Families</h3>
        <ul class='families'></ul>
        <h3>Expansions</h3>
        <ul class='expansions'></ul>`
    )
    for (let i = 0; i < game.categories.length; i++) {
        $('.categories').append(`<li>${game.categories[i]}</li>`);
    }
    for (let i = 0; i < game.mechanics.length; i++) {
        $('.mechanics').append(`<li>${game.mechanics[i]}</li>`);
    }
    for (let i = 0; i < game.families.length; i++) {
        $('.families').append(
            `<li>
                <a href='' class='family' data-id='${game.families[i].id}'>
                    ${game.families[i].name}
                </a>
            </li>`
        );
    }
    for (let i = 0; i < game.expansions.length; i++) {
        $('.expansions').append(
            `<li>
                <a href='' class='expansion game' data-id='${game.expansions[i].id}'>
                    ${game.expansions[i].name}
                </a>
            </li>`
        );
    }
}

function extractGameInfo(responseText) {
    // make variables for each part of the game info and run function to display the game and info

    const gameXML = toXMLDoc(responseText).getElementsByTagName('item')[0];
    console.log(gameXML);
    const game = {};
    game.name = gameXML.getElementsByTagName('name')[0].getAttribute('value');
    game.picture = gameXML.getElementsByTagName('image')[0].textContent;
    game.rank = gameXML.getElementsByTagName('rank')[0].getAttribute('value');
    game.average = gameXML.getElementsByTagName('average')[0].getAttribute('value');
    game.usersrated = gameXML.getElementsByTagName('usersrated')[0].getAttribute('value');
    game.description = gameXML.getElementsByTagName('description')[0].textContent.replace(/&#10;/g, '<br>');
    game.yearPublished = gameXML.getElementsByTagName('yearpublished')[0].getAttribute('value');
    game.minPlayers = gameXML.getElementsByTagName('minplayers')[0].getAttribute('value');
    game.maxPlayers = gameXML.getElementsByTagName('maxplayers')[0].getAttribute('value');
    game.minPlayTime = gameXML.getElementsByTagName('minplaytime')[0].getAttribute('value');
    game.maxPlayTime = gameXML.getElementsByTagName('maxplaytime')[0].getAttribute('value');
    game.playTime = gameXML.getElementsByTagName('playingtime')[0].getAttribute('value');
    game.minAge = gameXML.getElementsByTagName('minage')[0].getAttribute('value');
    const linksXML = gameXML.getElementsByTagName('link');
    game.categories = [];
    game.mechanics = [];
    game.families = [];
    game.expansions = [];
    for (let i = 0; i < linksXML.length; i++) {
        const type = linksXML[i].getAttribute('type');
        const value = linksXML[i].getAttribute('value');
        const id = linksXML[i].getAttribute('id');
        if (type === 'boardgamecategory') {
            game.categories.push(value);
        } else if (type === 'boardgamemechanic') {
            game.mechanics.push(value);
        } else if (type === 'boardgamefamily') {
            game.families.push({
                id: id,
                name: value
            });
        } else if (type === 'boardgameexpansion') {
            game.expansions.push({
                id: id,
                name: value
            });
        }
    }
    
    console.log(game);
    displayGameInfo(game);
}

function getGameInfo(id) {
    // use fetch to get game info from id from Board Game Geek

    const url = bggSearchURL + '/thing?id=' + id + '&stats=1';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => extractGameInfo(responseText))
        .catch(e => console.log(e))
}

function handleClickGame() {
    // listen for click on game and run functions to display info about game

    $('.results').on('click', '.game', function(e) {
        e.preventDefault();
        getGameInfo($(this).attr('data-id'));
    })
}

function familyIdsToString(htmlCollection) {
    //

    const idArray = [];
    for (let i = 0; i < htmlCollection.length; i++) {
        idArray.push(htmlCollection[i].getAttribute('id'));
    }
    const idsString = idArray.join();
    return idsString;
}

function displayFamilyResults(responseText, family, description) {
    //

    const xmlDoc = toXMLDoc(responseText);
    const games = xmlDoc.getElementsByTagName('item');

    const orderByPopularity = sortByPopularity(games);
    console.log(xmlDoc);

    $('.results').html(
        `<h2>${family}</h2>
        <p>${description}</p>
        <ul></ul>`
    );

    for (let i = 0; i < orderByPopularity.length; i++) {
        const index = orderByPopularity[i].index;
        const name = games[index].getElementsByTagName('name')[0].getAttribute('value');
        const thumb = games[index].getElementsByTagName('thumbnail')[0].innerHTML;
        const aveRating = games[index].getElementsByTagName('average')[0].getAttribute('value');
        const id = games[index].getAttribute('id');
        $('.results ul').append(
            `<li class="results-item">
                <img src='${thumb}' height='75' alt='${name} box artwork'>
                <a href='' class='game' data-id='${id}'>${name}</a>
                <br>
                <span>Average Rating: ${aveRating}</span>
            </li>`
        );
    }
}

function getFamilyIds(responseText) {
    //

    const xmlDoc = toXMLDoc(responseText);
    const family = xmlDoc.getElementsByTagName('name')[0].getAttribute('value');
    const description = xmlDoc.getElementsByTagName('description')[0].textContent.replace(/&#10;/g, '<br>');
    const htmlCollection = xmlDoc.getElementsByTagName('link')
    const idsString = familyIdsToString(htmlCollection);
    console.log(xmlDoc);

    const url = bggSearchURL + '/thing?id=' + idsString + '&stats=1';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => displayFamilyResults(responseText, family, description))
        .catch(e => console.log(e))
}

function getFamilies(id) {
    // 

    const url = bggSearchURL + '/family?id=' + id;

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => getFamilyIds(responseText))
        .catch(e => console.log(e))

}

function handleClickFamily() {
    // listen for click on a family and run functions to display search results for that family

    $('.results').on('click', '.family', function(e) {
        e.preventDefault();
        getFamilies($(this).attr('data-id'));
    })
}

function loadStartFunctions() {
    // run event listeners

    handleSubmitSearch();
    handleClickGame();
    handleClickFamily();
}

$(loadStartFunctions());