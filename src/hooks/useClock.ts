import {useEffect, useState} from 'preact/hooks';

/** Current time, re-rendered once a second (only changes when the minute changes
 *  matter to the UI, but a 1s tick keeps the displayed minute exact). */
export function useClock (): Date {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		let timer = 0;
		const tick = () => {
			window.clearTimeout(timer);
			if (document.hidden) return;
			setNow(new Date());
			timer = window.setTimeout(tick, 60000 - Date.now() % 60000 + 20);
		};
		tick();
		document.addEventListener('visibilitychange', tick);
		return () => { window.clearTimeout(timer); document.removeEventListener('visibilitychange', tick); };
	}, []);
	return now;
}
