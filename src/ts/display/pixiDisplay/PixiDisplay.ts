/**
 * Implements the Display interface using pixi.js to display the
 * level around the player using sprites and the UI using 
 * text components (including TTF fonts) laid over the map.
 * 
 */

import { Application, Assets, Texture, Rectangle, Sprite, Text, Container, Graphics, TextMetrics } from 'pixi.js';
import PIXITextBox from './PIXITextBox.class';
import PixiUtils from './PixiUtils';

let theCanvas;



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
		this.app = app;
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
		// Sprite aliases for convenient references
		this.textureMap['BOAT_EAST'] = this.textureMap['11-19'];
		this.textureMap['BOAT_SOUTH'] = this.textureMap['10-19'];
		this.textureMap['BOAT_NORTH'] = this.textureMap['9-19'];
		// Mirror of BOAT_EAST (we flip at render time)
		this.textureMap['BOAT_WEST'] = this.textureMap['11-19'];
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
		// X set relative to background in showInventory
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
		// Position inventory text near the background panel
		this.inventoryText.position.x = this.inventoryBackground.position.x + 8;
		this.inventoryText.position.y = this.inventoryBackground.position.y + 12;

		this.transparentTiles = config.transparentTiles;

		// Map overlay (top-right mini map)
		this.mapOverlay = new Container();
		this.mapOverlay.visible = false;
		mainGameContainer.addChild(this.mapOverlay);
		// Mini map dimensions
		// Width: fixed to 25% of canvas width in pixels for consistency
		// Height: keep previous behavior (half of canvas height)
		const canvasWpx = this.viewportCountX * tileSize;
		const canvasHpx = this.viewportCountY * tileSize;
		this.miniWpx = Math.floor(canvasWpx * 0.25);
		this.miniHpx = Math.floor(canvasHpx / 2);
		this.mapOverlay.position.x = canvasWpx - this.miniWpx;
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

		// Zoom state
		this.zoom = 1.0;
		this.miniZoom = 1.0;
		this.applyZoom();
		
	},
	applyZoom: function() {
		if (this.inMapView) {
			this.mapOverlay.scale.set(this.miniZoom, this.miniZoom);
		} else {
			this.mainGameContainer.scale.set(this.zoom, this.zoom);
		}
	},
	zoomIn: function() {
		if (this.inMapView) {
			this.miniZoom = Math.min(3.0, this.miniZoom + 0.1);
		} else {
			this.zoom = Math.min(3.0, this.zoom + 0.1);
		}
		this.applyZoom();
	},
	zoomOut: function() {
		if (this.inMapView) {
			this.miniZoom = Math.max(0.5, this.miniZoom - 0.1);
		} else {
			this.zoom = Math.max(0.5, this.zoom - 0.1);
		}
		this.applyZoom();
	},
	updateMapOverlayLayout: function() {
		const ts = this.tileSize;
		const bt = Math.max(2, Math.floor(this.tileSize / 4)); // border thickness
		const widthPx = this.miniWpx;
		const heightPx = this.miniHpx;
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
		const widthPx = this.miniWpx;
		const heightPx = this.miniHpx;
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
				// Handle horizontal flip for special keys (e.g., BOAT_WEST)
				if (key === 'BOAT_WEST') { sprite.anchor.x = 1; sprite.scale.x = -1; } else { sprite.anchor.x = 0; sprite.scale.x = 1; }
				sprite.width = miniTileSize;
				sprite.height = miniTileSize;
				sprite.position.x = innerX + x * miniTileSize;
				sprite.position.y = innerY + y * miniTileSize;
				this.miniTilesContainer.addChild(sprite);
					// Brown dot overlay for boats on mini-map
					if (key === 'BOAT_NORTH' || key === 'BOAT_SOUTH' || key === 'BOAT_EAST' || key === 'BOAT_WEST') {
						const dot = new Graphics();
						dot.beginFill(0x8B4513, 1);
						const r = Math.max(1, Math.floor(miniTileSize / 3));
						dot.drawCircle(0, 0, r);
						dot.endFill();
						dot.position.x = sprite.position.x + Math.floor(miniTileSize / 2);
						dot.position.y = sprite.position.y + Math.floor(miniTileSize / 2);
						this.miniTilesContainer.addChild(dot);
					}
					// Gold dot overlay for possessions pile tile (tileset 23-1)
					if (key === '23-1') {
						const dot = new Graphics();
						dot.beginFill(0xFFD700, 1);
						const r = Math.max(1, Math.floor(miniTileSize / 3));
						dot.drawCircle(0, 0, r);
						dot.endFill();
						dot.position.x = sprite.position.x + Math.floor(miniTileSize / 2);
						dot.position.y = sprite.position.y + Math.floor(miniTileSize / 2);
						this.miniTilesContainer.addChild(dot);
					}
					// White dot overlay for towns (CITY tileset 5-19)
					if (key === '5-19') {
						const dot = new Graphics();
						dot.beginFill(0xFFFFFF, 1);
						const r = Math.max(1, Math.floor(miniTileSize / 3));
						dot.drawCircle(0, 0, r);
						dot.endFill();
						dot.position.x = sprite.position.x + Math.floor(miniTileSize / 2);
						dot.position.y = sprite.position.y + Math.floor(miniTileSize / 2);
						this.miniTilesContainer.addChild(dot);
					}
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
		if (this.game.world && this.game.world.inCombat) {
			if (level.map[x] && level.map[x][y]){
				return {
					tilesetData: level.map[x][y].tilesetData
				}
			} else {
				return null;
			}
		} else if (level.player.canSee(xr, yr)){
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
		if (this.game.world && this.game.world.inCombat) {
			if (level.items[x] && level.items[x][y]){
				return level.items[x][y].def.tilesetData;
			} else {
				return null;
			}
		} else if (level.player.canSee(xr, yr)){
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
		if (this.game.world && this.game.world.inCombat) {
			if (level.beings[x] && level.beings[x][y]){
				return level.beings[x][y].tilesetData;
			} else {
				return null;
			}
		} else if (level.player.canSee(xr, yr)){
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
					// Flip handling per layer based on key label
					const setFlip = (sprite, key) => {
						if (key === 'BOAT_WEST') { sprite.anchor.x = 1; sprite.scale.x = -1; } else { sprite.anchor.x = 0; sprite.scale.x = 1; }
					};
					setFlip(this.tileLayers[0][index], terrain ? terrain.tilesetData : '');
					if (terrain) {
						if (terrain.variation === 'outOfSight') {
							this.tileLayers[0][index].tint = 0x0000CC;
						} else {
							this.tileLayers[0][index].tint = 0xFFFFFF;
						}
					}
					this.tileLayers[1][index].texture = itemTexture;
					setFlip(this.tileLayers[1][index], item || '');
					this.tileLayers[2][index].texture = beingTexture;
					setFlip(this.tileLayers[2][index], being || '');
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
		const items = this.game.player.items;
		for (var i = 0; i < items.length; i++){
			var item = items[i];
			let name = item.def.name + (item.equippedSlot ? ' [E]' : '');
			string += (i+1) + ") " + name + '\n';
		}
		this.inventoryText.text = string;
		// Place cursor aligned to the selected index
		const selIndex = this.game.input.selectedItemIndex || 0;
		const metrics = TextMetrics.measureText(this.inventoryText.text, this.inventoryText.style);
		const lineHeightPx = Math.max(1, Math.round(metrics.lineHeight * this.inventoryText.scale.y));
		const headerLines = 2; // "Inventory" + blank line
		const lineTopY = this.inventoryText.position.y + (headerLines + selIndex) * lineHeightPx;
		const baselineAdjust = Math.round(lineHeightPx * 0.15);
		this.inventoryCursor.width = lineHeightPx;
		this.inventoryCursor.height = lineHeightPx;
		this.inventoryCursor.position.x = this.inventoryText.position.x - this.inventoryCursor.width - 2;
		this.inventoryCursor.position.y = lineTopY + baselineAdjust;
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
