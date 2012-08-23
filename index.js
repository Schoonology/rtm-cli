var rtm = require('../rtm'),
    repl = require('repl'),
    fs = require('fs'),
    util = require('util'),
    optimist = require('optimist'),
    nconf = require('nconf'),
    argv = optimist
        .usage('Usage: $0 [command]')
        .describe('help', 'Show this help message, then exit.')
        .demand([1])
        .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}

// TODO: Find the right place to put the config file.
nconf.add('app', {
    type: 'file',
    file: __dirname + '/config.json'
}).add('local', {
    type: 'file',
    file: process.env.HOME + '/.rtm'
});

var session = new rtm.Session({
        apiKey: nconf.get('apiKey'),
        secret: nconf.get('secret'),
        token: nconf.get('token'),
        timeline: nconf.get('timeline')
    }),
    command = argv._[0];

var commands = {
    'repl': function startRepl() {
        var context = repl.start({}).context;
        context.session = session;
        context.nconf = nconf;
        context.callback = function callback(err, data) {
            this.err = err;
            this.data = data;
            console.log('Done.');
        };
    },
    'login': function login() {
        session.login(function (err, data) {
            // console.log('Login successful:', data);
            nconf.stores.local.set('token', data.token);
            nconf.stores.local.save(function (err, data) {});
        });
    },
    'add': function addTask() {
        session.addTask(argv._[1], function (err, transactionID) {
            if (err) {
                console.error(err.stack ? err.stack : err.message);
                return;
            }

            nconf.stores.local.set('lastTransactionID', transactionID);
            nconf.stores.local.save(function (err, data) {});
        });
    },
    'lists': function showLists() {
        session.getLists(function (err, lists) {
            if (err) {
                console.error(err.stack ? err.stack : err.message);
                return;
            }

            console.log('Lists:');
            lists.forEach(function (list) {
                // TODO: Make a separate, easier-to-type ID scheme for lists & tasks.
                console.log(util.format('[%s] %s', list.id, list.name));
            });
        });
    }
};

var commandFn = commands[argv._[0]];
if (commandFn == null) {
    console.error('RTM: "' + command + '" is not a valid command.');
    process.exit();
}
commandFn();
