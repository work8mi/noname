import type { Rng } from "../shared/rng";
import { isSkillBlacklisted } from "../data/blacklist";
import { ALL_GENERAL_SKILLS, getSkillMeta } from "../data/skills";
import type { SkillMeta } from "../shared/types";
import { equippedTags, hasSkill, type RunState } from "./state";

/** 普通战金币 15-25（概要设计 §7.1）。 */
export function rollGold(rng: Rng): number {
	return 15 + rng.int(11);
}

/** 精英战金币 40-60。 */
export function rollEliteGold(rng: Rng): number {
	return 40 + rng.int(21);
}

/** 首领战金币 80-120（概要设计 §7.1）。 */
export function rollBossGold(rng: Rng): number {
	return 80 + rng.int(41);
}

export function availableSkillPool(state: RunState): SkillMeta[] {
	return ALL_GENERAL_SKILLS.filter(skill => !isSkillBlacklisted(skill.id) && !hasSkill(state, skill.id));
}

/**
 * 战后三选一：70% 匹配已有标签、30% 跨流派随机（概要设计 §5.2）。
 */
export function rollSkillOffers(state: RunState, rng: Rng, count = 3): SkillMeta[] {
	const pool = availableSkillPool(state);
	if (pool.length <= count) return [...pool].sort((a, b) => a.id.localeCompare(b.id));
	const owned = new Set(equippedTags(state, getSkillMeta));
	const matched = pool.filter(skill => skill.tags.some(tag => owned.has(tag)));
	const offers: SkillMeta[] = [];
	const matchedPool = [...matched];
	const globalPool = [...pool];
	for (let i = 0; i < count; i++) {
		const useMatched = owned.size > 0 && matchedPool.length > 0 && rng.next() < 0.7;
		const source = useMatched ? matchedPool : globalPool;
		if (!source.length) break;
		const picked = source.splice(rng.int(source.length), 1)[0];
		offers.push(picked);
		const globalIndex = globalPool.indexOf(picked);
		if (globalIndex !== -1) globalPool.splice(globalIndex, 1);
		const matchedIndex = matchedPool.indexOf(picked);
		if (matchedIndex !== -1) matchedPool.splice(matchedIndex, 1);
	}
	return offers;
}

/** 商店技能标价：主动 100-150、被动 120-180（概要设计 §7.3）。 */
export function skillPrice(skill: SkillMeta, rng: Rng): number {
	return skill.kind === "active" ? 100 + rng.int(51) : 120 + rng.int(61);
}

/** 商店可售卡牌与价格（原型子集，§6.2 与 §7.3）。 */
const SHOP_CARD_PRICES: Readonly<Record<string, number>> = {
	sha: 50,
	shan: 50,
	tao: 60,
	jiu: 50,
	wuzhong: 80,
	guohe: 80,
	shunshou: 80,
	juedou: 80,
	nanman: 120,
	wanjian: 120,
};

export function cardPrice(id: string): number {
	return SHOP_CARD_PRICES[id] ?? 80;
}

/** 随机 3 张商店卡牌；不重复。 */
export function rollShopCards(rng: Rng, count = 3): string[] {
	const pool = Object.keys(SHOP_CARD_PRICES);
	const result: string[] = [];
	while (result.length < count && pool.length) {
		result.push(pool.splice(rng.int(pool.length), 1)[0]);
	}
	return result;
}

/** 事件奖励的技能：优先指定 id，缺失或已拥有时按类型随机。 */
export function pickGrantedSkill(state: RunState, rng: Rng, skillId?: string, kind?: "active" | "passive"): SkillMeta | undefined {
	if (!skillId && !kind) return undefined;
	if (skillId) {
		const meta = getSkillMeta(skillId);
		if (meta && !hasSkill(state, meta.id)) return meta;
	}
	const pool = availableSkillPool(state).filter(skill => !kind || skill.kind === kind);
	if (!pool.length) return undefined;
	return pool[rng.int(pool.length)];
}

/** 删牌价格：75 起，每次 +25。 */
export function removeCardPrice(state: RunState): number {
	return 75 + 25 * state.battleCount;
}
