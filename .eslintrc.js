module.exports = {
    extends: [
        "@redhat-actions/eslint-config"
    ],
    ignorePatterns: [
        "webpack.config.*.js"
    ],
    parserOptions: {
        ecmaVersion: 14,
        sourceType: "module",
        project: [
            "./tsconfig.json",
            "./src/server/tsconfig.json",
        ],
    },
    rules: {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unused-vars": [ 2, { argsIgnorePattern: "(^_|req|res|next|context)" } ],
        "@typescript-eslint/no-inferrable-types": [ 2, { ignoreParameters: true }],
        "lines-between-class-members": 0,
        "class-methods-use-this": 0,
        "no-use-before-define": 0,
        "@typescript-eslint/no-use-before-define": 2,
        "arrow-body-style": 0,
        // "import/no-relative-parent-imports": [ 2 ],
        "@typescript-eslint/explicit-function-return-type": [ 2, { allowExpressions: true }],
        "padded-blocks": [ 0, ]
    },
    overrides: [{
        files: [ "*.tsx" ],
        rules: {
            "no-console": 0,
            "max-len": [ 2, 150 ],
            "import/extensions": [ 2, { "css": "always" }],
            "@typescript-eslint/explicit-function-return-type": [ 0 ],
            "@typescript-eslint/explicit-module-boundary-types": [ 0 ],
            "@typescript-eslint/ban-types": [ 0 ]
        },
    }]
}
