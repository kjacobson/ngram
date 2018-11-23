const formattedTime = require('./formatted-time');

const app = ({numWords, ngram, inputValue, hash, words, remainingTime, originalTime, win, lose}) => {
    const showMinutes = originalTime / 60 >= 1;
    return (
        nav() +
        h1(numWords, ngram) +
        form(inputValue) +
        scoreBoard(words, hash, win, lose) +
        timerContainer(remainingTime, showMinutes) +
        (win ? winNotification() : '')
    );
};

const nav = () => {
    return `<nav>
        <a href="/">TopWords.me</a>
        <a href="#settings" class="settings-link">Settings</a>
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
    return `<form>
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

module.exports = { appTemplate : app, timerTemplate : timer };
