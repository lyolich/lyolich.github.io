/*
MaxSM Quality Plugin — FIXED VERSION
Работает без API ключа Jacred
*/

(function () {
'use strict';

if (window.maxsmQualityPlugin) return;
window.maxsmQualityPlugin = true;

/* ---------------- НАСТРОЙКИ ---------------- */

const CACHE_TIME = 1000 * 60 * 60 * 24;
const CACHE_KEY = "maxsm_quality_cache_v4";

let JACRED_URL =
(window.QUALITY_PLUGIN_TOKENS?.JACRED_URL) ||
localStorage.getItem("maxsm_jacred_url") ||
"https://jacred.xyz";

let API_KEY =
(window.QUALITY_PLUGIN_TOKENS?.JACRED_API_KEY) ||
localStorage.getItem("maxsm_jacred_api_key") ||
"1";

/* ---------------- СТИЛИ ---------------- */

Lampa.Template.add("q_css", `
<style>
.card__quality{
position:absolute;
bottom:6px;
right:6px;
background:#000c;
color:#fff;
padding:2px 6px;
border-radius:4px;
font-size:.75em;
font-weight:700;
z-index:10
}
.q4k{background:#2ecc71!important}
.qfhd{background:#f1c40f!important;color:#000}
</style>`);

$("body").append(Lampa.Template.get("q_css", {}, true));

/* ---------------- CACHE ---------------- */

function getCache(id){
let c = Lampa.Storage.get(CACHE_KEY) || {};
let v = c[id];
if(!v) return null;
if(Date.now()-v.t > CACHE_TIME && v.q!=="4K") return null;
return v.q;
}

function setCache(id,q){
let c = Lampa.Storage.get(CACHE_KEY)||{};
c[id]={q:q,t:Date.now()};
Lampa.Storage.set(CACHE_KEY,c);
}

/* ---------------- API ---------------- */

function buildUrl(card){

let year = (card.release_date||"").slice(0,4);
if(!year) return null;

let title = encodeURIComponent(card.title||card.name||"");
let orig = encodeURIComponent(card.original_title||card.original_name||"");

let key = API_KEY || "1";

return `${JACRED_URL}/api/v2.0/indexers/all/results?apikey=${key}&title=${title}&title_original=${orig}&year=${year}`;
}

function fetchQuality(card,cb){

let url = buildUrl(card);
if(!url) return cb(null);

new Lampa.Reguest().silent(url,res=>{

try{

let data = typeof res==="string"?JSON.parse(res):res;
let list = data.Results || [];

let best=0;

for(let t of list){

let q = t?.info?.quality;
if(!q) continue;

if(q>best) best=q;
if(q>=2160) break;

}

if(best>=2160) return cb("4K");
if(best>=1080) return cb("FHD");

cb(null);

}catch(e){cb(null)}

});

}

/* ---------------- UI ---------------- */

function apply(card,q){

let view = card.querySelector(".card__view");
if(!view) return;

let old = view.querySelector(".card__quality");
if(old) old.remove();

if(!q) return;

let d=document.createElement("div");
d.className="card__quality "+(q==="4K"?"q4k":"qfhd");
d.textContent=q;

view.appendChild(d);
}

/* ---------------- MAIN ---------------- */

function process(card){

if(card.dataset.qdone) return;
card.dataset.qdone=1;

let data = card.card_data;
if(!data) return;

if((data.media_type||data.type)!=="movie") return;

let id=data.id;
let cache=getCache(id);

if(cache){
apply(card,cache);
return;
}

apply(card,"...");

fetchQuality(data,q=>{
setCache(id,q);
apply(card,q);
});

}

/* ---------------- OBSERVER ---------------- */

new MutationObserver(muts=>{
let arr=[];
muts.forEach(m=>{
m.addedNodes.forEach(n=>{
if(n.nodeType!==1) return;
if(n.classList?.contains("card")) arr.push(n);
n.querySelectorAll?.(".card").forEach(x=>arr.push(x));
});
});
arr.forEach(process);
}).observe(document.body,{childList:true,subtree:true});

/* ---------------- SETTINGS ---------------- */

Lampa.SettingsApi.addComponent({
component:"maxsmq",
name:"Quality",
icon:"<svg viewBox='0 0 24 24' width='24'><path fill='white' d='M12 17l-5 3 1-6-4-4 6-1 2-5 2 5 6 1-4 4 1 6z'/></svg>"
});

function input(title,key){
Lampa.Input.edit({free:true,title:title},v=>{
if(!v) return;
localStorage.setItem(key,v.trim());
location.reload();
});
}

Lampa.SettingsApi.addParam({
component:"maxsmq",
param:{name:"url",type:"button"},
field:{name:"Jacred URL"},
onChange:()=>input("Jacred URL","maxsm_jacred_url")
});

Lampa.SettingsApi.addParam({
component:"maxsmq",
param:{name:"key",type:"button"},
field:{name:"API key (optional)"},
onChange:()=>input("API key","maxsm_jacred_api_key")
});

Lampa.SettingsApi.addParam({
component:"maxsmq",
param:{name:"clear",type:"button"},
field:{name:"Clear cache"},
onChange:()=>{
localStorage.removeItem(CACHE_KEY);
location.reload();
}
});

console.log("MaxSM Quality Plugin loaded");

})();
