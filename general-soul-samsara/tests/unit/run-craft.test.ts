import { describe, expect, it } from "vitest";
import { RECIPES, getRecipe } from "../../src/data/recipes";
import { getSkillMeta } from "../../src/data/skills";
import { applyRecipe, availableRecipes, canApplyRecipe, findSkillSlot } from "../../src/run/craft";
import { MAX_SKILL_LEVEL, createRunState, equipSkill, hasSkill, slotList, upgradeSkillAt } from "../../src/run/state";

function equip(state: ReturnType<typeof createRunState>, id: string): void {
	const meta = getSkillMeta(id);
	expect(meta, id).toBeDefined();
	expect(equipSkill(state, meta!).ok, id).toBe(true);
}

describe("技能升级", () => {
	it("等级 1→3 封顶", () => {
		const state = createRunState("seed");
		equip(state, "wusheng");
		const index = slotList(state, "active").findIndex(skill => skill?.id === "wusheng");
		expect(upgradeSkillAt(state, "active", index)).toBe(true);
		expect(upgradeSkillAt(state, "active", index)).toBe(true);
		expect(upgradeSkillAt(state, "active", index)).toBe(false);
		expect(slotList(state, "active")[index]?.level).toBe(MAX_SKILL_LEVEL);
	});

	it("空槽或越界返回 false", () => {
		const state = createRunState("seed");
		expect(upgradeSkillAt(state, "active", 0)).toBe(false);
		expect(upgradeSkillAt(state, "passive", 99)).toBe(false);
	});
});

describe("配方执行", () => {
	it("融合：消耗两个技能并占用一个槽位", () => {
		const state = createRunState("seed");
		equip(state, "wusheng");
		equip(state, "tieqi");
		const recipe = getRecipe("shenwei")!;
		expect(canApplyRecipe(state, recipe)).toBe(true);
		expect(availableRecipes(state).some(item => item.id === "shenwei")).toBe(true);
		expect(applyRecipe(state, recipe)).toBe(true);
		expect(hasSkill(state, "wusheng")).toBe(false);
		expect(hasSkill(state, "tieqi")).toBe(false);
		expect(hasSkill(state, "rogue_fusion_shenwei")).toBe(true);
		const filled = slotList(state, "active").filter(Boolean);
		expect(filled).toHaveLength(1);
		expect(applyRecipe(state, recipe)).toBe(false);
	});

	it("输入不齐时不可执行", () => {
		const state = createRunState("seed");
		equip(state, "wusheng");
		expect(canApplyRecipe(state, getRecipe("shenwei")!)).toBe(false);
		expect(applyRecipe(state, getRecipe("shenwei")!)).toBe(false);
		expect(availableRecipes(state)).toHaveLength(0);
	});

	it("进化需要 Lv2，产物继承等级与槽位类型", () => {
		const state = createRunState("seed");
		equip(state, "wusheng");
		const recipe = getRecipe("qinglong_wusheng")!;
		expect(canApplyRecipe(state, recipe)).toBe(false);
		const index = slotList(state, "active").findIndex(skill => skill?.id === "wusheng");
		upgradeSkillAt(state, "active", index);
		expect(canApplyRecipe(state, recipe)).toBe(true);
		expect(applyRecipe(state, recipe)).toBe(true);
		const slot = findSkillSlot(state, "rogue_evo_qinglong");
		expect(slot?.kind).toBe("active");
		expect(slot?.skill.level).toBe(2);
	});

	it("配方数据与执行结果一致（所有融合配方可执行）", () => {
		for (const recipe of RECIPES.filter(item => item.kind === "fusion")) {
			const state = createRunState("seed");
			for (const input of recipe.inputs) equip(state, input);
			expect(applyRecipe(state, recipe), recipe.id).toBe(true);
			expect(hasSkill(state, recipe.output.id), recipe.id).toBe(true);
		}
	});
});
