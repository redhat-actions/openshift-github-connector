module.exports = {
    extends: [
        "@redhat-actions/eslint-config"
    ],
    ignorePatterns: [
        "views/client.js"
    ],
    parserOptions: {
        ecmaVersion: 14,
    },
    rules: {
        "no-console": 2,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unused-vars": [ 2, { argsIgnorePattern: "(^_|req|res|next|context)" } ],
        "@typescript-eslint/no-inferrable-types": [ 2, { ignoreParameters: true }],
        "lines-between-class-members": 0,
        "class-methods-use-this": 0,
        "no-use-before-define": 0,
        "@typescript-eslint/no-use-before-define": 2,
        "arrow-body-style": 0,
        "import/no-relative-parent-imports": [ 2 ],
        "@typescript-eslint/explicit-function-return-type": [ 2, { allowExpressions: true }]
    },
    overrides: [{
        files: [ "*.tsx" ],
        rules: {

            "max-len": [ 2, 150 ],
            "import/extensions": [ 2, { "css": "always" }]
        },
    }]
}
