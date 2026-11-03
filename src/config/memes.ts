/** Local, small GIFs: no network requests or tracking at runtime. */
const APP_MEMES: Record<string, string> = {
 'com.ottplayer.app': 'ott',
 'io.strem.tv': 'stremio',
 'youtube.leanback.v4': 'youtube',
 netflix: 'netflix',
 amazon: 'prime',
 'com.disney.disneyplus-prod': 'disney',
 'com.apple.appletv': 'appletv',
 'com.wbd.stream': 'hbo',
 'cdp-30': 'plex',
 'spotify-beehive': 'spotify',
 'com.webos.app.livetv': 'livetv'
};

export function appMeme(id: string): string | undefined {
 const name = APP_MEMES[id];
 return name ? 'memes/' + name + '.gif' : undefined;
}

export function inputMeme(label: string, icon: string, appId: string): string {
 if (appId === 'com.webos.app.livetv') return 'memes/livetv.gif';
 if (/denon|avr|receiver|ses sistemi/i.test(label) || /hometheater|sound/.test(icon)) return 'memes/denon.gif';
 if (/ps5|playstation|xbox|oyun|console/i.test(label + ' ' + icon)) return 'memes/gaming.gif';
 return 'memes/hdmi.gif';
}
