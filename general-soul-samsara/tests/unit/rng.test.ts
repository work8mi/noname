import { describe, expect, it } from "vitest";
import { createRng } from "../../src/shared/rng";

describe("createRng", () => {
	it("同一 seed 产生同一序列", () => {
		const a = createRng("seed-1");
		const b = createRng("seed-1");
		const seqA = Array.from({ length: 16 }, () => a.next());
		const seqB = Array.from({ length: 16 }, () => b.next());
		expect(seqA).toEqual(seqB);
	});

	it("不同 seed 产生不同序列", () => {
		const a = createRng("seed-1");
		const b = createRng("seed-2");
		expect(a.next()).not.toEqual(b.next());
	});

	it("next 返回 [0, 1)", () => {
		const rng = createRng(42);
		for (let i = 0; i < 200; i++) {
			const value = rng.next();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it("int 遵守上界并对非法参数返回 0", () => {
		const rng = createRng("bounds");
		for (let i = 0; i < 200; i++) {
			const value = rng.int(6);
			expect(Number.isInteger(value)).toBe(true);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(6);
		}
		expect(rng.int(0)).toBe(0);
		expect(rng.int(-3)).toBe(0);
	});

	it("pick 从数组取值，空数组抛错", () => {
		const rng = createRng("pick");
		const items = ["a", "b", "c"] as const;
		for (let i = 0; i < 50; i++) {
			expect(items).toContain(rng.pick(items));
		}
		expect(() => rng.pick([])).toThrow();
	});
});
