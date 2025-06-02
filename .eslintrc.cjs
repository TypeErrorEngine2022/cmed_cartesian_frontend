module.exports = {
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
    "linebreak-style": ["error", "unix"],
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx", "*/**/*.ts", "*/**/*.tsx"],
      parserOptions: {
        project: ["tsconfig.json"],
      },
      rules: {
        "@typescript-eslint/no-unused-vars": ["error"],
        "@typescript-eslint/no-explicit-any": ["error"],
        "@typescript-eslint/no-unsafe-argument": ["error"],
        "@typescript-eslint/no-unsafe-assignment": ["error"],
        "@typescript-eslint/no-unsafe-call": ["error"],
        "@typescript-eslint/no-unsafe-member-access": ["error"],
        "@typescript-eslint/no-unsafe-return": ["error"],
      },
    },
  ],
};
