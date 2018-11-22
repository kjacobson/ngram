const commandLineArgs = require('command-line-args')

const CliAdapter = require('./cli-adapter');
const index = require('./index');


const optionDefinitions = [
  { name: 'words', alias: 'w', type: Number, defaultValue: 5 },
  { name: 'letters', alias: 'l', type: Number, defaultValue: 3 },
  { name: 'time', alias: 't', type: Number, defaultValue: 60 }
]
const options = commandLineArgs(optionDefinitions)

index.start(new CliAdapter(), {
    numWords : options.words,
    nGramLength : options.letters,
    time : options.time
});

