/** 诅咒牌定义（概要设计 §9 的原型子集）。 */
export interface CurseDef {
	id: string;
	name: string;
	description: string;
}

export const CURSES: readonly CurseDef[] = [
	{
		id: "rogue_curse_lebu",
		name: "乐不思蜀",
		description: "判定阶段：若此牌在手牌中，判定非红桃则跳过本回合的出牌阶段。",
	},
	{
		id: "rogue_curse_bingliang",
		name: "兵粮寸断",
		description: "判定阶段：若此牌在手牌中，判定非梅花则跳过本回合的摸牌阶段。",
	},
	{
		id: "rogue_curse_du",
		name: "毒",
		description: "结束阶段：若此牌在手牌中，失去 1 点体力。",
	},
	{
		id: "rogue_curse_jinliao",
		name: "禁疗",
		description: "回合开始：若此牌在手牌中，本回合不能回复体力。",
	},
];

export const CURSE_IDS: readonly string[] = CURSES.map(curse => curse.id);

export function getCurse(id: string): CurseDef | undefined {
	return CURSES.find(curse => curse.id === id);
}

export function isCurse(id: string): boolean {
	return CURSE_IDS.includes(id);
}
