/**
 * Sample object for "procedural generation".
 * 
 * Used by the World object whenever a level needs to be generated.
 */

import Tiles from './data/Tiles.data';
import Races from './data/Races.data';
import Items from './data/Items.data';
import Being from './model/Being.class';
import Item from './model/Item.class';
import Random from './Random';

export default {
	generateTestLevel: function(level, fromId, nextLevelId){
		const WIDTH = 300;
		const HEIGHT = 300;
		const midX = Math.floor(WIDTH/2);
		const midY = Math.floor(HEIGHT/2);
		const barrier = 6; // central water barrier width to keep continents separated

		// Init arrays
		for (let x = 0; x < WIDTH; x++){
			level.map[x] = [];
			level.territory[x] = [];
		}

		// Pseudo-noise helper (deterministic by x,y,seed)
		const noise = (x: number, y: number, seed: number) => {
			const n = Math.sin(x*12.9898 + y*78.233 + seed*37.719) * 43758.5453;
			return (n - Math.floor(n)) * 2.0 - 1.0; // [-1,1]
		};

		// Helper randoms
		const rRange = (min: number, max: number) => min + Math.random() * (max - min);
		const jitter = (base: number, span: number) => Math.floor(base + rRange(-span, span));

		// Continent shape by quadrant using rotated ellipses + multi-scale noise
		const continents = [
			{ name: 'Red Queen',
			  cx: jitter(Math.floor(WIDTH*0.23), Math.floor(WIDTH*0.04)),
			  cy: jitter(Math.floor(HEIGHT*0.26), Math.floor(HEIGHT*0.05)),
			  rx: Math.floor(WIDTH * rRange(0.17, 0.28)),
			  ry: Math.floor(HEIGHT * rRange(0.14, 0.24)),
			  rot: rRange(-0.4, 0.4), // radians
			  amp: rRange(0.25, 0.45),
			  seed: 11 },
			{ name: 'Machine Collective',
			  cx: jitter(Math.floor(WIDTH*0.77), Math.floor(WIDTH*0.04)),
			  cy: jitter(Math.floor(HEIGHT*0.24), Math.floor(HEIGHT*0.05)),
			  rx: Math.floor(WIDTH * rRange(0.19, 0.30)),
			  ry: Math.floor(HEIGHT * rRange(0.13, 0.22)),
			  rot: rRange(-0.5, 0.5),
			  amp: rRange(0.28, 0.50),
			  seed: 23 },
			{ name: 'Warlords',
			  cx: jitter(Math.floor(WIDTH*0.27), Math.floor(WIDTH*0.05)),
			  cy: jitter(Math.floor(HEIGHT*0.76), Math.floor(HEIGHT*0.05)),
			  rx: Math.floor(WIDTH * rRange(0.20, 0.26)),
			  ry: Math.floor(HEIGHT * rRange(0.16, 0.25)),
			  rot: rRange(-0.3, 0.6),
			  amp: rRange(0.20, 0.40),
			  seed: 37 },
			{ name: 'Archivists',
			  cx: jitter(Math.floor(WIDTH*0.74), Math.floor(WIDTH*0.05)),
			  cy: jitter(Math.floor(HEIGHT*0.73), Math.floor(HEIGHT*0.05)),
			  rx: Math.floor(WIDTH * rRange(0.16, 0.29)),
			  ry: Math.floor(HEIGHT * rRange(0.15, 0.26)),
			  rot: rRange(-0.6, 0.4),
			  amp: rRange(0.22, 0.48),
			  seed: 53 }
		];

		const landMask: boolean[][] = [];
		for (let x = 0; x < WIDTH; x++){
			landMask[x] = [];
			for (let y = 0; y < HEIGHT; y++){
				let owner = '';
				let land = false;
				// Keep water barrier cross
				if (Math.abs(x - midX) < Math.floor(barrier/2) || Math.abs(y - midY) < Math.floor(barrier/2)){
					land = false;
				} else {
					for (const c of continents){
						// rotate point around continent center
						const cosr = Math.cos(c.rot), sinr = Math.sin(c.rot);
						const rx0 = x - c.cx, ry0 = y - c.cy;
						const rx1 = (rx0 * cosr - ry0 * sinr) / c.rx;
						const ry1 = (rx0 * sinr + ry0 * cosr) / c.ry;
						const dist = Math.sqrt(rx1*rx1 + ry1*ry1);
						// multi-scale noise for shoreline
						const n1 = noise(x, y, c.seed);
						const n2 = noise(x*0.5, y*0.5, c.seed+101) * 0.5;
						const n3 = noise(x*0.25, y*0.25, c.seed+202) * 0.25;
						const n = (n1 + n2 + n3) * c.amp;
						const threshold = 1.0 + n;
						if (dist <= threshold){
							land = true;
							owner = c.name;
							break;
						}
					}
				}
				landMask[x][y] = land;
				level.map[x][y] = land ? Tiles.GRASS : Tiles.WATER;
				level.territory[x][y] = land ? (owner || 'Unknown') : 'Water';
			}
		}

		// Smooth shorelines with a couple of CA passes
		const dirs = [[-1,-1], [0,-1], [1,-1], [-1,0], [1,0], [-1,1], [0,1], [1,1]];
		for (let pass = 0; pass < 2; pass++){
			const next: boolean[][] = [];
			for (let x = 0; x < WIDTH; x++){
				next[x] = [];
				for (let y = 0; y < HEIGHT; y++){
					let count = 0;
					for (const d of dirs){
						const nx = x + d[0], ny = y + d[1];
						if (nx >= 0 && ny >= 0 && nx < WIDTH && ny < HEIGHT && landMask[nx][ny]) count++;
					}
					if (landMask[x][y]) next[x][y] = count >= 3; else next[x][y] = count >= 5;
				}
			}
			for (let x = 0; x < WIDTH; x++){
				for (let y = 0; y < HEIGHT; y++){
					landMask[x][y] = next[x][y];
					level.map[x][y] = landMask[x][y] ? Tiles.GRASS : Tiles.WATER;
					if (!landMask[x][y]) level.territory[x][y] = 'Water';
				}
			}
		}

		// Scatter some bushes on land only
		const scatterCount = Math.floor(WIDTH * HEIGHT * 0.02);
		for (let i = 0; i < scatterCount; i++){
			const x = Random.n(0, WIDTH-1), y = Random.n(0, HEIGHT-1);
			if (landMask[x][y]) level.map[x][y] = Tiles.BUSH;
		}

		// Helper to find a random land cell
		const randLand = (): {x:number,y:number} => {
			for (let tries = 0; tries < 5000; tries++){
				const x = Random.n(0, WIDTH-1), y = Random.n(0, HEIGHT-1);
				if (landMask[x][y]) return {x,y};
			}
			return {x: midX+barrier, y: midY+barrier};
		};

		// Place beings on land
		for (let i = 0; i < 20; i++){
			let pos = randLand();
			let being = new Being(level.game, level, Races.RAT);
			level.addBeing(being, pos.x, pos.y);
			being.setIntent('RANDOM');
			pos = randLand();
			being = new Being(level.game, level, Races.TROLL);
			level.addBeing(being, pos.x, pos.y);
			being.setIntent('CHASE');
		}

		// Place items on land
		let posA = randLand();
		level.addItem(new Item(Items.IRON_SWORD), posA.x, posA.y);
		posA = randLand();
		level.addItem(new Item(Items.BOOK_OF_MIRDAS), posA.x, posA.y);

		// Place exits on land
		if (fromId){
			const s = randLand();
			level.addExit(s.x, s.y, fromId, Tiles.STAIRS_DOWN);
			level.player.x = s.x;
			level.player.y = s.y;
		} else {
			// Place player on land to start
			const s = randLand();
			level.player.x = s.x;
			level.player.y = s.y;
			// Place reference boats around player on initial start
			const px = s.x, py = s.y;
			if (py - 1 >= 0) level.map[px][py - 1] = Tiles.BOAT_NORTH;
			if (py + 1 < HEIGHT) level.map[px][py + 1] = Tiles.BOAT_SOUTH;
			if (px + 1 < WIDTH) level.map[px + 1][py] = Tiles.BOAT_EAST;
			if (px - 1 >= 0) level.map[px - 1][py] = Tiles.BOAT_WEST;
		}
		const e = randLand();
		level.addExit(e.x, e.y, nextLevelId, Tiles.STAIRS_UP);
	}
}
