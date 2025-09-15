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

		// Ensure one massive snow cluster on the top-right continent (Machine Collective)
		// covering ~10% of its northern shoreline band.
		{
			const fname = 'Machine Collective';
			// Determine continent vertical extent
			let minY = HEIGHT, maxY = -1;
			for (let x = 0; x < WIDTH; x++){
				for (let y = 0; y < HEIGHT; y++){
					if (!landMask[x][y]) continue;
					if (level.territory[x][y] !== fname) continue;
					minY = Math.min(minY, y);
					maxY = Math.max(maxY, y);
				}
			}
			if (maxY >= 0) {
				const bandY = Math.floor(minY + (maxY - minY) * 0.20); // top 20% band
				const isProtected = (t): boolean => {
					if (!t) return true;
					const k = t.tilesetData;
					const boat = (k === 'BOAT_NORTH' || k === 'BOAT_SOUTH' || k === 'BOAT_EAST' || k === 'BOAT_WEST');
					const stairs = (t === Tiles.STAIRS_UP || t === Tiles.STAIRS_DOWN);
					return boat || stairs;
				};
				// Shoreline candidates: land in band with water to the north (any of N, NW, NE)
				const shoreline: {x:number,y:number, score:number}[] = [];
				for (let x = 0; x < WIDTH; x++){
					for (let y = minY; y <= bandY; y++){
						if (!landMask[x][y]) continue;
						if (level.territory[x][y] !== fname) continue;
						const t = level.map[x][y];
						if (isProtected(t)) continue;
						let waterAdj = 0;
						const neigh = [ {dx:0,dy:-1}, {dx:-1,dy:-1}, {dx:1,dy:-1} ];
						for (const d of neigh){
							const nx = x + d.dx, ny = y + d.dy;
							if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) { waterAdj++; continue; }
							if (!landMask[nx][ny]) waterAdj++;
						}
						if (waterAdj > 0) shoreline.push({x,y,score:waterAdj});
					}
				}
				if (shoreline.length) {
					const target = Math.max(1, Math.floor(shoreline.length * 0.10));
					// Pick a seed with strong shoreline score
					let seed = shoreline[0];
					for (let i = 0; i < 200; i++){
						const cand = shoreline[Random.n(0, shoreline.length-1)];
						if (cand.score > seed.score) seed = cand;
					}
					// BFS growth constrained to band and continent, avoiding protected tiles
					const q: {x:number,y:number}[] = [ {x:seed.x, y:seed.y} ];
					const seen: {[k:string]: boolean} = {};
					const keyOf = (p:{x:number,y:number}) => p.x+'-'+p.y;
					const dirs4 = [ {dx:-1,dy:0}, {dx:1,dy:0}, {dx:0,dy:-1}, {dx:0,dy:1} ];
					let placed = 0;
					while (q.length && placed < target){
						const cur = q.shift(); if (!cur) break;
						const k = keyOf(cur); if (seen[k]) continue; seen[k] = true;
						if (cur.x < 0 || cur.y < 0 || cur.x >= WIDTH || cur.y >= HEIGHT) continue;
						if (!landMask[cur.x][cur.y]) continue;
						if (level.territory[cur.x][cur.y] !== fname) continue;
						if (cur.y < minY || cur.y > bandY) continue;
						const tcur = level.map[cur.x][cur.y];
						if (isProtected(tcur)) continue;
						level.map[cur.x][cur.y] = Tiles.SNOW;
						placed++;
						for (const d of dirs4){
							const nx = cur.x + d.dx, ny = cur.y + d.dy;
							if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
							if (!landMask[nx][ny]) continue;
							if (level.territory[nx][ny] !== fname) continue;
							if (ny < minY || ny > bandY) continue;
							const tnb = level.map[nx][ny];
							if (isProtected(tnb)) continue;
							const nk = nx+'-'+ny; if (!seen[nk]) q.push({x:nx,y:ny});
						}
					}
				}
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

		// Helper: ensure the boat tile has at least one orthogonal land neighbor (so it's reachable)
		const hasLandAccess = (x: number, y: number, owner: string, exclude: 'E'|'W'|'N'|'S') => {
			const candidates: {dx:number,dy:number,dir:'E'|'W'|'N'|'S'}[] = [
				{dx:-1, dy:0, dir:'W'}, {dx:1, dy:0, dir:'E'}, {dx:0, dy:-1, dir:'N'}, {dx:0, dy:1, dir:'S'}
			];
			for (const c of candidates){
				if (c.dir === exclude) continue; // skip the water-facing side
				const nx = x + c.dx, ny = y + c.dy;
				if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
				if (landMask[nx][ny] && level.territory[nx][ny] === owner) return true;
			}
			return false;
		};

		// Helper: place a boat tile for a specific continent facing a direction
		const placeBoat = (owner: string, facing: 'EAST'|'WEST'|'NORTH'|'SOUTH', hintX: number, hintY: number): {x:number,y:number, key:string} | null => {
			// clamp helpers
			const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
			const yStart = clamp(hintY, 0, HEIGHT-1);
			const xStart = clamp(hintX, 0, WIDTH-1);
			// search windows around hints and near barrier edge
			const maxOffset = 80;
			if (facing === 'EAST') {
				const edgeX = Math.max(0, Math.floor(midX - Math.ceil(barrier/2) - 1));
				for (let dy = 0; dy <= maxOffset; dy++){
					for (const sy of [yStart - dy, yStart + dy]){
						if (sy < 0 || sy >= HEIGHT) continue;
						for (let dx = 0; dx <= 30; dx++){
							const x = edgeX - dx; const y = sy;
							if (x < 0) break;
							if (!landMask[x][y]) continue;
							if (level.territory[x][y] !== owner) continue;
							if (x+1 < WIDTH && !landMask[x+1][y] && hasLandAccess(x,y,owner,'E')) { level.map[x][y] = Tiles.BOAT_EAST; return {x, y, key: 'BOAT_EAST'}; }
						}
					}
				}
			} else if (facing === 'WEST') {
				const edgeX = Math.min(WIDTH-1, Math.floor(midX + Math.floor(barrier/2)));
				for (let dy = 0; dy <= maxOffset; dy++){
					for (const sy of [yStart - dy, yStart + dy]){
						if (sy < 0 || sy >= HEIGHT) continue;
						for (let dx = 0; dx <= 30; dx++){
							const x = edgeX + dx; const y = sy;
							if (x >= WIDTH) break;
							if (!landMask[x][y]) continue;
							if (level.territory[x][y] !== owner) continue;
							if (x-1 >= 0 && !landMask[x-1][y] && hasLandAccess(x,y,owner,'W')) { level.map[x][y] = Tiles.BOAT_WEST; return {x, y, key: 'BOAT_WEST'}; }
						}
					}
				}
			} else if (facing === 'SOUTH') {
				const edgeY = Math.max(0, Math.floor(midY - Math.ceil(barrier/2) - 1));
				for (let dx = 0; dx <= maxOffset; dx++){
					for (const sx of [xStart - dx, xStart + dx]){
						if (sx < 0 || sx >= WIDTH) continue;
						for (let dy = 0; dy <= 30; dy++){
							const x = sx; const y = edgeY - dy;
							if (y < 0) break;
							if (!landMask[x][y]) continue;
							if (level.territory[x][y] !== owner) continue;
							if (y+1 < HEIGHT && !landMask[x][y+1] && hasLandAccess(x,y,owner,'S')) { level.map[x][y] = Tiles.BOAT_SOUTH; return {x, y, key: 'BOAT_SOUTH'}; }
						}
					}
				}
			} else if (facing === 'NORTH') {
				const edgeY = Math.min(HEIGHT-1, Math.floor(midY + Math.floor(barrier/2)));
				for (let dx = 0; dx <= maxOffset; dx++){
					for (const sx of [xStart - dx, xStart + dx]){
						if (sx < 0 || sx >= WIDTH) continue;
						for (let dy = 0; dy <= 30; dy++){
							const x = sx; const y = edgeY + dy;
							if (y >= HEIGHT) break;
							if (!landMask[x][y]) continue;
							if (level.territory[x][y] !== owner) continue;
							if (y-1 >= 0 && !landMask[x][y-1] && hasLandAccess(x,y,owner,'N')) { level.map[x][y] = Tiles.BOAT_NORTH; return {x, y, key: 'BOAT_NORTH'}; }
						}
					}
				}
			}
			return null;
		};

		// Place two boats per continent and record positions
		const boatsByCont: { [name: string]: { [dir: string]: {x:number,y:number, key:string} } } = {};
		for (const c of continents){
			boatsByCont[c.name] = boatsByCont[c.name] || {};
			if (c.name === 'Red Queen') {
				boatsByCont[c.name]['EAST'] = placeBoat(c.name, 'EAST', c.cx, c.cy) || boatsByCont[c.name]['EAST'];
				boatsByCont[c.name]['SOUTH'] = placeBoat(c.name, 'SOUTH', c.cx, c.cy) || boatsByCont[c.name]['SOUTH'];
			} else if (c.name === 'Machine Collective') {
				boatsByCont[c.name]['WEST'] = placeBoat(c.name, 'WEST', c.cx, c.cy) || boatsByCont[c.name]['WEST'];
				boatsByCont[c.name]['SOUTH'] = placeBoat(c.name, 'SOUTH', c.cx, c.cy) || boatsByCont[c.name]['SOUTH'];
			} else if (c.name === 'Warlords') {
				boatsByCont[c.name]['EAST'] = placeBoat(c.name, 'EAST', c.cx, c.cy) || boatsByCont[c.name]['EAST'];
				boatsByCont[c.name]['NORTH'] = placeBoat(c.name, 'NORTH', c.cx, c.cy) || boatsByCont[c.name]['NORTH'];
			} else if (c.name === 'Archivists') {
				boatsByCont[c.name]['WEST'] = placeBoat(c.name, 'WEST', c.cx, c.cy) || boatsByCont[c.name]['WEST'];
				boatsByCont[c.name]['NORTH'] = placeBoat(c.name, 'NORTH', c.cx, c.cy) || boatsByCont[c.name]['NORTH'];
			}
		}

		// Link boats across continents for travel
		const keyOf = (p: {x:number,y:number}) => `${p.x}-${p.y}`;
		const link = (a?: {x:number,y:number}, b?: {x:number,y:number}) => {
			if (!a || !b) return;
			level.boatLinks[keyOf(a)] = { x: b.x, y: b.y };
		};
		link(boatsByCont['Red Queen'] && boatsByCont['Red Queen']['EAST'], boatsByCont['Machine Collective'] && boatsByCont['Machine Collective']['WEST']);
		link(boatsByCont['Machine Collective'] && boatsByCont['Machine Collective']['WEST'], boatsByCont['Red Queen'] && boatsByCont['Red Queen']['EAST']);
		link(boatsByCont['Red Queen'] && boatsByCont['Red Queen']['SOUTH'], boatsByCont['Warlords'] && boatsByCont['Warlords']['NORTH']);
		link(boatsByCont['Warlords'] && boatsByCont['Warlords']['NORTH'], boatsByCont['Red Queen'] && boatsByCont['Red Queen']['SOUTH']);
		link(boatsByCont['Machine Collective'] && boatsByCont['Machine Collective']['SOUTH'], boatsByCont['Archivists'] && boatsByCont['Archivists']['NORTH']);
		link(boatsByCont['Archivists'] && boatsByCont['Archivists']['NORTH'], boatsByCont['Machine Collective'] && boatsByCont['Machine Collective']['SOUTH']);
		link(boatsByCont['Warlords'] && boatsByCont['Warlords']['EAST'], boatsByCont['Archivists'] && boatsByCont['Archivists']['WEST']);
		link(boatsByCont['Archivists'] && boatsByCont['Archivists']['WEST'], boatsByCont['Warlords'] && boatsByCont['Warlords']['EAST']);

		// Scatter some bushes on land only
		const scatterCount = Math.floor(WIDTH * HEIGHT * 0.02);
		for (let i = 0; i < scatterCount; i++){
			const x = Random.n(0, WIDTH-1), y = Random.n(0, HEIGHT-1);
			if (landMask[x][y]) level.map[x][y] = Tiles.BUSH;
		}

		// Rocky terrain coverage per quadrant/continent using 2–3 large clusters
		const rockyVariants = [Tiles.ROCKY_1, Tiles.ROCKY_2, Tiles.ROCKY_3, Tiles.ROCKY_4];
		const coverage: {[name: string]: number} = {
			'Red Queen': 0.05, // top-left
			'Machine Collective': 0.05, // top-right
			'Archivists': 0.05, // bottom-right
			'Warlords': 0.10 // bottom-left
		};
		const dirs4 = [
			{dx:-1,dy:0}, {dx:1,dy:0}, {dx:0,dy:-1}, {dx:0,dy:1}
		];
		for (const fname in coverage){
			// Build candidate list (grass tiles of this continent)
			const candidates: {x:number,y:number}[] = [];
			for (let x = 0; x < WIDTH; x++){
				for (let y = 0; y < HEIGHT; y++){
					if (!landMask[x][y]) continue;
					if (level.territory[x][y] !== fname) continue;
					if (level.map[x][y] !== Tiles.GRASS) continue;
					candidates.push({x,y});
				}
			}
			if (!candidates.length) continue;
			const target = Math.floor(candidates.length * coverage[fname]);
			if (target <= 0) continue;
			const clusterCount = coverage[fname] >= 0.08 ? 3 : 2;
			const perCluster: number[] = [];
			for (let i = 0; i < clusterCount; i++) perCluster[i] = Math.floor(target / clusterCount);
			for (let i = 0; i < (target % clusterCount); i++) perCluster[i]++;
			// Helper distance function
			const dist2 = (a:{x:number,y:number}, b:{x:number,y:number}) => {
				const dx = a.x-b.x, dy = a.y-b.y; return dx*dx+dy*dy;
			};
			// Choose well-spaced seeds
			const seeds: {x:number,y:number}[] = [];
			for (let s = 0; s < clusterCount; s++){
				let best = candidates[Random.n(0, candidates.length-1)], bestScore = -1;
				for (let tries = 0; tries < 60; tries++){
					const cand = candidates[Random.n(0, candidates.length-1)];
					let score = 1e9;
					for (const prev of seeds){ score = Math.min(score, dist2(cand, prev)); }
					if (seeds.length === 0) score = Math.random();
					if (score > bestScore){ bestScore = score; best = cand; }
				}
				seeds.push({x:best.x, y:best.y});
			}
			// Multi-BFS growth per cluster
			const queues: {x:number,y:number}[][] = [];
			const seen: {[key:string]: boolean} = {};
			for (let i = 0; i < clusterCount; i++){
				queues[i] = [];
				const s = seeds[i];
				if (level.map[s.x][s.y] === Tiles.GRASS) queues[i].push(s);
			}
			const placedPer: number[] = new Array(clusterCount).fill(0);
			let totalPlaced = 0;
			const keyOf = (p:{x:number,y:number}) => p.x+'-'+p.y;
			// Round-robin expansion to keep clusters growing evenly
			outer: while (totalPlaced < target){
				let anyProgress = false;
				for (let i = 0; i < clusterCount; i++){
					if (placedPer[i] >= perCluster[i]) continue;
					let steps = 0;
					while (queues[i].length && placedPer[i] < perCluster[i] && steps < 200){
						steps++;
						const cur = queues[i].shift();
						if (!cur) break;
						const k = keyOf(cur);
						if (seen[k]) continue;
						seen[k] = true;
						if (cur.x < 0 || cur.y < 0 || cur.x >= WIDTH || cur.y >= HEIGHT) continue;
						if (!landMask[cur.x][cur.y]) continue;
						if (level.territory[cur.x][cur.y] !== fname) continue;
						if (level.map[cur.x][cur.y] !== Tiles.GRASS) continue; // don't overwrite
						// paint
						level.map[cur.x][cur.y] = rockyVariants[Random.n(0, rockyVariants.length-1)];
						placedPer[i]++; totalPlaced++; anyProgress = true;
						// enqueue neighbors
						for (const d of dirs4){
							const nx = cur.x + d.dx, ny = cur.y + d.dy;
							if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
							if (!landMask[nx][ny]) continue;
							if (level.territory[nx][ny] !== fname) continue;
							if (level.map[nx][ny] !== Tiles.GRASS) continue;
							const nk = nx+'-'+ny; if (!seen[nk]) queues[i].push({x:nx,y:ny});
						}
					}
				}
				if (!anyProgress) break outer; // cannot place more without overwriting
			}
		}

		// Snow coverage on far north of top continents (clustered ~20%)
		const topContinents = ['Red Queen', 'Machine Collective'];
		for (const fname of topContinents){
			// Build list of land cells for this continent to determine northern band
			let minY = HEIGHT, maxY = -1;
			for (let x = 0; x < WIDTH; x++){
				for (let y = 0; y < HEIGHT; y++){
					if (!landMask[x][y]) continue;
					if (level.territory[x][y] !== fname) continue;
					minY = Math.min(minY, y);
					maxY = Math.max(maxY, y);
				}
			}
			if (maxY < 0) continue; // none found
			const bandY = Math.floor(minY + (maxY - minY) * 0.30); // top 30% band
			// Candidates are land tiles in the northern band excluding boats and stairs
			const candidates: {x:number,y:number}[] = [];
			for (let x = 0; x < WIDTH; x++){
				for (let y = minY; y <= bandY; y++){
					if (!landMask[x][y]) continue;
					if (level.territory[x][y] !== fname) continue;
					const t = level.map[x][y];
					if (!t) continue;
					const key = t.tilesetData;
					const isBoat = (key === 'BOAT_NORTH' || key === 'BOAT_SOUTH' || key === 'BOAT_EAST' || key === 'BOAT_WEST');
					const isStairs = (t === Tiles.STAIRS_UP || t === Tiles.STAIRS_DOWN);
					if (isBoat || isStairs) continue;
					candidates.push({x,y});
				}
			}
			if (!candidates.length) continue;
			const target = Math.floor(candidates.length * 0.20);
			if (target <= 0) continue;
			// Move one cluster from top-right to top-left: TL gets 3, TR gets 1
			const clusterCount = (fname === 'Red Queen') ? 3 : 1;
			const perCluster: number[] = [];
			for (let i = 0; i < clusterCount; i++) perCluster[i] = Math.floor(target / clusterCount);
			for (let i = 0; i < (target % clusterCount); i++) perCluster[i]++;
			// Choose spaced seeds inside band (prefer GRASS tiles)
			const dist2 = (a:{x:number,y:number}, b:{x:number,y:number}) => { const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; };
			const seeds: {x:number,y:number}[] = [];
			for (let s = 0; s < clusterCount; s++){
				let best = candidates[Random.n(0, candidates.length-1)], bestScore = -1;
				for (let tries = 0; tries < 50; tries++){
					const cand = candidates[Random.n(0, candidates.length-1)];
					let score = 1e9;
					for (const prev of seeds){ score = Math.min(score, dist2(cand, prev)); }
					if (seeds.length === 0) score = Math.random();
					if (score > bestScore){ bestScore = score; best = cand; }
				}
				// If best is protected (boat/stairs), find a nearby valid candidate in-band
				{
					let found = null as null | {x:number,y:number};
					for (let radius = 1; radius <= 6 && !found; radius++){
						for (let dx = -radius; dx <= radius && !found; dx++){
							for (let dy = -radius; dy <= radius && !found; dy++){
								const nx = best.x + dx, ny = best.y + dy;
								if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
								if (!landMask[nx][ny]) continue;
								if (level.territory[nx][ny] !== fname) continue;
								if (ny < minY || ny > bandY) continue;
								const tt = level.map[nx][ny];
								if (!tt) continue;
								const k2 = tt.tilesetData;
								const boat2 = (k2 === 'BOAT_NORTH' || k2 === 'BOAT_SOUTH' || k2 === 'BOAT_EAST' || k2 === 'BOAT_WEST');
								const stairs2 = (tt === Tiles.STAIRS_UP || tt === Tiles.STAIRS_DOWN);
								if (boat2 || stairs2) continue;
								found = {x:nx, y:ny};
							}
						}
					}
					if (found) best = found;
				}
				seeds.push(best);
			}
			// Grow clusters via BFS restricted to band and continent and GRASS-only
			const dirs4 = [ {dx:-1,dy:0}, {dx:1,dy:0}, {dx:0,dy:-1}, {dx:0,dy:1} ];
			const queues: {x:number,y:number}[][] = [];
			const seen: {[key:string]: boolean} = {};
			for (let i = 0; i < clusterCount; i++){
				queues[i] = [];
				// Only start from valid seed (not boat/stairs)
				const s0 = seeds[i];
				const t0 = level.map[s0.x][s0.y];
				if (t0) {
					const k0 = t0.tilesetData;
					const boat0 = (k0 === 'BOAT_NORTH' || k0 === 'BOAT_SOUTH' || k0 === 'BOAT_EAST' || k0 === 'BOAT_WEST');
					const stairs0 = (t0 === Tiles.STAIRS_UP || t0 === Tiles.STAIRS_DOWN);
					if (!boat0 && !stairs0) queues[i].push(s0);
				}
			}
			const placedPer: number[] = new Array(clusterCount).fill(0);
			let totalPlaced = 0;
			const keyOf = (p:{x:number,y:number}) => p.x+'-'+p.y;
			outer2: while (totalPlaced < target){
				let anyProgress = false;
				for (let i = 0; i < clusterCount; i++){
					if (placedPer[i] >= perCluster[i]) continue;
					let steps = 0;
					while (queues[i].length && placedPer[i] < perCluster[i] && steps < 200){
						steps++;
						const cur = queues[i].shift(); if (!cur) break;
						const k = keyOf(cur); if (seen[k]) continue; seen[k] = true;
						if (cur.x < 0 || cur.y < 0 || cur.x >= WIDTH || cur.y >= HEIGHT) continue;
						if (!landMask[cur.x][cur.y]) continue;
						if (level.territory[cur.x][cur.y] !== fname) continue;
						if (cur.y < minY || cur.y > bandY) continue;
						const tcur = level.map[cur.x][cur.y];
						if (!tcur) continue;
						const kcur = tcur.tilesetData;
						const boatC = (kcur === 'BOAT_NORTH' || kcur === 'BOAT_SOUTH' || kcur === 'BOAT_EAST' || kcur === 'BOAT_WEST');
						const stairsC = (tcur === Tiles.STAIRS_UP || tcur === Tiles.STAIRS_DOWN);
						if (boatC || stairsC) continue; // never overwrite protected tiles
						level.map[cur.x][cur.y] = Tiles.SNOW; // overwrite bush/rock/grass etc.
						placedPer[i]++; totalPlaced++; anyProgress = true;
						for (const d of dirs4){
							const nx = cur.x + d.dx, ny = cur.y + d.dy;
							if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
							if (!landMask[nx][ny]) continue;
							if (level.territory[nx][ny] !== fname) continue;
							if (ny < minY || ny > bandY) continue;
							const tnb = level.map[nx][ny];
							if (!tnb) continue;
							const knb = tnb.tilesetData;
							const boatN = (knb === 'BOAT_NORTH' || knb === 'BOAT_SOUTH' || knb === 'BOAT_EAST' || knb === 'BOAT_WEST');
							const stairsN = (tnb === Tiles.STAIRS_UP || tnb === Tiles.STAIRS_DOWN);
							if (boatN || stairsN) continue;
							const nk = nx+'-'+ny; if (!seen[nk]) queues[i].push({x:nx,y:ny});
						}
					}
				}
				if (!anyProgress) break outer2;
			}
		}

		// Ensure boats are accessible: clear at least one adjacent approach tile
		{
			const dirs4: {dx:number,dy:number, label:'E'|'W'|'N'|'S'}[] = [
				{dx:-1,dy:0,label:'W'}, {dx:1,dy:0,label:'E'}, {dx:0,dy:-1,label:'N'}, {dx:0,dy:1,label:'S'}
			];
			const isWater = (x:number,y:number) => (x>=0&&y>=0&&x<WIDTH&&y<HEIGHT) && !landMask[x][y];
			for (let x = 0; x < WIDTH; x++){
				for (let y = 0; y < HEIGHT; y++){
					const cell = level.map[x][y];
					if (!cell) continue;
					const key = cell.tilesetData;
					if (key !== 'BOAT_EAST' && key !== 'BOAT_WEST' && key !== 'BOAT_NORTH' && key !== 'BOAT_SOUTH') continue;
					// Identify the water-facing direction from boat key
					let waterDir: 'E'|'W'|'N'|'S' = 'E';
					if (key === 'BOAT_EAST') waterDir = 'E';
					else if (key === 'BOAT_WEST') waterDir = 'W';
					else if (key === 'BOAT_NORTH') waterDir = 'N';
					else if (key === 'BOAT_SOUTH') waterDir = 'S';
					// Verify coastline: ensure water on the facing side; if not, try to find a neighboring water side and adjust waterDir
					let facing = waterDir;
					const tryDirs: ('E'|'W'|'N'|'S')[] = ['E','W','N','S'];
					for (const d of tryDirs){
						const dd = dirs4.find(v => v.label === d)!;
						if (isWater(x+dd.dx, y+dd.dy)) { facing = d; break; }
					}
					// Ensure at least one approach tile (not water, not stairs/boat) is passable; if blocked, set to GRASS
					const approachDirs = dirs4.filter(d => d.label !== facing);
					let hasApproach = false;
					for (const d of approachDirs){
						const nx = x + d.dx, ny = y + d.dy;
						if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
						if (!landMask[nx][ny]) continue; // not land
						const t = level.map[nx][ny];
						if (!t) continue;
						const tk = t.tilesetData;
						const isBoat = (tk === 'BOAT_EAST' || tk === 'BOAT_WEST' || tk === 'BOAT_NORTH' || tk === 'BOAT_SOUTH');
						const isStairs = (t === Tiles.STAIRS_UP || t === Tiles.STAIRS_DOWN);
						const isBush = (t === Tiles.BUSH);
						if (!isBoat && !isStairs && !isBush) { hasApproach = true; break; }
					}
					if (!hasApproach){
						// Clear the first available land neighbor (non-water) to GRASS as an approach
						for (const d of approachDirs){
							const nx = x + d.dx, ny = y + d.dy;
							if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue;
							if (!landMask[nx][ny]) continue;
							level.map[nx][ny] = Tiles.GRASS;
							break;
						}
					}
				}
			}
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
		}
		const e = randLand();
		level.addExit(e.x, e.y, nextLevelId, Tiles.STAIRS_UP);
	}
}
