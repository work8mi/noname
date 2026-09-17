import { getCharacterDeck } from "../data/decks";
import type { SkillMeta } from "../shared/types";

export const SLOT_COUNT = 3;

export interface RunCard {
	id: string;
	upgraded: boolean;
}

export interface RunSkill {
	id: string;
	level: number;
}

export interface RunSlots {
	active: Array<RunSkill | null>;
	passive: Array<RunSkill | null>;
}

/** 单局状态：跨战斗携带的一切。 */
export interface RunState {
	version: 1;
	seed: string;
	character: string;
	chapter: number;
	layer: number;
	hp: number;
	maxHp: number;
	gold: number;
	deck: RunCard[];
	slots: RunSlots;
	treasures: string[];
	battleCount: number;
	finished: boolean;
	/** 已触发过的事件（避免单局重复）。 */
	usedEvents: string[];
	/** 下一场战斗敌人的额外体力上限（事件代价）。 */
	nextBattleEnemyHp: number;
}

export function createRunState(seed: string, character = "zhaoyun", maxHp = 4, gold = 100): RunState {
	return {
		version: 1,
		seed,
		character,
		chapter: 1,
		layer: 0,
		hp: maxHp,
		maxHp,
		gold,
		deck: getCharacterDeck(character).map(id => ({ id, upgraded: false })),
		slots: {
			active: Array.from({ length: SLOT_COUNT }, () => null),
			passive: Array.from({ length: SLOT_COUNT }, () => null),
		},
		treasures: [],
		battleCount: 0,
		finished: false,
		usedEvents: [],
		nextBattleEnemyHp: 0,
	};
}

export function slotList(state: RunState, kind: SkillMeta["kind"]): Array<RunSkill | null> {
	return kind === "active" ? state.slots.active : state.slots.passive;
}

export function hasSkill(state: RunState, skillId: string): boolean {
	return [...state.slots.active, ...state.slots.passive].some(skill => skill?.id === skillId);
}

export function equippedTags(state: RunState, getMeta: (id: string) => SkillMeta | undefined): string[] {
	const tags = new Set<string>();
	for (const skill of [...state.slots.active, ...state.slots.passive]) {
		if (!skill) continue;
		for (const tag of getMeta(skill.id)?.tags ?? []) tags.add(tag);
	}
	return [...tags];
}

export interface EquipResult {
	ok: boolean;
	/** 被替换下来的技能（若有）。 */
	replaced?: RunSkill;
	/** 槽位已满且未指定替换位置。 */
	needReplace?: boolean;
}

/**
 * 把技能装入指定槽位；未指定槽位时选择第一个空槽，槽位满时返回 needReplace。
 */
export function equipSkill(state: RunState, skill: SkillMeta, replaceIndex?: number): EquipResult {
	if (hasSkill(state, skill.id)) return { ok: false };
	const list = slotList(state, skill.kind);
	if (replaceIndex !== undefined) {
		if (replaceIndex < 0 || replaceIndex >= list.length) return { ok: false };
		const replaced = list[replaceIndex] ?? undefined;
		list[replaceIndex] = { id: skill.id, level: 1 };
		return { ok: true, replaced };
	}
	const empty = list.findIndex(item => item === null);
	if (empty === -1) return { ok: false, needReplace: true };
	list[empty] = { id: skill.id, level: 1 };
	return { ok: true };
}

export function addGold(state: RunState, amount: number): void {
	state.gold = Math.max(0, state.gold + amount);
}

export function heal(state: RunState, amount: number): void {
	state.hp = Math.min(state.maxHp, state.hp + amount);
}

export function damage(state: RunState, amount: number): void {
	state.hp = Math.max(0, state.hp - amount);
	if (state.hp === 0) state.finished = true;
}

export function addCard(state: RunState, id: string): void {
	state.deck.push({ id, upgraded: false });
}

export function removeCardAt(state: RunState, index: number): RunCard | undefined {
	if (index < 0 || index >= state.deck.length) return undefined;
	return state.deck.splice(index, 1)[0];
}

export function countCard(state: RunState, id: string): number {
	return state.deck.filter(card => card.id === id).length;
}
