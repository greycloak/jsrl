const ut = (window as any).ut;

export default {
	GRASS: {
		tile: new ut.Tile('.', 0, 128, 0),
		darkTile: new ut.Tile('.', 128, 128, 128),
		solid: false,
		opaque: false,
		name: 'Grass',
		tilesetData: '5-0'
	},
	SNOW: {
		tile: new ut.Tile('·', 255, 255, 255),
		darkTile: new ut.Tile('·', 180, 180, 200),
		solid: false,
		opaque: false,
		name: 'Snow',
		tilesetData: '5-2'
	},
	STAIRS_DOWN: {
		tile: new ut.Tile('>', 255, 255, 255),
		darkTile: new ut.Tile('>', 128, 128, 128),
		solid: false,
		opaque: false,
		name: 'Stairs Down',
		tilesetData: '21-0'
	},
	STAIRS_UP: {
		tile: new ut.Tile('<', 255, 255, 255),
		darkTile: new ut.Tile('<', 128, 128, 128),
		solid: false,
		opaque: false,
		name: 'Stairs Up',
		tilesetData: '21-1'
	},
	BUSH: {
		tile: new ut.Tile('&', 0, 128, 0),
		darkTile: new ut.Tile('&', 128, 128, 128),
		solid: true,
		opaque: true,
		name: 'Bush',
		tilesetData: '2-1'
	},
	WATER: {
		tile: new ut.Tile('~', 0, 0, 255),
		darkTile: new ut.Tile('~', 128, 128, 128),
		solid: true,
		opaque: false,
		name: 'Water',
		tilesetData: '8-5'
	},
	ROCKY_1: {
		tile: new ut.Tile('·', 200, 200, 200),
		darkTile: new ut.Tile('·', 120, 120, 120),
		solid: false,
		opaque: false,
		name: 'Rocky Ground',
		tilesetData: '1-0'
	},
	ROCKY_2: {
		tile: new ut.Tile('·', 200, 200, 200),
		darkTile: new ut.Tile('·', 120, 120, 120),
		solid: false,
		opaque: false,
		name: 'Rocky Ground',
		tilesetData: '2-0'
	},
	ROCKY_3: {
		tile: new ut.Tile('·', 200, 200, 200),
		darkTile: new ut.Tile('·', 120, 120, 120),
		solid: false,
		opaque: false,
		name: 'Rocky Ground',
		tilesetData: '3-0'
	},
	ROCKY_4: {
		tile: new ut.Tile('·', 200, 200, 200),
		darkTile: new ut.Tile('·', 120, 120, 120),
		solid: false,
		opaque: false,
		name: 'Rocky Ground',
		tilesetData: '4-0'
	},
	CITY: {
		tile: new ut.Tile('C', 255, 255, 255),
		darkTile: new ut.Tile('C', 180, 180, 180),
		solid: false,
		opaque: false,
		name: 'City',
		tilesetData: '5-19'
	},
	BOAT_EAST: {
		tile: new ut.Tile('b', 200, 200, 0),
		darkTile: new ut.Tile('b', 128, 128, 0),
		solid: false,
		opaque: false,
		name: 'Boat (East)',
		tilesetData: 'BOAT_EAST'
	},
	BOAT_SOUTH: {
		tile: new ut.Tile('b', 200, 200, 0),
		darkTile: new ut.Tile('b', 128, 128, 0),
		solid: false,
		opaque: false,
		name: 'Boat (South)',
		tilesetData: 'BOAT_SOUTH'
	},
	BOAT_NORTH: {
		tile: new ut.Tile('b', 200, 200, 0),
		darkTile: new ut.Tile('b', 128, 128, 0),
		solid: false,
		opaque: false,
		name: 'Boat (North)',
		tilesetData: 'BOAT_NORTH'
	},
	BOAT_WEST: {
		tile: new ut.Tile('b', 200, 200, 0),
		darkTile: new ut.Tile('b', 128, 128, 0),
		solid: false,
		opaque: false,
		name: 'Boat (West)',
		tilesetData: 'BOAT_WEST'
	}
}
