module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "airbnb",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "postcss.config.js"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.2" } },
  plugins: ["react", "react-refresh", "prettier"],
  rules: {
    "react/jsx-no-target-blank": "off",
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    "prettier/prettier": ["error", { endOfLine: "auto" }],
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 1, maxBOF: 0 }],
    "import/no-extraneous-dependencies": ["error", { devDependencies: true }],
    "no-unused-vars": "error",
    quotes: ["error", "double", { avoidEscape: true, allowTemplateLiterals: true }],
    semi: ["error", "always"],
    eqeqeq: ["error", "always"],
    "array-callback-return": "off",
    "react-hooks/exhaustive-deps": "off",
    "react/jsx-no-bind": "off",
    "react/react-in-jsx-scope": "off",
    "react/jsx-filename-extension": [1, { extensions: [".js", ".jsx"] }],
    "no-use-before-define": "off",
    "react/prop-types": "off",
    "react/style-prop-object": "off",
    "func-names": "off",
    "no-undef": "off",
    "consistent-return": "off",
    "no-console": "error",
  },
};
