module.exports = (wallaby) => {
  return {
    files: [
      'package.json',
      'src/**/*.ts',
      'test/fixtures/**/*',
      'test/*.ts',
      'test/helpers/**/*.ts'
    ],

    tests: [
      'test/unit/**/*-test.ts',
      'test/integration/**/*-test.ts',
    ],

    env: {
      type: 'node'
    },

    testFramework: 'mocha',

    debug: false,

    setup: function (wallaby) {
      var path = require("path");

      process.env.DEV_BOT_ROOT = path.resolve(wallaby.localProjectDir);
    }
  };
};
