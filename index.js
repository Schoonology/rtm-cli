var rtm = require('../rtm'),
    repl = require('repl'),
    fs = require('fs'),
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
    }
};

var commandFn = commands[argv._[0]];
if (commandFn == null) {
    console.error('RTM: "' + command + '" is not a valid command.');
    process.exit();
}
commandFn();
