/**
 * Implements the Display interface using pixi.js to display the
 * level around the player using sprites and the UI using 
 * text components (including TTF fonts) laid over the map.
 * 
 */

import { Application, Assets, Texture, Rectangle, Sprite, Text, Container, Graphics } from 'pixi.js';
import PIXITextBox from './PIXITextBox.class';
import PixiUtils from './PixiUtils';

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
	inMapView: false,
	init: async function(game, config) {
		this.textureMap = {};
		this.game = game;
		// Compute viewport tile counts from window size to avoid scaling
		const desiredTile = config.tileSize;
		this.viewportCountX = Math.max(10, Math.floor(window.innerWidth / desiredTile));
		this.viewportCountY = Math.max(10, Math.floor(window.innerHeight / desiredTile));
		this.tileSize = config.tileSize;
		const app = new Application<HTMLCanvasElement>({
			width: this.tileSize * this.viewportCountX,
			height: this.tileSize * this.viewportCountY,
		})
		document.getElementById('game').appendChild(app.view);
		theCanvas = app.view;
		const spritesheetURL = config.tilesetURL;
		const blackTexture = await Assets.load('assets/gfx/black.png');
		const baseTexture = await Assets.load(spritesheetURL);
		const tileSize = config.tileSize;
		for (let x = 0; x < config.tilesetCountX; x++) {
			for (let y = 0; y < config.tilesetCountY; y++) {
				const spriteTexture = new Texture(
					baseTexture,
					new Rectangle(x * tileSize, y * tileSize, tileSize, tileSize)
				);
				this.textureMap[x+'-'+y] = spriteTexture;
			}
		}
		const titleScreenContainer = new Container();
		this.titleScreenContainer = titleScreenContainer;
		app.stage.addChild(titleScreenContainer);
		titleScreenContainer.visible = false;
		titleScreenContainer.addChild(
			PixiUtils.createTextBox(20, 20, config.textboxFontSize, "JSRL Sample Roguelike")
		);
		titleScreenContainer.addChild(
			PixiUtils.createTextBox(20, 40, config.textboxFontSize, "Press Space to Continue")
		);

		const mainGameContainer = new Container();
		this.mainGameContainer = mainGameContainer;
		app.stage.addChild(mainGameContainer);
		mainGameContainer.visible = false;
		this.tileLayers = [
			[],[],[]
		];
		for (let x = 0; x < this.viewportCountX; x++) {
			for (let y = 0; y < this.viewportCountY; y++) {
				for (let l = 0; l < 3; l++) {
					const sprite = new Sprite(this.textureMap['0-0'])
					mainGameContainer.addChild(sprite);
					this.tileLayers[l][x+'-'+y] = sprite;
					sprite.position.x = x * tileSize;
					sprite.position.y = y * tileSize;
				}
			}
		}
		this.semiViewportCountX = Math.floor(this.viewportCountX / 2);
		this.semiViewportCountY = Math.floor(this.viewportCountY / 2);
		const text = new Text('', {
			fontFamily: 'Kenney Pixel',
			fontSize: config.textboxFontSize,
			fill: 0xdddddd,
			align: 'left',
			wordWrap: true,
			wordWrapWidth: config.tileSize * config.viewportCountX * 4
		});
		text.position.x = 10;
		text.position.y = 10;
		text.scale.x = 0.25;
		text.scale.y = 0.25;
		mainGameContainer.addChild(text);
		this.textBox = new PIXITextBox(text);

		this.inventoryBackground = new Sprite(blackTexture);
		this.inventoryBackground.width = 106;
		this.inventoryBackground.height = 160;
		this.inventoryBackground.position.x = 246;
		this.inventoryBackground.position.y = 64;
		this.inventoryBackground.visible = false;
		mainGameContainer.addChild(this.inventoryBackground);

		this.inventoryCursor = new Sprite(this.textureMap['24-21']);
		this.inventoryCursor.position.x = 245;
		this.inventoryCursor.visible = false;
		mainGameContainer.addChild(this.inventoryCursor);

		this.inventoryText = new Text('', {
			fontFamily: 'Kenney Pixel',
			fontSize: config.textboxFontSize,
			fill: 0xdddddd,
			align: 'left',
		});
		this.inventoryText.scale.x = 0.25;
		this.inventoryText.scale.y = 0.25;
		mainGameContainer.addChild(this.inventoryText);
		this.inventoryText.visible = false;
		this.inventoryText.position.x = 16;
		this.inventoryText.position.y = 16;

		this.transparentTiles = config.transparentTiles;

		// Map overlay (top-right 25% mini map)
		this.mapOverlay = new Container();
		this.mapOverlay.visible = false;
		mainGameContainer.addChild(this.mapOverlay);
		// Mini map dimensions (quarter of the screen)
		this.miniW = Math.floor(this.viewportCountX / 2);
		this.miniH = Math.floor(this.viewportCountY / 2);
		this.mapOverlay.position.x = (this.viewportCountX - this.miniW) * tileSize;
		this.mapOverlay.position.y = 0;
		// Border sprites
		this.mapBorderTop = new Sprite(blackTexture);
		this.mapBorderBottom = new Sprite(blackTexture);
		this.mapBorderLeft = new Sprite(blackTexture);
		this.mapBorderRight = new Sprite(blackTexture);
		this.mapOverlay.addChild(this.mapBorderTop);
		this.mapOverlay.addChild(this.mapBorderBottom);
		this.mapOverlay.addChild(this.mapBorderLeft);
		this.mapOverlay.addChild(this.mapBorderRight);
		// Mini tiles container (we rebuild tiles when toggling or refreshing)
		this.miniTilesContainer = new Container();
		this.mapOverlay.addChild(this.miniTilesContainer);
		// Mini player marker as circular dot (Graphics)
		this.miniPlayerDot = new Graphics();
		this.mapOverlay.addChild(this.miniPlayerDot);

		// Character overlay (text on black background)
		this.charOverlay = new Container();
		this.charOverlay.visible = false;
		mainGameContainer.addChild(this.charOverlay);
		this.charBg = new Sprite(blackTexture);
		this.charBg.alpha = 0.8;
		this.charBg.width = Math.min(320, this.tileSize * this.viewportCountX - 16);
		this.charBg.height = Math.min(220, this.tileSize * this.viewportCountY - 16);
		this.charBg.position.set(8, 8);
		this.charOverlay.addChild(this.charBg);
		this.charText = new Text('', {
			fontFamily: 'Kenney Pixel',
			fontSize: config.textboxFontSize,
			fill: 0xdddddd,
			align: 'left',
			wordWrap: true,
			wordWrapWidth: this.charBg.width - 16
		});
		this.charText.scale.set(0.25, 0.25);
		this.charText.position.set(this.charBg.position.x + 8, this.charBg.position.y + 8);
		this.charOverlay.addChild(this.charText);

		resizeCanvas();
	},
	updateMapOverlayLayout: function() {
		const ts = this.tileSize;
		const bt = Math.max(2, Math.floor(this.tileSize / 4)); // border thickness
		const widthPx = this.miniW * ts;
		const heightPx = this.miniH * ts;
		this.mapBorderTop.position.set(0, 0);
		this.mapBorderTop.width = widthPx; this.mapBorderTop.height = bt;
		this.mapBorderTop.tint = 0xFFFFFF;
		this.mapBorderBottom.position.set(0, heightPx - bt);
		this.mapBorderBottom.width = widthPx; this.mapBorderBottom.height = bt;
		this.mapBorderBottom.tint = 0xFFFFFF;
		this.mapBorderLeft.position.set(0, 0);
		this.mapBorderLeft.width = bt; this.mapBorderLeft.height = heightPx;
		this.mapBorderLeft.tint = 0xFFFFFF;
		this.mapBorderRight.position.set(widthPx - bt, 0);
		this.mapBorderRight.width = bt; this.mapBorderRight.height = heightPx;
		this.mapBorderRight.tint = 0xFFFFFF;
	},
	showCharacter: function() {
		const p = this.game.player;
		const level = this.game.world.level;
		let factionLoc = 'Unknown';
		try { factionLoc = level.territory[p.x][p.y] || 'Unknown'; } catch(e) {}
		let text = '';
		text += 'Character\n\n';
		text += `Name: ${p.name}\n`;
		text += `Ancestry: ${p.ancestry}\n`;
		text += `Location: ${factionLoc}\n`;
		text += `Wealth: ${p.wealth}\n\n`;
		text += 'Favors\n';
		text += ` Red Queen: ${p.favor['Red Queen']}\n`;
		text += ` Machine Collective: ${p.favor['Machine Collective']}\n`;
		text += ` Warlords: ${p.favor['Warlords']}\n`;
		text += ` Archivists: ${p.favor['Archivists']}\n\n`;
		text += `Water: ${p.water}  Supplies: ${p.supplies}\n`;
		text += `Radiation: ${p.radiation}  Health: ${p.health}\n`;
		this.charText.text = text;
		this.charOverlay.visible = true;
	},
	hideCharacter: function() {
		this.charOverlay.visible = false;
	},
	updateMiniMapOverlay: function() {
		const level = this.game.world.level;
		if (!level.map || !level.map.length) return;
		const levelW = level.map.length;
		const levelH = (level.map[0] && level.map[0].length) || 0;
		const ts = this.tileSize;
		const bt = Math.max(2, Math.floor(ts / 4));
		const widthPx = this.miniW * ts;
		const heightPx = this.miniH * ts;
		const innerX = bt;
		const innerY = bt;
		const innerWpx = widthPx - 2 * bt;
		const innerHpx = heightPx - 2 * bt;
		const miniTileSize = Math.max(1, Math.floor(Math.min(innerWpx / levelW, innerHpx / levelH)));
		this.miniTileSize = miniTileSize;
		// Draw the player circular marker
		const dotRadius = Math.max(1, Math.floor(miniTileSize / 3));
		this.miniPlayerDot.clear();
		this.miniPlayerDot.beginFill(0xFF3333, 1);
		this.miniPlayerDot.drawCircle(0, 0, dotRadius);
		this.miniPlayerDot.endFill();
		// Rebuild mini tiles
		this.miniTilesContainer.removeChildren();
		for (let x = 0; x < levelW; x++){
			for (let y = 0; y < levelH; y++){
				const cell = level.map[x] && level.map[x][y];
				if (!cell) continue;
				const key = cell.tilesetData;
				const sprite = new Sprite(this.textureMap[key] || this.textureMap['0-0']);
				sprite.width = miniTileSize;
				sprite.height = miniTileSize;
				sprite.position.x = innerX + x * miniTileSize;
				sprite.position.y = innerY + y * miniTileSize;
				this.miniTilesContainer.addChild(sprite);
			}
		}
		// Player marker position
		const px = innerX + level.player.x * miniTileSize + Math.floor(miniTileSize / 2);
		const py = innerY + level.player.y * miniTileSize + Math.floor(miniTileSize / 2);
		this.miniPlayerDot.position.x = px;
		this.miniPlayerDot.position.y = py;
	},
	getTerrain: function(x: number, y: number) {
		var level = this.game.world.level;
		var xr = x - level.player.x;
		var yr = y - level.player.y;
		if (level.player.canSee(xr, yr)){
			if (level.map[x] && level.map[x][y]){
				return {
					tilesetData: level.map[x][y].tilesetData
				}
			} else {
				return null;
			}
		} else if (level.player.remembers(x, y)){
			if (level.map[x] && level.map[x][y]){
				return {
					tilesetData: level.map[x][y].tilesetData,
					variation: 'outOfSight'
				}
			} else {
				return null;
			}
		} else {
			return null;
		}
	},
	getItem: function(x: number, y: number) {
		var level = this.game.world.level;
		var xr = x - level.player.x;
		var yr = y - level.player.y;
		if (level.player.canSee(xr, yr)){
			if (level.items[x] && level.items[x][y]){
				return level.items[x][y].def.tilesetData;
			} else {
				return null;
			}
		} else {
			return null;
		}
	},
	getBeing: function(x: number, y: number) {
		var level = this.game.world.level;
		if (x === level.player.x && y === level.player.y){
			return '28-0';
		}
		var xr = x - level.player.x;
		var yr = y - level.player.y;
		if (level.player.canSee(xr, yr)){
			if (level.beings[x] && level.beings[x][y]){
				return level.beings[x][y].tilesetData;
			} else {
				return null;
			}
		} else {
			return null;
		}
	},
	refresh: function() {
		const player = this.game.world.level.player;
		const level = this.game.world.level;
		const noTexture = this.textureMap['0-0'];
			for (var x = -this.semiViewportCountX; x < this.semiViewportCountX; x++) {
				for (var y = -this.semiViewportCountY; y < this.semiViewportCountY; y++) {
					const mapX = player.x + x;
					const mapY = player.y + y;
					const being = this.getBeing(mapX, mapY);
					const item = this.transparentTiles || !being ? this.getItem(mapX, mapY) : null;
					const terrain = this.transparentTiles || (!being && !item) ? this.getTerrain(mapX, mapY) : null;
					const beingTexture = being ? this.textureMap[being] : noTexture;
					const itemTexture = item ? this.textureMap[item] : noTexture;
					const terrainTexture = terrain ? this.textureMap[terrain.tilesetData] : noTexture;
					const index = (x+this.semiViewportCountX)+'-'+(y+this.semiViewportCountY);
					this.tileLayers[0][index].texture = terrainTexture;
					if (terrain) {
						if (terrain.variation === 'outOfSight') {
							this.tileLayers[0][index].tint = 0x0000CC;
						} else {
							this.tileLayers[0][index].tint = 0xFFFFFF;
						}
					} 
					this.tileLayers[1][index].texture = itemTexture;
					this.tileLayers[2][index].texture = beingTexture;
				}
			}
		// Update mini map if visible
		if (this.inMapView) {
			this.updateMapOverlayLayout();
			this.updateMiniMapOverlay();
		}
	},
	showMap: function() {
		this.inMapView = true;
		this.mapOverlay.visible = true;
		this.updateMapOverlayLayout();
		this.refresh();
	},
	hideMap: function() {
		this.inMapView = false;
		this.mapOverlay.visible = false;
		this.refresh();
	},
	showInventory: function() {
		this.inventoryBackground.visible = true;
		let string = "Inventory\n\n";
		for (var i = 0; i < this.game.player.items.length; i++){
			var item = this.game.player.items[i];
			if (item == this.game.input.selectedItem){
				this.inventoryCursor.position.y = 86 + i * 10;
			}
			string += item.def.name + '\n';

			//this.term.put(item.def.tile, xBase+2, yBase+1+i);
		}
		this.inventoryText.text = string;
		this.inventoryText.visible = true;
		this.inventoryCursor.visible = true;
	},
	hideInventory: function() {
		this.inventoryBackground.visible = false;
		this.inventoryText.visible = false;
		this.inventoryCursor.visible = false;
	},
	message: function(str: string) {
		this.textBox.addText(str);
	},
	titleScreen() {
		this.titleScreenContainer.visible = true;
	},
	activateNewGame() {
		this.titleScreenContainer.visible = false;
		this.mainGameContainer.visible = true;
	}
}
