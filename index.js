var RTMClient = require('../rtm'),
    repl = require('repl'),
    optimist = require('optimist'),
    argv = optimist
        .describe('help', 'Show this help message, then exit.')
        .default(require('./config'))
        .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}

var client = new RTMClient(argv);

repl.start({}).context.client = client;