import { describe, expect, it } from "vitest";
import { CURSES, CURSE_IDS, getCurse, isCurse } from "../../src/data/curses";

describe("诅咒牌数据", () => {
	it("4 张诅咒牌、id 唯一且带名称与描述", () => {
		expect(CURSES).toHaveLength(4);
		expect(new Set(CURSE_IDS).size).toBe(4);
		for (const curse of CURSES) {
			expect(curse.name.length, curse.id).toBeGreaterThan(0);
			expect(curse.description.length, curse.id).toBeGreaterThan(0);
		}
	});

	it("isCurse / getCurse", () => {
		expect(isCurse("rogue_curse_du")).toBe(true);
		expect(isCurse("sha")).toBe(false);
		expect(getCurse("rogue_curse_lebu")?.name).toBe("乐不思蜀");
		expect(getCurse("missing")).toBeUndefined();
	});
});
