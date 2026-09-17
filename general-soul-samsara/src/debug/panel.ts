/// <reference types="vite/client" />
import { ui } from "noname";
import { M01_SKILLS } from "../data/skills";
import { injectStyles } from "../battle/engine/ui";
import { addGold, addTreasure, equipSkill, heal } from "../run/state";
import { getTreasure } from "../data/treasures";
import { clearRun } from "../run/save";
import { SEED_KEY } from "../shared/constants";
import type { DebugHandle } from "../run/flow";

/**
 * 仅开发环境可用的调试面板（需求规格 §13.5）。
 *
 * E2E 测试也通过它铺设前置状态；发布构建中整段代码会被 Vite 替换掉。
 */
export function installDebugPanel(debug: DebugHandle): void {
	if (!__ROGUE_DEBUG__) return;
	if (document.querySelector(".rogue-debug-button")) return;
	injectStyles();

	const button = ui.create.div(".rogue-debug-button", "调试", ui.window);
	const panel = ui.create.div(".rogue-debug-panel.rogue-hidden", ui.window);
	button.onclick = () => panel.classList.toggle("rogue-hidden");

	addAction(panel, "金币 +100", () => {
		addGold(debug.state, 100);
	});
	addAction(panel, "回满体力", () => {
		heal(debug.state, debug.state.maxHp);
	});
	addAction(panel, "获得全部技能", () => {
		for (const skill of M01_SKILLS) equipSkill(debug.state, skill);
	});
	addAction(panel, "获得咆哮令", () => {
		addTreasure(debug.state, "paoxiaoling");
	});
	addAction(panel, "获得将魂灯", () => {
		addTreasure(debug.state, "jianghundeng");
	});
	addAction(panel, "直接胜利", () => {
		debug.forceResult("victory");
	});
	addAction(panel, "直接失败", () => {
		debug.forceResult("defeat");
	});
	addAction(panel, "清档重开", () => {
		clearRun();
		window.location.reload();
	});

	const seedInput = document.createElement("input");
	seedInput.placeholder = "固定种子（留空随机）";
	seedInput.value = localStorage.getItem(SEED_KEY) ?? "";
	seedInput.style.padding = "4px 6px";
	seedInput.onchange = () => {
		if (seedInput.value) localStorage.setItem(SEED_KEY, seedInput.value);
		else localStorage.removeItem(SEED_KEY);
	};
	panel.appendChild(seedInput);
}

function addAction(panel: any, text: string, action: () => void): void {
	const button = ui.create.div(".rogue-button", text, panel);
	button.onclick = action;
}
