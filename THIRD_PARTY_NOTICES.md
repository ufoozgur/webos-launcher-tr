# Third-party notices

The MIT licence in [LICENSE](LICENSE) covers this project's own code and its app icon
(`public/icon.png`, `public/largeIcon.png`). The following material belongs to others and
is **not** covered by that licence.

## Bundled software

| Component | Licence | Where |
|---|---|---|
| [Preact](https://preactjs.com) | MIT, © Jason Miller | compiled into `assets/app.js`; licence text in [public/licenses/preact-MIT.txt](public/licenses/preact-MIT.txt) |
| [Inter](https://rsms.me/inter/) typeface | SIL Open Font License 1.1, © The Inter Project Authors | `src/assets/inter-latin-wght.woff2`; licence text in [public/licenses/Inter-OFL.txt](public/licenses/Inter-OFL.txt) |

Both licence texts are included in the installed app under `licenses/`.

## App and input icons

`public/icons/apps/` contains the icons of third-party TV apps, and `public/icons/inputs/`
contains input-type icons from LG's webOS software. They are trademarks or copyright of
their respective owners. This project is not affiliated with, endorsed by or sponsored by
any of them.

They are included in good faith, only so the launcher can show recognisable tiles for apps
and inputs already installed on the user's own TV. Rights holders who would like an icon
removed can open an issue on this repository and it will be removed. Every app tile falls
back to a plain text tile without its icon, so removal doesn't break anything.

"LG" and "webOS" are trademarks of LG Electronics.

## Turkish edition assets

New app artwork is sourced from publishers' Apple iTunes lookup records (Netflix, YouTube, Prime Video, Disney+, HBO Max, Plex and Spotify), the [Stremio website](https://www.stremio.com/) and [OTT+ website](https://ottplus.net/). Artwork identifies the corresponding installed application; no endorsement is implied.

The Panic Button animation is from [Tenor, Panic Button GIF](https://tenor.com/view/panic-button-gif-23870344), served from `https://media1.tenor.com/m/PoU5IHO6B7sAAAAC/panic-button.gif`. Rights remain with its respective owner. The static red button SVG is project code. Remove the GIF to use the static button alone.

`screensaver/quotes.en.json` contains short English movie quotations and character/performer credits. Film dialogue belongs to its respective rights holders and is not licensed under this project's MIT license. Voice performers are credited for animated and synthetic characters. These are excerpts, not scripts or subtitles.

## Contextual meme GIFs (1.3.0)

The additional GIFs are sourced from Tenor. Per-file source pages, direct media URLs, descriptions and SHA-256 checksums are recorded in [public/memes/sources.json](public/memes/sources.json). They remain the property of their respective rights holders, are not MIT-licensed, and do not imply endorsement. The project bundles small GIF variants and renders only the focused tile's animation.
