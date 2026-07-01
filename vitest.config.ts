import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/**/types.ts",
        // Root layout is hard to unit-test (fonts/html shell).
        "src/app/layout.tsx",
        // TODO: remove once the real main page has tests (scaffold page).
        "src/app/page.tsx",
        // Supabase/SDK wiring (cookies + env glue) — verified via integration,
        // not unit tests. The testable logic lives in config.ts.
        "src/lib/supabase/client.ts",
        "src/lib/supabase/server.ts",
        "src/lib/supabase/middleware.ts",
        "src/proxy.ts",
        // next-intl server config (cookies + dynamic import) — integration glue.
        "src/i18n/request.ts",
        // Auth route pages: thin server components (getUser + redirect + render).
        "src/app/sign-in/page.tsx",
        "src/app/sign-up/page.tsx",
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
