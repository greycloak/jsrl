# JSRL Agent Instructions

This repository hosts a bare-bones TypeScript roguelike. Use this file as guidance when extending the game.

## Modification Rules
- Only edit files inside `src/ts` unless explicitly instructed otherwise.
- Use **tabs** for indentation and keep existing formatting.
- After making changes run `npm run build:web` to verify the project compiles.

## Customization Overview
### World & Levels
- `src/ts/LevelGenerator.ts` controls map size and procedural generation.
- `src/ts/LevelLoader.ts` and `src/ts/data/Maps.data.ts` load hand-crafted ASCII maps.
- Persist and transition between levels in `src/ts/model/World.ts`.

### Tiles & Terrain
- Define tiles with colors, opacity, and passability in `src/ts/data/Tiles.data.ts`.

### Items & Inventory
- Add new item behaviors in `src/ts/data/ItemTypes.data.ts`.
- List concrete items in `src/ts/data/Items.data.ts`.
- Inventory rules live in `src/ts/model/Player.ts`.

### Monsters & NPCs
- Enemy and NPC races are defined in `src/ts/data/Races.data.ts`.
- Basic AI and stats are handled by `src/ts/model/Being.class.ts`.

### Player & Core Mechanics
- Starting equipment and messages are in `src/ts/Game.ts`.
- Field of view, memory, and actions are implemented in `src/ts/model/Player.ts`.
- Keyboard mappings are handled by `src/ts/Input.ts`.

### Display & UI
- Switch between Unicode and PIXI renderers under `src/ts/display/`.
- Customize HUD, message boxes, and tile sizes within these display modules.

### Extending the Engine
- Introduce quest systems, saving/loading, new skills, or other mechanics by adding modules under `src/ts/model` or `src/ts/data`.

## Testing
Run the following to ensure your changes compile:

```
npm run build:web
```
