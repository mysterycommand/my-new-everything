'use strict';

require.config({

    deps: ['main'],

    paths: {
        jquery: '../bower_components/jquery/jquery'
    },

    shim: {
        jquery: {
            exports: '$',
            init: function() {
                return this.$.noConflict();
            }
        }
    }

});
