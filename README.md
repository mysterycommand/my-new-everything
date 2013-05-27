# My New Setup

[![Build Status](https://travis-ci.org/mysterycommand/my-new-everything.png?branch=master)](https://travis-ci.org/mysterycommand/my-new-everything)

## [Yeoman + Travis + Github Pages](https://coderwall.com/p/ndaemg)

Herein I will describe how to get everything setup for a new front-end project using Yeoman, Travis, and Github Pages. When Travis successfully builds the project, the built files will be pushed into a `gh-pages` branch (creating the branch if necessary). This will require use of [Yeoman](http://yeoman.io) and the [Travis CI generator](https://github.com/pwmckenna/generator-travis-ci) for it.

Starting in an empty directory:

    mkdir my-new-everything && cd my-new-everything
    npm install generator-webapp
    npm install generator-travis-ci
    yo webapp

You could install the generators globally with the `-g` flag if you like. Then do whatever you do to get it into Github. Probably, create the repository there, and then:

    git init
    git add .
    git commit -am 'Initial commit.'
    git remote add origin https://github.com/mysterycommand/my-new-everything.git
    git push -u origin master

Visit your repository's settings/hooks page in Github. Something like https://github.com/username/repository/settings/hooks in this/my case [this](https://github.com/mysterycommand/my-new-everything/settings/hooks). Scroll down to the Travis hook and follow the instructions under Install Notes (ymmv, I did this a while ago and don't remember if it was difficult or not). When you've got that going (Test Hook should send you an email). Then, back in your local repo/command line:

    yo travis-ci:gh-pages

… answer some prompts, and if all went well:

    grunt test

Verify that the default tests pass, and then:

    git add .
    git commit -am 'Travis CI setup.'

At this point, tests may pass locally, but not on Travis. Here's the likely culprit:

    Warning: You need to have Ruby and Compass installed and in your system PATH for this task to work. More info: https://github.com/gruntjs/grunt-contrib-compass Use --force to continue.

The fix is to tell Travis in install compass before running your Grunt build script (you could also remove the compass/sass task(s?) from your Gruntfile, but I like Sass), so add this:

    - gem update --system
    - gem install compass

… to your .travis.yml file, right between these two lines (34 and 35 at time of writing):

    # install dependencies
    - npm install -g grunt-cli bower

Et voila … assuming your tests passed (mine did) you should have a new build in a gh-pages branch (I do) and visible to the world at:

http://username.github.io/repository (I think). In this/my case: http://mysterycommand.github.io/my-new-everything works like a charm.

Next time, I'll describe my current solution for running Mocha/Chai tests within a RequireJS/AMD based project, and how to get them working both in the browser, and via the command line.

## [Yeoman + AMD (RequireJS) + Mocha/Chai](https://coderwall.com/p/g4neba)

Assuming you like the setup I described [here](https://coderwall.com/p/ndaemg) (and why wouldn't you), this will describe how to add Mocha and Chai for testing in a way that will work with RequireJS modules that live in your `app/` directory.

### Create a `config.js` file for use by both `app/` and `test/`

1. Split `app/scripts/main.js` file out into two files, [`app/scripts/main.js`](https://github.com/mysterycommand/my-new-everything/blob/master/app/scripts/main.js) and [`app/scripts/config.js`](https://github.com/mysterycommand/my-new-everything/blob/master/app/scripts/config.js). The `config.js` file has `main` as a dependency, so `main`, `app` and `bootstrap` files are loaded as before.
2. Setup `index.html` to point at `config.js`, and remove the `usemin` comments, like [this](https://github.com/mysterycommand/my-new-everything/commit/2476b23b174896562c41119c44ef798b2034e9f3). Note: the commented out script block pointing at `scripts/app.min.js` will be useful later, so be sure to include it.

### Update `test/` to use the generated CSS and testing libraries installed with Bower

1. Install Mocha and Chai as dev dependencies:

        bower install mocha --save-dev
        bower install chai --save-dev

2. Remove the `test/lib` directory.
3. Replace the entire contents of `test/index.html` with the contents of `app/index.html`.
4. In the `head` of the new `test/index.html`, add references to the Mocha and Chai libraries installed with Bower:

        <link rel="stylesheet" href="../app/bower_components/mocha/mocha.css">
        <script src="../app/bower_components/mocha/mocha.js"></script>
        <script src="../app/bower_components/chai/chai.js"></script>

5. Update the reference to the main stylesheet, to point at the generated CSS file. The `Gruntfile.js` will be updated to serve `.tmp` and `.`, so the relative path will be `../styles/main.css`.

### Update `test/` to use the shared `config.js`.

1. At the bottom of `test/index.html` (right before the closing `body` tag), remove the Chrome Frame conditional comment, the Google Analytics script tag, and the commented out script block referencing `scripts/app.min.js` (it won't be needed for tests).
2. Update the reference to RequireJS to point to `../app/bower_components/requirejs/require.js` and set it's `data-main` attribute to `spec/config`.
3. Create `spec/config.js`, something like [this](https://github.com/mysterycommand/my-new-everything/blob/master/test/spec/config.js):

        'use strict';

        require.config({
            baseUrl: '../../app/scripts/', // non-pathed dependencies should come from the app/scripts directory
            deps: ['runner'], // load spec/runner.js by default
            paths: {
                spec: '../../test/spec', // path tests to this directory
                runner: '../../test/spec/runner', // the main test runner, load all tests as dependencies
                appConfig: '../../app/scripts/config' // the app's config file
            },
            shim: {
                runner: ['appConfig'] // make runner depend on the app's config file
            }
        });

4. Create `spec/runner.js` something like [this](https://github.com/mysterycommand/my-new-everything/blob/master/test/spec/runner.js):

        /* global define */
        define([
            // All your tests go here.
            'spec/app.test' // maybe it makes sense to add tests as dependencies in spec/config?
        ], function () {
            'use strict';

            window.console = window.console || function() {}; // protect from barfs
            window.notrack = true; // don't track
            window.mocha.run(); // kickoff the runner
        });

5. Create `spec/app.test.js` something like [this](https://github.com/mysterycommand/my-new-everything/blob/master/test/spec/app.test.js):

        /* global define, describe, it, should */
        define(['app'], function (app) {
            'use strict';

            // whatever tests are in here will run as soon as this module is loaded
            describe('app', function () {
                it('should exist', function() {
                    should.exist(app);
                });
            });
        });

### Update `Gruntfile.js` to serve and test everything

Make [these changes](https://github.com/mysterycommand/my-new-everything/commit/e151d6fae76b34c6dc69aadd6374ba84a29591dd) to `Gruntfile.js`. The most important of these are:

1. Add `mountFolder(connect, '.'),` to the `connect:livereload` task. This adds the project root to files served at `localhost:9000`. Tests will be available when the server is running at `localhost:9000/test`.
2. Replace `mountFolder(connect, 'test')` with `mountFolder(connect, '.')` in the `connect:test` task. This is required in order for `test/index.html` to have relative path access to `app`-level dependencies.
3. Update the `mocha:all` task options to `run: false` and `urls: ['http://localhost:<%= connect.options.port %>/test/index.html']`. Optionally set the reporter option: `reporter: 'Spec'`. Run is now triggered by `test/spec/runner.js` when it (and it's dependencies) have loaded. The tests are now located in `test/index.html` because we are serving the project root.
4. Update the `requirejs:dist` task by adding to the options hash:

        include: '../bower_components/requirejs/require',
        mainConfigFile: yeomanConfig.app + '/scripts/config.js',
        out: yeomanConfig.dist + '/scripts/app.min.js'

### Nearly done!

If all went well, you should have passing tests at both `http://localhost:9000/test` (while running `grunt server`), and via the command line by running `grunt test`. Assuming that's true, commit whatever's not committed, and push up to GitHub. When the Travis hook fires, you should also have a successful build in your `gh-pages` branch!

### But wait! What's this!?

The built files don't quite work yet. Because we're not using `usemin` to rewrite our script tags, `dist/index.html` has a script tag referencing `bower_components/requirejs/require.js` … but no such file exists in the `dist` directory.

However, that little commented out script tag referencing `scripts/app.min.js` does get updated to point to the generated (RequireJS included, and `rev`d) JavaScript. So how do we get `dist` to use it?

### Add `cleanup.js`, and update `.travis.yml` to use it in the `after_success` hook.

Here's `app/scripts/util/cleanup.js` in it's entirety (I'm not super familiar with Node, so if there's a better way to do this, please do tell). Also, please note: **This script is really specific to how I have things set up. I accept no responsibility if this destroys your project and ruins your life. USE AT YOUR OWN RISK!**:

    'use strict';

    var fs = require('fs');
    var filename = process.argv[2];

    // Make sure we got a filename on the command line.
    if (process.argv.length < 3) {
        console.log('Usage: node ' + process.argv[1] + ' FILENAME');
        process.exit(1);
    }

    // Read the file.
    fs.readFile(filename, 'utf8', function(error, data) {
        var file = data;

        // Find the old RequireJS script tag, and remove it.
        var tag = '        <script data-main="scripts/config" src="bower_components/requirejs/require.js"></script>';
        var tagIndex = file.indexOf(tag);
        file = file.substring(0, tagIndex) + file.substring(tagIndex + tag.length + 1);

        // Assume the last comment in the HTML file is the one you want to remove.
        // TODO: Make it a comment like build:uncomment or build:remove like `usemin` does.
        var beginComment = file.lastIndexOf('<!-- ');
        file = file.substring(0, beginComment) + file.substring(beginComment + 5);

        var endComment = file.lastIndexOf(' -->');
        file = file.substring(0, endComment) + file.substring(endComment + 4);

        // Write the edited file back into place.
        fs.writeFile(filename, file, 'utf8', function(error) {
            if (error) { throw error; }
        });
    });

Create this file, then add the following line to `.travis.yml` between after line 45 ([like here](https://github.com/mysterycommand/my-new-everything/commit/4ce12b61b05e7aff76d570563060fa054ed5665b)):

    - node ../app/scripts/util/cleanup.js ../dist/index.html

This way, when Travis successfully builds your project, it will remove the script tag pointing at the Bower-loaded RequireJS library, and un-comment script tag pointing to the `r.js` optimized, and `rev`d JavaScript.

This has been a really long Pro Tip, but I hope you find it useful. If anyone knows how to improve upon `cleanup.js` I'm all ears. Further, if there's a way to have Grunt run `cleanup.js` on `dist/index.html` during `grunt:build` that'd be good (better) too.

Also, I don't really know what's going on with this formatting … for a code-specific community to not get code formatting right is a pretty huge bummer. If you have any questions you can check out the whole, un-touched after this demo project here:

https://github.com/mysterycommand/my-new-everything
http://mysterycommand.github.io/my-new-everything/
