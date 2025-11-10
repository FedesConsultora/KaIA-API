// src/dev/print-db-to-clipboard.js
// ----------------------------------------------------
// Junta TODO de models, migrations y seeders,
// lo formatea en Markdown y lo copia al portapapeles.
// Uso: node src/dev/print-db-to-clipboard.js
//
// Requiere: Node 18+
// Linux: necesita tener instalado xclip o xsel para copiar al clipboard.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(process.cwd(), 'src');
const FOLDERS = ['models', 'migrations', 'seeders'];
const EXCLUDES = ['node_modules','dist','build','.git','.cache','coverage','tmp','logs','.DS_Store'];
const TEXT_EXTS = new Set(['js','mjs','cjs','ts','json','sql','csv','yml','yaml']);

function looksExcluded(p){ const s=p.replace(/\\/g,'/'); return EXCLUDES.some(sub=>s.includes(sub)); }
function isTextFile(p){ const ext=path.extname(p).slice(1).toLowerCase(); return TEXT_EXTS.has(ext); }
async function pathExists(p){ try{await fs.access(p);return true;}catch{return false;} }
async function walk(dir){ const out=[]; let entries=[]; try{entries=await fs.readdir(dir,{withFileTypes:true});}catch{return out;} for(const e of entries){ const abs=path.join(dir,e.name); if(looksExcluded(abs))continue; if(e.isDirectory())out.push(...await walk(abs)); else if(e.isFile()&&isTextFile(abs))out.push(abs);} return out.sort(); }
function rel(p){ return path.relative(process.cwd(),p).replace(/\\/g,'/'); }
function lang(p){ const ext=path.extname(p).toLowerCase(); const map={'.js':'js','.mjs':'js','.cjs':'js','.ts':'ts','.json':'json','.sql':'sql','.csv':'csv','.yml':'yaml','.yaml':'yaml'}; return map[ext]||''; }

async function collectAll(){
  const dirs=[]; for(const f of FOLDERS){ const p=path.join(ROOT,f); if(await pathExists(p))dirs.push(p);}
  if(!dirs.length)throw new Error(`No encontré carpetas en ${rel(ROOT)}: [${FOLDERS.join(', ')}]`);
  let files=[]; for(const d of dirs)files.push(...await walk(d));
  files=Array.from(new Set(files)).sort();

  let totalLines=0; const chunks=[];
  chunks.push(`# Dump técnico de Base de Datos\n`);
  chunks.push(`> Generado desde \`${rel(ROOT)}\` — ${new Date().toLocaleString('es-AR')}\n`);
  for(const f of files){
    let raw=''; try{raw=await fs.readFile(f,'utf-8');}catch{continue;}
    const lines=raw.split('\n').length; totalLines+=lines;
    chunks.push(`\n---\n\n### ${rel(f)} (${lines} líneas)\n`);
    chunks.push('```'+lang(f)); chunks.push(raw); chunks.push('```');
  }
  const md=chunks.join('\n');
  return {md,filesCount:files.length,totalLines};
}

function spawnSyncExists(cmd){ try{const which=process.platform==='win32'?'where':'which';spawn(which,[cmd],{stdio:'ignore'});return true;}catch{return false;} }
function copyToClipboard(text){ return new Promise((res,rej)=>{ const plat=process.platform; let proc,ok=false; if(plat==='darwin'){proc=spawn('pbcopy');ok=true;}else if(plat==='win32'){proc=spawn('clip');ok=true;}else{ if(spawnSyncExists('xclip')){proc=spawn('xclip',['-selection','clipboard']);ok=true;}else if(spawnSyncExists('xsel')){proc=spawn('xsel',['--clipboard','--input']);ok=true;} } if(!ok)return rej(new Error('No hay utilidades de clipboard disponibles.')); proc.on('error',rej); proc.on('close',c=>c===0?res():rej(new Error(`Clipboard exit code ${c}`))); proc.stdin.write(text); proc.stdin.end(); }); }

async function main(){
  const {md,filesCount,totalLines}=await collectAll();
  const outDir=path.resolve(process.cwd(),'tmp');
  await fs.mkdir(outDir,{recursive:true});
  const outFile=path.join(outDir,'db_dump.md');
  await fs.writeFile(outFile,md,'utf-8');
  try{
    await copyToClipboard(md);
    console.log(`✅ Copiado al portapapeles. Archivos: ${filesCount} | Líneas: ${totalLines}`);
    console.log(`📄 Backup: ${rel(outFile)}`);
  }catch(err){
    console.warn('⚠️ No pude copiar al portapapeles:',err.message);
    console.log(`Guardado en: ${rel(outFile)}\n`);
    process.stdout.write(md);
  }
}

main().catch(err=>{console.error('Error:',err.message);process.exit(1);});
