import {LUNA, SYSTEM_APP} from '../config/constants';
import {lunaCall} from './luna';
import type {SaverMode} from './storage';

/** Launch an app or switch to an input (HDMI inputs are apps too: com.webos.app.hdmiN). */
export function launchApp (id: string, params: object = {}): Promise<void> {
	return lunaCall(LUNA.launch, {id, params}).then(() => undefined);
}

/** Bring up LG's own home screen. */
export function launchLgHome (): Promise<void> {
	return launchApp(SYSTEM_APP.lgHome);
}

/** Root-installed clock/quote screensaver, launched through the normal app API. */
export function startScreensaver(mode?: SaverMode): Promise<void> {
	return launchApp('com.webos.app.screensaver', {configureOnly: false, ...(mode ? {mode} : {})});
}

/** Save the automatic saver preference without displaying the saver. */
export function configureScreensaver(mode: SaverMode): Promise<void> {
	return launchApp('com.webos.app.screensaver', {mode, configureOnly: true});
}

/** Whether an app with this ID exists on the TV (permitted from a web app, unlike listing). */
export function appExists (id: string): Promise<boolean> {
	return lunaCall<{exist?: boolean}>(LUNA.appLoadStatus, {appId: id})
		.then((r) => r.exist === true)
		.catch(() => false);
}
