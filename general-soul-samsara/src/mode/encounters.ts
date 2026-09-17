import type { Rng } from "../shared/rng";
import type { EnemyDef } from "../shared/types";
import { MOB_DEFS } from "../data/enemies";

/** M0.1：随机挑选 1-2 种小兵，组成一场遭遇战。 */
export function rollEncounter(rng: Rng, count?: number): EnemyDef[] {
	const size = count ?? 1 + rng.int(2);
	const pool = [...MOB_DEFS];
	const picked: EnemyDef[] = [];
	while (picked.length < size && pool.length) {
		picked.push(pool.splice(rng.int(pool.length), 1)[0]);
	}
	return picked;
}
