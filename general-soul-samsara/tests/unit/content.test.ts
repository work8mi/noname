import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { BLACKLISTED_CARDS, BLACKLISTED_SKILLS, isCardBlacklisted, isSkillBlacklisted } from "../../src/data/blacklist";
import { CHARACTER_DECKS, deckSize, expandDeck, getCharacterDeck } from "../../src/data/decks";
import { M01_SKILLS, M03_SKILLS, getSkillMeta, getSlotSkills } from "../../src/data/skills";
import { MOB_DEFS, pickEncounter } from "../../src/data/enemies";
import { rollEncounter } from "../../src/mode/encounters";

describe("1v1 黑名单", () => {
	it("包含离间与借刀杀人", () => {
		expect(isSkillBlacklisted("lijian")).toBe(true);
		expect(isCardBlacklisted("jiedao")).toBe(true);
		expect(BLACKLISTED_SKILLS).toContain("hujia");
		expect(BLACKLISTED_CARDS).toContain("jiedao");
	});

	it("不误伤普通技能与卡牌", () => {
		expect(isSkillBlacklisted("wusheng")).toBe(false);
		expect(isCardBlacklisted("sha")).toBe(false);
	});
});

describe("初始卡组", () => {
	it("通用模板 20 张", () => {
		expect(getCharacterDeck("unknown-character")).toHaveLength(20);
	});

	it("赵云 20 张且分布正确", () => {
		const deck = getCharacterDeck("zhaoyun");
		expect(deck).toHaveLength(20);
		const count = (name: string) => deck.filter(card => card === name).length;
		expect(count("sha")).toBe(7);
		expect(count("shan")).toBe(7);
		expect(count("tao")).toBe(3);
		expect(count("jiu")).toBe(1);
		expect(count("wuzhong")).toBe(1);
		expect(count("guohe")).toBe(1);
	});

	it("全部武将模板都是 20 张", () => {
		for (const [id, template] of Object.entries(CHARACTER_DECKS)) {
			expect(deckSize(template), id).toBe(20);
		}
	});

	it("expandDeck 拒绝非法数量", () => {
		expect(() => expandDeck([{ name: "sha", count: -1 }])).toThrow();
		expect(() => expandDeck([{ name: "sha", count: 1.5 }])).toThrow();
	});
});

describe("技能元数据", () => {
	it("M0.1 是 3 主动 + 3 被动且 id 唯一", () => {
		const { active, passive } = getSlotSkills();
		expect(active).toHaveLength(3);
		expect(passive).toHaveLength(3);
		const ids = M01_SKILLS.map(skill => skill.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("M0.3 之后共 12 个技能且 id 唯一", () => {
		const ids = [...M01_SKILLS, ...M03_SKILLS].map(skill => skill.id);
		expect(ids).toHaveLength(12);
		expect(new Set(ids).size).toBe(12);
	});

	it("每个技能是稳定 ID 且带标签与等级说明", () => {
		for (const skill of [...M01_SKILLS, ...M03_SKILLS]) {
			expect(getSkillMeta(skill.id)?.name).toBe(skill.name);
			expect(skill.tags.length).toBeGreaterThan(0);
			expect(skill.levels).toHaveLength(2);
			expect(skill.id).toMatch(/^[a-z_]+$/);
		}
	});
});

describe("敌人配置", () => {
	it("5 种小兵都有牌表与意图，且 deck 非空", () => {
		expect(MOB_DEFS).toHaveLength(5);
		for (const mob of MOB_DEFS) {
			expect(mob.deck.length, mob.id).toBeGreaterThan(0);
			expect(mob.intents.length, mob.id).toBeGreaterThan(0);
			expect(mob.intents.some(entry => entry.weight > 0), mob.id).toBe(true);
			expect(mob.hp, mob.id).toBeGreaterThan(0);
		}
	});

	it("pickEncounter 至少返回一个敌人且不超过数量", () => {
		expect(pickEncounter(MOB_DEFS, 0)).toHaveLength(1);
		expect(pickEncounter(MOB_DEFS, 2)).toHaveLength(2);
		expect(pickEncounter(MOB_DEFS, 99)).toHaveLength(MOB_DEFS.length);
	});

	it("rollEncounter 生成 1-2 个不重复的敌人且可复现", () => {
		for (let i = 0; i < 30; i++) {
			const picked = rollEncounter(createRng(`enc-${i}`));
			expect(picked.length).toBeGreaterThanOrEqual(1);
			expect(picked.length).toBeLessThanOrEqual(2);
			expect(new Set(picked.map(mob => mob.id)).size).toBe(picked.length);
		}
		const a = rollEncounter(createRng("same")).map(mob => mob.id);
		const b = rollEncounter(createRng("same")).map(mob => mob.id);
		expect(a).toEqual(b);
	});
});
