import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {Home, type HomeRow} from './screens/Home';
import {Settings, type SettingsTab} from './screens/Settings';
import type {OptionItem} from './components/OptionList';
import {Toast, type ToastMessage} from './components/Toast';
import type {TileModel} from './components/Tile';
import {listApps, type AppEntry} from './lib/apps';
import {listInputs, MOCK_INPUTS, type InputSource} from './lib/inputs';
import {launchApp, launchLgHome} from './lib/launch';
import {isWebOS} from './lib/luna';
import {hidePointerOnForeground} from './lib/pointer';
import {loadConfig, saveConfig, toggleId, type UserConfig} from './lib/storage';
import {appTile, inputTile, pickInOrder} from './lib/tiles';
import {TIMING} from './config/constants';

type Screen = 'home' | 'settings';

const ROW = {apps: 'apps', sources: 'sources', misc: 'misc'} as const;
const MISC = {lgHome: 'lg-home', settings: 'settings'} as const;
const OPTION = {useHomebrew: 'use-homebrew'} as const;

const MISC_TILES: TileModel[] = [
	{key: MISC.lgHome, label: 'Panic Button', description: 'LG ana ekranına dön', imageUrl: 'memes/panic-static.svg', animatedImageUrl: 'memes/panic-button.gif'},
	{key: MISC.settings, label: 'Ayarlar', glyph: 'gear', animatedImageUrl: 'memes/settings.gif'}
];

export function App () {
	const [screen, setScreen] = useState<Screen>('home');
	const [config, setConfig] = useState<UserConfig>(loadConfig);
	const [apps, setApps] = useState<AppEntry[]>([]);
	const [inputs, setInputs] = useState<InputSource[]>([]);
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const toastTimer = useRef(0);

	const showToast = useCallback((text: string, kind: ToastMessage['kind'] = 'info') => {
		window.clearTimeout(toastTimer.current);
		setToast({text, kind});
		toastTimer.current = window.setTimeout(() => setToast(null), TIMING.toastMs);
	}, []);

	// Start in remote (5-way) mode: hide the Magic Remote pointer whenever we come to the
	// front. Shaking the remote still brings it back.
	useEffect(() => hidePointerOnForeground(), []);

	// Load apps at start and whenever the Homebrew option changes; refresh inputs whenever
	// the app comes back to the foreground (labels or connections may have changed).
	useEffect(() => {
		listApps(config.useHomebrew)
			.then(({apps: list, source}) => {
				setApps(list);
				if (config.useHomebrew && source !== 'homebrew') showToast('Homebrew Channel kullanılamıyor; kayıtlı uygulama listesi gösteriliyor', 'error');
			})
			.catch(() => showToast('Uygulama listesi okunamadı', 'error'));
	}, [config.useHomebrew, showToast]);

	useEffect(() => {
		const refresh = () => {
			if (!isWebOS()) { setInputs(MOCK_INPUTS); return; }
			listInputs().then(setInputs).catch(() => showToast('Girişler okunamadı', 'error'));
		};
		refresh();
		const onVisibility = () => { if (!document.hidden) refresh(); };
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	}, [showToast]);

	const updateConfig = (next: UserConfig) => { setConfig(next); saveConfig(next); };

	// ----- derived rows -----
	const shownApps = useMemo(() => pickInOrder(apps, config.appIds, (a) => a.id), [apps, config.appIds]);
	const shownInputs = useMemo(
		() => (config.sourceIds ? pickInOrder(inputs, config.sourceIds, (s) => s.appId) : inputs),
		[inputs, config.sourceIds]
	);

	const rows: HomeRow[] = useMemo(() => [
		{id: ROW.apps, label: 'Uygulamalar', items: shownApps.map(appTile), emptyText: 'Henüz uygulama seçilmedi. Ayarlar’dan ekleyebilirsin.'},
		{id: ROW.sources, label: 'Girişler', items: shownInputs.map(inputTile), emptyText: 'Henüz giriş seçilmedi'},
		{id: ROW.misc, label: 'Diğer', items: MISC_TILES}
	], [shownApps, shownInputs]);

	const tabs: SettingsTab[] = useMemo(() => [
		{id: ROW.apps, label: 'Uygulamalar', noun: 'Uygulamaları', items: apps.map(appTile), shown: shownApps.map(appTile)},
		{id: ROW.sources, label: 'Girişler', noun: 'Girişleri', items: inputs.map(inputTile), shown: shownInputs.map(inputTile)}
	], [apps, inputs, shownApps, shownInputs]);

	const options: OptionItem[] = useMemo(() => [
		{
			id: OPTION.useHomebrew,
			label: 'Kurulu uygulamaları otomatik listele',
			description: 'TV’de kurulu uygulamaları ve simgelerini Homebrew Channel üzerinden alır. Kapalıyken kayıtlı liste kullanılır.',
			value: config.useHomebrew
		}
	], [config.useHomebrew]);

	// ----- actions -----
	const open = (id: string, label: string) => {
		launchApp(id).catch(() => showToast(`${label} açılamadı`, 'error'));
	};

	const onActivate = useCallback((rowId: string, item: TileModel) => {
		if (rowId === ROW.misc) {
			if (item.key === MISC.settings) setScreen('settings');
			else if (item.key === MISC.lgHome) launchLgHome().catch(() => showToast('LG ana ekranı açılamadı', 'error'));
			return;
		}
		open(item.key, item.label);
	}, [showToast]);

	const onToggle = useCallback((tabId: string, key: string) => {
		if (tabId === ROW.apps) {
			updateConfig({...config, appIds: toggleId(config.appIds, key)});
		} else {
			const current = config.sourceIds || inputs.map((s) => s.appId);
			updateConfig({...config, sourceIds: toggleId(current, key)});
		}
	}, [config, inputs]);

	const onOption = useCallback((optionId: string) => {
		if (optionId === OPTION.useHomebrew) updateConfig({...config, useHomebrew: !config.useHomebrew});
	}, [config]);

	/** Replace a row's order with `keys` (the full list of what's shown). */
	const onReorder = useCallback((tabId: string, keys: string[]) => {
		if (tabId === ROW.apps) updateConfig({...config, appIds: keys});
		else updateConfig({...config, sourceIds: keys});
	}, [config]);

	return (
		<>
			{/* Home stays mounted under Settings so it keeps its focus position. */}
			<Home rows={rows} active={screen === 'home'} onActivate={onActivate} />
			{screen === 'settings' && <Settings tabs={tabs} options={options} active onToggle={onToggle} onReorder={onReorder} onOption={onOption} onClose={() => setScreen('home')} />}
			<Toast message={toast} />
		</>
	);
}
