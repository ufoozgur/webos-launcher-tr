import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {Home, type HomeRow} from './screens/Home';
import {Settings, type SettingsTab} from './screens/Settings';
import type {OptionItem} from './components/OptionList';
import {Toast, type ToastMessage} from './components/Toast';
import type {TileModel} from './components/Tile';
import {listApps, type AppEntry} from './lib/apps';
import {listInputs, MOCK_INPUTS, type InputSource} from './lib/inputs';
import {launchApp, launchLgHome, startScreensaver, configureScreensaver} from './lib/launch';
import {randomVideo} from './lib/randomVideo';
import {loadRecent, rememberRecent} from './lib/recent';
import {isWebOS} from './lib/luna';
import {hidePointerOnForeground} from './lib/pointer';
import {loadConfig, saveConfig, toggleId, type UserConfig, type SaverMode} from './lib/storage';
import {appTile, inputTile, pickInOrder} from './lib/tiles';
import {TIMING} from './config/constants';

type Screen = 'home' | 'settings';

const ROW = {apps: 'apps', sources: 'sources', misc: 'misc', recent: 'recent'} as const;
const MISC = {lgHome: 'lg-home', settings: 'settings', saver: 'screensaver', random: 'random-video', sleep: 'sleep'} as const;
const OPTION = {useHomebrew: 'use-homebrew'} as const;

const MISC_TILES: TileModel[] = [
	{key: MISC.lgHome, label: 'Panic Button', description: 'LG ana ekranına dön', imageUrl: 'memes/panic-static.svg', animatedImageUrl: 'memes/panic-button.gif'},
	{key: MISC.saver, label: 'Ben Yokum', description: 'Ekran koruyucuyu başlat', imageUrl: 'memes/screensaver.png', animatedImageUrl: 'memes/screensaver.gif'},
	{key: MISC.random, label: 'Tavşan Deliği', description: '4,5 milyarlık arşivden konu filtresiz kura', imageUrl: 'memes/rabbit-hole.png', animatedImageUrl: 'memes/rabbit-hole.gif'},
	{key: MISC.sleep, label: 'Uykuya Geç', description: 'TV’nin kapanma süresini seç', imageUrl: 'memes/sleep.svg'},
	{key: MISC.settings, label: 'Ayarlar', glyph: 'gear', animatedImageUrl: 'memes/settings.gif'}
];

export function App () {
	const [screen, setScreen] = useState<Screen>('home');
	const [config, setConfig] = useState<UserConfig>(loadConfig);
	const [apps, setApps] = useState<AppEntry[]>([]);
	const [inputs, setInputs] = useState<InputSource[]>([]);
	const [toast, setToast] = useState<ToastMessage | null>(null);
	const toastTimer = useRef(0);
	const findingVideo = useRef(false);
	const [recent, setRecent] = useState<string[]>(loadRecent);

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
		...(recent.length ? [{id: ROW.recent, label: 'Son Kullanılanlar', compact: true, items: recent.map(id => [...apps.map(appTile), ...inputs.map(inputTile)].find(tile => tile.key === id)).filter((tile): tile is TileModel => Boolean(tile)), emptyText: 'Kayıtlı uygulamalar artık kurulu değil'}] : []),
		{id: ROW.apps, label: 'Uygulamalar', items: shownApps.map(appTile), emptyText: 'Henüz uygulama seçilmedi. Ayarlar’dan ekleyebilirsin.'},
		{id: ROW.sources, label: 'Girişler', items: shownInputs.map(inputTile), emptyText: 'Henüz giriş seçilmedi'},
		{id: ROW.misc, label: 'Diğer', items: MISC_TILES}
	], [shownApps, shownInputs, recent, apps, inputs]);

	const tabs: SettingsTab[] = useMemo(() => [
		{id: ROW.apps, label: 'Uygulamalar', noun: 'Uygulamaları', items: apps.map(appTile), shown: shownApps.map(appTile)},
		{id: ROW.sources, label: 'Girişler', noun: 'Girişleri', items: inputs.map(inputTile), shown: shownInputs.map(inputTile)}
	], [apps, inputs, shownApps, shownInputs]);

	const options: OptionItem[] = useMemo(() => [
		{id: 'saver-quotes', label: 'Ekran koruyucu: Film replikleri', description: '100 film • İngilizce replikler, filme uygun yazı tipleri ve saat', value: config.saverMode === 'quotes', kind: 'choice'},
		{id: 'saver-facts', label: 'Ekran koruyucu: İlginç bilgiler', description: '100 kaynaklı Türkçe bilgi • Okuma uzunluğuna göre süre ve saat', value: config.saverMode === 'facts', kind: 'choice'},
		{id: 'saver-art', label: 'Ekran koruyucu: Ünlü tablolar', description: '60 eser • Sanatçı, yıl ve teknik • Yumuşak geçişler', value: config.saverMode === 'art', kind: 'choice'},
		{
			id: OPTION.useHomebrew,
			label: 'Kurulu uygulamaları otomatik listele',
			description: 'TV’de kurulu uygulamaları ve simgelerini Homebrew Channel üzerinden alır. Kapalıyken kayıtlı liste kullanılır.',
			value: config.useHomebrew
		}
	], [config.useHomebrew, config.saverMode]);

	// ----- actions -----
	const open = (id: string, label: string) => {
		launchApp(id).then(() => setRecent(previous => rememberRecent(previous, id))).catch(() => showToast(`${label} açılamadı`, 'error'));
	};
	const openRandomVideo = useCallback(() => {
		if (findingVideo.current) return;
		findingVideo.current = true;
		showToast('Tavşan deliği kazılıyor…');
		randomVideo().then(video => launchApp('youtube.leanback.v4', {contentTarget: 'v=' + video.id}))
			.then(() => setRecent(previous => rememberRecent(previous, 'youtube.leanback.v4')))
			.catch(() => showToast('Video bulunamadı veya YouTube açılamadı; tekrar dene', 'error'))
			.finally(() => { findingVideo.current = false; });
	}, [showToast]);
	useEffect(() => {
		const handle = (event?: Event) => {
			let params: {action?: string} = (event as CustomEvent)?.detail || {};
			if (!params.action) {
				try { params = JSON.parse((window as unknown as {webOSSystem?: {launchParams: string}; PalmSystem?: {launchParams: string}}).webOSSystem?.launchParams || (window as unknown as {PalmSystem?: {launchParams: string}}).PalmSystem?.launchParams || '{}'); } catch { return; }
			}
			if (params.action === 'random-video') openRandomVideo();
		};
		handle();
		document.addEventListener('webOSRelaunch', handle);
		return () => document.removeEventListener('webOSRelaunch', handle);
	}, [openRandomVideo]);

	const onActivate = useCallback((rowId: string, item: TileModel) => {
		if (rowId === ROW.misc) {
			if (item.key === MISC.settings) setScreen('settings');
			else if (item.key === MISC.lgHome) launchLgHome().catch(() => showToast('LG ana ekranı açılamadı', 'error'));
			else if (item.key === MISC.saver) startScreensaver(config.saverMode).catch(() => showToast('Ekran koruyucu açılamadı', 'error'));
			else if (item.key === MISC.random) openRandomVideo();
			else if (item.key === MISC.sleep) launchApp('com.palm.app.settings', {target: 'Timer', item: 'sleepTimer'}).catch(() => showToast('Uyku zamanlayıcısı açılamadı', 'error'));
			return;
		}
		open(item.key, item.label);
	}, [showToast, config.saverMode, openRandomVideo]);

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
		else if (optionId.startsWith('saver-')) {
			const mode = optionId.slice(6) as SaverMode;
			if (!['quotes', 'facts', 'art'].includes(mode)) return;
			configureScreensaver(mode).then(() => { updateConfig({...config, saverMode: mode}); showToast('Ekran koruyucu seçimi kaydedildi'); })
				.catch(() => showToast('Ekran koruyucu seçimi kaydedilemedi', 'error'));
		}
	}, [config, showToast]);

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
