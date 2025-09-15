/**
 * Represent an "alive" entity that moves around the world
 * and can be interacted with by the player.
 * 
 */

import Random from '../Random';
import Level from './Level.class';

export default class Being {
	private game: any;
	private level: Level;
	private tile: any;
	private tileName: string;
	private tilesetData: any;
	private xPosition: number;
	private yPosition: number;
	private intent: string;
	private hp: number;
	private attackPower: number;

	get x(): number {
		return this.xPosition;
	}

	get y(): number {
		return this.yPosition;
	}

	constructor (game: any, level: Level, race: any) {
		this.game = game;
		this.level = level;
		this.tile = race.tile;
		this.tileName = race.name;
		this.tilesetData = race.tilesetData;
		this.xPosition = 0;
		this.yPosition = 0;
		this.intent = 'CHASE';
		this.hp = (race && race.hp) || 3;
		this.attackPower = (race && race.attack) || 1;
	}

	act () {
		switch (this.intent){
			case 'RANDOM':
				this.actRandom();
				break;
			case 'CHASE':
				this.actChase();
				break;
		}
	}

	actRandom () {
		var dx = Random.n(-1, 1);
		var dy = Random.n(-1, 1);
		if (!this.level.canWalkTo(this.x+dx,this.y+dy)){
			return;
		}
		this.moveTo(dx, dy);
	}

	actChase () {
		var nearestEnemy = this.getNearestEnemy();
		if (!nearestEnemy){
			return;
		}
		var dx = Math.sign(nearestEnemy.x - this.x);
		var dy = Math.sign(nearestEnemy.y - this.y);
		// If destination is the player
		try {
			if (this.game.player.x === this.x+dx && this.game.player.y === this.y+dy){
				// On main map: trigger combat instead of dealing damage here
				if (!this.game.world.inCombat && this.game.world.startCombat){
					this.game.world.startCombat(this);
					return;
				}
				// In arena: attack
				this.attackPlayer();
				return;
			}
		} catch(e) {}
		if (!this.level.canWalkTo(this.x+dx,this.y+dy)){
			return;
		}
		this.moveTo(dx, dy);
	}

	getNearestEnemy () {
		return this.game.player;
	}

	moveTo (dx: number, dy: number) {
		this.level.moveBeing(this, dx, dy)
		this.xPosition = this.x + dx;
		this.yPosition = this.y + dy;
	}

	attackPlayer () {
		const p = this.game.player;
		p.health = Math.max(0, p.health - this.attackPower);
		this.game.display.message(`${this.tileName} hits you for ${this.attackPower}!`);
		if (p.health <= 0) {
			if (this.game.world.onPlayerDefeatedInCombat) this.game.world.onPlayerDefeatedInCombat(this);
		}
	}

	takeDamage (amount: number) {
		this.hp = Math.max(0, this.hp - amount);
		if (this.hp <= 0) {
			if (this.game.world.onMonsterDefeatedInCombat) this.game.world.onMonsterDefeatedInCombat(this);
		}
	}

	setIntent (intent: string) {
		this.intent = intent;
	}
}
