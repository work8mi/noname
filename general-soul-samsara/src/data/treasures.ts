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
 * 原型宝物池（概要设计 §10.2 的 13 件）。
 *
 * 部分效果按引擎能力做了等价落地：血诏的"额外触发卖血技"改为摸牌 + 回复，
 * 青囊书的"触发卖血技"同样以摸牌替代；其余按设计实现。
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
	{
		id: "fangtian",
		name: "方天画戟",
		quality: "rare",
		description: "你使用的【杀】被【闪】抵消后，本回合下一张【杀】不可闪避。",
		skillId: "rogue_fangtian",
	},
	{
		id: "taiping",
		name: "太平要术",
		quality: "legendary",
		description: "每回合首次判定自动成功；每次判定后摸 1 张牌。",
		skillId: "rogue_taiping",
	},
	{
		id: "xuezhao",
		name: "血诏",
		quality: "rare",
		description: "每回合首次受到伤害后，摸 1 张牌并回复 1 点体力。",
		skillId: "rogue_xuezhao",
	},
	{
		id: "qingnang",
		name: "青囊书",
		quality: "gamechanger",
		description: "回合开始时若体力 > 1，失去 1 点体力并摸 1 张牌；每场战斗首次濒死时回复至 1 点体力。",
		skillId: "rogue_qingnang",
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
