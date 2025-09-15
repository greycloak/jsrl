const ut = (window as any).ut;

/**
 * Object that contains the state of the player, as well as functions for it
 * to interact with the world.
 * 
 * Contains the player inventory and functions to grab and drop.
 * 
 * Contains the player memory (tiles he has seen previously per level)
 * 
 * Contains the field of view logic using simple raycasting.
 */

export default {
	MAX_SIGHT_RANGE: 10,
	x: 20,
	y: 20,
	tile: new ut.Tile('@', 255, 255, 255),
	visible: [],
	memory: {},
	items: [],
	name: '',
	ancestry: 'human',
	wealth: 0,
	water: 0,
	supplies: 0,
	radiation: 0,
	health: 6,
	maxHealth: 6,
	favor: { 'Red Queen': 0, 'Machine Collective': 0, 'Warlords': 0, 'Archivists': 0 },
	init: function(game) {
		this.game = game;
		for (var j = -this.MAX_SIGHT_RANGE; j <= this.MAX_SIGHT_RANGE; j++){
			this.visible[j] = [];
		}
		this.generateCharacter();
	},
	generateCharacter: function() {
		const ancestries = ['plantoid', 'awakened', 'human', 'robot'];
		this.ancestry = ancestries[Math.floor(Math.random()*ancestries.length)];
		this.name = this.randomName();
		this.wealth = 0;
		this.water = 0;
		this.supplies = 0;
		this.radiation = 0;
		this.maxHealth = 6;
		this.health = this.maxHealth;
		this.favor = { 'Red Queen': 0, 'Machine Collective': 0, 'Warlords': 0, 'Archivists': 0 };
	},
	randomName: function() {
		const starts = ['Ka', 'Ra', 'Ze', 'Lo', 'Mi', 'An', 'Vu', 'Te', 'Ori', 'Sha', 'Bra', 'Qua'];
		const mids = ['nar', 'lek', 'mos', 'tan', 'vir', 'dor', 'xis', 'ran', 'mon', 'vak'];
		const ends = ['a', 'e', 'i', 'o', 'u', 'an', 'en', 'in', 'on', 'un'];
		return starts[Math.floor(Math.random()*starts.length)]
			+ mids[Math.floor(Math.random()*mids.length)]
			+ ends[Math.floor(Math.random()*ends.length)];
	},
	tryMove: function(dir) {
		const level = this.game.world.level;
		const nx = this.x + dir.x, ny = this.y + dir.y;
		// If moving into a monster
		const targetBeing = level.getBeing && level.getBeing(nx, ny);
		if (targetBeing){
			if (this.game.world.inCombat){
				// Attack in combat
				this.attack(targetBeing);
				this.endTurn();
			} else {
				// Start combat from overworld
				this.game.world.startCombat && this.game.world.startCombat(targetBeing);
			}
			this.game.input.inputEnabled = true;
			return;
		}
		if (!level.canWalkTo(nx, ny)){
			this.game.input.inputEnabled = true;
			return;
		}
		this.x = nx;
		this.y = ny;
		this.land();
	},

	attack: function(being) {
		// Melee damage: prefer equipped hand weapon meleeDie; if no hand items, fists (1d2)
		let dmg = 1;
		try {
			const equipped = (this.items || []).filter(it => it && it.equippedSlot === 'hand');
			let weapon = null as any;
			for (const it of equipped){ if (it.def && it.def.meleeDie){ weapon = it; break; } }
			if (weapon && weapon.def.meleeDie){
				dmg = this.rollDie ? this.rollDie(weapon.def.meleeDie) : (Math.floor(Math.random()*6)+1);
			} else if (equipped.length === 0) {
				// fists 1d2
				dmg = Math.floor(Math.random() * 2) + 1;
			} else {
				dmg = 1;
			}
		} catch(e) { dmg = 1; }
		being.takeDamage(dmg);
		this.game.display.message(`You hit the ${being['tileName'] || 'enemy'} for ${dmg}!`);
	},
	rollDie32: function(s: string) { return this.rollDie(s); },
	rollDie33: function(s: string) { return this.rollDie(s); },
	rollDie34: function(s: string) { return this.rollDie(s); },
	rollDie35: function(s: string) { return this.rollDie(s); },
	rollDie36: function(s: string) { return this.rollDie(s); },
	rollDie37: function(s: string) { return this.rollDie(s); },
	rollDie38: function(s: string) { return this.rollDie(s); },
	rollDie39: function(s: string) { return this.rollDie(s); },
	rollDie40: function(s: string) { return this.rollDie(s); },
	rollDie41: function(s: string) { return this.rollDie(s); },
	rollDie42: function(s: string) { return this.rollDie(s); },
	rollDie43: function(s: string) { return this.rollDie(s); },
	rollDie44: function(s: string) { return this.rollDie(s); },
	rollDie45: function(s: string) { return this.rollDie(s); },
	rollDie46: function(s: string) { return this.rollDie(s); },
	rollDie47: function(s: string) { return this.rollDie(s); },
	rollDie48: function(s: string) { return this.rollDie(s); },
	rollDie49: function(s: string) { return this.rollDie(s); },
	rollDie50: function(s: string) { return this.rollDie(s); },

	rollDie51: function(s: string) { return this.rollDie(s); },

	rollDie52: function(s: string) { return this.rollDie(s); },
	rollDie53: function(s: string) { return this.rollDie(s); },
	rollDie54: function(s: string) { return this.rollDie(s); },
	rollDie55: function(s: string) { return this.rollDie(s); },
	rollDie56: function(s: string) { return this.rollDie(s); },

	rollDie57: function(s: string) { return this.rollDie(s); },

	rollDie58: function(s: string) { return this.rollDie(s); },
	rollDie59: function(s: string) { return this.rollDie(s); },

	rollDie60: function(s: string) { return this.rollDie(s); },

	rollDie61: function(s: string) { return this.rollDie(s); },
	rollDie62: function(s: string) { return this.rollDie(s); },
	rollDie63: function(s: string) { return this.rollDie(s); },
	rollDie64: function(s: string) { return this.rollDie(s); },
	rollDie65: function(s: string) { return this.rollDie(s); },

	rollDie66: function(s: string) { return this.rollDie(s); },
	rollDie67: function(s: string) { return this.rollDie(s); },
	rollDie68: function(s: string) { return this.rollDie(s); },
	rollDie69: function(s: string) { return this.rollDie(s); },
	rollDie70: function(s: string) { return this.rollDie(s); },
	rollDie71: function(s: string) { return this.rollDie(s); },
	rollDie72: function(s: string) { return this.rollDie(s); },

	rollDie73: function(s: string) { return this.rollDie(s); },
	rollDie74: function(s: string) { return this.rollDie(s); },

	rollDie75: function(s: string) { return this.rollDie(s); },

	rollDie76: function(s: string) { return this.rollDie(s); },

	rollDie77: function(s: string) { return this.rollDie(s); },

	rollDie78: function(s: string) { return this.rollDie(s); },

	rollDie79: function(s: string) { return this.rollDie(s); },

	rollDie80: function(s: string) { return this.rollDie(s); },

	rollDie81: function(s: string) { return this.rollDie(s); },

	rollDie82: function(s: string) { return this.rollDie(s); },

	rollDie83: function(s: string) { return this.rollDie(s); },
	rollDie84: function(s: string) { return this.rollDie(s); },

	rollDie85: function(s: string) { return this.rollDie(s); },

	rollDie86: function(s: string) { return this.rollDie(s); },
	rollDie87: function(s: string) { return this.rollDie(s); },
	rollDie88: function(s: string) { return this.rollDie(s); },
	rollDie89: function(s: string) { return this.rollDie(s); },
	rollDie90: function(s: string) { return this.rollDie(s); },
	rollDie91: function(s: string) { return this.rollDie(s); },
	rollDie92: function(s: string) { return this.rollDie(s); },
	rollDie93: function(s: string) { return this.rollDie(s); },
	rollDie94: function(s: string) { return this.rollDie(s); },
	rollDie95: function(s: string) { return this.rollDie(s); },
	rollDie96: function(s: string) { return this.rollDie(s); },
	rollDie97: function(s: string) { return this.rollDie(s); },
	rollDie98: function(s: string) { return this.rollDie(s); },
	rollDie99: function(s: string) { return this.rollDie(s); },

	rollDie100: function(s: string) { return this.rollDie(s); },

	rollDie101: function(s: string) { return this.rollDie(s); },

	rollDie102: function(s: string) { return this.rollDie(s); },

	rollDie103: function(s: string) { return this.rollDie(s); },

	rollDie104: function(s: string) { return this.rollDie(s); },
	rollDie105: function(s: string) { return this.rollDie(s); },

	rollDie106: function(s: string) { return this.rollDie(s); },

	rollDie107: function(s: string) { return this.rollDie(s); },
	rollDie108: function(s: string) { return this.rollDie(s); },

	rollDie109: function(s: string) { return this.rollDie(s); },
	rollDie110: function(s: string) { return this.rollDie(s); },
	rollDie111: function(s: string) { return this.rollDie(s); },
	rollDie112: function(s: string) { return this.rollDie(s); },
	rollDie113: function(s: string) { return this.rollDie(s); },
	rollDie114: function(s: string) { return this.rollDie(s); },
	rollDie115: function(s: string) { return this.rollDie(s); },

	rollDie116: function(s: string) { return this.rollDie(s); },
	rollDie117: function(s: string) { return this.rollDie(s); },
	rollDie118: function(s: string) { return this.rollDie(s); },
	rollDie119: function(s: string) { return this.rollDie(s); },
	rollDie120: function(s: string) { return this.rollDie(s); },

	rollDie121: function(s: string) { return this.rollDie(s); },

	rollDie122: function(s: string) { return this.rollDie(s); },

	rollDie123: function(s: string) { return this.rollDie(s); },

	rollDie124: function(s: string) { return this.rollDie(s); },

	rollDie125: function(s: string) { return this.rollDie(s); },

	rollDie126: function(s: string) { return this.rollDie(s); },
	rollDie127: function(s: string) { return this.rollDie(s); },
	rollDie128: function(s: string) { return this.rollDie(s); },

	rollDie129: function(s: string) { return this.rollDie(s); },
	rollDie130: function(s: string) { return this.rollDie(s); },
	rollDie131: function(s: string) { return this.rollDie(s); },
	rollDie132: function(s: string) { return this.rollDie(s); },
	rollDie133: function(s: string) { return this.rollDie(s); },
	rollDie134: function(s: string) { return this.rollDie(s); },
	rollDie135: function(s: string) { return this.rollDie(s); },

	rollDie136: function(s: string) { return this.rollDie(s); },

	rollDie137: function(s: string) { return this.rollDie(s); },

	rollDie138: function(s: string) { return this.rollDie(s); },

	rollDie139: function(s: string) { return this.rollDie(s); },
	rollDie140: function(s: string) { return this.rollDie(s); },

	rollDie141: function(s: string) { return this.rollDie(s); },
	rollDie142: function(s: string) { return this.rollDie(s); },
	rollDie143: function(s: string) { return this.rollDie(s); },
	rollDie144: function(s: string) { return this.rollDie(s); },

	rollDie145: function(s: string) { return this.rollDie(s); },

	rollDie146: function(s: string) { return this.rollDie(s); },

	rollDie147: function(s: string) { return this.rollDie(s); },

	rollDie148: function(s: string) { return this.rollDie(s); },

	rollDie149: function(s: string) { return this.rollDie(s); },

	rollDie150: function(s: string) { return this.rollDie(s); },

	rollDie151: function(s: string) { return this.rollDie(s); },
	rollDie152: function(s: string) { return this.rollDie(s); },

	rollDie153: function(s: string) { return this.rollDie(s); },

	rollDie154: function(s: string) { return this.rollDie(s); },

	rollDie155: function(s: string) { return this.rollDie(s); },

	rollDie156: function(s: string) { return this.rollDie(s); },

	rollDie157: function(s: string) { return this.rollDie(s); },

	rollDie158: function(s: string) { return this.rollDie(s); },

	rollDie159: function(s: string) { return this.rollDie(s); },

	rollDie160: function(s: string) { return this.rollDie(s); },

	rollDie161: function(s: string) { return this.rollDie(s); },

	rollDie162: function(s: string) { return this.rollDie(s); },

	rollDie163: function(s: string) { return this.rollDie(s); },
	rollDie164: function(s: string) { return this.rollDie(s); },
	rollDie165: function(s: string) { return this.rollDie(s); },
	rollDie166: function(s: string) { return this.rollDie(s); },

	rollDie167: function(s: string) { return this.rollDie(s); },

	rollDie168: function(s: string) { return this.rollDie(s); },
	rollDie169: function(s: string) { return this.rollDie(s); },
	rollDie170: function(s: string) { return this.rollDie(s); },

	rollDie171: function(s: string) { return this.rollDie(s); },

	rollDie172: function(s: string) { return this.rollDie(s); },

	rollDie173: function(s: string) { return this.rollDie(s); },

	rollDie174: function(s: string) { return this.rollDie(s); },

	rollDie175: function(s: string) { return this.rollDie(s); },

	rollDie176: function(s: string) { return this.rollDie(s); },

	rollDie177: function(s: string) { return this.rollDie(s); },
	rollDie178: function(s: string) { return this.rollDie(s); },

	rollDie179: function(s: string) { return this.rollDie(s); },
	rollDie180: function(s: string) { return this.rollDie(s); },

	rollDie181: function(s: string) { return this.rollDie(s); },

	rollDie182: function(s: string) { return this.rollDie(s); },

	rollDie183: function(s: string) { return this.rollDie(s); },
	rollDie184: function(s: string) { return this.rollDie(s); },
	rollDie185: function(s: string) { return this.rollDie(s); },

	rollDie186: function(s: string) { return this.rollDie(s); },

	rollDie187: function(s: string) { return this.rollDie(s); },

	rollDie188: function(s: string) { return this.rollDie(s); },
	rollDie189: function(s: string) { return this.rollDie(s); },
	rollDie190: function(s: string) { return this.rollDie(s); },

	rollDie191: function(s: string) { return this.rollDie(s); },
	rollDie192: function(s: string) { return this.rollDie(s); },

	rollDie193: function(s: string) { return this.rollDie(s); },
	rollDie194: function(s: string) { return this.rollDie(s); },
	rollDie195: function(s: string) { return this.rollDie(s); },
	rollDie196: function(s: string) { return this.rollDie(s); },
	rollDie197: function(s: string) { return this.rollDie(s); },
	rollDie198: function(s: string) { return this.rollDie(s); },
	rollDie199: function(s: string) { return this.rollDie(s); },
	rollDie200: function(s: string) { return this.rollDie(s); },

	rollDie201: function(s: string) { return this.rollDie(s); },

	rollDie202: function(s: string) { return this.rollDie(s); },
	rollDie203: function(s: string) { return this.rollDie(s); },

	// Simple die roller: supports forms like '1d6', '2d4'
	rollDie: function(spec: string) {
		try {
			const m = /^(\d+)d(\d+)$/i.exec(spec || '1d1');
			const count = Math.max(1, parseInt(m && m[1] || '1', 10));
			const sides = Math.max(1, parseInt(m && m[2] || '1', 10));
			let total = 0;
			for (let i = 0; i < count; i++) total += Math.floor(Math.random() * sides) + 1;
			return total;
		} catch(e) { return 1; }
	},

	getEquippedCount: function(slot: string) {
		let c = 0;
		for (const it of this.items){ if (it && it.equippedSlot === slot) c++; }
		return c;
	},
	getSlotCapacity: function(slot: string) {
		switch (slot) {
			case 'hand': return 2;
			case 'ring': return 2;
			case 'ranged': return 1;
			case 'head': return 1;
			case 'foot': return 1;
			case 'glove': return 1;
			case 'armor': return 1;
			default: return 0;
		}
	},
	tryEquip: function(item) {
		const slot = item && item.def && item.def.equipSlot;
		if (!slot){ this.game.display.message("You can't equip that."); return; }
		if (item.equippedSlot){ this.game.display.message('It is already equipped.'); return; }
		const cap = this.getSlotCapacity(slot);
		if (cap <= 0){ this.game.display.message("You can't equip that."); return; }
		const count = this.getEquippedCount(slot);
		if (count >= cap){ this.game.display.message('No free ' + slot + ' slot.'); return; }
		item.equippedSlot = slot;
		this.game.display.message('You equip the ' + (item.def && item.def.name || 'item') + '.');
	},
	tryUnequip: function(item) {
		if (!item || !item.equippedSlot){ this.game.display.message('That item is not equipped.'); return; }
		item.equippedSlot = null;
		this.game.display.message('You unequip the ' + (item.def && item.def.name || 'item') + '.');
	},

	hasItemNamed: function(name: string) {
		for (let i = 0; i < this.items.length; i++){
			if (this.items[i] && this.items[i].def && this.items[i].def.name === name) return true;
		}
		return false;
	},

	tryRangedAttack: function(dx: number, dy: number) {
		// Only in combat and only if player has a Sling
		if (!this.game.world.inCombat){
			this.game.display.message('You can only use the sling in combat.');
			return;
		}
		if (!this.hasItemNamed('Sling')){
			this.game.display.message('You do not have any ranged weapons!');
			return;
		}
		const range = 3;
		const level = this.game.world.level;
		for (let i = 1; i <= range; i++){
			const tx = this.x + dx * i;
			const ty = this.y + dy * i;
			const b = level.getBeing && level.getBeing(tx, ty);
			if (b){
				const dmg = Math.max(1, Math.floor(Math.random() * 4) + 0); // 1d4 -> 0..3 then +1 below
				const real = dmg + 1;
				b.takeDamage(real);
				this.game.display.message(`You sling a stone for ${real} damage!`);
				this.endTurn();
				return;
			}
		}
		this.game.display.message('The stone flies off harmlessly.');
		this.endTurn();
	},
	land: function() {
		// Possessions recovery: if standing on a POSSESSIONS tile, recover items
		try {
			const level = this.game.world.level;
			const tile = level.map[this.x][this.y];
			if (tile && tile.tilesetData === '23-1') { // POSSESSIONS tile key
				const levelId = (level as any).id || 'unknown';
				const key = this.x + '-' + this.y;
				const pile = this.game.world.possessionPiles && this.game.world.possessionPiles[levelId] && this.game.world.possessionPiles[levelId][key];
				if (pile && pile.items && pile.items.length){
					// Recover all items regardless of capacity
					for (const it of pile.items){ this.addItem(it); }
					level.map[this.x][this.y] = pile.originalTile || tile;
					delete this.game.world.possessionPiles[levelId][key];
					this.game.display.message('You recover your possessions.');
				}
			}
		} catch(e) {}
		// Boat travel: if standing on a boat tile, teleport to its linked counterpart
		try {
			const level = this.game.world.level;
			const tile = level.map[this.x][this.y];
			const key = tile && tile.tilesetData;
			if (key === 'BOAT_NORTH' || key === 'BOAT_SOUTH' || key === 'BOAT_EAST' || key === 'BOAT_WEST'){
				const linkKey = this.x + '-' + this.y;
				const dest = level.boatLinks && level.boatLinks[linkKey];
				if (dest){
					const fromFaction = (level.territory[this.x] && level.territory[this.x][this.y]) || 'Unknown';
					const toFaction = (level.territory[dest.x] && level.territory[dest.x][dest.y]) || 'Unknown';
					this.x = dest.x; this.y = dest.y;
					this.game.display.message(`You sail from ${fromFaction} to ${toFaction}.`);
				}
			}
		} catch(e) {}
		if (this.game.world.level.exits[this.x] && this.game.world.level.exits[this.x][this.y]){
			this.game.world.loadLevel(this.game.world.level.exits[this.x][this.y]);
		}
		this.endTurn();
	},
	endTurn: function() {
		this.updateFOV();
		this.game.display.refresh();
		this.game.world.level.beingsTurn();
	},
	remember: function(x: number, y: number) {
		var memory = this.memory[this.game.world.level.id];
		if (!memory){
			memory = [];
			this.memory[this.game.world.level.id] = memory;
		}
		if (!memory[x]){
			memory[x] = [];
		}
		memory[x][y] = true;
	},
	remembers: function(x: number, y: number) {
		var memory = this.memory[this.game.world.level.id];
		if (!memory){
			return false;
		}
		if (!memory[x]){
			return false;
		}
		return memory[x][y] === true;
	},
	canSee: function(dx: number, dy: number) {
		try {
			return this.visible[dx][dy] === true;
		} catch(err) {
			// Catch OOB
			return false; 
		}
	},
	getSightRange: function() {
		return 15;
	},
	updateFOV: function() {
		/*
		 * This function uses simple raycasting, 
		 * use something better for longer ranges
		 * or increased performance
		 */
		for (var j = -this.MAX_SIGHT_RANGE; j <= this.MAX_SIGHT_RANGE; j++)
			for (var i = -this.MAX_SIGHT_RANGE; i <= this.MAX_SIGHT_RANGE; i++)
				this.visible[i][j] = false;
		var step = Math.PI * 2.0 / 1080;
		for (var a = 0; a < Math.PI * 2; a += step)
			this.shootRay(a);
	},
	shootRay: function (a: number) {
		var step = 0.3333;
		var maxdist = this.getSightRange() < this.MAX_SIGHT_RANGE ? this.getSightRange() : this.MAX_SIGHT_RANGE;
		maxdist /= step;
		var dx = Math.cos(a) * step;
		var dy = -Math.sin(a) * step;
		var xx = this.x, yy = this.y;
		for (var i = 0; i < maxdist; ++i) {
			var testx = Math.round(xx);
			var testy = Math.round(yy);
			this.visible[testx-this.x][testy-this.y] = true;
			this.remember(testx, testy);
			try { 
				if (this.game.world.level.map[testx][testy].opaque)
					return;
			} catch(err) {
				// Catch OOB
				return; 
			}
			xx += dx; yy += dy;
		}
	},
	canPick: function() {
		return this.items.length < 24;
	},
	addItem: function(item) {
		if (this.items.length === 24){
			return;
		}
		this.items.push(item);
		this.items.sort(this.itemSorter);
	},
	removeItem: function(item) {
		this.items.splice(this.items.indexOf(item), 1);
		this.items.sort(this.itemSorter);	
	},
	itemSorter: function(a, b) {
		if (a.def.type.name === b.def.type.name){
			return a.def.name > b.def.name ? 1 : -1;
		} else {
			return a.def.type.name > b.def.type.name ? 1 : -1;
		}
	},
	tryPickup: function() {
		var item = this.game.world.level.getItem(this.x, this.y);
		if (item){
			if (!this.canPick()){
				this.game.display.message("You can't pickup the "+item.def.name);
			} else {
				this.game.display.message("You pickup the "+item.def.name);
				this.game.world.level.removeItem(this.x, this.y);
				this.addItem(item);
			}
		}
	},
	tryDrop: function(item) {
		var underItem = this.game.world.level.items[this.x] && this.game.world.level.items[this.x][this.y];
		if (underItem){
			this.game.display.message("Cannot drop the "+item.def.name+" here.");
		} else {
			this.game.world.level.addItem(item, this.x, this.y);
			this.removeItem(item);
			this.game.display.message("You drop the "+item.def.name+".");
		}
	},
	tryUse: function(item, dx, dy) {
		item.def.type.useFunction(this.game, item, dx, dy);
	}
}
