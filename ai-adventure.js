(function(){
const S=document.querySelector('#screen'),H=document.querySelector('#score');
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const label=s=>'<div class="fieldlabel">'+s+'</div>';
const button=(text,call,cls='')=>'<button class="action '+cls+'" onclick="'+call+'">'+text+'</button>';
const styles={story:'🧙 Skřítci a příběh',nature:'🌿 Přírodní pátrání',treasure:'🗺️ Hledání pokladu',explore:'🔎 Objevitelská výprava'};
let state={place:'',context:'',style:'story',count:10,children:[],isGenerating:false},display=null,taskIndex=0,revealed=false,savedFrom=null;
const profiles=()=>{const x=get('hs-profiles-v1',[]);return Array.isArray(x)?x.filter(p=>p&&p.id&&p.name):[]};
const saved=()=>{const x=get('hs-ai-plans-v1',[]);return Array.isArray(x)?x.slice(0,30):[]};
function endpoint(){
 const config=window.HADANKY_AI_CONFIG||{};
 return (config.endpoint||get('hs-ai-endpoint','')).trim().replace(/\/$/,'');
}
function saveInputs(){
 const place=document.getElementById('aiPlace'),context=document.getElementById('aiContext');
 if(place)state.place=place.value.trim();
 if(context)state.context=context.value.trim();
 state.children=Array.from(document.querySelectorAll('input[name="aiChild"]:checked')).map(x=>x.value);
}
function builder(){
 H.textContent='✨ AI výpravy na míru';
 const people=profiles(),chosen=get('hs-selected-v1',people.slice(0,1).map(p=>p.id));
 if(!state.children.length)state.children=chosen.filter(id=>people.some(p=>p.id===id));
 let html='<div class="welcome"><h2>✨ AI dobrodružství</h2><p class="subtle">Napiš kam jdete. AI připraví příběh a úkoly podle cíle výletu a věku dětí. Telefon může mít celou dobu rodič.</p>';
 html+=label('Kam vyrážíte?')+'<input id="aiPlace" maxlength="140" placeholder="Např. Čertův kámen, Lodhéřov" value="'+esc(state.place)+'">';
 html+=label('Co o místě víš? (nepovinné)')+'<textarea id="aiContext" rows="2" maxlength="500" placeholder="Les, balvany, naučná stezka, co děti baví…">'+esc(state.context)+'</textarea>';
 html+=label('Děti')+(people.length?people.map(p=>'<label class="ai-person"><input type="checkbox" name="aiChild" value="'+esc(p.id)+'" '+(state.children.includes(p.id)?'checked':'')+'><span>'+esc(p.name)+' · '+p.age+' let · '+(p.level==='easy'?'lehké':'střední')+'</span></label>').join(''):'<p class="subtle">Nejdřív si na hlavní stránce přidej profil dítěte.</p>');
 html+=label('Styl příběhu')+'<div class="topic-grid">'+Object.entries(styles).map(([k,v])=>'<button class="choice '+(state.style===k?'active':'')+'" onclick="aiStyle(\''+k+'\')">'+v+'</button>').join('')+'</div>';
 html+=label('Počet úkolů')+'<div class="mode-row">'+[5,8,10,12,15].map(n=>'<button class="choice '+(state.count===n?'active':'')+'" onclick="aiCount('+n+')">'+n+'</button>').join('')+'</div>';
 if(!endpoint())html+='<p class="ai-notice">⚙ Gemini ještě není připojeno. Připravené výpravy můžeš prohlížet, ale nové AI generování bude možné po nasazení backendu.</p>';
 else html+='<p class="subtle">Při generování se cílové místo, nepovinný popis a věk vybraných dětí odešlou AI službě. Jména se nepředávají.</p>';
 html+='<p id="ai-error" class="form-error" aria-live="polite"></p>';
 html+='<button id="ai-generate" class="action launch" onclick="aiGenerate()" '+(!endpoint()||!people.length?'disabled':'')+'>✨ Vytvořit skutečnou AI výpravu</button>';
 html+='<div class="mode-row">'+button('📚 Uložené výpravy','aiLibrary()','secondary')+button('⚙ Gemini připojení','aiSettings()','secondary')+'</div>';
 html+=button('← Zpět','hsHome()','secondary')+'</div>';
 S.innerHTML=html;
}
function style(s){saveInputs();state.style=s;builder()}
function count(n){saveInputs();state.count=n;builder()}
function settings(){
 saveInputs();H.textContent='Gemini připojení';
 S.innerHTML='<div class="welcome"><h2>⚙ Google Gemini</h2><p class="subtle">Bezplatné Gemini generování vyžaduje jednorázové nasazení serveru. API klíč sem nikdy nevkládej – musí zůstat na bezpečném serveru.</p>'+label('Adresa Cloudflare Workeru')+'<input id="aiEndpoint" placeholder="https://hadankovy-ai....workers.dev" value="'+esc(endpoint())+'"><p class="subtle">Používá se HTTPS server s koncovým bodem /generate. Nastavení se uloží pouze na tomto zařízení.</p><p id="ai-error" class="form-error"></p>'+button('Uložit adresu','aiSaveEndpoint()')+button('← Zpět','aiHome()','secondary')+'</div>';
}
function saveEndpoint(){
 const text=document.getElementById('aiEndpoint').value.trim().replace(/\/$/,'');
 if(text&&!/^https:\/\/[a-z0-9.-]+(?::\d+)?(?:\/[a-z0-9/_-]*)?$/i.test(text)){document.getElementById('ai-error').textContent='Zadej platnou HTTPS adresu serveru.';return}
 put('hs-ai-endpoint',text);builder();
}
function error(text){const box=document.getElementById('ai-error');if(box)box.textContent=text}
async function generate(){
 saveInputs();if(state.isGenerating)return;
 const picked=profiles().filter(p=>state.children.includes(p.id));
 if(state.place.length<3)return error('Zadej prosím konkrétní cíl.');
 if(!picked.length)return error('Vyber alespoň jedno dítě.');
 const url=endpoint();if(!url)return error('Nejprve připoj AI server.');
 state.isGenerating=true;
 const b=document.getElementById('ai-generate');if(b){b.disabled=true;b.textContent='⏳ Vytvářím dobrodružství…'}
 try{
  const res=await fetch(url+'/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   place:state.place,context:state.context,style:state.style,count:state.count,children:picked.map(p=>({age:p.age,level:p.level}))
  })});
  const content=await res.json().catch(()=>({error:'Nerozpoznatelná odpověď serveru.'}));
  if(!res.ok)throw Error(content.error||'AI server je nedostupný.');
  if(!Array.isArray(content.tasks)||content.tasks.length!==state.count)throw Error('Výprava není kompletní.');
  display={id:'plan-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),place:state.place,style:state.style,children:picked.map(p=>p.id),createdAt:new Date().toISOString(),...content,source:'ai'};
  taskIndex=0;revealed=false;savedFrom=null;preview();
 }catch(e){error('Nepodařilo se vytvořit výpravu: '+e.message)}
 finally{state.isGenerating=false;const again=document.getElementById('ai-generate');if(again){again.disabled=false;again.textContent='✨ Vytvořit skutečnou AI výpravu'}}
}
function preview(){
 if(!display)return builder();
 H.textContent='✨ '+display.title;
 const tasks=display.tasks||[];
 S.innerHTML='<div class="welcome"><div class="hero">🧭</div><h2>'+esc(display.title)+'</h2><p>'+esc(display.intro)+'</p><p class="subtle">📍 '+esc(display.place)+' · '+tasks.length+' úkolů · '+esc(styles[display.style]||'Dobrodružství')+'</p>'
 +'<p class="ai-notice">ℹ AI vytvořila příběh a návrhy. Ověř si cestu, aktuální podmínky a to, co na místě skutečně je. Některé úkoly mohou být podmíněné okolím.</p>'
 +(display.caution?'<p class="subtle">Bezpečnost: '+esc(display.caution)+'</p>':'')
 +button('▶ Začít dobrodružství','aiPlay()')+button('💾 Uložit do telefonu','aiSave()','secondary')
 +button('📚 Uložené výpravy','aiLibrary()','secondary')+button('← Nová výprava','aiHome()','secondary')+'</div>';
}
function savePlan(){
 if(!display)return;const list=saved(),idx=list.findIndex(x=>x.id===display.id);
 if(idx<0)list.unshift(display);else list[idx]=display;
 put('hs-ai-plans-v1',list.slice(0,30));savedFrom=display.id;
 preview();
 const b=document.querySelector('.welcome .action.secondary');if(b)b.textContent='✓ Uloženo na tomto zařízení';
}
function library(){
 H.textContent='📚 Moje AI dobrodružství';
 const items=saved();
 S.innerHTML='<div class="welcome"><h2>Uložené výpravy</h2><p class="subtle">Uložené příběhy fungují bez připojení. Maximálně 30 výprav na tomto zařízení.</p>'
 +(items.length?items.map((x,i)=>'<div class="profile-card"><div><strong>'+esc(x.title)+'</strong><div class="subtle">'+esc(x.place)+' · '+(x.tasks?.length||0)+' úkolů</div></div><button class="mini" onclick="aiOpen('+i+')">Otevřít</button><button class="mini danger" onclick="aiDelete('+i+')">Smazat</button></div>').join(''):'<p>Zatím nemáš žádnou uloženou výpravu.</p>')
 +button('← Nové dobrodružství','aiHome()','secondary')+'</div>';
}
function openPlan(i){display=saved()[i]||null;taskIndex=0;revealed=false;preview()}
function removePlan(i){if(!confirm('Smazat uloženou výpravu?'))return;const x=saved();x.splice(i,1);put('hs-ai-plans-v1',x);library()}
function play(){taskIndex=0;revealed=false;renderTask()}
function renderTask(){
 if(!display)return builder();const t=display.tasks[taskIndex];
 H.textContent=display.title;
 S.innerHTML='<div class="eyebrow">Úkol '+(taskIndex+1)+' z '+display.tasks.length+'</div><div class="track"><div class="fill" style="width:'+(100*taskIndex/display.tasks.length)+'%"></div></div>'
 +'<div class="adv-task"><span class="adv-step-icon">✨</span><h2>'+esc(t.title)+'</h2><p>'+esc(t.instruction)+'</p></div>'
 +'<div id="ai-more" class="adv-help"></div>'
 +'<div class="actions">'+button('💡 Nápověda','aiHint()','secondary')+button('⭐ Pro starší','aiChallenge()','secondary')+'</div>'
 +'<div class="actions">'+button('Ukončit','aiPreview()','secondary')+button('Přeskočit','aiNext()','secondary')+button('Splněno ✓','aiNext()')+'</div>';
}
function hint(){document.getElementById('ai-more').innerHTML='<p><b>Nápověda:</b> '+esc(display.tasks[taskIndex].hint)+'</p>'}
function challenge(){document.getElementById('ai-more').innerHTML='<p><b>Pro starší děti:</b> '+esc(display.tasks[taskIndex].challenge)+'</p>'}
function next(){
 if(taskIndex+1===display.tasks.length){
 H.textContent='Dobrodružství dokončeno';S.innerHTML='<div class="end"><h2>Výprava dokončena! 🌟</h2><p>'+esc(display.ending)+'</p>'+button('💾 Uložit','aiSave()')+button('Zpět na výpravu','aiPreview()','secondary')+'</div>';
 }else{taskIndex++;renderTask()}
}
Object.assign(window,{aiHome:builder,aiStyle:style,aiCount:count,aiSettings:settings,aiSaveEndpoint:saveEndpoint,aiGenerate:generate,aiPreview:preview,aiPlay:play,aiHint:hint,aiChallenge:challenge,aiNext:next,aiSave:savePlan,aiLibrary:library,aiOpen:openPlan,aiDelete:removePlan});
})();