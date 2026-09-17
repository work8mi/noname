import { describe, expect, it } from "vitest";
import { resolvePhaseIndex } from "../../src/battle/phases";
import { HUAXIONG_DEF, MOB_DEFS, ZHANGJIAO_DEF, getChapterBoss } from "../../src/data/enemies";
import { createRng } from "../../src/shared/rng";
import { rollEncounter } from "../../src/mode/encounters";

describe("阶段推进", () => {
	const phases = ZHANGJIAO_DEF.phases!;

	it("体力比例跌破阈值时推进阶段", () => {
		const max = ZHANGJIAO_DEF.hp;
		expect(resolvePhaseIndex(max, max, phases)).toBe(0);
		expect(resolvePhaseIndex(7, max, phases)).toBe(1);
		expect(resolvePhaseIndex(3, max, phases)).toBe(2);
		expect(resolvePhaseIndex(1, max, phases)).toBe(2);
	});

	it("一次伤害跨过多个阈值时直接进入最深阶段", () => {
		expect(resolvePhaseIndex(1, 12, phases)).toBe(2);
	});

	it("非法体力上限安全返回基础阶段", () => {
		expect(resolvePhaseIndex(0, 0, phases)).toBe(0);
	});
});

describe("章尾对手", () => {
	it("第 1 章为精英华雄、第 2 章为首领张角", () => {
		expect(getChapterBoss(1).id).toBe(HUAXIONG_DEF.id);
		expect(getChapterBoss(2).id).toBe(ZHANGJIAO_DEF.id);
		expect(getChapterBoss(3).id).toBe(ZHANGJIAO_DEF.id);
	});

	it("华雄带狂暴与蓄力斩（高伤蓄力意图）", () => {
		expect(HUAXIONG_DEF.affixes).toContain("kuangbao");
		const charge = HUAXIONG_DEF.intents.find(intent => intent.type === "charge");
		expect(charge?.value).toBe(2);
	});

	it("张角有两个阶段：召唤与伤害强化", () => {
		expect(ZHANGJIAO_DEF.phases).toHaveLength(2);
		const summon = ZHANGJIAO_DEF.phases![0].intents.find(intent => intent.type === "summon");
		expect(summon?.summon?.id).toBe(MOB_DEFS[0].id);
		expect(ZHANGJIAO_DEF.phases![1].damageBonus).toBe(1);
		expect(ZHANGJIAO_DEF.phases![1].intents.some(intent => intent.type === "judge")).toBe(true);
	});
});

describe("遭遇战难度", () => {
	it("第 2 章固定两名敌人", () => {
		for (let i = 0; i < 10; i++) {
			expect(rollEncounter(createRng(`ch2-${i}`), 2)).toHaveLength(2);
		}
	});

	it("第 1 章为 1-2 名敌人且不重复", () => {
		for (let i = 0; i < 20; i++) {
			const picked = rollEncounter(createRng(`ch1-${i}`), 1);
			expect(picked.length).toBeGreaterThanOrEqual(1);
			expect(picked.length).toBeLessThanOrEqual(2);
			expect(new Set(picked.map(enemy => enemy.id)).size).toBe(picked.length);
		}
	});
});
