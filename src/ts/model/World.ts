/**
 * Object representing the entirety of the world of the game.
 * Connects with LevelLoader and procedural level generators to build levels as required.
 * Contains the state of the levels generated or loaded previously.
 */

import Level from './Level.class';
import LevelGenerator from '../LevelGenerator';
import LevelLoader from '../LevelLoader';
import Tiles from '../data/Tiles.data';
import Random from '../Random';

export default {
	levels: {},
	inCombat: false,
	combatContext: null as any,
	possessionPiles: {} as any, // { [levelId]: { [key]: { items: any[], originalTile: any } } }
	init: function(game) {
		this.game = game;
		this.player = game.player;
		this.loadLevel('testLevel' + Random.n(0,1000));
	},
	loadLevel: function(levelId: string) {
		if (this.levels[levelId]){
			this.level.exitX = this.player.x;
			this.level.exitY = this.player.y;
			this.level = this.levels[levelId];
			this.player.x = this.level.exitX;
			this.player.y = this.level.exitY;
		} else {
			if (this.level) {
				this.level.exitX = this.player.x;
				this.level.exitY = this.player.y;
				var previousLevelId = this.level.id;
				this.level = new Level(this.game, levelId);
				LevelLoader.loadLevel(this.level, levelId, previousLevelId);
				//LevelGenerator.generateTestLevel(this.level, previousLevelId, 'test'+Random.n(0,1000));
			} else {
				this.level = new Level(this.game, levelId);
				LevelGenerator.generateTestLevel(this.level, undefined, 'test');
				//LevelGenerator.generateTestLevel(this.level, undefined, 'test'+Random.n(0,1000));
			}
			this.levels[levelId] = this.level;
		}
	},
	startCombat: function(enemy) {
		// Store context and remove enemy from current level
		const originalLevel = this.level;
		const enemyPos = { x: enemy.x, y: enemy.y };
		originalLevel.removeBeing && originalLevel.removeBeing(enemy);
		this.combatContext = {
			previousLevelId: originalLevel.id || 'unknown',
			previousLevel: originalLevel,
			playerPos: { x: this.player.x, y: this.player.y },
			enemyRace: { name: enemy['tileName'], tile: enemy['tile'], tilesetData: enemy['tilesetData'], hp: enemy['hp'] || 3, attack: enemy['attackPower'] || 1 },
			enemyOriginalPos: enemyPos
		};
		this.inCombat = true;
		// Create a new level for combat
		const combatId = 'combat-' + Date.now();
		this.levels[combatId] = new (Level as any)(this.game, combatId);
		this.level = this.levels[combatId];
		// Generate a combat arena
		LevelGenerator.generateCombatLevel(this.level);
		// Place player and enemy
		this.player.x = 3; this.player.y = 5;
		const BeingClass = (require('./Being.class').default);
		const enemyBeing = new (BeingClass as any)(this.game, this.level, this.combatContext.enemyRace);
		this.level.addBeing(enemyBeing, 10, 5);
		this.game.display.message('Combat begins!');
		this.player.updateFOV();
		this.game.display.refresh();
	},
	onMonsterDefeatedInCombat: function(monster) {
		if (!this.inCombat) return;
		this.game.display.message('You defeated the enemy!');
		// End combat, return to previous level (without the enemy)
		const ctx = this.combatContext;
		this.inCombat = false;
		// Restore previous level
		this.level = ctx.previousLevel;
		this.player.x = ctx.playerPos.x;
		this.player.y = ctx.playerPos.y;
		this.combatContext = null;
		this.player.updateFOV();
		this.game.display.refresh();
	},
	onPlayerDefeatedInCombat: function(monster) {
		if (!this.inCombat) return;
		this.game.display.message('You are defeated! Retreating to the nearest town...');
		const ctx = this.combatContext;
		// Remove inventory and reduce to half health
		const lostItems = this.player.items.slice();
		this.player.items = [];
		this.player.health = Math.max(1, Math.floor((this.player.maxHealth || 6) / 2));
		// Restore previous level and reinsert the monster where it was
		const BeingClass2 = (require('./Being.class').default);
		const enemyBeing = new (BeingClass2 as any)(this.game, ctx.previousLevel, ctx.enemyRace);
		// Relocate the monster 2-10 tiles away on same terrain type
		const prevLevel = ctx.previousLevel as any;
		const ox = ctx.enemyOriginalPos.x, oy = ctx.enemyOriginalPos.y;
		const origTile = prevLevel.map && prevLevel.map[ox] && prevLevel.map[ox][oy];
		let mx = ox, my = oy;
		if (origTile) {
			const dirs = [
				{dx:-1,dy:0},{dx:1,dy:0},{dx:0,dy:-1},{dx:0,dy:1},
				{dx:-1,dy:-1},{dx:1,dy:-1},{dx:-1,dy:1},{dx:1,dy:1}
			];
			for (let tries = 0; tries < 40; tries++){
				const d = dirs[Random.n(0, dirs.length-1)];
				const dist = Random.n(2, 10);
				const tx = ox + d.dx * dist;
				const ty = oy + d.dy * dist;
				if (tx < 0 || ty < 0) continue;
				try {
					const t = prevLevel.map[tx] && prevLevel.map[tx][ty];
					if (!t) continue;
					// Match terrain type by tilesetData
					if (t.tilesetData !== origTile.tilesetData) continue;
					if (!prevLevel.canWalkTo(tx, ty)) continue;
					mx = tx; my = ty; break;
				} catch(e) {
					continue;
				}
			}
		}
		ctx.previousLevel.addBeing(enemyBeing, mx, my);
		this.level = ctx.previousLevel;
		// Drop possessions where the player was defeated on the overworld
		this.placePossessionsPile(this.level, ctx.playerPos.x, ctx.playerPos.y, lostItems);
		// Find nearest CITY to the player's previous position
		let dest = null as null | {x:number,y:number};
		try {
			const map = (this.level as any).map;
			let bestD = 1e9;
			for (let x = 0; x < map.length; x++){
				const col = map[x]; if (!col) continue;
				for (let y = 0; y < col.length; y++){
					const t = col[y]; if (!t) continue;
					if (t === Tiles.CITY){
						const dx = x - ctx.playerPos.x, dy = y - ctx.playerPos.y;
						const d2 = dx*dx + dy*dy;
						if (d2 < bestD){ bestD = d2; dest = {x,y}; }
					}
				}
			}
		} catch(e) { dest = null; }
		if (dest){
			this.player.x = dest.x; this.player.y = dest.y;
		} else {
			this.player.x = ctx.playerPos.x; this.player.y = ctx.playerPos.y;
		}
		this.inCombat = false;
		this.combatContext = null;
		this.player.updateFOV();
		this.game.display.refresh();
	},
	placePossessionsPile: function(level, x: number, y: number, items: any[]) {
		if (!items || items.length === 0) return;
		const levelId = level.id || 'unknown';
		const key = x + '-' + y;
		this.possessionPiles[levelId] = this.possessionPiles[levelId] || {};
		const originalTile = level.map[x][y];
		level.map[x][y] = (Tiles as any).POSSESSIONS;
		this.possessionPiles[levelId][key] = { items: items.slice(), originalTile };
	}
}
