const app = ({numWords, ngram, words, remainingTime}) => {
    return (
        nav +
        h1 +
        scoreBoard +
        form +
        timer
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

const scoreBoard = (words) => {
    return `<ol>
        ${words.map(wordBlank).join('\n')}
    </ol>`;
};

const wordBlank = (word) => {
    return `<li class="correct recent">${word || '&nbsp'}</li>`;
};

const form = () => {
    return `<form>
        <input type="text"
            id="guessInput"
            placeholder="Type your guess here"
            autocapitalize="off" 
            autocomplete="off"
            spellcheck="false" 
            autocorrect="off" />
    </form>`;
};

const timer = (remaining) => {
    return `<time class="${remaining > 10 ? 'low-remainder' : ''}">${remaining}</time>`;
};

module.exports = app;
