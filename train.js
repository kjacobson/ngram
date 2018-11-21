const ALPHABET = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
const numLetters = 3;
const lastLetter = ALPHABET.length - 1;
let letters = Array(numLetters);
let ngrams = {};

for (let currentChar = numLetters; currentChar > 0; currentChar--) {
    for (let i = 0; i < ALPHABET.length; i++) {
        letters[currentChar - 1] = ALPHABET[i];
        letters.fill(ALPHABET[0], 0, currentChar - 1);
        ngrams[letters.join('')] = null;

        for (let currentPrior = currentChar - 1; currentPrior > 0; currentPrior--) {
            letters[currentPrior - 1] = ALPHABET[i];
            ngrams[letters.join('')] = null;
        }
    }
}
console.log(Object.keys(ngrams));
