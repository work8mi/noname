import type { Rng } from "../shared/rng";
import { addCard, addGold, damage, heal, type RunState } from "./state";

/** 事件效果类型；即时效果直接结算，其余交给流程层处理。 */
export type EventEffectKind = "gold" | "heal" | "damage" | "cards" | "remove" | "skill" | "enemy-hp" | "curse" | "treasure";

export interface EventEffect {
	kind: EventEffectKind;
	/** gold / heal / damage / remove / enemy-hp / treasure 的数值。 */
	value?: number;
	/** cards 效果要加入牌组的卡牌 id。 */
	cards?: string[];
	/** curse 效果要加入牌组的诅咒牌 id。 */
	curses?: string[];
	/** skill 效果的期望类型；未指定 skillId 时按类型随机。 */
	skillKind?: "active" | "passive";
	/** skill 效果优先指定的技能 id。 */
	skillId?: string;
}

export interface EventOption {
	id: string;
	label: string;
	/** 选项说明（收益与代价）。 */
	detail: string;
	effects: EventEffect[];
}

export interface RunEventDef {
	id: string;
	name: string;
	description: string;
	chapter: number;
	options: EventOption[];
}

/**
 * 原型事件表（概要设计 §8.2）。
 *
 * 宝物与诅咒牌未接入前，对应选项用现有系统做等效替代，并在 detail 中如实说明。
 */
export const EVENTS: readonly RunEventDef[] = [
	{
		id: "taoyuan",
		name: "桃园结义",
		description: "花开正盛，三人于桃园中焚香结义。",
		chapter: 1,
		options: [
			{ id: "join", label: "结义", detail: "获得 2 张【桃】，回复 2 点体力", effects: [{ kind: "cards", cards: ["tao", "tao"] }, { kind: "heal", value: 2 }] },
			{ id: "alone", label: "独行", detail: "获得 50 金币", effects: [{ kind: "gold", value: 50 }] },
			{ id: "sacrifice", label: "献祭", detail: "失去 3 点体力，删除一张牌", effects: [{ kind: "damage", value: 3 }, { kind: "remove", value: 1 }] },
		],
	},
	{
		id: "qingmei",
		name: "青梅煮酒",
		description: "盘置青梅，一樽煮酒。曹操以手指玄德，后自指，曰：今天下英雄，惟使君与操耳！",
		chapter: 1,
		options: [
			{
				id: "ambition",
				label: "承认野心",
				detail: "获得一个主动技能；下一战敌人 +1 体力上限",
				effects: [{ kind: "skill", skillKind: "active" }, { kind: "enemy-hp", value: 1 }],
			},
			{ id: "hide", label: "隐藏锋芒", detail: "获得 40 金币", effects: [{ kind: "gold", value: 40 }] },
			{
				id: "cup",
				label: "摔杯为号",
				detail: "获得一件随机宝物，并加入一张【毒】",
				effects: [{ kind: "treasure", value: 1 }, { kind: "curse", curses: ["rogue_curse_du"] }],
			},
		],
	},
	{
		id: "sangu",
		name: "三顾茅庐",
		description: "草庐之前，风雪三顾。",
		chapter: 2,
		options: [
			{ id: "sincere", label: "诚心相请", detail: "获得【观星】；若已拥有则改为 40 金币", effects: [{ kind: "skill", skillId: "guanxing" }, { kind: "gold", value: 40 }] },
			{ id: "gift", label: "留下礼物", detail: "获得 60 金币", effects: [{ kind: "gold", value: 60 }] },
			{ id: "leave", label: "转身离去", detail: "删除一张牌", effects: [{ kind: "remove", value: 1 }] },
		],
	},
	{
		id: "huarong",
		name: "华容道",
		description: "关羽横刀立马，曹操伏地求情。",
		chapter: 2,
		options: [
			{ id: "release", label: "放走曹操", detail: "获得 80 金币", effects: [{ kind: "gold", value: 80 }] },
			{ id: "execute", label: "斩杀曹操", detail: "获得 3 张【杀】，失去 5 点体力", effects: [{ kind: "cards", cards: ["sha", "sha", "sha"] }, { kind: "damage", value: 5 }] },
			{ id: "recruit", label: "劝降", detail: "获得【鬼才】，并加入一张【乐不思蜀】", effects: [{ kind: "skill", skillId: "guicai" }, { kind: "curse", curses: ["rogue_curse_lebu"] }] },
		],
	},
];

/** 需要流程层继续处理的部分。 */
export interface PendingEventResult {
	removals: number;
	skillId?: string;
	skillKind?: "active" | "passive";
	enemyHpBonus: number;
	/** 需要发放的随机宝物数量。 */
	treasures: number;
	/** 指定技能已拥有时补偿的金币。 */
	goldFallback: number;
}

/** 结算即时效果，并把需要 UI 的效果汇总给流程层。 */
export function applyEventEffects(state: RunState, effects: readonly EventEffect[]): PendingEventResult {
	const pending: PendingEventResult = { removals: 0, enemyHpBonus: 0, treasures: 0, goldFallback: 0 };
	for (const effect of effects) {
		switch (effect.kind) {
			case "gold":
				addGold(state, effect.value ?? 0);
				break;
			case "heal":
				heal(state, effect.value ?? 0);
				break;
			case "damage":
				damage(state, effect.value ?? 0);
				break;
			case "cards":
				for (const id of effect.cards ?? []) addCard(state, id);
				break;
			case "curse":
				for (const id of effect.curses ?? []) addCard(state, id);
				break;
			case "remove":
				pending.removals += effect.value ?? 1;
				break;
			case "skill":
				if (effect.skillId) pending.skillId = effect.skillId;
				else if (effect.skillKind) pending.skillKind = effect.skillKind;
				break;
			case "treasure":
				pending.treasures += effect.value ?? 1;
				break;
			case "enemy-hp":
				pending.enemyHpBonus += effect.value ?? 0;
				break;
		}
	}
	return pending;
}

/** 从本层可用且未触发过的事件里随机抽取；用尽则返回 undefined。 */
export function rollEvent(chapter: number, used: readonly string[], rng: Rng): RunEventDef | undefined {
	const pool = EVENTS.filter(event => event.chapter <= chapter && !used.includes(event.id));
	if (!pool.length) return undefined;
	return pool[rng.int(pool.length)];
}
