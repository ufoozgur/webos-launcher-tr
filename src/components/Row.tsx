import {LAYOUT} from '../theme/tokens';
import {Tile, type TileModel} from './Tile';

interface Props {
	label: string;
	items: TileModel[];
	focused: boolean;
	selected: number;
	emptyText?: string;
	onSelect: (index: number) => void;
	onActivate: (index: number) => void;
}

const VIEWPORT_WIDTH = LAYOUT.screenWidth - 2 * LAYOUT.edgePadding;
const STEP = LAYOUT.tileSize + LAYOUT.tileGap;

/** Horizontal strip of tiles. Centred when it fits; otherwise a carousel that keeps
 *  the selected tile in the middle (clamped at the ends). */
export function Row ({label, items, focused, selected, emptyText, onSelect, onActivate}: Props) {
	const pageSize = Math.max(1, Math.floor((VIEWPORT_WIDTH + LAYOUT.tileGap) / STEP));
	const start = Math.floor(selected / pageSize) * pageSize;
	const visible = items.slice(start, start + pageSize);

	return (
		<section class={`row${focused ? ' row--focused' : ''}`}>
			<h2 class="row__label">{label}{items.length > pageSize && <span class="row__page">{Math.floor(start / pageSize) + 1} / {Math.ceil(items.length / pageSize)}</span>}</h2>
			<div class="row__viewport">
				{items.length === 0
					? <div class="row__empty">{emptyText || 'Henüz öğe yok'}</div>
					: <div class="row__track row__track--centered">
						{visible.map((item, i) => (
							<Tile
								key={item.key}
								model={item}
								focused={focused && start + i === selected}
								onHover={() => onSelect(start + i)}
								onActivate={() => onActivate(start + i)}
							/>
						))}
					</div>}
			</div>
		</section>
	);
}
