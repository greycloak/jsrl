/**
 * Object representing the entirety of the world of the game.
 * Connects with LevelLoader and procedural level generators to build levels as required.
 * Contains the state of the levels generated or loaded previously.
 */

import Level from './Level.class';
import LevelGenerator from '../LevelGenerator';
import LevelLoader from '../LevelLoader';
import Random from '../Random';

export default {
	levels: {},
	inCombat: false,
	combatContext: null as any,
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
		this.game.display.message('You are defeated! Retreating...');
		const ctx = this.combatContext;
		// Remove inventory and reduce to half health
		this.player.items = [];
		this.player.health = Math.max(1, Math.floor((this.player.maxHealth || 6) / 2));
		// Restore previous level and reinsert the monster where it was
		const BeingClass2 = (require('./Being.class').default);
		const enemyBeing = new (BeingClass2 as any)(this.game, ctx.previousLevel, ctx.enemyRace);
		ctx.previousLevel.addBeing(enemyBeing, ctx.enemyOriginalPos.x, ctx.enemyOriginalPos.y);
		this.level = ctx.previousLevel;
		this.player.x = ctx.playerPos.x;
		this.player.y = ctx.playerPos.y;
		this.inCombat = false;
		this.combatContext = null;
		this.player.updateFOV();
		this.game.display.refresh();
	}
}
