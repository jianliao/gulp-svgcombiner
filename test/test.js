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

var test = require('ava');
var fs = require('fs');
var format = require('xml-formatter');
var path = require('path');
var assert = require('stream-assert');
var File = require('vinyl');
var gulp = require('gulp');
var vfs = require('vinyl-fs');
var svgcombiner = require('../index.js');

function getFakeFile(filePath) {
  return new File({
    path: filePath,
    contents: new Buffer(fs.readFileSync(filePath, 'utf8'))
  });
}

test.cb('should emit error on streamed file', t => {
  var combiner = svgcombiner({
    processName: function(filePath) {
      return 'spectrum-css-icon-' + path.basename(filePath, path.extname(filePath)).replace(/S_UI(.*?)_.*/, '$1');
    },
    processClass: function(filePath) {
      // Return the last directory
      return 'spectrum-UIIcon--' + path.dirname(filePath).split(path.sep).pop();
    }
  });

  // wait for the file to come back out
  vfs.src('test/medium/S_UICornerTriangle_5_N@1x.svg' , {
      buffer: false
    })
    .pipe(combiner)
    .once('error', (err) => {
      t.is(err.message, 'Streaming not supported');
      t.end();
    });
});

test.cb('should take path file of last file', function(t) {
  gulp.src([
    'test/medium/S_UICheckboxCheckmark_12_N@1x.svg',
    'test/large/S_UICheckboxCheckmark_12_N@1x.svg'
  ])
    .pipe(svgcombiner())
    .pipe(assert.first(function(newFile) {
      var newFilePath = path.resolve(newFile.path);
      var expectedFilePath = path.resolve(path.join('test', 'large', 'S_UICheckboxCheckmark_12_N@1x.svg'));
      t.is(newFilePath, expectedFilePath);
    }))
    .pipe(assert.end(function() {
      t.end();
    }));
});

test.cb('should define default processName and processClass', function(t) {
  // Create the fake files
  var medium = getFakeFile('test/medium/S_UICheckboxCheckmark_12_N@1x.svg');
  var large = getFakeFile('test/large/S_UICheckboxCheckmark_12_N@1x.svg');

  // Create a plugin stream
  var combiner = svgcombiner();

  // write the fake file to it
  combiner.write(medium);
  combiner.write(large);
  combiner.end();

  // wait for the file to come back out
  combiner.once('data', function(file) {
    // make sure it came out the same way it went in
    t.truthy(file.isBuffer());

    // check the contents
    t.is(format(file.contents.toString('utf8')), format(fs.readFileSync('test/CheckboxCheckmark.svg', 'utf8')));
    t.end();
  });
});

test.cb('should combine SVGs', function(t) {
  // Create the fake files
  var medium = getFakeFile('test/medium/S_UICornerTriangle_5_N@1x.svg');
  var large = getFakeFile('test/large/S_UICornerTriangle_6_N@1x.svg');

  // Create a plugin stream
  var combiner = svgcombiner({
    processName: function(filePath) {
      return 'spectrum-css-icon-' + path.basename(filePath, path.extname(filePath)).replace(/S_UI(.*?)_.*/, '$1');
    },
    processClass: function(filePath) {
      // Return the last directory
      return 'spectrum-UIIcon--' + path.dirname(filePath).split(path.sep).pop();
    }
  });

  // write the fake file to it
  combiner.write(medium);
  combiner.write(large);
  combiner.end();

  // wait for the file to come back out
  combiner.once('data', function(file) {
    // make sure it came out the same way it went in
    t.truthy(file.isBuffer());

    // check the contents
    t.is(format(file.contents.toString('utf8')), format(fs.readFileSync('test/CornerTriangle.svg', 'utf8')));
    t.end();
  });
});

test('should ignore empty files', function(t) {
  t.plan(0);
  // Create the fake files
  var emptyFile = new File({
    path: 'test/medium/S_UICornerTriangle_5_N@1x.svg',
    contents: ''
  });

  // Create a plugin stream
  var combiner = svgcombiner();

  // write the fake file to it
  combiner.write(emptyFile);
  combiner.end();

  // wait for the file to come back out
  combiner.once('data', function(file) {
    t.is(true);
    t.end();
  });
});

test.cb('should ignore single files if options.skipSingle is true', function (t) {
  // Create the fake files
  var medium = getFakeFile('test/medium/S_UICornerTriangle_5_N@1x.svg');

  var combiner = svgcombiner({
    skipSingle: true
  });

  // write the fake file to it
  combiner.write(medium);
  combiner.end();

  // wait for the file to come back out
  combiner.once('data', function(file) {
    // make sure it came out the same way it went in
    t.truthy(file.isBuffer());

    // check the contents
    t.is(format(file.contents.toString('utf8')), format(fs.readFileSync('test/medium/S_UICornerTriangle_5_N@1x.svg', 'utf8')));
    t.end();
  });
});

test.cb('should still combine SVGs even options.skipSingle is true', function(t) {
  // Create the fake files
  var medium = getFakeFile('test/medium/S_UICornerTriangle_5_N@1x.svg');
  var large = getFakeFile('test/large/S_UICornerTriangle_6_N@1x.svg');

  // Create a plugin stream
  var combiner = svgcombiner({
    processName: function(filePath) {
      return 'spectrum-css-icon-' + path.basename(filePath, path.extname(filePath)).replace(/S_UI(.*?)_.*/, '$1');
    },
    processClass: function(filePath) {
      // Return the last directory
      return 'spectrum-UIIcon--' + path.dirname(filePath).split(path.sep).pop();
    },
    skipSingle: true
  });

  // write the fake file to it
  combiner.write(medium);
  combiner.write(large);
  combiner.end();

  // wait for the file to come back out
  combiner.once('data', function(file) {
    // make sure it came out the same way it went in
    t.truthy(file.isBuffer());

    // check the contents
    t.is(format(file.contents.toString('utf8')), format(fs.readFileSync('test/CornerTriangle.svg', 'utf8')));
    t.end();
  });
});
