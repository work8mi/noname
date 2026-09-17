import { describe, expect, it } from "vitest";
import { RECIPES, RECIPE_TRANSLATE, getRecipe, getRecipeOutput } from "../../src/data/recipes";
import { ALL_GENERAL_SKILLS, getSkillMeta } from "../../src/data/skills";

describe("配方表", () => {
	it("6 条融合 + 6 条进化，产物 id 唯一", () => {
		expect(RECIPES.filter(recipe => recipe.kind === "fusion")).toHaveLength(6);
		expect(RECIPES.filter(recipe => recipe.kind === "evolution")).toHaveLength(6);
		const outputs = RECIPES.map(recipe => recipe.output.id);
		expect(new Set(outputs).size).toBe(outputs.length);
	});

	it("融合输入为两个同标签的技能且都存在于技能池", () => {
		for (const recipe of RECIPES.filter(item => item.kind === "fusion")) {
			expect(recipe.inputs, recipe.id).toHaveLength(2);
			const metas = recipe.inputs.map(id => getSkillMeta(id));
			expect(metas.every(Boolean), recipe.id).toBe(true);
			const tags = metas.flatMap(meta => meta!.tags);
			expect(new Set(tags).size < tags.length, `${recipe.id} 应共享标签`).toBe(true);
		}
	});

	it("进化输入为一个技能且需要 Lv2", () => {
		for (const recipe of RECIPES.filter(item => item.kind === "evolution")) {
			expect(recipe.inputs, recipe.id).toHaveLength(1);
			expect(getSkillMeta(recipe.inputs[0]), recipe.id).toBeDefined();
			expect(recipe.minLevel, recipe.id).toBe(2);
		}
	});

	it("translate 覆盖所有产物的名称与描述", () => {
		for (const recipe of RECIPES) {
			expect(RECIPE_TRANSLATE[recipe.output.id], recipe.id).toBe(recipe.output.name);
			expect(RECIPE_TRANSLATE[`${recipe.output.id}_info`], recipe.id).toBeTruthy();
			expect(recipe.output.tags.length, recipe.id).toBeGreaterThan(0);
		}
	});

	it("getRecipe / getRecipeOutput", () => {
		expect(getRecipe("shenwei")?.inputs).toEqual(["wusheng", "tieqi"]);
		expect(getRecipeOutput("rogue_fusion_shenwei")?.name).toBe("神威");
		expect(getRecipe("missing")).toBeUndefined();
		expect(getRecipeOutput("wusheng")).toBeUndefined();
	});

	it("未使用的技能池保持一致", () => {
		expect(ALL_GENERAL_SKILLS).toHaveLength(12);
	});
});
