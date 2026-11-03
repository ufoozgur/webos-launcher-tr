import type {CatalogApp} from './catalog';

export const EXTRA_APPS: CatalogApp[] = [
 {id:'netflix',title:'Netflix',icon:'netflix.png'},
 {id:'com.disney.disneyplus-prod',title:'Disney+',icon:'com.disney.disneyplus-prod.png'},
 {id:'com.wbd.stream',title:'HBO Max',icon:'com.wbd.stream.png'},
 {id:'spotify-beehive',title:'Spotify',icon:'spotify-beehive.png'},
 {id:'com.ottplayer.app',title:'OTT+ Player',icon:'com.ottplayer.app.png'},
 {id:'io.strem.tv',title:'Stremio',icon:'io.strem.tv.png'}
];

export const DEFAULT_APP_IDS = [
 'com.ottplayer.app','io.strem.tv','youtube.leanback.v4','netflix','amazon',
 'com.disney.disneyplus-prod','com.apple.appletv','com.wbd.stream','cdp-30','spotify-beehive'
];
