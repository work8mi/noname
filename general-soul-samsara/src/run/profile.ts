/**
 * 局外进度占位（需求规格 §2.2）。
 *
 * 原型阶段只记录单局统计并预留解锁与将魂树字段，不提供实际解锁逻辑。
 */
export interface RunProfile {
	version: 1;
	runs: number;
	victories: number;
	/** 预留：已解锁的武将 / 技能 / 宝物 id。 */
	unlocks: string[];
	/** 预留：将魂树节点 id → 等级。 */
	soulTree: Record<string, number>;
}

export const PROFILE_STORAGE_KEY = "rogue_profile";

export function createProfile(): RunProfile {
	return { version: 1, runs: 0, victories: 0, unlocks: [], soulTree: {} };
}

/** 反序列化并做最小校验；损坏或版本不符时返回默认档案。 */
export function deserializeProfile(raw: string | null | undefined): RunProfile {
	if (!raw) return createProfile();
	try {
		const parsed = JSON.parse(raw) as Partial<RunProfile>;
		if (parsed?.version !== 1) return createProfile();
		return {
			version: 1,
			runs: Math.max(0, Number(parsed.runs) || 0),
			victories: Math.max(0, Number(parsed.victories) || 0),
			unlocks: Array.isArray(parsed.unlocks) ? [...parsed.unlocks] : [],
			soulTree: parsed.soulTree && typeof parsed.soulTree === "object" ? { ...parsed.soulTree } : {},
		};
	} catch {
		return createProfile();
	}
}

/** 记录一局结果。 */
export function recordRun(profile: RunProfile, result: "victory" | "defeat"): RunProfile {
	return {
		...profile,
		runs: profile.runs + 1,
		victories: profile.victories + (result === "victory" ? 1 : 0),
	};
}

export function loadProfile(storage: Storage = localStorage): RunProfile {
	return deserializeProfile(storage.getItem(PROFILE_STORAGE_KEY));
}

export function saveProfile(profile: RunProfile, storage: Storage = localStorage): void {
	storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearProfile(storage: Storage = localStorage): void {
	storage.removeItem(PROFILE_STORAGE_KEY);
}
