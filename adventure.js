(function(){
const D=window.HADANKY_ADVENTURES||{packs:{},tasks:[]};
const screen=document.querySelector('#screen'),score=document.querySelector('#score');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const randomize=a=>{const x=[...a];for(let i=x.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x};
let active=null,choices=[],current=0,completed=[],usedProfiles=[],packKey=null,showHint=false,showAdvanced=false;
function profiles(){const x=get('hs-profiles-v1',[]);return Array.isArray(x)?x.filter(p=>p&&p.id&&p.name):[]}
function activeProfiles(){const ps=profiles(),ids=get('hs-selected-v1',[]);return ps.filter(p=>Array.isArray(ids)&&ids.includes(p.id))}
function packs(){
 score.textContent='Dobrodružství pro celou rodinu';
 const ps=activeProfiles(),who=ps.length?ps.map(p=>p.name).join(' a '):'všechny děti';
 let html='<div class="welcome"><h2>🧭 Rodinné výpravy</h2><p class="subtle">Úkoly do lesa, na výlet i do pokojíčku. Telefon drží rodič, děti objevují svět.</p><p class="subtle">Vybraní průzkumníci: <strong>'+esc(who)+'</strong>. Profily upravíš na hlavní stránce.</p><div class="adventure-grid">';
 for(const [id,p] of Object.entries(D.packs)){
 const n=D.tasks.filter(t=>t.pack===id).length;
 html+='<button class="adventure-card" onclick="advChoose(\''+id+'\')"><span class="adv-icon">'+p.icon+'</span><strong>'+esc(p.title)+'</strong><small>'+esc(p.where)+' · '+n+' úkolů</small></button>';
 }
 html+='</div><button class="action secondary" onclick="hsHome()">← Zpět k hádankám</button></div>';screen.innerHTML=html;
}
function choose(id){
 if(!D.packs[id])return packs();packKey=id;
 const p=D.packs[id];score.textContent=p.title;
 const statistics=get('hs-adventure-progress-v1',{});const done=statistics[id]?.completed||0;
 screen.innerHTML='<div class="welcome"><div class="hero">'+p.icon+'</div><h2>'+esc(p.title)+'</h2><p>'+esc(p.intro)+'</p><p class="subtle">📍 '+esc(p.where)+'</p><p class="subtle">Výprava je určená k bezpečnému pozorování. Děti zůstávají s dospělým, nic neochutnávají a neodcházejí z vyznačené trasy.</p><div class="fieldlabel">Délka výpravy</div><div class="mode-row">'+[5,8,12].map(n=>'<button class="choice '+(n===8?'active':'')+'" id="advlen'+n+'" onclick="advSetLength('+n+')">'+n+' úkolů</button>').join('')+'</div><p class="subtle">Dokončené výpravy tohoto typu: '+done+'</p><button class="action launch" onclick="advStart()">Začít dobrodružství →</button><button class="action secondary" onclick="advHome()">← Zpět na výběr</button></div>';
 active={len:8};
}
function setLength(n){active.len=n;[5,8,12].forEach(i=>{const el=document.getElementById('advlen'+i);if(el)el.classList.toggle('active',n===i)})}
function start(){
 const all=D.tasks.filter(t=>t.pack===packKey),take=Math.min(active?.len||8,all.length);
 const seenKey='hs-adventure-seen-v1-'+packKey,already=get(seenKey,[]);
 let fresh=randomize(all.filter(t=>!already.includes(t.id)));
 let pick=fresh.slice(0,take),stored=Array.isArray(already)?already:[];
 if(pick.length<take){pick=pick.concat(randomize(all.filter(t=>!pick.some(q=>q.id===t.id))).slice(0,take-pick.length));stored=[]}
 save(seenKey,[...new Set([...stored,...pick.map(t=>t.id)])]);
 choices=pick;current=0;completed=[];usedProfiles=activeProfiles();render();
}
function render(){
 const p=D.packs[packKey],t=choices[current];
 showHint=false;showAdvanced=false;
 score.textContent=p.icon+' '+p.title;
 let html='<div class="eyebrow">Úkol '+(current+1)+' z '+choices.length+'</div><div class="track"><div class="fill" style="width:'+Math.round(100*current/choices.length)+'%"></div></div>';
 html+='<div class="adv-task"><span class="adv-step-icon">'+p.icon+'</span><h2>'+esc(t.title)+'</h2><p>'+esc(t.instruction)+'</p></div>';
 html+='<div class="adv-help" id="adv-help"></div><div class="actions">'+
 '<button class="action secondary" onclick="advHint()">💡 Tip</button><button class="action secondary" onclick="advChallenge()">⭐ Těžší úkol</button></div>';
 html+='<div class="actions"><button class="action secondary" onclick="advExit()">Ukončit</button><button class="action secondary" onclick="advSkip()">Přeskočit</button><button class="action" onclick="advComplete()">Splněno ✓</button></div>';
 html+='<p class="subtle">Úkoly lze přeskočit. Nejde o soutěž a není třeba vše splnit dokonale.</p>';screen.innerHTML=html;
}
function hint(){showHint=!showHint;displayHelp()}
function challenge(){showAdvanced=!showAdvanced;displayHelp()}
function displayHelp(){
 const task=choices[current];let text='';
 if(showHint)text+='<p><b>Tip pro rodiče:</b> '+esc(task.hint)+'</p>';
 if(showAdvanced)text+='<p><b>Pro starší děti:</b> '+esc(task.challenge)+'</p>';
 document.getElementById('adv-help').innerHTML=text;
}
function complete(){completed.push(choices[current].id);advance()}
function skip(){advance()}
function advance(){if(current===choices.length-1)finish();else{current++;render()}}
function finish(){
 const p=D.packs[packKey],all=get('hs-adventure-progress-v1',{}),s=all[packKey]||{completed:0,missions:0};
 s.completed++;s.missions+=completed.length;s.last=new Date().toISOString();all[packKey]=s;save('hs-adventure-progress-v1',all);
 const st=get('hs-adventure-child-v1',{});
 for(const child of usedProfiles){const c=st[child.id]||{trips:0,tasks:0};c.trips++;c.tasks+=completed.length;st[child.id]=c}save('hs-adventure-child-v1',st);
 score.textContent='Mise dokončena';
 screen.innerHTML='<div class="end"><div class="hero">'+p.icon+'✨</div><h2>Výprava dokončena!</h2><p>'+esc(p.outro)+'</p><p class="subtle">Společně jste dokončili '+completed.length+' z '+choices.length+' úkolů. Důležité je dobrodružství, ne počet splněných úkolů.</p><button class="action" onclick="advChoose(\''+packKey+'\')">Nová výprava</button><button class="action secondary" onclick="advHome()">Všechna dobrodružství</button><button class="action secondary" onclick="advProgress()">Přehled výprav</button></div>';
}
function exit(){
 if(!confirm('Opravdu ukončit výpravu? Nedokončené úkoly se nezapočítají.'))return;
 packs();
}
function progress(){
 score.textContent='Naše dobrodružství';
 const stats=get('hs-adventure-child-v1',{}),global=get('hs-adventure-progress-v1',{});
 let h='<div class="welcome"><h2>🧭 Společné výpravy</h2><p class="subtle">Bez soutěžení: jen přehled, co jste spolu prožili.</p>';
 for(const p of profiles()){const s=stats[p.id]||{trips:0,tasks:0};h+='<div class="progress-card"><strong>'+esc(p.name)+'</strong><div class="progress-grid"><div><b>'+s.trips+'</b><small>výprav</small></div><div><b>'+s.tasks+'</b><small>splněných úkolů</small></div></div></div>'}
 h+='<div class="fieldlabel">Dokončené dobrodružné série</div>';
 for(const [id,p] of Object.entries(D.packs))h+='<div class="own-line">'+p.icon+' '+esc(p.title)+'<span></span><strong>'+(global[id]?.completed||0)+'×</strong></div>';
 h+='<button class="action secondary" onclick="advHome()">← Zpět</button></div>';screen.innerHTML=h;
}
window.advHome=packs;window.advChoose=choose;window.advSetLength=setLength;window.advStart=start;window.advHint=hint;window.advChallenge=challenge;window.advComplete=complete;window.advSkip=skip;window.advExit=exit;window.advProgress=progress;
})();