// Time-of-day text. Pure functions so they are trivially testable.

export type TimeFormat = '12h' | '24h';

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function greeting (date: Date): string {
	const h = date.getHours();
	if (h < 6) return 'İyi geceler';
	if (h < 12) return 'Günaydın';
	if (h < 18) return 'İyi günler';
	return 'İyi akşamlar';
}

export function dayName (date: Date): string {
	return DAYS[date.getDay()];
}

/** "23 September" */
export function dateText (date: Date): string {
	return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export interface TimeParts {
	/** "15:42" or "3:42" */
	time: string;
	/** "AM" / "PM" in 12-hour format, otherwise empty */
	period: string;
}

export function timeParts (date: Date, _format: TimeFormat): TimeParts {
	const h = date.getHours();
	const m = pad(date.getMinutes());
	return {time: `${pad(h)}:${m}`, period: ''};
}

function pad (n: number): string {
	return n < 10 ? `0${n}` : String(n);
}
