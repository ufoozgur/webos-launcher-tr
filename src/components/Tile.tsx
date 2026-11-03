import {CheckMark, Glyph, type GlyphName} from './Glyph';

/** Everything a tile needs to draw itself; rows and grids build these from app/input data. */
export interface TileModel {
	key: string;
	label: string;
	description?: string;
	/** full-bleed artwork (app icons) */
	imageUrl?: string;
	animatedImageUrl?: string;
	/** LG's grey line-art input icons, drawn smaller and lightened */
	glyphImageUrl?: string;
	/** built-in vector icon */
	glyph?: GlyphName;
	/** monogram background when there is no artwork */
	color?: string;
}

interface Props {
	model: TileModel;
	focused: boolean;
	/** picked up in re-order mode */
	lifted?: boolean;
	/** shown with a tick badge (settings picker) */
	checked?: boolean;
	/** greyed out (settings picker: not on the home screen) */
	dimmed?: boolean;
	onHover?: () => void;
	onActivate?: () => void;
}

export function Tile ({model, focused, lifted, checked, dimmed, onHover, onActivate}: Props) {
	const classes = ['tile', model.key === 'lg-home' && 'tile--panic', focused && 'tile--focused', lifted && 'tile--lifted', dimmed && 'tile--dimmed'].filter(Boolean).join(' ');
	return (
		<div class={classes} onMouseEnter={onHover} onClick={onActivate}>
			<div class="tile__box" style={model.color && !model.imageUrl ? {background: model.color} : undefined}>
				{model.imageUrl
					? <img class="tile__image" src={focused && model.animatedImageUrl ? model.animatedImageUrl : model.imageUrl} alt="" />
					: model.glyphImageUrl
						? <img class="tile__image tile__image--glyph" src={model.glyphImageUrl} alt="" onError={(event) => { if (!event.currentTarget.src.endsWith('/hdmigeneric.png')) event.currentTarget.src = 'icons/inputs/hdmigeneric.png'; }} />
						: model.glyph
							? <Glyph name={model.glyph} />
							: <div class="tile__monogram">{model.label.charAt(0).toUpperCase()}</div>}
				{checked && <div class="tile__badge"><CheckMark /></div>}
			</div>
			<div class="tile__label">{model.label}</div>
			{model.description && <div class="tile__description">{model.description}</div>}
		</div>
	);
}
