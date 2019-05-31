/*
Copyright 2018 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

var through = require('through2');
var extend = require('xtend');
var path = require('path');
var File = require('vinyl');
var PluginError = require('plugin-error');
var svgcombiner = require('svgcombiner');

module.exports = function(options) {
  options = extend({
    processName: function(filePath) {
      // The filename without extension
      return path.basename(filePath, path.extname(filePath));
    },
    processClass: function(filePath) {
      // The first folder name
      return path.dirname(filePath).split(path.sep).pop();
    },
    skipSingle: false
  }, options);

  // Hash to hold all icons arranged by processed name
  var icons = {};
  var fileObjs = {};
  var latestIcon = null;

  function gatherIcons(file, end, cb) {
    // ignore empty files
    if (file.isNull()) {
      cb();
      return;
    }

    // we don't do streams
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-svgcombiner', 'Streaming not supported'));
      cb();
      return;
    }

    // Process the name
    var processedName = options.processName(file.path);
    var processedClass = options.processClass(file.path);

    // Read the contents and put them into a map of maps
    icons[processedName] = icons[processedName] || {};
    icons[processedName][processedClass] = file.contents.toString('utf8');

    // Store the file so we can clone it
    fileObjs[processedName] = file;

    // Store the last icon we processed
    latestIcon = file;

    cb();
  }

  function combineIcons(cb) {
    // no files passed in, no file goes out
    if (!latestIcon) {
      cb();
      return;
    }

    // Run through hashmap
    for (var icon in icons) {
      // Clone the source file to get path information
      var file = fileObjs[icon];
      var combinedFile = file.clone({ contents: false });
      combinedFile.path = path.join(file.base, icon + '.svg');

      if (options.skipSingle && Object.keys(icons[icon]).length < 2) {
        combinedFile.contents = file.contents;
      } else {
        // Combine all SVGs
        combinedFile.contents = new Buffer(svgcombiner(icon, icons[icon]));
      }

      // Emit downstream
      this.push(combinedFile);
    }

    cb();
  }

  // Gather all the icons, then combine them
  return through.obj(gatherIcons, combineIcons);
};
