import { describe, expect, it } from "vitest";
import { RUN_STORAGE_KEY, deserializeRun, loadRun, saveRun, serializeRun } from "../../src/run/save";
import { createRunState, equipSkill } from "../../src/run/state";
import { getSkillMeta } from "../../src/data/skills";

function createMemoryStorage(): Storage {
	const map = new Map<string, string>();
	return {
		get length() {
			return map.size;
		},
		clear: () => map.clear(),
		getItem: (key: string) => map.get(key) ?? null,
		key: (index: number) => [...map.keys()][index] ?? null,
		removeItem: (key: string) => void map.delete(key),
		setItem: (key: string, value: string) => void map.set(key, value),
	};
}

describe("单局存档", () => {
	it("序列化往返保持数据", () => {
		const state = createRunState("round-trip");
		equipSkill(state, getSkillMeta("wusheng")!);
		state.gold = 42;
		state.layer = 3;
		const restored = deserializeRun(serializeRun(state));
		expect(restored).toEqual(state);
	});

	it("保存与读取走 storage", () => {
		const storage = createMemoryStorage();
		const state = createRunState("storage");
		saveRun(state, storage);
		expect(storage.getItem(RUN_STORAGE_KEY)).toBeTruthy();
		expect(loadRun(storage)).toEqual(state);
	});

	it("损坏、缺失与版本不符返回 undefined", () => {
		const storage = createMemoryStorage();
		expect(loadRun(storage)).toBeUndefined();
		storage.setItem(RUN_STORAGE_KEY, "{not json");
		expect(loadRun(storage)).toBeUndefined();
		storage.setItem(RUN_STORAGE_KEY, JSON.stringify({ version: 999 }));
		expect(loadRun(storage)).toBeUndefined();
		storage.setItem(RUN_STORAGE_KEY, JSON.stringify({ version: 1, seed: "a", hp: 1, gold: 1, deck: [] }));
		expect(loadRun(storage)).toBeUndefined();
	});
});
