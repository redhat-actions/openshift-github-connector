module.exports = {
  extends: [
    "@redhat-actions/eslint-config",
    "plugin:react/recommended"
  ],
  ignorePatterns: [
    "webpack.config*.js",
    "build/",
    "jwt.js", "key.js", "auth.js"
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

    "indent": [ 2, 2 ],
    "max-len": [ 2, 120, 2, { ignoreUrls: true } ],
    "camelcase": [ 2, { allow: [ "client_id", "client_secret", "webhook_secret", "key_id" ] } ],

    "react/react-in-jsx-scope": [ 0 ],
  },
  overrides: [{
    files: [ "*.tsx" ],
    rules: {
      "no-console": 0,
      "max-len": [ 2, 150, 2 ],
      "operator-linebreak": [ 0 ],
      "import/extensions": [ 2, { css: "always", json: "always", scss: "always" }],
      "@typescript-eslint/explicit-function-return-type": [ 0 ],
      "@typescript-eslint/explicit-module-boundary-types": [ 0 ],
      "@typescript-eslint/ban-types": [ 0 ],
      "@typescript-eslint/no-use-before-define": [ 0 ]
    },
  }]
}
