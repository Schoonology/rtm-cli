var RTMClient = require('../rtm'),
    optimist = require('optimist'),
    argv = optimist
        .describe('help', 'Show this help message, then exit.')
        .default(require('./config'))
        .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}

var client = new RTMClient({
    apiKey: argv.apiKey,
    secret: argv.secret
});