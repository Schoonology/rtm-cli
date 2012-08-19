var rtm = require('../rtm'),
    repl = require('repl'),
    optimist = require('optimist'),
    nconf = require('nconf'),
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

// TODO: Find the right place to put the config file.
nconf.argv().env().file(__dirname + '/config.json');

var session = new rtm.Session(argv),
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
            console.log('Login successful:', data);
        });
    }
};

var commandFn = commands[argv._[0]];
if (commandFn == null) {
    console.error('RTM: "' + command + '" is not a valid command.');
    process.exit();
}
commandFn();
