import { ui } from "noname";
import { describeIntent } from "../intents";
import type { Intent } from "../../shared/types";

const STYLE_ID = "rogue-styles";

const STYLES = `
/* 引擎有全局 div{position:absolute;display:inline-block;transition:all .5s}，元层必须显式复位 */
.rogue-layer,.rogue-layer div{position:static!important;transition:none!important;}
.rogue-layer{position:fixed!important;inset:0;z-index:80;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:auto;padding:24px;box-sizing:border-box;background:rgba(20,16,12,.94);color:#e8ddc4;}
.rogue-panel{display:flex;flex-direction:column;align-items:center;gap:14px;max-width:760px;}
.rogue-panel-wide{max-width:860px;width:100%;}
.rogue-title{font-size:36px;letter-spacing:12px;margin-bottom:4px;}
.rogue-subtitle{opacity:.7;font-size:14px;}
.rogue-stats{opacity:.85;font-size:14px;}
.rogue-button{display:inline-block;padding:8px 28px;border:1px solid #b89b5e;border-radius:4px;color:#e8ddc4;cursor:pointer;user-select:none;font-size:14px;}
.rogue-button:hover{background:rgba(184,155,94,.2);}
.rogue-button-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}
.rogue-disabled{opacity:.35;cursor:not-allowed;}
.rogue-disabled:hover{background:rgba(0,0,0,.25);}
.rogue-row{display:flex;align-items:center;gap:10px;}
.rogue-row-current{outline:1px solid rgba(184,155,94,.5);border-radius:4px;padding:4px 8px;}
.rogue-layer-label{width:64px;opacity:.6;font-size:12px;flex-shrink:0;}
.rogue-node{padding:6px 16px;border:1px solid #5b5140;border-radius:4px;font-size:13px;opacity:.4;}
.rogue-node-current{opacity:1;border-color:#b89b5e;cursor:pointer;}
.rogue-node-current:hover{background:rgba(184,155,94,.25);}
.rogue-node-cleared{opacity:.25;text-decoration:line-through;}
.rogue-card-row{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}
.rogue-card{min-width:132px;padding:12px;border:1px solid #5b5140;border-radius:6px;cursor:pointer;text-align:center;background:rgba(0,0,0,.25);}
.rogue-card:hover{background:rgba(184,155,94,.2);}
.rogue-card-name{font-size:16px;margin-bottom:4px;}
.rogue-card-kind{font-size:12px;opacity:.7;}
.rogue-card-tags{font-size:12px;opacity:.55;margin-top:4px;}
.rogue-description{opacity:.8;font-size:14px;max-width:560px;text-align:center;line-height:1.6;}
.rogue-option{width:520px;max-width:90vw;padding:12px 16px;border:1px solid #5b5140;border-radius:6px;cursor:pointer;background:rgba(0,0,0,.25);}
.rogue-option:hover{background:rgba(184,155,94,.2);}
.rogue-option-label{font-size:16px;margin-bottom:4px;}
.rogue-option-detail{font-size:13px;opacity:.7;}
.rogue-section{opacity:.6;font-size:13px;margin-top:6px;}
.rogue-intent{position:absolute;top:-1.5em;left:50%;transform:translateX(-50%);white-space:nowrap;padding:2px 8px;border-radius:10px;background:rgba(0,0,0,.65);color:#ffd9a0;font-size:12px;z-index:5;pointer-events:none;}
.rogue-debug-button{position:absolute;right:8px;bottom:8px;z-index:90;padding:4px 10px;background:rgba(0,0,0,.6);color:#9fe8b0;border-radius:4px;cursor:pointer;}
.rogue-debug-panel,.rogue-debug-panel div{position:static!important;transition:none!important;}
.rogue-debug-panel{position:absolute!important;right:8px;bottom:44px;z-index:90;display:flex;flex-direction:column;gap:6px;padding:10px;background:rgba(0,0,0,.82);border-radius:6px;color:#ddd;}
.rogue-debug-panel .rogue-button{padding:4px 10px;font-size:13px;text-align:center;border-color:#5f7f66;color:#cfe8d6;}
.rogue-hidden{display:none;}
`;

export function injectStyles(): void {
	if (document.getElementById(STYLE_ID)) return;
	const style = document.createElement("style");
	style.id = STYLE_ID;
	style.textContent = STYLES;
	document.head.appendChild(style);
}

/** 在敌人座位旁创建常驻意图标签。 */
export function createIntentBadge(enemy: any): void {
	if (!enemy.node.rogueIntent) {
		enemy.node.rogueIntent = ui.create.div(".rogue-intent", "…", enemy);
	}
}

export function updateIntentBadge(enemy: any, intent: Intent, charge: number): void {
	createIntentBadge(enemy);
	enemy.node.rogueIntent.innerHTML = `意图：${describeIntent(intent, charge)}`;
}

export function removeIntentBadge(enemy: any): void {
	enemy.node.rogueIntent?.remove?.();
	delete enemy.node.rogueIntent;
}

export function clearIntentBadges(enemies: any[]): void {
	for (const enemy of enemies) removeIntentBadge(enemy);
}
