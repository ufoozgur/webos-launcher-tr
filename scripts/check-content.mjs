import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {turkishArtDate} from './localize-paintings.mjs';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../screensaver');
const facts=JSON.parse(fs.readFileSync(path.join(base,'facts.tr.json'),'utf8'));
const art=JSON.parse(fs.readFileSync(path.join(base,'paintings.json'),'utf8'));
assert.equal(facts.length,100);assert.equal(new Set(facts.map(x=>x.text)).size,100);
assert(facts.every(x=>x.text&&x.sourceName&&/^https:\/\//.test(x.sourceUrl)));
assert(art.length>=50);assert.equal(new Set(art.map(x=>x.id)).size,art.length);
assert(art.every(x=>x.title&&x.artist&&x.year&&x.medium&&x.isPublicDomain&&x.license==='CC0'));
assert(art.every(x=>x.titleTr && x.dateTr && !/\b(before|after|ca\.|early|late|probably|possibly)\b/i.test(x.dateTr)));
for(const [source,expected] of [['before 1500','1500 yılından önce'],['shortly after 1450','1450 yılından kısa süre sonra'],['ca. 1624–25','yaklaşık 1624–1625'],['late 1480s','1480’lerin sonları'],['probably 1630s','büyük olasılıkla 1630’lar'],['possibly ca. 1320','muhtemelen yaklaşık 1320']])assert.equal(turkishArtDate(source),expected);
for(const r of art){
 const target=path.join(base,r.image);
 if(fs.existsSync(target))assert.equal(createHash('sha256').update(fs.readFileSync(target)).digest('hex'),r.sha256);
 else if(process.argv.includes('--require-images'))throw Error('Missing '+r.image);
}
const lib={};vm.runInNewContext(fs.readFileSync(path.join(base,'Quotes.js'),'utf8').replace(/^\.pragma library\s*/,''),lib);
for(const [count,sig] of [[100,'facts'],[art.length,'art']]){
 let state={},last=-1;
 for(let round=0;round<10;round++){
  const seen=new Set();for(let i=0;i<count;i++){
   state=lib.nextSelection(state,count,Math.random,sig);
   assert.notEqual(state.index,last);assert(!seen.has(state.index));seen.add(state.index);last=state.index;
   // Round-trip persisted JSON, as happens when the TV restarts.
   state=JSON.parse(JSON.stringify(state));
  }
  assert.equal(seen.size,count);
 }
}
const content={};vm.runInNewContext(fs.readFileSync(path.join(base,'Content.js'),'utf8').replace(/^\.pragma library\s*/,''),content);
assert.equal(JSON.stringify(content.facts),JSON.stringify(facts));assert.equal(JSON.stringify(content.paintings),JSON.stringify(art));
console.log('100 kaynaklı bilgi, '+art.length+' CC0 tablo ve her modda 10 tam tekrar etmeyen deste doğrulandı.');
