// One-time desktop preparation. Install sharp first: npm install --no-save sharp
// Runtime on TV is fully offline. Images are CC0 Open Access works from The Met.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../screensaver');
const records=JSON.parse(fs.readFileSync(path.join(base,'paintings.json'),'utf8'));
for(const r of records){
 if(!r.isPublicDomain||r.license!=='CC0'||!/^https:\/\/images\.metmuseum\.org\//.test(r.originalImage)||!/^paintings\/met-\d+\.jpg$/.test(r.image))throw Error('Invalid source record');
 const target=path.join(base,r.image);if(fs.existsSync(target))continue;
 const response=await fetch(r.originalImage,{signal:AbortSignal.timeout(60000)});
 if(!response.ok)throw Error(`${response.status}: ${r.title}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 const resized=await sharp(bytes).rotate().resize({width:1920,height:1080,fit:'inside',withoutEnlargement:true}).jpeg({quality:90,mozjpeg:true}).toBuffer();
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,resized);
 console.log(r.title);
}
