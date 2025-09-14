const ut = (window as any).ut;

/**
 * Implements the Display interface using unicodetiles.js to display the
 * level around the player using character graphics and the UI using 
 * text components laid over the map.
 * 
 */

import TextBox from './TextBox.class';
import Box from './Box.class';

let theCanvas;

function resizeCanvas () {
	if (!theCanvas) {
		return;
	}
	const padding = 0;
	const gameDiv = document.getElementById('game');
	// Stretch to fill the entire window
	theCanvas.style.width = (innerWidth - padding) + "px";
	theCanvas.style.height = (innerHeight - padding) + "px";
	gameDiv.style.width = theCanvas.style.width;
	gameDiv.style.height = theCanvas.style.height;
}

window.addEventListener("resize", resizeCanvas);

export default {
	BLANK_TILE: new ut.Tile(' ', 255, 255, 255),
	CURSOR_TILE: new ut.Tile('*', 255, 255, 255),
	inMapView: false,
	init: function(game, config) {
		this.game = game;
		// Create a temporary viewport to measure tile size
		this.term = new ut.Viewport(document.getElementById("game"), 1, 1);
		theCanvas = this.term.renderer.canvas;
		// Compute how many tiles fit the window
		const tw = this.term.renderer.tw || 8;
		const th = this.term.renderer.th || 16;
		const cols = Math.max(40, Math.floor(window.innerWidth / tw));
		const rows = Math.max(20, Math.floor(window.innerHeight / th));
		// Recreate viewport with computed size
		document.getElementById("game").innerHTML = "";
		this.term = new ut.Viewport(document.getElementById("game"), cols, rows);
		theCanvas = this.term.renderer.canvas;
		this.eng = new ut.Engine(this.term, this.getDisplayedTile.bind(this), undefined, undefined);
		this.textBox = new TextBox(this.term, 2, cols, {x:0, y:0}, this);
		this.inventoryBox = new Box(this.term, 15, 40, {x:2, y:4});
		this.centered = config && config.centered;
		resizeCanvas();
	},
	getDisplayedTile: function(x: number,y: number) {
		var level = this.game.world.level;
		if (x === level.player.x && y === level.player.y){
			return level.player.tile;
		}
		var xr = x - level.player.x;
		var yr = y - level.player.y;
		if (level.player.canSee(xr, yr)) {
			if (level.beings[x] && level.beings[x][y]){
				return level.beings[x][y].tile;
			} else if (level.items[x] && level.items[x][y]){
				return level.items[x][y].def.tile;
			} else if (level.map[x] && level.map[x][y]){
				return level.map[x][y].tile;
			} else {
				return ut.NULLTILE;
			}
		} else if (level.player.remembers(x, y)){
			if (level.map[x] && level.map[x][y]){
				return level.map[x][y].darkTile;
			} else {
				return ut.NULLTILE;
			}
		} else {
			return ut.NULLTILE;
		}
	},
	drawMiniMap: function() {
		const level = this.game.world.level;
		if (!level.map || !level.map.length) return;
		const levelW = level.map.length;
		const levelH = (level.map[0] && level.map[0].length) || 0;
		// Top-right 25% of the screen
		const vpW = 80, vpH = 25;
		const miniW = Math.floor(vpW / 2);
		const miniH = Math.floor(vpH / 2);
		const left = vpW - miniW;
		const top = 0;
		const innerW = miniW - 2;
		const innerH = miniH - 2;
		// Border
		this.term.putString("+" + "-".repeat(innerW) + "+", left, top, 255, 255, 255);
		for (let y = 0; y < innerH; y++){
			this.term.putString("|", left, top + 1 + y, 255, 255, 255);
			this.term.putString("|", left + innerW + 1, top + 1 + y, 255, 255, 255);
		}
		this.term.putString("+" + "-".repeat(innerW) + "+", left, top + innerH + 1, 255, 255, 255);
		// Content
		for (let mx = 0; mx < innerW; mx++){
			for (let my = 0; my < innerH; my++){
				const mapX = innerW > 1 ? Math.floor(mx * (levelW - 1) / (innerW - 1)) : 0;
				const mapY = innerH > 1 ? Math.floor(my * (levelH - 1) / (innerH - 1)) : 0;
				if (level.map[mapX] && level.map[mapX][mapY]){
					this.term.put(level.map[mapX][mapY].tile, left + 1 + mx, top + 1 + my);
				}
			}
		}
		// Player marker
		const pmx = innerW > 1 ? Math.floor(level.player.x * (innerW - 1) / (levelW - 1)) : 0;
		const pmy = innerH > 1 ? Math.floor(level.player.y * (innerH - 1) / (levelH - 1)) : 0;
		this.term.put(this.CURSOR_TILE, left + 1 + pmx, top + 1 + pmy);
	},
	refresh: function() {
		if (this.centered) {
			this.eng.update(this.game.player.x, this.game.player.y);
		} else {
			this.eng.update(40, 12);
		}
		this.textBox.draw();
		if (this.inMapView) this.drawMiniMap();
		this.term.render();
	},
	showMap: function() {
		this.inMapView = true;
		this.term.clear();
		this.refresh();
	},
	hideMap: function() {
		this.inMapView = false;
		this.term.clear();
	},
	showInventory: function() {
		this.inventoryBox.draw();
		var xBase = 20;
		var yBase = 5;
		this.term.putString("Inventory", xBase, yBase, 255, 0, 0);
		for (var i = 0; i < this.game.player.items.length; i++){
			var item = this.game.player.items[i];
			if (item == this.game.input.selectedItem){
				this.term.put(this.CURSOR_TILE, xBase, yBase+1+i);
			} else {
				this.term.put(this.BLANK_TILE, xBase, yBase+1+i);
			}
			this.term.put(item.def.tile, xBase+2, yBase+1+i);
			this.term.put(item.def.tile, xBase+2, yBase+1+i);
			this.term.putString(item.def.name, xBase + 4, yBase+1+i, 255, 255, 255);
		}
		this.term.render();
	},
	hideInventory: function(){
		this.term.clear();
		this.refresh();		
	},
	message: function(str: string) {
		this.textBox.addText(str);
		this.textBox.draw();
		this.term.render();
	},
	titleScreen() {
		this.term.putString("JSRL Sample Roguelike", 2, 2, 255, 255, 255);
		this.term.putString("Press Space to Start", 6, 4, 255, 255, 255);
		this.term.render();
	},
	activateNewGame() {
	}
}
