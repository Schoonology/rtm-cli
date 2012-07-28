var RTMClient = require('../rtm'),
    repl = require('repl'),
    optimist = require('optimist'),
    Cache = require('./lib/cache'),
    stepup = require('stepup'),
    open = require('open'),
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

process.stdin.resume();
process.stdin.setEncoding('utf8');

var client = new RTMClient(argv),
    command = argv._[0],
    cache = new Cache(),
    user = null;

function basicErrorHandler(err) {
    console.error(err.stack);
}

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
        stepup(basicErrorHandler, function openCache() {
            cache.open(this);
        }, function getPreviousToken() {
            cache.get('token', this);
        }, function checkToken(token) {
            if (token != null) {
                client.checkToken(token, this);
                return;
            }

            stepup(basicErrorHandler, function getAuthURL() {
                client.getDesktopAuthURL('write', this);
            }, function openAuthURL(url) {
                console.log('Once you have granted this application access to Remember the Milk, press any key to continue.');
                open(url);

                // TODO: This is where I don't like the semantics of step(up) with "this" being a Function.
                // "this" should be an Object, with (like .parallel) members for both callback and event
                // handler continuation generators.
                process.stdin.once('data', function (chunk) { this(); }.bind(this));
            }, function getToken() {
                client.getToken(this);
            }, function checkToken(token) {
                client.checkToken(token, this);
            }.bind(this));
        }, function cacheToken(response) {
            user = response.user;
            cache.put('token', response.token, this);
        }, function welcome() {
            console.log('Welcome, ' + user.fullname + '!');
            this();
        }, function getLists() {
            client.getLists(this);
        }, function printLists(lists) {
            console.log('Available lists:');
            lists.forEach(function (list) {
                if (list.archived === '1' || list.deleted === '1') {
                    return;
                }

                console.log('[' + list.id + '] ' + list.name);
            });
            this();
        }, function done() {
            console.log('Done.');
            process.exit();
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
