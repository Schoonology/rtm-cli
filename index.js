var RTMClient = require('../rtm'),
    repl = require('repl'),
    optimist = require('optimist'),
    Cache = require('./lib/cache'),
    stepup = require('stepup'),
    argv = optimist
        .usage('Usage: $0 [command]')
        .describe('help', 'Show this help message, then exit.')
        .default(require('./config'))
        .demand([1])
        .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}

var client = new RTMClient(argv),
    command = argv._[0],
    cache = new Cache();

var commands = {
    'repl': function startRepl() {
        var context = repl.start({}).context;
        context.client = client;
        context.cache = cache;
        context.callback = function callback(err, data) {
            this.err = err;
            this.data = data;
            console.log('Done.');
        };
    },
    'list': function taskList() {
        stepup(function errorHandler(err) {
            console.error(err.stack);
        }, function openCache() {
            cache.open(this);
        }, function getToken() {
            cache.get('token', this);
        }, function checkToken(token) {
            console.log(token);
        });
    }
};

// 1. Check the current token stored in Alfred.
//  a. If valid, continue.
//  b. If invalid, log in and store the token in Alfred.
// 2. Perform the requested action.
// 3. If the requested action requires a Timeline, check for one in Alfred.
//  a. If one exists, continue.
//  b. If one doesn't exist, create a Timeline and store in Alfred.
// 4. If we ever fail, check the error result.
//  a. If it's because of a bad timeline or a bad token, remove them from Alfred and start over.

var commandFn = commands[argv._[0]];
if (commandFn == null) {
    console.error('RTM: "' + command + '" is not a valid command.');
    process.exit();
}
commandFn();
