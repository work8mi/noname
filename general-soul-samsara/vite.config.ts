import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const entry = fileURLToPath(new URL("src/mode/index.ts", import.meta.url));
const outDir = fileURLToPath(new URL("../apps/core/mode", import.meta.url));

export default defineConfig(({ mode }) => ({
	define: {
		/** 调试面板开关：development 构建保留，production 构建剔除。 */
		__ROGUE_DEBUG__: JSON.stringify(mode !== "production"),
	},
	build: {
		lib: {
			entry,
			formats: ["es"],
			fileName: () => "general-soul-samsara.js",
		},
		outDir,
		emptyOutDir: false,
		minify: false,
		sourcemap: true,
		target: ["chrome91", "safari16.4"],
		rollupOptions: {
			external: ["noname", "vue"],
		},
	},
}));
