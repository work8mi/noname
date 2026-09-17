import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	timeout: 180_000,
	expect: { timeout: 60_000 },
	use: { baseURL: "http://127.0.0.1:8081", screenshot: "only-on-failure" },
	reporter: [["list"]],
	webServer: [
		{
			command: "pnpm -F @noname/fs dev --debug --dirname=../../apps/core",
			url: "http://127.0.0.1:8089/",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: "pnpm -F noname dev",
			url: "http://127.0.0.1:8081/",
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
});
