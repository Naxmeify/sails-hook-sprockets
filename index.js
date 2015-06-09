var path = require("path");

var connectMincer = require("connect-mincer");
var nib = require("nib");

module.exports = function (sails) {
    return {
        defaults: {
            __configKey__: {
                // sprockets active by default
                active: true,

                defaultAssetFolder: path.resolve(sails.config.appPath, 'assets'),

                dirs: [],

                middlewareKey: 'sprockets',

                // Mincer Settings
                root: path.resolve(sails.config.appPath),
                production: process.env.NODE_ENV === 'production',
                manifestFile: path.join(sails.config.appPath, 'tmp/public/assets/', 'manifest.json'),
                mountPoint: '/assets',

                engines: {
                    stylus: function (stylus) {
                        stylus.set('include css', true);
                        stylus.use(nib());
                    },

                    jade: {},
                    coffee: {}
                }
            }
        },

        initialize: function (cb) {
            // If the hook has been deactivated, just return
            if (!sails.config[this.configKey].active) {
                sails.log.verbose("Sprockets hook deactivated.");
                return cb();
            }

            // Setup Configuration of Mincer
            var paths = [sails.config[this.configKey].defaultAssetFolder];

            for(var dir in sails.config[this.configKey].dirs) {
                path.push(dir);
                console.log(dir);
            }

            var mincer = new connectMincer({
                root: sails.config[this.configKey].root,
                production: sails.config[this.configKey].production,
                mountPoint: sails.config[this.configKey].mountPoint,
                manifestFile: sails.config[this.configKey].manifestFile,
                paths: paths
            });

            // Engines
            mincer.Mincer.StylusEngine.configure(sails.config[this.configKey].engines.stylus);
            mincer.Mincer.JadeEngine.configure(sails.config[this.configKey].engines.jade);
            mincer.Mincer.CoffeeEngine.configure(sails.config[this.configKey].engines.coffee);


            // Setup Middleware
            sails.config.http.middleware[sails.config[this.configKey].middlewareKey] = function(app) {
                app.use(mincer.assets());

                // Connect-mincer serves our assets in dev
                // We must precompile our assets before starting in production
                if (process.env.NODE_ENV !== 'production') {
                    app.use('/assets', mincer.createServer());
                }

                sails.log.verbose("Sails JS Sprockets Pipeline activated");
            };

            cb();
        }
    };
};