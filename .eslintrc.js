module.exports = {
    extends: [
        "@redhat-actions/eslint-config"
    ],
    parserOptions: {
        ecmaVersion: 14,
    },
    rules: {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unused-vars": [ 2, { argsIgnorePattern: "(^_|req|res|next)" } ],
        "@typescript-eslint/no-inferrable-types": [ 2, { ignoreParameters: true }],
        "no-console": 0,
        "lines-between-class-members": 0
    }
}
