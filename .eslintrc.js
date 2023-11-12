module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: "eslint:recommended",
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        ".eslintrc.{js,cjs}"
      ],
      parserOptions: {
        sourceType: "script"
      },
    }
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "@stylistic/js"
  ],
  rules: {
    "curly": ["error"],
    "eqeqeq": ["error", "smart"],
    "new-cap": ["error"],
    "no-caller": ["error"],
    "no-constant-condition": ["error", { "checkLoops": false }],
    "no-shadow": ["error"],
    "no-unused-vars": ["error", { "args": "none" }],
    "quotes": ["error", "double"],
    "@stylistic/js/no-trailing-spaces": ["error"],
    "@stylistic/js/wrap-iife": ["error", "outside"],
  }
}
