import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";
import { QUALITY_LABELS, TREASURES, getTreasure, rollTreasure, treasurePrice } from "../../src/data/treasures";
import { MAX_SLOT_COUNT, addTreasure, createRunState, hasTreasure } from "../../src/run/state";

describe("宝物数据", () => {
	it("13 件宝物、id 唯一、品质合法", () => {
		expect(TREASURES).toHaveLength(13);
		const ids = TREASURES.map(treasure => treasure.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const treasure of TREASURES) {
			expect(Object.keys(QUALITY_LABELS)).toContain(treasure.quality);
			expect(treasure.description.length, treasure.id).toBeGreaterThan(0);
			expect(Boolean(treasure.skillId) !== Boolean(treasure.meta), treasure.id).toBe(true);
		}
		expect(getTreasure("paoxiaoling")?.name).toBe("咆哮令");
		expect(getTreasure("missing")).toBeUndefined();
	});

	it("抽取排除已拥有并支持品质过滤", () => {
		const owned = TREASURES.slice(0, 5).map(treasure => treasure.id);
		for (let i = 0; i < 30; i++) {
			const picked = rollTreasure(createRng(`roll-${i}`), owned);
			expect(picked).toBeDefined();
			expect(owned).not.toContain(picked!.id);
			const rare = rollTreasure(createRng(`rare-${i}`), [], ["rare"]);
			expect(rare?.quality).toBe("rare");
		}
		expect(rollTreasure(createRng("none"), TREASURES.map(treasure => treasure.id))).toBeUndefined();
	});

	it("价格随品质递增", () => {
		const rng = createRng("price");
		expect(treasurePrice(getTreasure("paoxiaoling")!, rng)).toBe(150);
		const rare = treasurePrice(getTreasure("yuxi")!, rng);
		expect(rare).toBeGreaterThanOrEqual(200);
		expect(rare).toBeLessThanOrEqual(250);
		expect(treasurePrice(getTreasure("zhugeliannu")!, rng)).toBeGreaterThanOrEqual(250);
		expect(treasurePrice(getTreasure("jianghundeng")!, rng)).toBe(300);
	});
});

describe("宝物获取", () => {
	it("获取、去重与查询", () => {
		const state = createRunState("seed");
		expect(addTreasure(state, "paoxiaoling")).toBe(true);
		expect(addTreasure(state, "paoxiaoling")).toBe(false);
		expect(addTreasure(state, "missing")).toBe(false);
		expect(hasTreasure(state, "paoxiaoling")).toBe(true);
		expect(state.treasures).toEqual(["paoxiaoling"]);
	});

	it("将魂灯扩展主动槽，兵书扩展被动槽，上限 4", () => {
		const state = createRunState("seed");
		expect(state.slots.active).toHaveLength(3);
		addTreasure(state, "jianghundeng");
		expect(state.slots.active).toHaveLength(MAX_SLOT_COUNT);
		expect(state.slots.passive).toHaveLength(3);
		addTreasure(state, "bingshu");
		expect(state.slots.passive).toHaveLength(MAX_SLOT_COUNT);
	});

	it("槽位已达上限时不再扩展", () => {
		const state = createRunState("seed");
		state.slots.active.push(null);
		addTreasure(state, "jianghundeng");
		expect(state.slots.active).toHaveLength(MAX_SLOT_COUNT);
	});
});
