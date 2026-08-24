import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  // 1. Global Ignores: dist, node_modules vb. her koşulda hariç tutulur
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", "*.config.js", "*.config.mjs"]
  },

  // 2. JS ve TS Tavsiye Edilen Kurallar
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Sadece 'src' altındaki dosyalar için geçerli ayarlar
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest
      }
    }
  }
]);