module.exports = {
  extends: [
    "@redhat-actions/eslint-config",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  plugins: [
    "react", "react-hooks", "import",
  ],
  ignorePatterns: [
    // "webpack.config*.[tj]s",
    "build/",
  ],
  settings: {
    react: {
      version: "detect"
    }
  },
  parserOptions: {
    ecmaVersion: 14,
    emcaFeatures: {
      jsx: true,
    },
    sourceType: "module",
    project: [
      "./tsconfig.json",
      "./src/server/tsconfig.json",
      "./webpack.config*.[tj]s"
    ],
  },
  rules: {
    "@typescript-eslint/no-explicit-any": 0,
    "class-methods-use-this": 0,
    "no-use-before-define": 0,

    "@typescript-eslint/no-unused-vars": [ 2, { argsIgnorePattern: "(^_|req|res|next)" } ],
    "@typescript-eslint/member-delimiter-style": [ 2, {
        multiline: {
          delimiter: "comma",
        },
        singleline: {
          delimiter: "comma",
        },
      }
    ],

    "indent": 0,
    "@typescript-eslint/indent": [ 2, 2 ],
    "max-len": [ 2, 120, 2, { ignoreUrls: true } ],
    "camelcase": [ 0 ],

    "@typescript-eslint/member-ordering": [ 2 ],

    // this is to work with @typescript-eslint/floating-promises void behaviour
    "no-void": [ 2, { allowAsStatement: true }],

    // doesn't understand ts paths
    "import/no-unresolved": 0,
    "import/no-cycle": 0,
  },
  overrides: [{
    files: [ "*.tsx" ],
    rules: {
      "no-console": 0,
      "no-nested-ternary": 0,
      "max-len": [ 2, 150, 2, { ignoreUrls: true } ],
      "operator-linebreak": [ 0 ],
      "import/extensions": [ 2, { css: "always", json: "always", scss: "always" }],
      "@typescript-eslint/explicit-function-return-type": [ 0 ],
      "@typescript-eslint/explicit-module-boundary-types": [ 0 ],
      "@typescript-eslint/ban-types": [ 0 ],
      "react/react-in-jsx-scope": [ 0 ],
    },
  }, {
    files: [ "webpack.config.*.*s" ],
    rules: {
      "import/no-extraneous-dependencies": 0,
      "@typescript-eslint/explicit-module-boundary-types": 0,
      "no-console": 0
    }
  }]
}
