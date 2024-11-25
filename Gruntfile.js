module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bump: {
            options: {
                files: ['package.json'],
                updateConfigs: [],
                commit: false,
                createTag: false,
                push: false,
                prereleaseName: false,
            }
        },
    });

    grunt.loadNpmTasks('grunt-bump');
};