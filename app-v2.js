(function(){
const S=document.querySelector('#screen'),H=document.querySelector('#score'),lib=window.HADANKY_LIBRARY||[];
const cats={all:'Všechna témata',zvirata:'Zvířátka',pohadky:'Pohádky',pocitani:'Počítání',priroda:'Příroda',logika:'Logika',kazdodenni:'Každodenní život'};
const icons={all:'✨',zvirata:'🐾',pohadky:'📖',pocitani:'🔢',priroda:'🌿',logika:'🧠',kazdodenni:'🏡'};
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const mix=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
let profiles=get('hs-profiles-v1',null);
if(!Array.isArray(profiles)){profiles=[{id:'laura',name:'Laurinka',age:3,level:'easy'},{id:'melinka',name:'Melinka',age:5,level:'medium'}];save('hs-profiles-v1',profiles)}
profiles=profiles.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string'&&['easy','medium'].includes(p.level));
let selected=get('hs-selected-v1',profiles.length?[profiles[0].id]:[]).filter?.(x=>profiles.some(p=>p.id===x))||[];
let mode=get('hs-mode-v1','read')==='picture'?'picture':'read',theme='all',limit=10,round=[],index=0,attempts=0,done=false;
const find=id=>profiles.find(p=>p.id===id),level=l=>l==='easy'?'Lehké':'Střední';
const label=(s)=>'<div class="fieldlabel">'+s+'</div>';
const btn=(text,fn,cls='')=>'<button class="action '+cls+'" onclick="'+fn+'">'+text+'</button>';
function home(){
 H.textContent='Klidné večery bez nutnosti obrazovky pro děti';
 let h='<div class="welcome"><h2>Večerní hádanky 🌙</h2><p class="subtle">Jednoduché společné hraní pro celou rodinu.</p>'+label('Režim');
 h+='<div class="mode-row">'+[['read','📖 Jen čtení'],['picture','🧩 S obrázky']].map(([v,t])=>'<button class="choice '+(mode===v?'active':'')+'" onclick="hsMode(\''+v+'\')">'+t+'</button>').join('')+'</div>';
 h+=label('Kdo bude hádat?');
 if(!profiles.length)h+='<p class="subtle">Nejprve vytvořte profil dítěte.</p>';
 profiles.forEach(p=>h+='<button class="profile-choice '+(selected.includes(p.id)?'active':'')+'" onclick="hsSelect(\''+esc(p.id)+'\')"><span>'+(selected.includes(p.id)?'✓':'○')+'</span><strong>'+esc(p.name)+'</strong><small>'+p.age+' let · '+level(p.level)+'</small></button>');
 h+='<button class="text-link" onclick="hsProfiles()">⚙ Spravovat profily</button>'+label('Téma');
 h+='<div class="topic-grid">'+Object.entries(cats).map(([key,name])=>'<button class="choice topic '+(theme===key?'active':'')+'" onclick="hsTopic(\''+key+'\')">'+icons[key]+' '+name+'</button>').join('')+'</div>';
 h+=label('Délka kola')+'<div class="mode-row">'+[5,10,15].map(n=>'<button class="choice '+(limit===n?'active':'')+'" onclick="hsLimit('+n+')">'+n+' hádanek</button>').join('')+'</div>';
 h+='<button class="action ai-launch" onclick="aiHome()">✨ AI výprava na konkrétní místo →</button><button class="action launch" '+(selected.length?'':'disabled')+' onclick="hsStart()">🧩 Začít hádanky →</button><button class="action adventure-launch" onclick="advHome()">🧭 Připravená rodinná dobrodružství →</button><div class="mode-row">'+btn('📊 Pokrok','hsProgress()','secondary')+btn('✏️ Vlastní','hsCustom()','secondary')+'</div>';
 h+='<p class="subtle">'+lib.length+' tematických otázek a 8 připravených výprav. Děti nemusí držet telefon.</p></div>';S.innerHTML=h;
}
function hsMode(v){mode=v;save('hs-mode-v1',v);home()}
function hsSelect(id){selected=selected.includes(id)?selected.filter(x=>x!==id):[...selected,id];save('hs-selected-v1',selected);home()}
function hsTopic(t){theme=t;home()}
function hsLimit(n){limit=n;home()}
function hsProfiles(){
 H.textContent='Profily dětí';
 S.innerHTML='<div class="welcome"><h2>Profily dětí</h2><p class="subtle">Jméno, věk a obtížnost lze kdykoliv upravit.</p>'+profiles.map(p=>'<div class="profile-card"><div><strong>'+esc(p.name)+'</strong><p class="subtle">'+p.age+' let · '+level(p.level)+'</p></div><button class="mini" onclick="hsEdit(\''+esc(p.id)+'\')">Upravit</button><button class="mini danger" onclick="hsDelete(\''+esc(p.id)+'\')">Smazat</button></div>').join('')+btn('+ Přidat dítě','hsEdit()')+btn('← Zpět','hsHome()','secondary')+'</div>';
}
function hsEdit(id){
 const p=id?find(id):null;if(id&&!p)return hsProfiles();H.textContent='Úprava profilu';
 S.innerHTML='<div class="welcome"><h2>'+(p?'Upravit profil':'Nové dítě')+'</h2>'+label('Jméno')+'<input id="pname" maxlength="30" value="'+esc(p?p.name:'')+'" placeholder="Jméno nebo přezdívka">'+label('Věk')+'<select id="page">'+Array.from({length:10},(_,i)=>i+2).map(n=>'<option value="'+n+'" '+(n===(p?p.age:4)?'selected':'')+'>'+n+' let</option>').join('')+'</select>'+label('Obtížnost')+'<select id="plevel"><option value="easy" '+(p?.level==='easy'?'selected':'')+'>Lehké · 3–4 roky</option><option value="medium" '+(p?.level==='medium'?'selected':'')+'>Střední · 5–7 let</option></select><p id="msg" class="form-error"></p>'+btn('Uložit','hsSave('+(p?"'"+esc(p.id)+"'":'null')+')')+btn('Zpět','hsProfiles()','secondary')+'</div>';
 document.querySelector('#page').onchange=()=>{if(!p)document.querySelector('#plevel').value=Number(document.querySelector('#page').value)<=4?'easy':'medium'};
}
function hsSave(id){
 const name=document.querySelector('#pname').value.trim(),age=Number(document.querySelector('#page').value),difficulty=document.querySelector('#plevel').value;
 if(name.length<2){document.querySelector('#msg').textContent='Zadejte jméno alespoň na dvě písmena.';return}
 if(id){Object.assign(find(id),{name,age,level:difficulty})}else{
 const p={id:'kid-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,age,level:difficulty};profiles.push(p);selected=[p.id];save('hs-selected-v1',selected)}
 save('hs-profiles-v1',profiles);hsProfiles();
}
function hsDelete(id){
 const p=find(id);if(!p||!confirm('Smazat profil '+p.name+' včetně historie?'))return;
 profiles=profiles.filter(p=>p.id!==id);selected=selected.filter(x=>x!==id);save('hs-profiles-v1',profiles);save('hs-selected-v1',selected);
 let stats=get('hs-progress-v1',{});delete stats[id];save('hs-progress-v1',stats);localStorage.removeItem('hs-seen-v1-'+id);hsProfiles();
}
const own=()=>get('hadankovy-svet-custom-v1',[]).filter(x=>x&&x.q&&x.a&&['laura','melinka'].includes(x.who));
function bank(p){
 const extra=own().map((x,i)=>({id:'own-'+i,q:x.q,a:x.a,level:x.who==='laura'?'easy':'medium',cat:'kazdodenni',emoji:'✏️'}));
 return [...lib,...extra].filter(q=>q.level===p.level&&(theme==='all'||theme===q.cat));
}
function hsDraw(p,n){
 const items=bank(p),key='hs-seen-v1-'+p.id,seen=get(key,[]),used=Array.isArray(seen)?seen:[],unused=mix(items.filter(q=>!used.includes(q.id)));
 let chosen=unused.slice(0,n),history=used;
 if(chosen.length<n){
  chosen=chosen.concat(mix(items.filter(q=>!chosen.some(x=>x.id===q.id))).slice(0,n-chosen.length));
  const inTheme=new Set(items.map(x=>x.id));history=used.filter(id=>!inTheme.has(id));
 }
 save(key,[...new Set([...history,...chosen.map(q=>q.id)])]);
 return chosen.map(q=>({...q,who:p.id,options:hsOptions(q)}));
}
const answerEmoji={
'pes':'🐶','kočka':'🐱','slon':'🐘','slepice':'🐔','žirafa':'🦒','zebra':'🦓','zajíc':'🐇','žába':'🐸','šnek':'🐌','ježek':'🦔','kráva':'🐮','kůň':'🐴','ryba':'🐟','včela':'🐝','sova':'🦉','štěně':'🐕','hříbě':'🐴','kotě':'🐈','jehně':'🐑','bobr':'🦫','papoušek':'🦜','želva':'🐢','motýl':'🦋','pavouk':'🕷️','kohout':'🐓','jelen':'🦌','tele':'🐄','kachna':'🦆','lev':'🦁','ovce':'🐑','králík':'🐰','cvrček':'🦗','vlaštovka':'🐦','káče':'🦆','karkulka':'👧','červená karkulka':'👧','popelce':'👸','popelka':'👸','ježibaba':'🧙','princezna':'👸','víla':'🧚','korunku':'👑','korunu':'👑','na koštěti':'🧹','poklad':'💰','princ':'🤴','sněhurka':'👸','locika':'👩','mořská panna':'🧜‍♀️','čarodějnice':'🧙‍♀️','jablko':'🍎','perník':'🍪','sklenice':'🥛','slunce':'☀️','sníh':'❄️','duha':'🌈','voda':'💧','listy':'🍃','listí':'🍂','vítr':'💨','květiny':'🌸','vzduch':'🌬️','rostlina':'🌱','jaro':'🌷','léto':'☀️','podzim':'🍁','les':'🌳','led':'🧊','déšť':'🌧️','moře':'🌊','řeka':'🏞️','mrak':'☁️','rosa':'💦','dub':'🌳','smrk':'🌲','měsíc':'🌙','písek':'🏖️','hračky':'🧸','mýdlo':'🧼','klíč':'🔑','klíčem':'🔑','kartáček':'🪥','deštník':'☂️','knihu':'📖','knížku':'📖','lžící':'🥄','vidličkou':'🍴','boty':'👟','rukavice':'🧤','čepici':'🧢','pyžamo':'🥼','hřebenem':'🪮','baterka':'🔦','světlo':'💡','hasič':'🚒','veterinář':'🩺','pošťák':'📮','pekař':'🥖','polštář':'🛏️','budík':'⏰','hodiny':'🕒','bezpečnostní pás':'🚗','dveře':'🚪','nízký':'📏','suchý':'🌵','pět':'5️⃣','šest':'6️⃣','sedm':'7️⃣','osm':'8️⃣','devět':'9️⃣','deset':'🔟','čtyři':'4️⃣','tři':'3️⃣','dvě':'2️⃣','jeden':'1️⃣','jedna':'1️⃣'};
function emojiFor(text,cat){
 const k=String(text).toLowerCase().trim();
 return answerEmoji[k]||(/^\d+$/.test(k)?'🔢':null)||({zvirata:'🐾',pohadky:'🏰',pocitani:'🔢',priroda:'🌿',logika:'💡',kazdodenni:'🏠'})[cat]||'❔';
}
function hsOptions(q){
 let candidates=mix(lib.filter(x=>x.cat===q.cat&&x.level===q.level&&x.a.toLowerCase()!==q.a.toLowerCase()));
 let alternatives=[];for(const x of candidates){if(!alternatives.some(s=>s.toLowerCase()===x.a.toLowerCase()))alternatives.push(x.a);if(alternatives.length===3)break}
 return mix([{text:q.a,correct:true,emoji:emojiFor(q.a,q.cat)},...alternatives.map(text=>({text,correct:false,emoji:emojiFor(text,q.cat)}))]);
}
function hsStart(){
 const ps=selected.map(find).filter(Boolean);if(!ps.length)return home();
 const lists=ps.map((p,i)=>hsDraw(p,Math.floor(limit/ps.length)+(i<limit%ps.length?1:0)));
 round=[];for(let i=0;i<limit;i++){const x=lists[i%ps.length].shift();if(x)round.push(x)}
 if(!round.length){alert('Pro toto téma nejsou dostupné hádanky.');return}
 index=0;render();
}
function render(){
 const q=round[index],p=find(q.who);done=false;attempts=0;
 H.textContent=(mode==='read'?'📖 Předčítání':'🧩 Obrázková hra')+' · '+esc(p?.name||'Dítě');
 let h='<div class="eyebrow">'+esc(p?.name||'Dítě')+' · '+(index+1)+' / '+round.length+' · '+icons[q.cat]+' '+cats[q.cat]+'</div><div class="track"><div class="fill" style="width:'+(100*index/round.length)+'%"></div></div>';
 if(mode==='read'){
 h+='<div class="q reading-question">'+esc(q.q)+'</div><div id="answer" class="read-answer" aria-live="polite"></div><div class="actions">'+btn('⌂ Domů','hsHome()','secondary')+btn('Nápověda','hsHint()','secondary')+'<button id="reveal" class="action" onclick="hsReveal()">Odpověď</button></div><button class="action next-wide" id="next" disabled onclick="hsNext()">'+(index===round.length-1?'Dokončit':'Další →')+'</button>';
 }else{
 h+='<div class="hero">'+esc(q.emoji||'❓')+'</div><div class="q">'+esc(q.q)+'</div><div class="options">'+q.options.map((o,i)=>'<button class="option" id="opt'+i+'" onclick="hsChoose('+i+')"><span class="emoji">❔</span>'+esc(o.text)+'</button>').join('')+'</div><div id="note" class="note">Vyber odpověď</div><div class="actions">'+btn('⌂ Domů','hsHome()','secondary')+btn('Nápověda','hsHint()','secondary')+'<button class="action" id="next" disabled onclick="hsNext()">'+(index===round.length-1?'Dokončit':'Další →')+'</button></div>';
 }
 S.innerHTML=h;
}
function hsHint(){if(done)return;const node=document.querySelector(mode==='read'?'#answer':'#note');node.textContent='Nápověda: odpověď začíná na „'+round[index].a[0]+'“.'}
function hsReveal(){if(done)return;done=true;document.querySelector('#answer').innerHTML='<b>Správná odpověď</b>'+esc(round[index].a);document.querySelector('#reveal').disabled=true;document.querySelector('#next').disabled=false}
function hsChoose(i){
 if(done)return;const q=round[index],o=q.options[i],button=document.querySelector('#opt'+i),note=document.querySelector('#note');
 if(o.correct){done=true;button.classList.add('correct');document.querySelectorAll('.option').forEach(b=>b.disabled=true);note.textContent='Správně, pokračujeme!';document.querySelector('#next').disabled=false}
 else{attempts++;button.classList.add('wrong');button.disabled=true;note.textContent='Zkus další odpověď.'}
}
function hsRecord(){
 let stats=get('hs-progress-v1',{});const date=new Date().toISOString();
 for(const id of [...new Set(round.map(q=>q.who))]){
 const p=find(id),count=round.filter(q=>q.who===id).length;if(!p||!count)continue;
 const x=stats[id]||{rounds:0,questions:0,byLevel:{easy:0,medium:0},recent:[]};
 x.rounds++;x.questions+=count;x.byLevel[p.level]=(x.byLevel[p.level]||0)+count;
 x.recent=[{date,topic:theme,count,level:p.level},...x.recent].slice(0,30);stats[id]=x;
 }save('hs-progress-v1',stats);
}
function hsNext(){
 if(!done)return;if(index+1===round.length){
 hsRecord();H.textContent='Večerní kolo dokončeno';S.innerHTML='<div class="end"><h2>Hotovo! 🌙</h2><p>Společně jste zvládli '+round.length+' hádanek.</p><p>Teď už krásné sny!</p>'+btn('Další večer','hsHome()')+btn('Přehled pokroku','hsProgress()','secondary')+'</div>';
 }else{index++;render()}
}
function hsProgress(){
 H.textContent='Společné večery';const stats=get('hs-progress-v1',{});
 let h='<div class="welcome"><h2>Pokrok dětí</h2><p class="subtle">Žádné porovnávání. Jen společné chvíle a obtížnost.</p>';
 for(const p of profiles){
 const s=stats[p.id]||{rounds:0,questions:0,byLevel:{}};
 h+='<div class="progress-card"><strong>'+esc(p.name)+'</strong> · '+level(p.level)+'<div class="progress-grid"><div><b>'+s.rounds+'</b><small>odehraných kol</small></div><div><b>'+s.questions+'</b><small>hádanek</small></div></div><p class="subtle">Lehké: '+(s.byLevel?.easy||0)+' · Střední: '+(s.byLevel?.medium||0)+'</p></div>';
 }h+=btn('← Zpět','hsHome()','secondary')+'</div>';S.innerHTML=h;
}
function hsCustom(){
 H.textContent='Vlastní hádanky';const arr=own();
 S.innerHTML='<div class="welcome"><h2>Vlastní hádanky</h2><p class="subtle">Uloží se jen v tomto prohlížeči.</p>'+label('Obtížnost')+'<select id="ownLevel"><option value="laura">Lehké</option><option value="melinka">Střední</option></select>'+label('Otázka')+'<textarea id="ownQ" rows="2" maxlength="200"></textarea>'+label('Odpověď')+'<input id="ownA" maxlength="90"><p id="msg" class="form-error"></p>'+btn('Přidat','hsAdd()')+'<p class="subtle">'+arr.length+' vlastních hádanek</p><div class="own-list">'+arr.map((x,i)=>'<div class="own-line"><span>'+esc(x.q)+'</span><button class="action secondary" onclick="hsRemove('+i+')">Smazat</button></div>').join('')+'</div>'+btn('Zpět','hsHome()','secondary')+'</div>';
}
function hsAdd(){const q=document.querySelector('#ownQ').value.trim(),a=document.querySelector('#ownA').value.trim(),who=document.querySelector('#ownLevel').value;if(!q||!a){document.querySelector('#msg').textContent='Vyplňte otázku i odpověď.';return}const x=own();if(x.length>=80)return;x.push({q,a,who});save('hadankovy-svet-custom-v1',x);hsCustom()}
function hsRemove(i){const x=own();x.splice(i,1);save('hadankovy-svet-custom-v1',x);profiles.forEach(p=>save('hs-seen-v1-'+p.id,get('hs-seen-v1-'+p.id,[]).filter(id=>!String(id).startsWith('own-'))));hsCustom()}
Object.assign(window,{hsHome:home,hsMode,hsSelect,hsTopic,hsLimit,hsProfiles,hsEdit,hsSave,hsDelete,hsStart,hsHint,hsReveal,hsChoose,hsNext,hsProgress,hsCustom,hsAdd,hsRemove});
home();
})();