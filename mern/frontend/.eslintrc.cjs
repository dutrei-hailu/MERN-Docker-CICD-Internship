module.exports = {
  env: {
    browser: true,
    es2021: true,
  },

  ignorePatterns: ["dist"],

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
  ],

  plugins: [
    "react",
  ],

  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
};
