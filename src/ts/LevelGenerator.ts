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
		const WIDTH = 200;
		const HEIGHT = 300;
		for (let x = 0; x < WIDTH; x++){
			level.map[x] = [];
			for (let y = 0; y < HEIGHT; y++){
				level.map[x][y] = Tiles.GRASS;
			}
		}
		// Scatter some features proportionally
		for (let i = 0; i < Math.floor(WIDTH * HEIGHT * 0.02); i++){
			level.map[Random.n(0, WIDTH-1)][Random.n(0, HEIGHT-1)] = Tiles.BUSH;
		}
		for (let i = 0; i < Math.floor(WIDTH * HEIGHT * 0.02); i++){
			level.map[Random.n(0, WIDTH-1)][Random.n(0, HEIGHT-1)] = Tiles.WATER;
		}
		for (let i = 0; i < 20; i++){
			let being = new Being(level.game, level, Races.RAT);
			level.addBeing(being, Random.n(0, WIDTH-1), Random.n(0, HEIGHT-1));
			being.setIntent('RANDOM');
			being = new Being(level.game, level, Races.TROLL);
			level.addBeing(being, Random.n(0, WIDTH-1), Random.n(0, HEIGHT-1));
			being.setIntent('CHASE');
		}
		level.addItem(new Item(Items.IRON_SWORD), Random.n(0, WIDTH-1), Random.n(0, HEIGHT-1));
		level.addItem(new Item(Items.BOOK_OF_MIRDAS), Random.n(0, WIDTH-1), Random.n(0, HEIGHT-1));
		if (fromId){
			const xs = Random.n(0, WIDTH-1);
			const ys = Random.n(0, HEIGHT-1);
			level.addExit(xs, ys, fromId, Tiles.STAIRS_DOWN);
			level.player.x = xs;
			level.player.y = ys;
		}
		level.addExit(Random.n(0, WIDTH-1), Random.n(0, HEIGHT-1), nextLevelId, Tiles.STAIRS_UP);
	}
}
