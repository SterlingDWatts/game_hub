'use strict';

const ATLAS_SEARCH_URL = 'https://www.boardgameatlas.com/api';
const ATLAS_CLIENT_ID = 'client_id=wGoq3sNRE5';
const BGG_SEARCH_URL = 'https://www.boardgamegeek.com/xmlapi2';
const $hotness = $('.hotness');
const $viewTheHotness = $('.view-the-hotness');
const $results = $('.results');
const $spinner = $('.spinner-div');

function toXMLDoc(responseText) {
    // convert text to XML Doc

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(responseText, 'text/xml');
    return xmlDoc;
}

function displayTheHotness(responseText) {
    // use text from fetch to populate the top ten hottest games
    
    const xmlDoc = toXMLDoc(responseText);
    const games = xmlDoc.getElementsByTagName('item');

    for (let i = 0; i < 10; i++) {
        const name = games[i].getElementsByTagName('name')[0].getAttribute('value');
        const thumb = games[i].getElementsByTagName('thumbnail')[0].getAttribute('value');
        const rank = i + 1;
        const id = games[i].getAttribute('id');
        const yearPublished = games[i].getElementsByTagName('yearpublished')[0].getAttribute('value');

        $('.hotness-list').append(
            `<li class='hotness-list-item' data-id='${id}'>
                <img class='hotness-thumb left-float' src='${thumb}' width='80' alt='${name} box artwork'>
                <div>
                    <a href='' class='game'>
                        ${name}<span class='medium'> | ${yearPublished}</span>
                    </a>
                    <br>
                    <span class='small'>${yearPublished} | </span><span>Rank: ${rank}</span>
                </div>
            </li>`
        )
    }
}

function fetchTheHotness() {
    // fetch the top ten hottest items on Board Game Geek

    let url = BGG_SEARCH_URL + '/hot?TYPE=boardgame'

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText);
        })
        .then(responseText => {
            displayTheHotness(responseText);
        })
        .catch(e => console.log(e))
}

function shrinkTheSearchArea() {
    $('header').addClass('one-point-five-em');
    $('form, .search').addClass('small-padding');
    $viewTheHotness.removeClass('hidden');
    $hotness.addClass('hidden');
    $('.buttons').removeClass('inline-block');
    $('button').html('Search')
    $('.search, .linen-background').addClass('initial-height');
    $('header').addClass('no-padding');
    $('label').addClass('hidden');
}

function displayGameInfo(game) {
    //  clear the results, build html for game info and populate it with arguments passed in

    shrinkTheSearchArea();
    $results.empty();
    $results.append(
        `<h2 class='game-name'>${game.name}</h2>
        <div class='pic-and-stats'>
            <img src='${game.picture}' height='200'>
            <div class='stats'>
                <div class='trait'>${game.usersRated} Ratings</div>
                <div class='trait'>Rank: ${game.rank}</div>
                <div class='trait'>Rating: ${parseFloat(game.average).toFixed(1)}</div>
            </div>
            <div class='age-playtime-players'>
                <div class='trait'>Age: ${game.minAge}+</div>
                <div class='trait'>${game.minPlaytime}-${game.maxPlaytime} Mins</div>
                <div class='trait'>${game.minPlayers}-${game.maxPlayers} Players</div>
            </div>
        </div>
        <br>
        <p class='left-justified'>${game.description}</p>
        <div class='groups'>
            <div class='categories-div group'>
                <h3>Categories</h3>
                <ul class='categories'>${arrayToLiHtmlString(game.categories)}</ul>
            </div>
            <div class='mechanics-div group'>
                <h3>Mechanics</h3>
                <ul class='mechanics'>${arrayToLiHtmlString(game.mechanics)}</ul>
            </div>
            <div class='families-div group'>
                <h3>Families</h3>
                <ul class='families'></ul>
            </div>
            <div class='expansions-div group'>
                <h3>Expansions</h3>
                <ul class='expansions'></ul>
            </div>
        </div>`
    )
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
    window.scrollTo(0,0);
    $results.removeClass('hidden');
}

function setGameObject(gameObj, gameXML) {
    //

    const attributes = ['name', 'rank', 'average', 'usersRated', 'yearPublished', 'minPlayers', 'maxPlayers', 'minPlaytime', 'maxPlaytime', 'playingTime', 'minAge'];
    let attribute;

    for (attribute of attributes) {
        gameObj[attribute] = gameXML.getElementsByTagName(attribute.toLowerCase())[0].getAttribute('value');
    }

    gameObj.picture = gameXML.getElementsByTagName('image')[0].textContent;
    gameObj.description = gameXML.getElementsByTagName('description')[0].textContent.replace(/&#10;/g, '<br>');

    const linksXML = gameXML.getElementsByTagName('link');
    gameObj.categories = [];
    gameObj.mechanics = [];
    gameObj.families = [];
    gameObj.expansions = [];
    for (let i = 0; i < linksXML.length; i++) {
        const type = linksXML[i].getAttribute('type');
        const value = linksXML[i].getAttribute('value');
        const id = linksXML[i].getAttribute('id');
        if (type === 'boardgamecategory') {
            gameObj.categories.push(value);
        } else if (type === 'boardgamemechanic') {
            gameObj.mechanics.push(value);
        } else if (type === 'boardgamefamily') {
            gameObj.families.push({
                id: id,
                name: value
            });
        } else if (type === 'boardgameexpansion') {
            gameObj.expansions.push({
                id: id,
                name: value
            });
        }
    }
}

function extractGameInfo(responseText) {
    // make variables for each part of the game info and run function to display the game and info

    const gameXML = toXMLDoc(responseText).getElementsByTagName('item')[0];
    const game = {};
    setGameObject(game, gameXML);

    displayGameInfo(game);
}

function getGameInfo(id) {
    // use fetch to get game info from id from Board Game Geek

    const url = BGG_SEARCH_URL + '/thing?id=' + id + '&stats=1';

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

function handleClickHotnessGame() {
    //

    $hotness.on('click', '.hotness-list-item', function(e) {
        e.preventDefault();
        getGameInfo($(this).attr('data-id'));
    })
}

function makeIdsCSV(xmlDoc) {
    // iterate over items in Doc, extract IDS, join them into one long string

    const gamesXML = xmlDoc.getElementsByTagName('item');
    
    const idsArray = [];
    for (let i = 0; i < gamesXML.length; i++) {
        idsArray.push(gamesXML[i].getAttribute('id'));
    }
    return idsArray.join();
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

    $spinner.addClass('hidden');
    $results.html('<ul></ul>');

    for (let i = 0; i < orderByPopularity.length; i++) {
        try {
            const index = orderByPopularity[i].index;
            const name = games[index].getElementsByTagName('name')[0].getAttribute('value');
            const thumb = games[index].getElementsByTagName('thumbnail')[0].innerHTML;
            const aveRating = parseFloat(games[index].getElementsByTagName('average')[0].getAttribute('value')).toFixed(2);
            const id = games[index].getAttribute('id');
            $('.results ul').append(
                `<li class='results-item' data-id='${id}'>
                    <img src='${thumb}'  width='80' alt='${name} box artwork'>
                    <div>
                        <a href='' class='game'>
                            ${name}
                        </a>
                        <br>
                        <span>Rating: ${aveRating}</span>
                    </div>
                </li>`
            );
        }
        catch {
            console.log(`No box art on game # ${i + 1}`)
        }
    }

    $('.hotness h2, .hotness ul').addClass('hidden');
    shrinkTheSearchArea();
    $results.removeClass('hidden');
    window.scrollTo(0,0);
}

function getSearchResultsFromCsvOfIds(csvOfIds) {
    // use fetch to get search results from ids from Board Game Geek

    const url = BGG_SEARCH_URL + '/thing?id=' + csvOfIds + '&stats=1';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => displaySearchResults(responseText))
        .catch(e => {
            $spinner.addClass('hidden')
        })
}

function responseTextToCsvOfIds(responseText) {
    const xmlDoc = toXMLDoc(responseText);
    return makeIdsCSV(xmlDoc); 
}

function getSearchIds(searchTerm) {
    // use fetch to get ids of search results from Board Game Geek

    const url = BGG_SEARCH_URL + '/search?query=' + encodeURIComponent(searchTerm) + '&type=boardgame,boardgameexpansion'

    $spinner.css('top', '0')
    $spinner.removeClass('hidden');

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => getSearchResultsFromCsvOfIds(responseTextToCsvOfIds(responseText)))
        .catch(err => {
            $spinner.addClass('hidden');
        })
}

function handleSubmitSearch() {
    // listen for submit and run function for search

    $('form').on('submit', function(e) {
        e.preventDefault();
        const searchTerm = $('input').val().toLowerCase();
        getSearchIds(searchTerm);
    })
}

function arrayToLiHtmlString(anArray) {
    //

    return '<li>' + anArray.join('</li><li>') + '</li>';
}

function handleClickGame() {
    // listen for click on game and run functions to display info about game

    $results.on('click', '.results-item', function(e) {
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

    $spinner.addClass('hidden');

    $results.html(
        `<h2>${family}</h2>
        <p>${description}</p>
        <ul></ul>`
    );

    for (let i = 0; i < orderByPopularity.length; i++) {
        try {
            const index = orderByPopularity[i].index;
            const name = games[index].getElementsByTagName('name')[0].getAttribute('value');
            const thumb = games[index].getElementsByTagName('thumbnail')[0].innerHTML;
            const aveRating = games[index].getElementsByTagName('average')[0].getAttribute('value');
            const id = games[index].getAttribute('id');
            $('.results ul').append(
                `<li class="results-item" data-id='${id}'>
                    <img src='${thumb}' height='75' alt='${name} box artwork'>
                    <a href='' class='game'>${name}</a>
                    <br>
                    <span>Average Rating: ${aveRating}</span>
                </li>`
            );
        }
        catch {
            console.log(`No box art on game # ${i + 1}`);
        }
    }
    window.scrollTo(0,0);
}

function displayWithoutPictures(responseText, family, description) {
    //

    const xmlDoc = toXMLDoc(responseText);
    const games = xmlDoc.getElementsByTagName('link');

    $spinner.addClass('hidden')

    $results.html(
        `<h2>${family}</h2>
        <p>${description}</p>
        <ul></ul>`
    );

    for (let i = 0; i < games.length; i++) {
        try {
            const name = games[i].getAttribute('value');
            const id = games[i].getAttribute('id');
            $('.results ul').append(
                `<li class='results-item' data-id='${id}'>
                    <a href='' class='game'>${name}</a>
                </li>`
            );
        }
        catch {
            console.log(`No box art on game # ${i + 1}`);
        }
    }
    window.scrollTo(0,0);
}

function getFamilyIds(responseText) {
    //

    const xmlDoc = toXMLDoc(responseText);
    const family = xmlDoc.getElementsByTagName('name')[0].getAttribute('value');
    const description = xmlDoc.getElementsByTagName('description')[0].textContent.replace(/&#10;/g, '<br>');
    const htmlCollection = xmlDoc.getElementsByTagName('link')
    const idsString = familyIdsToString(htmlCollection);

    const url = BGG_SEARCH_URL + '/thing?id=' + idsString + '&stats=1';

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => displayFamilyResults(responseText, family, description))
        .catch(e => displayWithoutPictures(responseText, family, description))
}

function getFamilies(id) {
    // 

    const url = BGG_SEARCH_URL + '/family?id=' + id;
    console.log(`fetching family: ${id} from ${url}`)

    $spinner.removeClass('hidden');
    $spinner.css('top', window.pageYOffset)

    fetch(url)
        .then(response => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(response.statusText)
        })
        .then(responseText => getFamilyIds(responseText))
        .catch(e => {
            console.log(e);
            $spinner.addClass('hidden');
        })

}

function handleClickFamily() {
    // listen for click on a family and run functions to display search results for that family

    $results.on('click', '.family', function(e) {
        e.preventDefault();
        getFamilies($(this).attr('data-id'));
    })
}

function loadStartFunctions() {
    // run event listeners and starting functions

    fetchTheHotness();
    handleClickHotnessGame();
    handleSubmitSearch();
    handleClickGame();
    handleClickFamily();
}

$(loadStartFunctions());

/* 
For each result in api2 let score = 0; 
if(api1.name === result.name) { 
    // exact match 
    exactMapArray.push(result); 
    // you may want to break 
    break; 
} 
if(result.name.isASubStringOf(api1.name)) { score++; } 
if(api1.name.isASubstringOf(result.name)) { score++; } 
if(api1.year === result.year){ score++; } 
// may also want this check to be a substring check 
// may also want to convert to all lower case 
if(api1.author === result.author) {

}

result.score = score;

*/