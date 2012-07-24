var RTMClient = require('../rtm'),
    repl = require('repl'),
    alfred = require('alfred'),
    optimist = require('optimist'),
    argv = optimist
        .describe('help', 'Show this help message, then exit.')
        .default(require('./config'))
        .argv;

if (argv.help) {
    optimist.showHelp();
    process.exit();
}

var client = new RTMClient(argv),
    context = repl.start({}).context;

context.client = client;
context.alfred = alfred;
context.callback = function callback(err, data) {
    this.err = err;
    this.data = data;
    console.log('Done.');
};

function openDB() {
    var fs = require('fs');
    fs.mkdir(process.env.HOME + '/.rtm', function (err) {
        if (err.code !== 'EEXIST') {
            console.error(err);
            return;
        }

        alfred.open(process.env.HOME + '/.rtm', function (err, db) {
            if (err) {
                console.error(err);
            }

            db.rtm.get('foo', console.log);
        });
    });
}
