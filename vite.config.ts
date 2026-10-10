import { resolve } from "node:path";
import { defineConfig } from "vite-plus";

const root = import.meta.dirname;

export default defineConfig({
  // Tests import the package through its own public subpaths, exactly like the
  // JSR manifest used to. The alias points those self-references at the sources
  // so tests run against the same code the package will be built from.
  resolve: {
    alias: {
      "@dldc/css-builder": resolve(root, "src"),
    },
  },

  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },

  fmt: {
    // Prose docs and CI files are kept untouched by the formatter to avoid
    // unrelated churn.
    ignorePatterns: ["**/*.md", ".github/**", "coverage/**", "dist/**", "node_modules/**"],
  },

  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      // `any` was the only excluded rule in the previous Deno lint config.
      "no-explicit-any": "off",
      // clamp() documents its special `"none"` keyword as `AnyExpression | "none"`,
      // which is redundant at the type level (string) but intentional API surface.
      "no-redundant-type-constituents": "off",
    },
  },

  // Library build (tsdown). The entry map mirrors the export map in
  // package.json so every public subpath has its own emitted module and types.
  pack: {
    entry: {
      index: "mod.ts",
      ast: "src/ast.ts",
      builder: "src/builder.ts",
      create: "src/create.ts",
      serialize: "src/serialize.ts",
    },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
  },
});
