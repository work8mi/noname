import { describe, expect, it } from "vitest";
import { LEVEL_SKILL_LEVELS, levelSkillIds } from "../../src/mode/levels";
import { getSkillMeta } from "../../src/data/skills";

describe("逐级技能数值", () => {
	it("等级效果只挂在技能池内的技能上", () => {
		const keys = Object.keys(LEVEL_SKILL_LEVELS);
		expect(keys.length).toBeGreaterThan(0);
		for (const skillId of keys) {
			expect(getSkillMeta(skillId), skillId).toBeDefined();
		}
		expect(keys.sort()).toEqual(["fankui", "guanxing", "jianxiong", "kongcheng", "kurou", "paoxiao", "qixi", "wusheng", "yiji"]);
	});

	it("每个技能至少有一个等级效果且等级合法", () => {
		for (const [skillId, levels] of Object.entries(LEVEL_SKILL_LEVELS)) {
			expect(levels.length, skillId).toBeGreaterThan(0);
			for (const level of levels) expect([2, 3], skillId).toContain(level);
		}
	});

	it("levelSkillIds 按等级返回引擎技能 id", () => {
		expect(levelSkillIds("paoxiao", 1)).toEqual([]);
		expect(levelSkillIds("paoxiao", 2)).toEqual(["rogue_lv_paoxiao_2"]);
		expect(levelSkillIds("paoxiao", 3)).toEqual(["rogue_lv_paoxiao_2", "rogue_lv_paoxiao_3"]);
		expect(levelSkillIds("wusheng", 3)).toEqual(["rogue_lv_wusheng_2", "rogue_lv_wusheng_3"]);
		expect(levelSkillIds("zhizhen", 3)).toEqual([]);
		expect(levelSkillIds("rogue_fusion_shenwei", 3)).toEqual([]);
	});
});
