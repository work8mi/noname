import { describe, expect, it } from "vitest";
import { PROFILE_STORAGE_KEY, clearProfile, createProfile, deserializeProfile, loadProfile, recordRun, saveProfile } from "../../src/run/profile";

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

describe("局外进度占位", () => {
	it("默认档案为零统计与空解锁表", () => {
		const profile = createProfile();
		expect(profile).toEqual({ version: 1, runs: 0, victories: 0, unlocks: [], soulTree: {} });
	});

	it("记录单局：局数累加、仅有胜利计入通关", () => {
		let profile = createProfile();
		profile = recordRun(profile, "defeat");
		expect(profile.runs).toBe(1);
		expect(profile.victories).toBe(0);
		profile = recordRun(profile, "victory");
		expect(profile.runs).toBe(2);
		expect(profile.victories).toBe(1);
	});

	it("存档往返与清除", () => {
		const storage = createMemoryStorage();
		expect(loadProfile(storage)).toEqual(createProfile());
		saveProfile(recordRun(createProfile(), "victory"), storage);
		expect(loadProfile(storage).victories).toBe(1);
		expect(storage.getItem(PROFILE_STORAGE_KEY)).toBeTruthy();
		clearProfile(storage);
		expect(loadProfile(storage)).toEqual(createProfile());
	});

	it("损坏数据或版本不符回退为默认档案", () => {
		expect(deserializeProfile("{not json")).toEqual(createProfile());
		expect(deserializeProfile(JSON.stringify({ version: 2, runs: 9 }))).toEqual(createProfile());
		expect(deserializeProfile(JSON.stringify({ version: 1, runs: -3 })).runs).toBe(0);
	});
});
