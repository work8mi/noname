import type { Rng } from "../shared/rng";
import type { EnemyDef } from "../shared/types";
import { MOB_DEFS } from "../data/enemies";

/** 随机挑选小兵组成遭遇战：第 1 章 1-2 名，第 2 章起固定 2 名。 */
export function rollEncounter(rng: Rng, chapter = 1, count?: number): EnemyDef[] {
	const size = count ?? (chapter >= 2 ? 2 : 1 + rng.int(2));
	const pool = [...MOB_DEFS];
	const picked: EnemyDef[] = [];
	while (picked.length < size && pool.length) {
		picked.push(pool.splice(rng.int(pool.length), 1)[0]);
	}
	return picked;
}
