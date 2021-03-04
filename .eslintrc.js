module.exports = {
    extends: [
        "@redhat-actions/eslint-config"
    ],
    parserOptions: {
        ecmaVersion: 14,
    },
    rules: {
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-unused-vars": [ 2, { argsIgnorePattern: "^_" } ]
    }
}
