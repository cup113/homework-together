import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";


export default [
  { ignores: ["node_modules/**/*", "src/components/ui/**/*", "src/lib/utils.ts", "*.config.js", "*.config.cjs", "pb_data/types.d.ts", "pb_migrations/**/*", "dist/**/*", "dist-server/**/*", "coverage/**/*"] },
  { files: ["**/*.{mts,ts,vue}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  { files: ["**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
];