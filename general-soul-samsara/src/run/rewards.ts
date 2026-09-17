import type { Rng } from "../shared/rng";
import { isSkillBlacklisted } from "../data/blacklist";
import { ALL_GENERAL_SKILLS, getSkillMeta } from "../data/skills";
import { getRecipeOutput } from "../data/recipes";
import type { SkillMeta, SkillQuality } from "../shared/types";
import { equippedTags, hasSkill, type RunState } from "./state";

/** 普通战金币 20-30（卡牌不再由战斗掉落，金币为主要产出）。 */
export function rollGold(rng: Rng): number {
	return 20 + rng.int(11);
}

/** 精英战金币 50-70。 */
export function rollEliteGold(rng: Rng): number {
	return 50 + rng.int(21);
}

/** 首领战金币 100-140。 */
export function rollBossGold(rng: Rng): number {
	return 100 + rng.int(41);
}

export function availableSkillPool(state: RunState): SkillMeta[] {
	return ALL_GENERAL_SKILLS.filter(skill => !isSkillBlacklisted(skill.id) && !hasSkill(state, skill.id));
}

export interface SkillOfferOptions {
	count?: number;
	/** 品质抽取权重；未提供的品质按 1 计。 */
	weights?: Partial<Record<SkillQuality, number>>;
}

/**
 * 战后三选一：按品质权重抽取（前期普通、精英稀有、Boss 传奇），
 * 每个槽位内再按 70% 匹配已有标签 / 30% 跨流派随机（概要设计 §5.2）。
 */
export function rollSkillOffers(state: RunState, rng: Rng, options: SkillOfferOptions = {}): SkillMeta[] {
	const count = options.count ?? 3;
	const pool = availableSkillPool(state);
	if (pool.length <= count) return [...pool].sort((a, b) => a.id.localeCompare(b.id));
	const owned = new Set(equippedTags(state, id => getSkillMeta(id) ?? getRecipeOutput(id)));
	const remaining = [...pool];
	const offers: SkillMeta[] = [];
	while (offers.length < count && remaining.length) {
		const quality = pickQuality(remaining, options.weights, rng);
		const qualityPool = remaining.filter(skill => skill.quality === quality);
		const source = qualityPool.length ? qualityPool : remaining;
		const matched = source.filter(skill => skill.tags.some(tag => owned.has(tag)));
		const useMatched = owned.size > 0 && matched.length > 0 && rng.next() < 0.7;
		const candidates = useMatched ? matched : source;
		const picked = candidates[rng.int(candidates.length)];
		offers.push(picked);
		remaining.splice(remaining.indexOf(picked), 1);
	}
	return offers;
}

function pickQuality(pool: readonly SkillMeta[], weights: Partial<Record<SkillQuality, number>> | undefined, rng: Rng): SkillQuality {
	const qualities = [...new Set(pool.map(skill => skill.quality))];
	const weightOf = (quality: SkillQuality) => weights?.[quality] ?? 1;
	const total = qualities.reduce((sum, quality) => sum + weightOf(quality), 0);
	if (total <= 0) return qualities[0];
	let roll = rng.next() * total;
	for (const quality of qualities) {
		roll -= weightOf(quality);
		if (roll < 0) return quality;
	}
	return qualities[qualities.length - 1];
}

/** 按节点类型与章节给出技能品质权重。 */
export function battleOfferWeights(nodeType: string, chapter: number): Partial<Record<SkillQuality, number>> {
	if (nodeType === "boss") return { common: 0.2, rare: 2, legendary: 8 };
	if (nodeType === "elite") return { common: 1, rare: 6, legendary: 3 };
	return chapter >= 2 ? { common: 4, rare: 5, legendary: 1 } : { common: 7, rare: 3, legendary: 0.5 };
}

/** 商店技能标价：主动 100-150、被动 120-180（概要设计 §7.3）。 */
export function skillPrice(skill: SkillMeta, rng: Rng): number {
	return skill.kind === "active" ? 100 + rng.int(51) : 120 + rng.int(61);
}

/** 商店可售卡牌与价格（概要设计 §6.2 / §7.3）。 */
export type ShopCardKind = "basic" | "trick" | "special" | "weapon" | "armor";

export interface ShopCardDef {
	id: string;
	kind: ShopCardKind;
	price: number;
}

export const CARD_KIND_LABELS: Record<ShopCardKind, string> = {
	basic: "基本牌",
	trick: "锦囊",
	special: "特殊锦囊",
	weapon: "武器",
	armor: "防具",
};

/**
 * 原型商店卡池：基本牌 / 基础锦囊 / 特殊锦囊 / 武器 / 防具。
 *
 * 坐骑与宝物类装备卡按需求规格 §2.2 留到原型后接入。
 * 特殊锦囊与部分装备来自 extra 卡包（默认启用）。
 */
export const SHOP_CARDS: readonly ShopCardDef[] = [
	{ id: "sha", kind: "basic", price: 50 },
	{ id: "shan", kind: "basic", price: 50 },
	{ id: "tao", kind: "basic", price: 60 },
	{ id: "jiu", kind: "basic", price: 50 },
	{ id: "wuzhong", kind: "trick", price: 80 },
	{ id: "guohe", kind: "trick", price: 80 },
	{ id: "shunshou", kind: "trick", price: 80 },
	{ id: "juedou", kind: "trick", price: 80 },
	{ id: "nanman", kind: "trick", price: 120 },
	{ id: "wanjian", kind: "trick", price: 120 },
	{ id: "taoyuan", kind: "special", price: 150 },
	{ id: "wugu", kind: "special", price: 130 },
	{ id: "huogong", kind: "special", price: 120 },
	{ id: "tiesuo", kind: "special", price: 120 },
	{ id: "zhuge", kind: "weapon", price: 150 },
	{ id: "qinggang", kind: "weapon", price: 130 },
	{ id: "cixiong", kind: "weapon", price: 130 },
	{ id: "zhangba", kind: "weapon", price: 130 },
	{ id: "guanshi", kind: "weapon", price: 120 },
	{ id: "qilin", kind: "weapon", price: 130 },
	{ id: "hanbing", kind: "weapon", price: 120 },
	{ id: "zhuque", kind: "weapon", price: 130 },
	{ id: "guding", kind: "weapon", price: 120 },
	{ id: "bagua", kind: "armor", price: 120 },
	{ id: "renwang", kind: "armor", price: 120 },
	{ id: "tengjia", kind: "armor", price: 110 },
	{ id: "baiyin", kind: "armor", price: 130 },
];

export function getShopCard(id: string): ShopCardDef | undefined {
	return SHOP_CARDS.find(card => card.id === id);
}

export function cardPrice(id: string): number {
	return getShopCard(id)?.price ?? 80;
}

/** 商店卡牌的类型标签；未知卡牌回退为"卡牌"。 */
export function cardKindLabel(id: string): string {
	const card = getShopCard(id);
	return card ? CARD_KIND_LABELS[card.kind] : "卡牌";
}

/** 随机抽取商店卡牌（默认 5 张，不重复）。 */
export function rollShopCards(rng: Rng, count = 5): string[] {
	const pool = SHOP_CARDS.map(card => card.id);
	const result: string[] = [];
	while (result.length < count && pool.length) {
		result.push(pool.splice(rng.int(pool.length), 1)[0]);
	}
	return result;
}

/** 每章可售卖卡牌次数（需求规格 §7.1）。 */
export const MAX_SALES_PER_CHAPTER = 3;

/** 售卖卡牌的金币回收价：基本牌 15 / 锦囊与装备 30 / 诅咒与未知 10。 */
export function sellPrice(id: string): number {
	const card = getShopCard(id);
	if (!card) return 10;
	if (card.kind === "basic") return 15;
	return 30;
}

/** 本章剩余售卖次数。 */
export function salesLeft(state: RunState): number {
	return Math.max(0, MAX_SALES_PER_CHAPTER - (state.salesUsed ?? 0));
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
