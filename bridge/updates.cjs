'use strict';
const fs=require('node:fs'),path=require('node:path');
const releases='https://github.com/IPokemon54/spicetify-radio-italiane/releases';
const endpoint='https://api.github.com/repos/IPokemon54/spicetify-radio-italiane/releases/latest';
function versionParts(value){const match=/^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(value));return match?match.slice(1).map(Number):null}
function isNewer(latest,current){const a=versionParts(latest),b=versionParts(current);if(!a||!b)return false;for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]>b[i]}return false}
function installedVersion(){try{return JSON.parse(fs.readFileSync(path.join(__dirname,'../manifest.json'),'utf8')).version||null}catch{return null}}
function createUpdateChecker({version=installedVersion(),fetchLatest=(...args)=>fetch(...args),now=Date.now}={}){
 let saved=null,expires=0,pending=null;
 return async function checkUpdates(){
  if(saved&&now()<expires)return saved;
  if(pending)return pending;
  pending=(async()=>{
   try{
    if(!versionParts(version))throw Error('Versione installata non disponibile');
    const response=await fetchLatest(endpoint,{signal:AbortSignal.timeout(6000),headers:{Accept:'application/vnd.github+json','User-Agent':'Radio-on-Spotify-update-check'}});
    if(!response.ok)throw Error('GitHub HTTP '+response.status);
    const release=await response.json();if(release.draft||release.prerelease||!versionParts(release.tag_name))throw Error('Release non valida');
    const latest=release.tag_name.replace(/^v/,'');
    saved={installedVersion:version,latestVersion:latest,updateAvailable:isNewer(latest,version),releaseUrl:releases+'/tag/'+encodeURIComponent(release.tag_name),checkFailed:false};
    expires=now()+60*60*1000;
   }catch{
    saved={installedVersion:version,latestVersion:null,updateAvailable:false,releaseUrl:releases,checkFailed:true};expires=now()+5*60*1000;
   }
   return saved;
  })();
  try{return await pending}finally{pending=null}
 };
}
module.exports={createUpdateChecker,isNewer};
