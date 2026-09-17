import { describe, expect, it } from "vitest";
import { LAYER_COUNT, chapterBossType, generateChapter, isLastLayer, nodesAt } from "../../src/run/map";

describe("章节地图", () => {
	it("结构固定：7 层、入口为战斗、章尾为精英/首领", () => {
		const map = generateChapter("seed", 1);
		expect(map.layers).toHaveLength(LAYER_COUNT);
		expect(nodesAt(map, 0)[0].type).toBe("battle");
		expect(nodesAt(map, LAYER_COUNT - 1)[0].type).toBe("elite");
		expect(generateChapter("seed", 2).layers[LAYER_COUNT - 1][0].type).toBe("boss");
		expect(chapterBossType(3)).toBe("boss");
	});

	it("同一 seed 生成相同地图", () => {
		expect(generateChapter("same", 1)).toEqual(generateChapter("same", 1));
	});

	it("配额满足：1 商店、1 休整、2 事件", () => {
		for (let i = 0; i < 20; i++) {
			const map = generateChapter(`seed-${i}`, 1);
			const types = map.layers.flat().map(node => node.type);
			expect(types.filter(type => type === "shop")).toHaveLength(1);
			expect(types.filter(type => type === "rest")).toHaveLength(1);
			expect(types.filter(type => type === "event")).toHaveLength(2);
			expect(types[types.length - 1]).toBe("elite");
		}
	});

	it("连通性：每个节点可达且最后一层每个节点都有入边", () => {
		for (let i = 0; i < 20; i++) {
			const map = generateChapter(`seed-${i}`, 1);
			const reachable = new Set<string>([map.layers[0][0].id]);
			for (let layer = 0; layer < map.layers.length - 1; layer++) {
				for (const node of map.layers[layer]) {
					if (!reachable.has(node.id)) continue;
					for (const next of node.next) reachable.add(map.layers[layer + 1][next].id);
				}
			}
			const all = map.layers.flat().map(node => node.id);
			expect(all.every(id => reachable.has(id))).toBe(true);
			for (const node of map.layers[map.layers.length - 1]) {
				const hasIncoming = map.layers[map.layers.length - 2].some(prev => prev.next.includes(node.index));
				expect(hasIncoming, node.id).toBe(true);
			}
		}
	});

	it("isLastLayer 判定", () => {
		const map = generateChapter("seed", 1);
		expect(isLastLayer(map, LAYER_COUNT - 1)).toBe(true);
		expect(isLastLayer(map, 0)).toBe(false);
	});
});
