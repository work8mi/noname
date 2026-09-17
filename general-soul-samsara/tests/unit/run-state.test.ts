import { describe, expect, it } from "vitest";
import { addCard, addGold, countCard, createRunState, damage, equipSkill, hasSkill, heal, removeCardAt } from "../../src/run/state";
import { getSkillMeta, M01_SKILLS } from "../../src/data/skills";

describe("单局状态", () => {
	it("新开局：赵云 4 血、20 张卡、100 金币、空槽位", () => {
		const state = createRunState("seed");
		expect(state.hp).toBe(4);
		expect(state.maxHp).toBe(4);
		expect(state.gold).toBe(100);
		expect(state.deck).toHaveLength(20);
		expect(state.slots.active).toEqual([null, null, null]);
		expect(state.slots.passive).toEqual([null, null, null]);
		expect(state.finished).toBe(false);
	});

	it("装备技能：优先空槽，重复技能不生效", () => {
		const state = createRunState("seed");
		const wusheng = getSkillMeta("wusheng")!;
		expect(equipSkill(state, wusheng).ok).toBe(true);
		expect(equipSkill(state, wusheng).ok).toBe(false);
		expect(hasSkill(state, "wusheng")).toBe(true);
		expect(state.slots.active[0]?.id).toBe("wusheng");
	});

	it("槽位满时返回 needReplace，指定槽位后替换", () => {
		const state = createRunState("seed");
		const active = M01_SKILLS.filter(skill => skill.kind === "active");
		for (const skill of active) expect(equipSkill(state, skill).ok).toBe(true);
		const extra = getSkillMeta("guanxing")!;
		const result = equipSkill(state, extra);
		expect(result.needReplace).toBe(true);
		expect(equipSkill(state, extra, 1)).toMatchObject({ ok: true, replaced: { id: active[1].id } });
		expect(state.slots.active[1]?.id).toBe("guanxing");
	});

	it("金币、体力与删除卡牌", () => {
		const state = createRunState("seed");
		addGold(state, 50);
		expect(state.gold).toBe(150);
		addGold(state, -999);
		expect(state.gold).toBe(0);
		damage(state, 2);
		expect(state.hp).toBe(2);
		heal(state, 99);
		expect(state.hp).toBe(4);
		damage(state, 99);
		expect(state.finished).toBe(true);
	});

	it("删除与新增卡牌", () => {
		const state = createRunState("seed");
		const before = state.deck.length;
		const removed = removeCardAt(state, 0);
		expect(removed).toBeDefined();
		expect(state.deck).toHaveLength(before - 1);
		addCard(state, "sha");
		expect(state.deck).toHaveLength(before);
		expect(countCard(state, "sha")).toBe(7);
		expect(removeCardAt(state, 999)).toBeUndefined();
	});
});
