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
		this.health = 6;
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
		if (!this.game.world.level.canWalkTo(this.x+dir.x, this.y+dir.y)){
			this.game.input.inputEnabled = true;
			return;
		}
		this.x += dir.x;
		this.y += dir.y;
		this.land();
	},
	land: function() {
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
