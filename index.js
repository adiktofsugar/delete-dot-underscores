#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var walk = require('fs-walk');
var logPath = path.join(__dirname, 'log.txt');

function log(level) {
    var args = Array.prototype.slice.call(arguments, 1);
    var now = new Date();
    args.unshift('[' + now + ' ' + level.toUpperCase() + ']');
    console.log.apply(console, args);
    fs.appendFileSync(logPath, args.join(" ") + "\n");
}
function logError() {
    log.apply(null, ['error'].concat(Array.prototype.slice.call(arguments)));
}
function logDebug() {
    log.apply(null, ['debug'].concat(Array.prototype.slice.call(arguments)));
}
function logInfo() {
    log.apply(null, ['info'].concat(Array.prototype.slice.call(arguments)));
}

function deleteAllDotUnderscoreFiles(folder, callback) {
    var deletedFiles = [];
    walk.walk(folder, function (basedir, filename, stat, next) {
        if (stat.isDirectory()) {
            next();
            return;
        }
        var fullFilename = path.join(basedir, filename);
        if (filename.match(/^\._/)) {
            //logDebug('should delete', fullFilename);
            try {
                fs.unlinkSync(fullFilename);
            } catch (e) {
                return next(e);
            }
            deletedFiles.push(fullFilename);
        }
        next();
    }, function (error) {
        if (error) return callback(error);
        callback(null, deletedFiles);
    });
}

var volumes = [];
function watchForVolumeMountChanges(onVolumeMounted, onVolumeUnmounted) {
    //logDebug('poll for volume mount change');
    var newVolumes = fs.readdirSync('/Volumes');

    newVolumes.forEach(function (dirname) {
        var inVolumes = volumes.indexOf(dirname) >= 0;
        if (!inVolumes) {
            logInfo('volume mounted:', dirname);
            onVolumeMounted(dirname);
        }
    });

    volumes.forEach(function (dirname) {
        var inNewVolumes = newVolumes.indexOf(dirname) >= 0;
        if (!inNewVolumes) {
            logInfo('volume unmounted:', dirname);
            onVolumeUnmounted(dirname);
        }
    });

    volumes = newVolumes;

    setTimeout(function () {
        watchForVolumeMountChanges(onVolumeMounted, onVolumeUnmounted);
    }, 1000);
}


var volumeNameToWatcher = {};
watchForVolumeMountChanges(
    function onVolumeMounted(dirname) {
        if (dirname != 'NO NAME') return;
        var volumeName = path.join('/Volumes', dirname);
        function onChange() {
            deleteAllDotUnderscoreFiles(volumeName, function (error, deletedFiles) {
                if (error) {
                    logError('problem deleting dot underscore files: ' + error);
                } else if (deletedFiles.length) {
                    logInfo('deleted files: ' + deletedFiles.join(", "));
                }
            });
        }
        var watcherTimeout;
        var watcher = fs.watch(volumeName, {recursive: true}, function (event, filename) {
            logDebug('watcher event:', event, 'filename:', filename);
            clearTimeout(watcherTimeout);
            watcherTimeout = setTimeout(onChange, 10);
        })
        .on('error', function (error) {
            logError('fs watch error for volume ' + volumeName + ': ' + error);
        });
        onChange();
        volumeNameToWatcher[dirname] = watcher;
    },
    function onVolumeUnmounted(dirname) {
        if (dirname != 'NO NAME') return;
        var volumeName = path.join('/Volumes', dirname);
        var watcher = volumeNameToWatcher[dirname];
        if (!watcher) {
            logError('no watcher for volume ' + volumeName);
            return;
        }
        watcher.close();
        volumeNameToWatcher[dirname] = undefined;
    }
);
