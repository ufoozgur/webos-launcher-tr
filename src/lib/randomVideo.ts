/** Live discovery via an Invidious instance listed by docs.invidious.io/instances. */
const SEARCH_HOST = 'https://yt.chocolatemoo53.com';
const HISTORY_KEY = 'launcher-random-video-history-v1';
const TOPICS = [
 'weird science', 'street music', 'forgotten inventions', 'deep sea', 'tiny desk music',
 'funny animals', 'restoration', 'stop motion', 'ancient history', 'world travel',
 'optical illusion', 'short film', 'space documentary', 'street food', 'retro gaming',
 'jazz live', 'nature documentary', 'how it works', 'unexpected talent', 'animation short',
 'interesting facts', 'robotics', 'miniature art', 'underwater life', 'train journey',
 'movie behind the scenes', 'classic comedy', 'musical instruments', 'woodworking', 'oddly satisfying',
 'Türkiye belgesel', 'ilginç deneyler', 'sokak müziği', 'unutulmuş meslekler', 'doğa belgeseli',
 'eski reklamlar', 'uzay belgeseli', 'film kamera arkası', 'komik hayvanlar', 'nasıl yapılır',
 'live concert', 'mountain adventure', 'amazing architecture', 'electronic music', 'wildlife',
 'old computers', 'mathematics visual', 'historical footage', 'ocean exploration', 'timelapse'
];
interface SearchVideo {type?: string; videoId?: string; title?: string; liveNow?: boolean;}
export interface RandomVideo {id: string; title: string;}
const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

export async function randomVideo(): Promise<RandomVideo> {
 let history: string[] = [];
 try { const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); if (Array.isArray(saved)) history = saved.filter(x => typeof x === 'string').slice(-150); } catch { /* empty history */ }
 for (let attempt = 0; attempt < 2; attempt++) {
  const query = pick(TOPICS);
  const sort = pick(['relevance', 'upload_date', 'view_count']);
  const page = 1 + Math.floor(Math.random() * 4);
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 6500);
  try {
   const response = await fetch(SEARCH_HOST + '/api/v1/search?type=video&q=' + encodeURIComponent(query) + '&sort_by=' + sort + '&page=' + page, {signal: controller.signal, cache: 'no-store'});
   if (!response.ok) throw new Error('Video araması yanıt vermedi');
   const data: unknown = await response.json();
   if (!Array.isArray(data)) throw new Error('Video sonuçları okunamadı');
   const candidates = (data as SearchVideo[]).filter(v => v && v.type === 'video' && typeof v.videoId === 'string' && /^[A-Za-z0-9_-]{11}$/.test(v.videoId) && !v.liveNow && history.indexOf(v.videoId) < 0);
   if (!candidates.length) continue;
   const video = pick(candidates);
   const id = video.videoId!;
   try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.concat(id).slice(-150))); } catch { /* playback works without history */ }
   return {id, title: typeof video.title === 'string' ? video.title.slice(0, 180) : 'Rastgele video'};
  } catch (error) {
   if (attempt === 1) throw error;
  } finally { window.clearTimeout(timer); }
 }
 throw new Error('Yeni video bulunamadı; tekrar dene');
}
