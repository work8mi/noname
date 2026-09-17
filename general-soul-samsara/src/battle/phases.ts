import type { EnemyPhase } from "../shared/types";

/**
 * 根据体力比例计算敌人应处的阶段下标。
 *
 * 0 = 基础阶段；i+1 = `phases[i]`。纯函数，便于单测与调参。
 */
export function resolvePhaseIndex(hp: number, maxHp: number, phases: readonly EnemyPhase[]): number {
	if (maxHp <= 0) return 0;
	const ratio = hp / maxHp;
	let index = 0;
	for (let i = 0; i < phases.length; i++) {
		if (ratio <= phases[i].threshold) index = i + 1;
	}
	return index;
}
