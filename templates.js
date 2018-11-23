const app = ({numWords, ngram, inputValue, hash, words, remainingTime}) => {
    const gameOver = remainingTime === '00';
    return (
        nav() +
        h1(numWords, ngram) +
        scoreBoard(words, hash, gameOver) +
        form(inputValue) +
        timerCountainer(remainingTime)
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

const scoreBoard = (words, hash, gameOver) => {
    return `<ol>
        ${words.map(wordBlank(hash, gameOver)).join('\n')}
    </ol>`;
};

const wordBlank = (hash, gameOver) => (word) => {
    const guessed = hash[word];
    return `<li class="${guessed ? 'correct recent' : ''}">${guessed || gameOver ? word : '&nbsp'}</li>`;
};

const form = (inputValue) => {
    return `<form>
        <input type="text"
            id="guessInput"
            value="${inputValue}"
            placeholder="Type your guess here"
            autocapitalize="off" 
            autocomplete="off"
            spellcheck="false" 
            autocorrect="off" />
    </form>`;
};

const timerCountainer = (remaining) => {
    return `<div id="timerCountainer">
        ${timer(remaining)}
    </div>`;
};

const timer = (remaining) => {
    return `<time id="remainingTime" class="${remaining < 10 ? 'low-remainder' : ''}">${remaining}</time>`;
};

module.exports = { appTemplate : app, timerTemplate : timer };
