import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/lib/clock.ts'),'utf8');
const withoutTypes=source
 .replace(/export type TimeFormat[^;]+;/,'')
 .replace(/export interface TimeParts\s*\{[\s\S]*?\n\}/,'')
 .replace(/export function /g,'function ')
 .replace(/: Date/g,'').replace(/: TimeFormat/g,'').replace(/: TimeParts/g,'').replace(/: string/g,'').replace(/: number/g,'');
const clock={};vm.runInNewContext(withoutTypes,clock);
for(const [date,expected] of [[new Date(2026,10,4,0,5),'00:05'],[new Date(2026,10,4,13,7),'13:07'],[new Date(2026,11,31,23,59),'23:59']]){
 assert.equal(clock.timeParts(date,'24h').time,expected);
 assert.equal(clock.timeParts(date,'12h').time,expected);
}
assert.equal(clock.dayName(new Date(2026,10,4)),'Çarşamba');
assert.equal(clock.dateText(new Date(2026,10,4)),'4 Kasım 2026');
const quotes=JSON.parse(fs.readFileSync(path.join(root,'screensaver/quotes.en.json'),'utf8'));
assert.equal(quotes.length,100);
assert.equal(new Set(quotes.map(q=>q.film)).size,100);
assert(quotes.every(q=>q.text && q.character && q.actor && Number.isInteger(q.year)));
console.log('Türkçe saat/tarih ve 100 farklı film kaydı doğrulandı.');
