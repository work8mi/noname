import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	// 跳过 GPL 确认弹窗（无头浏览器里 confirm 会被自动取消，导致游戏退出）。
	await page.addInitScript(() => {
		localStorage.setItem("gplv3_noname_alerted", "true");
	});
	page.on("dialog", dialog => dialog.accept());
});

test("游戏可以启动且没有页面异常", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", error => errors.push(String(error)));
	await page.goto("/");
	await page.waitForSelector("#splash, #window", { state: "attached", timeout: 120_000 });
	expect(errors).toEqual([]);
});

test("模式构建产物可被加载且包含模式注册名", async ({ page }) => {
	const response = await page.request.get("/mode/general-soul-samsara.js");
	expect(response.ok()).toBeTruthy();
	const source = await response.text();
	expect(source).toContain("general-soul-samsara");
});
