const KEY = 'launcher-tr.recent.v1';
export function loadRecent(): string[] {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
		return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^[\w.-]{1,160}$/.test(id)))].slice(0, 6) : [];
	} catch { return []; }
}
export function rememberRecent(previous: string[], id: string): string[] {
	const next = [id, ...previous.filter(item => item !== id)].slice(0, 6);
	try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Storage may be full. */ }
	return next;
}
