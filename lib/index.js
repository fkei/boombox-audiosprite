/**
 * @fileOverview boombox.js compatible audio sprite generator
 * @name index.js<boombox-audiosprite>
 * @author fkei <kei.topaz@gmail.com>
 * @license MIT
 */

var fs = require('fs');
var path = require('path');

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var colors = require('colors');
var _ = require('underscore');
var winston = require('winston');
var mime = require('mime');

// custom media type
mime.define({'audio/ac3': ['ac3']});


var BoomboxAudioSprite = function () {
    this.VERSION = '0.1.1';
    this.cwd = process.cwd();
    this.OUTPUT_PREFIX = 'boombox-';
};

BoomboxAudioSprite.prototype.PROG_AUDIOSPRITE = 'audiosprite';
BoomboxAudioSprite.prototype.PROG_FFMPEG = 'ffmpeg';

var boombox_audiosprite = module.exports = new BoomboxAudioSprite();

BoomboxAudioSprite.prototype.title_display = function () {
    console.log('\n=========='.magenta);
    console.log('audiosprite(https://github.com/tonistiigi/audiosprite) wrapper for boombox.js :)'.magenta);
    console.log('==========\n\n'.magenta);
};

BoomboxAudioSprite.prototype.check = function (callback) {
    var self = this;
    var flag = false;
    exec('which ' + self.PROG_FFMPEG, null, function (err) {
        if (err) {
            console.log('Please install ffmpeg(http://www.ffmpeg.org/). check: $ which ffmpeg'.red);
            flag = true;
        }
        exec('which ' + self.PROG_AUDIOSPRITE, null, function (err1) {
            if (err1) {
                console.log('Please install audiosprite(https://github.com/tonistiigi/audiosprite). check: $ which audiosprite'.red);
                flag = true;
            }
            var res;
            if (flag) {
                res = new Error('\n[ERROR] Dependent library is missing.\n'.red);
            }
            return callback && callback(res);
        });
    });
};

BoomboxAudioSprite.prototype.commander = function (callback) {
    console.log(process.argv);

    this.title_display();

    var self = this;

    this.check(function (err) {
        if (err) {
            console.error(err.message);
            callback && callback(1);
            return;
        }

        var args = Array.prototype.slice.call(process.argv, 2);
        var argv_h = _.find(args, function (s) {
            if (s === '--help' || s === '-h') {
                return true;
            }
            return false;
        });


        /// help
        if (0 === args.length || argv_h) {
            var help = spawn(self.PROG_AUDIOSPRITE, ['--help']);
            var HELP = "";

            help.stdout.on('data', function (data) {
                HELP += data.toString();
            });
            help.addListener('exit', function (e) {
                console.log(HELP);
                callback && callback(1);
            });
            return;
        }


        var proc = spawn(self.PROG_AUDIOSPRITE, args);
        var output = 'Wrapper audiosprite :)\n'.rainbow;
        proc.stdout.on('data', function (data) {
            process.stdout.write(data.toString());
        });

        proc.stderr.on('data', function (data) {
            process.stderr.write(data.toString());
        });

        proc.addListener('exit', function (err) {
            if (err) {
                console.log('\n[ Failure ]\n'.red);
                callback && callback(1, err);
                return;
            }

            var output = 'output';
            _.find(args, function (s, i) {
                if (s === '--output' || s === '-o') {
                    output = args[i+1];
                    return true;
                }
                return false;
            });

            console.log('\n');
            console.log(('>>> Output audio files: ' + self.cwd).yellow);

            try {

                var extname = '.json';
                var inpath = path.resolve(self.cwd + '/' + output + extname);
                var outpath = path.resolve(self.cwd + '/' + self.OUTPUT_PREFIX + output + extname);

                var json = JSON.parse(fs.readFileSync(inpath, 'utf-8'));

                json.src = [];
                _.each(json.resources, function (path) {
                    json.src.push({
                        media: mime.lookup(path) || '',
                        path: path
                    });
                });

                _.each(json.spritemap, function (data, key) {
                    if (data.hasOwnProperty('loop')) {
                        delete data.loop;
                    }
                });

                delete json.resources;
                var raw = JSON.stringify(json, null, '  ');
                fs.writeFileSync(outpath, raw);

                console.log('<<< Original json file for audiosprite: '.yellow + inpath.yellow);
                console.log('>>> Processed json file for boombox.js: '.yellow + outpath.yellow);

            } catch (e) {
                console.log('\n\t[ Failure ]\n'.red);
                console.log(e);
                callback && callback(1);
                return;
            }

            console.log('\n\t[ Success ] Goodbye :p\n'.blue);

            return;
        });

        return;

    });

};
