import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // NestJS patterns frequently use `any` for decorators, request bodies,
      // and dynamic Prisma queries. Warn instead of error to avoid blocking CI
      // while the codebase is incrementally typed.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/"],
  },
);
