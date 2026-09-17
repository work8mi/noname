import { expect, test } from "@playwright/test";

const CONFIG_PREFIX = "noname_0.9_";

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem("gplv3_noname_alerted", "true");
		// 固定种子：第 2 层为事件节点（桃园结义）
		localStorage.setItem("rogue_seed", "e2e-1");
	});
	page.on("dialog", dialog => dialog.accept());
});

/**
 * 通过 IndexedDB 写入 mode 配置 + directstart，让游戏直接进入将魂轮回，
 * 再点击「开始战斗」，验证模式启动与战斗初始化在真实浏览器中可用。
 */
test("可以直接进入将魂轮回并开始战斗", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", error => errors.push(String(error)));

	/** 幂等地开关调试面板（按钮是 toggle）。 */
	const setDebugPanelOpen = async (open: boolean) => {
		const hidden = await page.locator(".rogue-debug-panel").evaluate(node => node.classList.contains("rogue-hidden"));
		if (hidden === open) await page.locator(".rogue-debug-button").click();
	};

	await page.goto("/");
	await page.waitForSelector("#window", { state: "attached", timeout: 120_000 });

	await page.evaluate(async () => {
		await new Promise<void>((resolve, reject) => {
			const request = indexedDB.open("noname_0.9_data", 4);
			request.onsuccess = () => {
				const db = request.result;
				const tx = db.transaction("config", "readwrite");
				tx.objectStore("config").put("general-soul-samsara", "mode");
				tx.oncomplete = () => {
					db.close();
					resolve();
				};
				tx.onerror = () => {
					db.close();
					reject(tx.error);
				};
			};
			request.onerror = () => reject(request.error);
		});
	});
	await page.evaluate(prefix => localStorage.setItem(prefix + "directstart", "true"), CONFIG_PREFIX);
	await page.reload();

	await expect(page.locator(".rogue-title")).toHaveText("将魂轮回", { timeout: 120_000 });
	await page.locator(".rogue-button", { hasText: "新开一局" }).click();

	// 地图第一层只有一个入口节点，点击后进入战斗
	await page.locator(".rogue-node-current").first().click();
	await expect(page.locator(".rogue-intent").first()).toBeVisible({ timeout: 60_000 });

	// 通过调试面板结束战斗，验证胜利结算 → 技能三选一 → 回到地图
	await setDebugPanelOpen(true);
	await page.locator(".rogue-debug-panel .rogue-button", { hasText: "直接胜利" }).click();
	// 判定在玩家当前行动结束后生效：结束出牌阶段，并处理弃牌阶段的强制弃牌
	await page.locator("#control").getByText("结束回合").click();
	await page.waitForTimeout(1000);
	const selectAll = page.locator("#control").getByText("全选", { exact: true });
	if ((await selectAll.count()) > 0) {
		await selectAll.first().click();
		const confirm = page.locator("#control").getByText("确定", { exact: true });
		if ((await confirm.count()) > 0) await confirm.first().click();
	}
	await expect(page.locator(".rogue-title")).toHaveText("战斗胜利", { timeout: 60_000 });
	await page.locator(".rogue-card").first().click();
	await expect(page.locator(".rogue-title")).toHaveText("第 1 章", { timeout: 30_000 });

	// 第 2 层的事件节点：进入事件面板并选择一个选项
	await page.locator(".rogue-node-current", { hasText: "事件" }).click();
	await expect(page.locator(".rogue-description")).toContainText("桃园", { timeout: 30_000 });
	await page.locator(".rogue-option", { hasText: "独行" }).click();
	await expect(page.locator(".rogue-title")).toHaveText("第 1 章", { timeout: 30_000 });

	// 宝物：调试发放后可在查看面板确认，槽位宝物会扩展主动槽
	await setDebugPanelOpen(true);
	await page.locator(".rogue-debug-panel .rogue-button", { hasText: "获得咆哮令" }).click();
	await page.locator(".rogue-debug-panel .rogue-button", { hasText: "获得将魂灯" }).click();
	await setDebugPanelOpen(false);
	await page.locator(".rogue-button", { hasText: "查看宝物" }).click();
	await expect(page.locator(".rogue-card-name", { hasText: "咆哮令" })).toBeVisible({ timeout: 30_000 });
	await page.locator(".rogue-button", { hasText: "返回" }).click();
	await page.locator(".rogue-button", { hasText: "查看技能" }).click();
	await expect(page.locator(".rogue-card-kind").filter({ hasText: "主动 4" })).toBeVisible({ timeout: 30_000 });
	await page.locator(".rogue-button", { hasText: "返回" }).click();
	expect(errors).toEqual([]);
});
