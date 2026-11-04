/** Unfiltered draw from Random Video's live index, not keyword search results.
 * This external index is not a complete or provably uniform census of YouTube.
 * No YouTube cookies, account tokens, language, topic or popularity filter is sent.
 */
const RANDOM_HOST = 'https://random-video.com/';
const HISTORY_KEY = 'launcher-random-video-history-v1';
const ALL_VIEW_BUCKETS = '0,10,100,1k,10k,100k,1m,10m,100m,1b';
export interface RandomVideo {id: string; title: string;}

export async function randomVideo(): Promise<RandomVideo> {
 let history: string[] = [];
 try { const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); if (Array.isArray(saved)) history = saved.filter(x => typeof x === 'string').slice(-150); } catch { /* empty history */ }
 for (let attempt=0; attempt<3; attempt++) {
  const controller=new AbortController();
  const timer=window.setTimeout(()=>controller.abort(),6500);
  try {
   const body='action=r&v='+encodeURIComponent(ALL_VIEW_BUCKETS)+'&l=all&y=all&last='+encodeURIComponent(history[history.length-1]||'');
   const response=await fetch(RANDOM_HOST,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,signal:controller.signal,cache:'no-store',credentials:'omit'});
   if(!response.ok)throw new Error('Rastgele video servisi yanıt vermedi');
   const result: unknown=await response.json();
   if(!result || typeof result!=='object')throw new Error('Video yanıtı okunamadı');
   const data=result as {status?:string;data?:unknown};
   if(data.status!=='success'||typeof data.data!=='string'||!/^[A-Za-z0-9_-]{11}$/.test(data.data))throw new Error('Geçerli video bulunamadı');
   if(history.includes(data.data))continue;
   const playable=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+data.data),{signal:controller.signal,cache:'no-store',credentials:'omit'});
   if(!playable.ok)throw new Error('Video artık kullanılamıyor');
   const metadata: unknown=await playable.json();
   const title=metadata && typeof metadata==='object' && typeof (metadata as {title?:unknown}).title==='string' ? (metadata as {title:string}).title.slice(0,180) : 'Rastgele video';
   try { localStorage.setItem(HISTORY_KEY,JSON.stringify(history.concat(data.data).slice(-150))); } catch { /* playback works without history */ }
   return {id:data.data,title};
  } catch(error) { if(attempt===2)throw error; }
  finally { window.clearTimeout(timer); }
 }
 throw new Error('Yeni video bulunamadı; tekrar dene');
}
