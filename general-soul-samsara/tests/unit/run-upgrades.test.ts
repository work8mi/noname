import { describe, expect, it } from "vitest";
import { UPGRADE_EFFECTS, isUpgradable, upgradeEffect } from "../../src/data/upgrades";
import { createRunState, upgradeCardAt } from "../../src/run/state";

describe("卡牌升级", () => {
	it("覆盖概要设计 §6.3 的六种牌", () => {
		expect(Object.keys(UPGRADE_EFFECTS).sort()).toEqual(["guohe", "sha", "shan", "shunshou", "tao", "wuzhong"]);
		for (const id of Object.keys(UPGRADE_EFFECTS)) {
			expect(isUpgradable(id), id).toBe(true);
			expect(upgradeEffect(id)?.length, id).toBeGreaterThan(0);
		}
		expect(isUpgradable("juedou")).toBe(false);
		expect(upgradeEffect("juedou")).toBeUndefined();
	});

	it("升级单张牌：生效一次且不影响其他牌", () => {
		const state = createRunState("seed");
		expect(state.deck.every(card => !card.upgraded)).toBe(true);
		const shaIndex = state.deck.findIndex(card => card.id === "sha");
		expect(upgradeCardAt(state, shaIndex)).toBe(true);
		expect(state.deck[shaIndex].upgraded).toBe(true);
		expect(upgradeCardAt(state, shaIndex)).toBe(false);
		expect(state.deck.filter(card => card.upgraded)).toHaveLength(1);
	});

	it("越界返回 false", () => {
		const state = createRunState("seed");
		expect(upgradeCardAt(state, -1)).toBe(false);
		expect(upgradeCardAt(state, 999)).toBe(false);
	});
});
