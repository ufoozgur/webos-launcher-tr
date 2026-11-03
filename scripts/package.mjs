import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(!fs.existsSync(path.join(root,'dist/appinfo.json')))throw Error('Önce npm run build çalıştırın.');
fs.mkdirSync(path.join(root,'dist/licenses'),{recursive:true});
fs.copyFileSync(path.join(root,'LICENSE'),path.join(root,'dist/licenses/LICENSE.txt'));
fs.mkdirSync(path.join(root,'build'),{recursive:true});
const localConfig=path.join(root,'.webos-cli');fs.mkdirSync(localConfig,{recursive:true});
const cli=path.join(root,'node_modules/@webos-tools/cli/bin/ares-package.js');
const result=spawnSync(process.execPath,[cli,'dist','--no-minify','-o','build'],{cwd:root,stdio:'inherit',env:{...process.env,APPDATA:localConfig,...(process.platform==='win32'?{USERPROFILE:localConfig}:{})}});
process.exitCode=result.status||0;
