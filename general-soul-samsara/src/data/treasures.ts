import type { Rng } from "../shared/rng";

export type TreasureQuality = "common" | "rare" | "legendary" | "gamechanger";

export interface TreasureDef {
	id: string;
	name: string;
	quality: TreasureQuality;
	description: string;
	/** 战斗内生效的引擎技能 id。 */
	skillId?: string;
	/** 元层效果：槽位扩展。 */
	meta?: "active-slot" | "passive-slot";
}

export const QUALITY_LABELS: Record<TreasureQuality, string> = {
	common: "普通",
	rare: "稀有",
	legendary: "传奇",
	gamechanger: "质变",
};

/**
 * 原型宝物池。
 *
 * 概要设计 §10.2 的 13 件中，方天画戟、血诏、太平要术、青囊书涉及判定覆盖、
 * 卖血重触发与濒死保护，待后续接入；其余 9 件已实现。
 */
export const TREASURES: readonly TreasureDef[] = [
	{
		id: "paoxiaoling",
		name: "咆哮令",
		quality: "common",
		description: "每回合首次使用【杀】后摸 1 张牌。",
		skillId: "rogue_paoxiaoling",
	},
	{
		id: "jizhifu",
		name: "集智符",
		quality: "common",
		description: "每使用一张锦囊牌摸 1 张牌。",
		skillId: "rogue_jizhifu",
	},
	{
		id: "xiaoji",
		name: "枭姬令",
		quality: "common",
		description: "每使用一张装备牌摸 1 张牌。",
		skillId: "rogue_xiaoji",
	},
	{
		id: "bagua",
		name: "八卦阵",
		quality: "common",
		description: "每回合首次受到伤害时判定，红色则防止此伤害。",
		skillId: "rogue_bagua",
	},
	{
		id: "qinglong",
		name: "青龙偃月刀",
		quality: "rare",
		description: "每回合第一张【杀】伤害 +1；击杀角色后回复 1 点体力。",
		skillId: "rogue_qinglong",
	},
	{
		id: "yuxi",
		name: "玉玺",
		quality: "rare",
		description: "摸牌阶段多摸 1 张牌，手牌上限 +1。",
		skillId: "rogue_yuxi",
	},
	{
		id: "zhugeliannu",
		name: "诸葛连弩",
		quality: "legendary",
		description: "每回合使用【杀】的次数 +2，但你使用【杀】造成的伤害 -1。",
		skillId: "rogue_zhugeliannu",
	},
	{
		id: "jianghundeng",
		name: "将魂灯",
		quality: "gamechanger",
		description: "通用主动槽 +1。",
		meta: "active-slot",
	},
	{
		id: "bingshu",
		name: "兵书二十四卷",
		quality: "gamechanger",
		description: "通用被动槽 +1。",
		meta: "passive-slot",
	},
];

export function getTreasure(id: string): TreasureDef | undefined {
	return TREASURES.find(treasure => treasure.id === id);
}

/** 从品质池中抽取未拥有的宝物。 */
export function rollTreasure(rng: Rng, owned: readonly string[], qualities?: readonly TreasureQuality[]): TreasureDef | undefined {
	const pool = TREASURES.filter(treasure => !owned.includes(treasure.id) && (!qualities || qualities.includes(treasure.quality)));
	if (!pool.length) return undefined;
	return pool[rng.int(pool.length)];
}

/** 商店宝物价（概要设计 §7.3：150-300）。 */
export function treasurePrice(treasure: TreasureDef, rng: Rng): number {
	switch (treasure.quality) {
		case "common":
			return 150;
		case "rare":
			return 200 + rng.int(51);
		case "legendary":
			return 250 + rng.int(51);
		case "gamechanger":
			return 300;
	}
}
