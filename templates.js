const formattedTime = require('./formatted-time');

const app = ({numWords, ngramLength, ngram, inputValue, hash, words, remainingTime, originalTime, win, lose, editingSettings}) => {
    const showMinutes = originalTime / 60 >= 1;
    return (
        nav() +
        h1(numWords, ngram) +
        form(inputValue) +
        timerContainer(remainingTime, showMinutes) +
        scoreBoard(words, hash, win, lose) +
        (win ? winNotification() : '') +
        (editingSettings ? settingsEditor(ngramLength, numWords, originalTime) : '')
    );
};

const nav = () => {
    return `<nav>
        <a href="/">TopWords.me</a>
        <a href="#settings" id="settingsLink" class="settings-link">Settings</a>
    </nav>`;
};

const h1 = (numWords, ngram) => {
    return `<h1>
      Top ${numWords} words starting with
      <var>${ngram}</var>
    </h1>`;
};

const scoreBoard = (words, hash, win, lose) => {
    return `<ol>
        ${words.map(wordBlank(hash, win, lose)).join('\n')}
    </ol>`;
};

const wordBlank = (hash, win, lose) => (word) => {
    const guessed = hash[word];
    return `<li class="${guessed ? 'correct recent' : (lose ? 'incorrect' : '')}">${guessed || win || lose ? word : '&nbsp'}</li>`;
};

const form = (inputValue) => {
    return `<form class="guess-word">
        <input type="text"
            id="guessInput"
            value="${inputValue}"
            placeholder="Type your guess"
            autocapitalize="off" 
            autocomplete="off"
            spellcheck="false" 
            autocorrect="off" />
    </form>`;
};

const timerContainer = (remaining, showMinutes) => {
    return `<div id="timerContainer">
        ${timer(remaining, showMinutes)}
    </div>`;
};

const timer = (remaining, showMinutes) => {
    return `<time id="remainingTime" class="${remaining < 10 ? 'low-remainder' : ''}">${formattedTime(remaining, showMinutes)}</time>`;
};

const winNotification = () => {
    return '<h2 id="winNotification">🎉 You won! 🎉</h2>';
};

const settingsEditor = (ngramLength, numWords, originalTime) => {
    return `<aside id="settingsEditor">
        <h2>Edit settings</h2>
        <form id="settingsForm" class="settings-editor">
            <label for="numberOfLettersSelector">Number of letters</label>
            <select id="numberOfLettersSelector" name="ngramLength">
                <option value="2" ${ngramLength === 2 ? 'selected' : ''}>2</option>
                <option value="3" ${ngramLength === 3 ? 'selected' : ''}>3</option>
            </select>

            <label for="numberOfWordsSelector">Number of words</label>
            <select id="numberOfWordsSelector" name="numWords">
                <option value="3" ${numWords === 3 ? 'selected' : ''}>3</option>
                <option value="5" ${numWords === 5 ? 'selected' : ''}>5</option>
            </select>

            <label for="timeLimitSelector">Time limit</label>
            <select id="timeLimitSelector" name="time">
                <option value="30" ${originalTime === 30 ? 'selected' : ''}>30 seconds</option>
                <option value="45" ${originalTime === 45 ? 'selected' : ''}>45 seconds</option>
                <option value="60" ${originalTime === 60 ? 'selected' : ''}>1 minute</option>
                <option value="120" ${originalTime === 120 ? 'selected' : ''}>2 minutes</option>
            </select>

            <button type="submit">
                Play
            </button>
            <a href="#" id="cancelEditSettings">Cancel</a>
        </form>
    </aside>`;
};

module.exports = { appTemplate : app, timerTemplate : timer };
