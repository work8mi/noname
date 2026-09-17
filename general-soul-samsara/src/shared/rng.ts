/**
 * 确定性伪随机数生成器（xmur3 种子哈希 + mulberry32）。
 *
 * 单局的所有随机决策都应通过它产生，以便存档恢复与测试复盘。
 */
export interface Rng {
	/** 返回 [0, 1) 的浮点数。 */
	next(): number;
	/** 返回 [0, maxExclusive) 的整数；非法参数返回 0。 */
	int(maxExclusive: number): number;
	/** 从数组中等概率取一个元素。 */
	pick<T>(items: readonly T[]): T;
}

function hashSeed(seed: string): number {
	let h = 1779033703 ^ seed.length;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	return h >>> 0;
}

export function createRng(seed: string | number): Rng {
	let state = (typeof seed === "number" ? seed : hashSeed(seed)) >>> 0;
	const next = (): number => {
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const rng: Rng = {
		next,
		int(maxExclusive: number) {
			if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) return 0;
			return Math.floor(next() * maxExclusive);
		},
		pick<T>(items: readonly T[]): T {
			if (!items.length) throw new Error("无法从空数组中取值");
			return items[rng.int(items.length)];
		},
	};
	return rng;
}

export function randomSeed(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
