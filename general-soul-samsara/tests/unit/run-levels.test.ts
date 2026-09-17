import { describe, expect, it } from "vitest";
import { LEVEL_SKILLS, LEVEL_SKILL_DEFS, levelSkillIds } from "../../src/mode/levels";
import { getSkillMeta } from "../../src/data/skills";

describe("逐级技能数值", () => {
	it("等级效果只挂在技能池内的技能上", () => {
		const keys = Object.keys(LEVEL_SKILLS);
		expect(keys.length).toBeGreaterThan(0);
		for (const skillId of keys) {
			expect(getSkillMeta(skillId), skillId).toBeDefined();
		}
		expect(keys.sort()).toEqual(["fankui", "jianxiong", "kongcheng", "paoxiao", "yiji"]);
	});

	it("每个技能至少有一个等级效果且都有 filter/content", () => {
		for (const [skillId, levels] of Object.entries(LEVEL_SKILLS)) {
			const defs = [levels[2], levels[3]].filter(Boolean);
			expect(defs.length, skillId).toBeGreaterThan(0);
			for (const def of defs) {
				expect(typeof def.filter, skillId).toBe("function");
				expect(typeof def.content, skillId).toBe("function");
			}
		}
	});

	it("levelSkillIds 按等级返回引擎技能 id", () => {
		expect(levelSkillIds("paoxiao", 1)).toEqual([]);
		expect(levelSkillIds("paoxiao", 2)).toEqual(["rogue_lv_paoxiao_2"]);
		expect(levelSkillIds("paoxiao", 3)).toEqual(["rogue_lv_paoxiao_2", "rogue_lv_paoxiao_3"]);
		expect(levelSkillIds("wusheng", 3)).toEqual([]);
		expect(levelSkillIds("rogue_fusion_shenwei", 3)).toEqual([]);
	});

	it("技能表与注入表一致", () => {
		const expected = Object.entries(LEVEL_SKILLS).flatMap(([skillId, levels]) =>
			([2, 3] as const).filter(level => levels[level]).map(level => `rogue_lv_${skillId}_${level}`)
		);
		expect(Object.keys(LEVEL_SKILL_DEFS).sort()).toEqual(expected.sort());
	});
});
