var fs = require('fs'),
    alfred = require('alfred');

function Cache(options) {
    if (options == null) {
        options = {};
    }

    this.rootDir = options.rootDir || Cache.getDefaultRootDir();
    this.db = null;
}

Cache.getDefaultRootDir = getDefaultRootDir;
function getDefaultRootDir() {
    return process.env.HOME + '/.rtm';
}

Cache.prototype.open = function open(callback) {
    fs.mkdir(this.rootDir, function (err) {
        if (err && err.code !== 'EEXIST') {
            console.log(1);
            callback(err, null);
            return;
        }

        this.db = alfred.open(this.rootDir, function (err, db) {
            if (err) {
                callback(err, null);
                return;
            }

            this.db.ensure('rtm', function (err, keymap) {
                callback(null, this);
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

Cache.prototype.get = function(key, callback) {
    // TODO: Queue if it's not open yet.
    this.db.rtm.get(key, callback);
};

Cache.prototype.put = function(key, value, callback) {
    // TODO: Queue if it's not open yet.
    this.db.rtm.put(key, value, callback);
};

module.exports = Cache;
