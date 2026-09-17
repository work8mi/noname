import type { RunState } from "./state";

export const RUN_STORAGE_KEY = "rogue_run";

/** 存档版本；结构变更时递增，旧档自动作废。 */
export const RUN_SAVE_VERSION = 1;

export function serializeRun(state: RunState): string {
	return JSON.stringify(state);
}

/** 反序列化并做最小结构校验；损坏或版本不符返回 undefined。 */
export function deserializeRun(raw: string | null | undefined): RunState | undefined {
	if (!raw) return undefined;
	try {
		const parsed = JSON.parse(raw) as Partial<RunState>;
		if (parsed?.version !== RUN_SAVE_VERSION) return undefined;
		if (typeof parsed.seed !== "string" || typeof parsed.hp !== "number" || typeof parsed.gold !== "number") return undefined;
		if (!Array.isArray(parsed.deck) || !parsed.slots || !Array.isArray(parsed.slots.active) || !Array.isArray(parsed.slots.passive)) return undefined;
		const state = parsed as RunState;
		// 旧档补齐可选字段，避免版本迁移。
		state.usedEvents ??= [];
		state.nextBattleEnemyHp ??= 0;
		state.treasures ??= [];
		return state;
	} catch {
		return undefined;
	}
}

export function saveRun(state: RunState, storage: Storage = localStorage): void {
	storage.setItem(RUN_STORAGE_KEY, serializeRun(state));
}

export function loadRun(storage: Storage = localStorage): RunState | undefined {
	return deserializeRun(storage.getItem(RUN_STORAGE_KEY));
}

export function clearRun(storage: Storage = localStorage): void {
	storage.removeItem(RUN_STORAGE_KEY);
}
