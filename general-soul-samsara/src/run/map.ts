import { createRng } from "../shared/rng";
import type { Rng } from "../shared/rng";

export type NodeType = "battle" | "elite" | "event" | "shop" | "rest" | "treasure" | "boss";

export interface MapNode {
	id: string;
	layer: number;
	index: number;
	type: NodeType;
	/** 下一层可前往的节点下标。 */
	next: number[];
}

export interface ChapterMap {
	chapter: number;
	layers: MapNode[][];
}

/** 原型每章 7 层（需求规格 §8.1）。 */
export const LAYER_COUNT = 7;

/** 原型骨架的每层节点数（手工骨架 + 有限随机，§8.2）。 */
const LAYER_SIZES = [1, 2, 3, 2, 3, 2, 1];

/** 全章节点类型配额（不含入口与章尾）。 */
const QUOTA = { shop: 1, rest: 1, event: 2 } as const;

export function chapterBossType(chapter: number): NodeType {
	return chapter >= 2 ? "boss" : "elite";
}

/**
 * 生成章节地图：固定拓扑骨架 + 按配额的节点类型随机。
 *
 * 随机只影响节点类型与连线细节，保证每局的节奏结构一致。
 */
export function generateChapter(seed: string, chapter = 1): ChapterMap {
	const rng = createRng(`${seed}-chapter-${chapter}`);
	const total = LAYER_SIZES.reduce((sum, size) => sum + size, 0);
	const types: NodeType[] = [];
	for (let i = 0; i < total; i++) types.push("battle");
	types[0] = "battle";

	const pool: NodeType[] = [
		...Array.from({ length: QUOTA.shop }, () => "shop" as NodeType),
		...Array.from({ length: QUOTA.rest }, () => "rest" as NodeType),
		...Array.from({ length: QUOTA.event }, () => "event" as NodeType),
	];
	const mutableIndices: number[] = [];
	for (let i = 1; i < total - 1; i++) mutableIndices.push(i);
	shuffleInPlace(mutableIndices, rng);
	for (let i = 0; i < pool.length && i < mutableIndices.length; i++) {
		types[mutableIndices[i]] = pool[i];
	}
	types[total - 1] = chapterBossType(chapter);

	const layers: MapNode[][] = [];
	let flat = 0;
	for (let layer = 0; layer < LAYER_COUNT; layer++) {
		const size = LAYER_SIZES[layer];
		const nodes: MapNode[] = [];
		for (let index = 0; index < size; index++) {
			nodes.push({ id: `${layer}-${index}`, layer, index, type: types[flat++], next: [] });
		}
		layers.push(nodes);
	}
	connectLayers(layers, rng);
	return { chapter, layers };
}

function connectLayers(layers: MapNode[][], rng: Rng): void {
	for (let layer = 0; layer < layers.length - 1; layer++) {
		const current = layers[layer];
		const next = layers[layer + 1];
		// 每个节点连接下一层的一个主目标
		for (let i = 0; i < current.length; i++) {
			const main = current.length === 1 ? rng.int(next.length) : Math.min(next.length - 1, Math.round((i / Math.max(1, current.length - 1)) * (next.length - 1)));
			current[i].next.push(main);
			// 向相邻节点扩展分支，保证多路径
			if (next.length > 1 && rng.next() < 0.6) {
				const branch = main === 0 ? 1 : main - 1;
				if (!current[i].next.includes(branch)) current[i].next.push(branch);
			}
		}
		// 保证下一层每个节点都可达
		for (let j = 0; j < next.length; j++) {
			if (!current.some(node => node.next.includes(j))) {
				const fallback = Math.min(current.length - 1, Math.round((j / Math.max(1, next.length - 1)) * (current.length - 1)));
				current[fallback].next.push(j);
			}
		}
	}
}

function shuffleInPlace<T>(items: T[], rng: Rng): void {
	for (let i = items.length - 1; i > 0; i--) {
		const j = rng.int(i + 1);
		[items[i], items[j]] = [items[j], items[i]];
	}
}

export function isLastLayer(map: ChapterMap, layer: number): boolean {
	return layer >= map.layers.length - 1;
}

export function nodesAt(map: ChapterMap, layer: number): MapNode[] {
	return map.layers[layer] ?? [];
}

/** 章节地图的显示名。 */
export const NODE_LABELS: Record<NodeType, string> = {
	battle: "战斗",
	elite: "精英",
	event: "事件",
	shop: "商店",
	rest: "休整",
	treasure: "宝箱",
	boss: "首领",
};
