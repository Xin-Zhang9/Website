const ROUND_SIZE=20,LETTERS=["A","B","C","D"],SUBJECTS={geography:"Geography",history:"History",biology:"Biology",chemistry:"Chemistry"},ICONS={geography:"◉",history:"⌛",biology:"⌬",chemistry:"⚗"};
const BADGES=[{id:"first",icon:"✦",name:"First Step",desc:"Complete your first level.",test:s=>s.rounds>=1},{id:"streak5",icon:"🔥",name:"On Fire",desc:"Reach a 5-answer correct streak.",test:s=>s.bestStreak>=5},{id:"streak10",icon:"🔥",name:"Unstoppable",desc:"Reach a 10-answer correct streak.",test:s=>s.bestStreak>=10},{id:"perfect",icon:"20",name:"Perfect Round",desc:"Score 20 / 20 in any round.",test:s=>s.perfect>=1},{id:"explorer",icon:"◎",name:"Explorer",desc:"Complete a round in all four subjects.",test:s=>s.subjects>=4},{id:"mixed",icon:"∞",name:"Generalist",desc:"Complete the Mixed Challenge.",test:s=>s.mixed>=1},{id:"scholar",icon:"✧",name:"Scholar",desc:"Complete 10 rounds.",test:s=>s.rounds>=10},{id:"comeback",icon:"↻",name:"Comeback",desc:"Correct 10 previously missed questions.",test:s=>s.corrected>=10}];
const V={map:$("mapView"),quiz:$("quizView"),result:$("resultView"),wrong:$("wrongView"),history:$("historyView"),badges:$("badgesView")};let mode="subject",subject=null,level=1,qs=[],idx=0,score=0,streak=0,answered=false,newBadges=[];
function $(x){return document.getElementById(x)}function load(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}function save(k,v){localStorage.setItem(k,JSON.stringify(v))}function S(){return load("kq_state",{best:{},unlocked:{},history:[],wrong:{},seen:{},badges:[],bestStreak:0,currentStreak:0,corrected:0})}function put(s){save("kq_state",s)}function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}function key(s,l){return s+"-"+l}function show(n){Object.values(V).forEach(v=>v.classList.remove("active"));V[n].classList.add("active");scrollTo({top:0,behavior:"smooth"})}
function renderMap(){let st=S();$("homeStreak").textContent=st.currentStreak||0;$("bestStreak").textContent=st.bestStreak||0;let host=$("subjectMaps");host.innerHTML="";Object.keys(SUBJECTS).forEach(s=>{let sec=document.createElement("section");sec.className="subject-map";let best=Math.max(st.best[key(s,1)]||0,st.best[key(s,2)]||0,st.best[key(s,3)]||0);sec.innerHTML=`<div class="subject-title-row"><h2>${ICONS[s]} ${SUBJECTS[s]}</h2><span class="subject-best">Best ${best} / 20</span></div><div class="level-path"></div>`;let p=sec.querySelector(".level-path");[1,2,3].forEach((l,i)=>{let unlocked=l===1||(st.unlocked[s]||1)>=l,b=st.best[key(s,l)]||0,bt=document.createElement("button");bt.className="level-node";bt.disabled=!unlocked;bt.innerHTML=`${!unlocked?'<span class="lock">🔒</span>':''}<span class="level-num">LEVEL 0${l}</span><strong>${l===1?"Foundations":l===2?"Connections":"Challenge"}</strong><span class="level-score">${b?`Best ${b} / 20`:"Not completed"}</span>`;bt.onclick=()=>startSubject(s,l);p.appendChild(bt);if(i<2){let c=document.createElement("div");c.className="connector";p.appendChild(c)}});host.appendChild(sec)})}
function pick(s,l){let st=S(),bank=window.QUESTION_BANK[s],k=key(s,l),seen=st.seen[k]||[],preferred=shuffle(bank.filter(q=>q.level===l&&!seen.includes(q.id))),other=shuffle(bank.filter(q=>q.level!==l&&!seen.includes(q.id))),pool=[...preferred,...other];if(pool.length<ROUND_SIZE){seen=[];pool=[...shuffle(bank.filter(q=>q.level===l)),...shuffle(bank.filter(q=>q.level!==l))]}let out=pool.slice(0,ROUND_SIZE);st.seen[k]=[...seen,...out.map(q=>q.id)];put(st);return out}
function startSubject(s,l){mode="subject";subject=s;level=l;qs=pick(s,l);begin()}function startMixed(){mode="mixed";subject="mixed";level=1;let pool=[];Object.keys(SUBJECTS).forEach(s=>pool.push(...window.QUESTION_BANK[s].map(q=>({...q,source:s}))));qs=shuffle(pool).slice(0,20);begin()}function begin(){idx=score=streak=0;answered=false;show("quiz");renderQ()}
function renderQ(){answered=false;let q=qs[idx],src=mode==="mixed"?q.source:subject;$("quizLabel").textContent=mode==="mixed"?"Mixed Challenge":`${SUBJECTS[subject]} · Level ${level}`;$("quizProgress").textContent=`${idx+1} / 20`;$("quizScore").textContent=`Score ${score}`;$("quizStreak").textContent=`Streak ${streak}`;$("progressFill").style.width=((idx+1)/20*100)+"%";$("questionEyebrow").textContent=`${SUBJECTS[src]} · Question ${String(idx+1).padStart(2,"0")}`;$("questionText").textContent=q.q;$("learningCard").classList.add("hidden");$("nextQuestion").classList.add("hidden");let a=$("answers");a.innerHTML="";q.a.forEach((t,i)=>{let b=document.createElement("button");b.className="answer";b.innerHTML=`<span class="letter">${LETTERS[i]}</span><span>${t}</span>`;b.onclick=()=>answer(i);a.appendChild(b)})}
const KNOWLEDGE_CACHE_KEY="kq_knowledge_cache_v1";
let learningRequestToken=0;

function knowledgeQuery(q,src){
  const answer=q.a[q.c];
  // The correct answer is intentionally placed first because Wikipedia search
  // weights early terms strongly. The subject disambiguates short answers.
  return `${answer} ${SUBJECTS[src]||src}`.trim();
}

function cleanExtract(text,max=620){
  if(!text)return "";
  const clean=String(text).replace(/\s+/g," ").trim();
  if(clean.length<=max)return clean;
  const cut=clean.slice(0,max);
  const sentence=Math.max(cut.lastIndexOf(". "),cut.lastIndexOf("? "),cut.lastIndexOf("! "));
  return (sentence>220?cut.slice(0,sentence+1):cut.replace(/\s+\S*$/,"")+"…");
}

async function searchWikipedia(q,src){
  const query=knowledgeQuery(q,src);
  const url=new URL("https://en.wikipedia.org/w/api.php");
  url.search=new URLSearchParams({
    action:"query",format:"json",origin:"*",generator:"search",
    gsrsearch:query,gsrlimit:"4",gsrnamespace:"0",
    prop:"extracts|pageimages|info",exintro:"1",explaintext:"1",exsentences:"4",
    piprop:"thumbnail|name",pithumbsize:"1000",inprop:"url"
  }).toString();
  const r=await fetch(url.toString(),{headers:{Accept:"application/json"}});
  if(!r.ok)throw new Error("Wikipedia search failed");
  const data=await r.json();
  const pages=Object.values(data.query?.pages||{}).sort((a,b)=>(a.index||999)-(b.index||999));
  const best=pages.find(p=>p.extract)||pages[0];
  if(!best)return null;
  return {
    title:best.title||q.a[q.c],
    extract:cleanExtract(best.extract),
    pageUrl:best.fullurl||`https://en.wikipedia.org/wiki/${encodeURIComponent((best.title||"").replace(/ /g,"_"))}`,
    imageUrl:best.thumbnail?.source||"",
    imageCredit:best.thumbnail?.source?"Image: Wikipedia / Wikimedia Commons":""
  };
}

async function searchCommonsImage(q,src){
  const query=knowledgeQuery(q,src);
  const url=new URL("https://commons.wikimedia.org/w/api.php");
  url.search=new URLSearchParams({
    action:"query",format:"json",origin:"*",generator:"search",
    gsrsearch:query,gsrnamespace:"6",gsrlimit:"8",
    prop:"imageinfo",iiprop:"url|extmetadata",iiurlwidth:"1000"
  }).toString();
  const r=await fetch(url.toString(),{headers:{Accept:"application/json"}});
  if(!r.ok)throw new Error("Wikimedia search failed");
  const data=await r.json();
  const pages=Object.values(data.query?.pages||{}).sort((a,b)=>(a.index||999)-(b.index||999));
  const valid=pages.find(p=>{
    const ii=p.imageinfo?.[0];
    const u=ii?.thumburl||ii?.url||"";
    return u && !/\.svg(?:\?|$)/i.test(u);
  }) || pages.find(p=>p.imageinfo?.[0]);
  if(!valid)return null;
  const ii=valid.imageinfo[0],meta=ii.extmetadata||{};
  const artist=(meta.Artist?.value||"").replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim();
  const license=(meta.LicenseShortName?.value||"").replace(/<[^>]*>/g,"").trim();
  return {
    imageUrl:ii.thumburl||ii.url||"",
    imagePage:ii.descriptionurl||"",
    imageCredit:[artist,license].filter(Boolean).join(" · ")||"Wikimedia Commons"
  };
}

async function getConnectedKnowledge(q,src){
  const cache=load(KNOWLEDGE_CACHE_KEY,{});
  const cacheKey=`${q.id}:${src}`;
  if(cache[cacheKey])return cache[cacheKey];

  const [wiki,commons]=await Promise.allSettled([
    searchWikipedia(q,src),searchCommonsImage(q,src)
  ]);
  const w=wiki.status==="fulfilled"?wiki.value:null;
  const c=commons.status==="fulfilled"?commons.value:null;
  if(!w&&!c)throw new Error("No connected knowledge found");

  const result={
    title:w?.title||q.a[q.c],
    extract:w?.extract||"",
    pageUrl:w?.pageUrl||c?.imagePage||"",
    imageUrl:c?.imageUrl||w?.imageUrl||"",
    imagePage:c?.imagePage||w?.pageUrl||"",
    imageCredit:c?.imageCredit||w?.imageCredit||"Wikimedia"
  };
  cache[cacheKey]=result;
  const keys=Object.keys(cache);
  if(keys.length>120)delete cache[keys[0]];
  save(KNOWLEDGE_CACHE_KEY,cache);
  return result;
}

function setKnowledgeVisual(q,src,data){
  const v=$("knowledgeVisual");
  if(data?.imageUrl){
    v.innerHTML="";
    const img=document.createElement("img");
    img.src=data.imageUrl;
    img.alt=`Related image: ${data.title||q.a[q.c]}`;
    img.loading="lazy";
    img.referrerPolicy="no-referrer";
    img.addEventListener("error",()=>{
      v.innerHTML=`<div class="generated-visual"><div class="rings"></div><div class="symbol">${escapeHTML(q.topic||SUBJECTS[src])}</div></div>`;
    },{once:true});
    v.appendChild(img);
    if(data.imageCredit){
      const credit=document.createElement("div");
      credit.className="image-credit";
      credit.textContent=data.imageCredit;
      v.appendChild(credit);
    }
  }
}

async function loadConnectedKnowledge(q,src,token){
  const text=$("onlineKnowledgeText"),source=$("knowledgeSource");
  text.classList.add("loading");
  text.textContent="Searching Wikipedia and Wikimedia for a related explanation and image…";
  source.classList.add("hidden");
  try{
    const data=await getConnectedKnowledge(q,src);
    if(token!==learningRequestToken)return;
    text.classList.remove("loading");
    text.textContent=data.extract||"A related reference was found. Open the source to explore the topic in more detail.";
    if(data.pageUrl){source.href=data.pageUrl;source.textContent=`Read about ${data.title} on Wikipedia ↗`;source.classList.remove("hidden")}
    setKnowledgeVisual(q,src,data);
  }catch(err){
    if(token!==learningRequestToken)return;
    text.classList.remove("loading");
    text.textContent="Connected knowledge is temporarily unavailable. The local note above is still available.";
  }
}

function answer(ch){if(answered)return;answered=true;let q=qs[idx],ok=ch===q.c,src=mode==="mixed"?q.source:subject,st=S();if(ok){score++;streak++;st.currentStreak=streak;st.bestStreak=Math.max(st.bestStreak||0,streak);if(st.wrong[q.id]){delete st.wrong[q.id];st.corrected=(st.corrected||0)+1}}else{streak=0;st.currentStreak=0;st.wrong[q.id]={...q,source:src,wrongAt:new Date().toISOString(),chosen:ch}}put(st);$("quizScore").textContent=`Score ${score}`;$("quizStreak").textContent=`Streak ${streak}`;[...document.querySelectorAll(".answer")].forEach((b,i)=>{b.disabled=true;if(i===q.c)b.classList.add("correct");if(i===ch&&i!==q.c)b.classList.add("wrong")});learning(q,ok,src);$("nextQuestion").textContent=idx===19?"Finish →":"Next →";$("nextQuestion").classList.remove("hidden")}
function learning(q,ok,src){
  const token=++learningRequestToken;
  $("knowledgeTitle").textContent=`${LETTERS[q.c]}. ${q.a[q.c]}`;
  $("knowledgeText").textContent=q.e;
  let s=$("answerStatus");s.className="answer-status "+(ok?"good":"bad");s.textContent=ok?"✓ Correct — streak continues.":"✕ Added to your wrong-answer book.";
  let v=$("knowledgeVisual");v.innerHTML=q.image?`<img src="${q.image}" alt="Knowledge illustration">`:`<div class="generated-visual"><div class="rings"></div><div class="symbol">${escapeHTML(q.topic||SUBJECTS[src])}</div></div>`;
  $("learningCard").classList.remove("hidden");
  loadConnectedKnowledge(q,src,token);
}
function escapeHTML(x){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function next(){if(idx<19){idx++;renderQ()}else finish()}function badgeStats(st){return{rounds:st.history.length,bestStreak:st.bestStreak||0,perfect:st.history.filter(h=>h.score===20).length,subjects:new Set(st.history.filter(h=>h.mode==="subject").map(h=>h.subject)).size,mixed:st.history.filter(h=>h.mode==="mixed").length,corrected:st.corrected||0}}
function finish(){let st=S();st.history.unshift({date:new Date().toISOString(),mode,subject,level,score,total:20});st.history=st.history.slice(0,100);if(mode==="subject"){let k=key(subject,level);st.best[k]=Math.max(st.best[k]||0,score);if(score>=12&&level<3)st.unlocked[subject]=Math.max(st.unlocked[subject]||1,level+1)}let owned=new Set(st.badges||[]),stats=badgeStats(st);BADGES.forEach(b=>{if(b.test(stats)&&!owned.has(b.id)){st.badges.push(b.id);newBadges.push(b.id)}});put(st);$("resultScore").textContent=score;$("resultTitle").textContent=score>=18?"Outstanding.":score>=14?"Strong round.":score>=10?"Good progress.":"Keep exploring.";$("resultText").textContent=mode==="subject"&&score>=12&&level<3?`Level ${level+1} is now unlocked.`:"Your score and learning history have been saved.";$("newBadges").innerHTML=newBadges.splice(0).map(id=>{let b=BADGES.find(x=>x.id===id);return `<span class="pill">${b.icon} ${b.name}</span>`}).join("");show("result");renderMap()}
function renderWrong(){let arr=Object.values(S().wrong||{}).sort((a,b)=>new Date(b.wrongAt)-new Date(a.wrongAt));$("wrongList").innerHTML=arr.length?arr.map(q=>`<div class="review-row"><div class="meta">${SUBJECTS[q.source]}</div><div><h3>${q.q}</h3><p>Correct: <strong>${q.a[q.c]}</strong> · ${q.e}</p></div><div class="review-score">✕</div></div>`).join(""):`<div class="review-row"><div></div><div><h3>No mistakes saved.</h3><p>Your wrong-answer book is empty.</p></div></div>`}
function renderHistory(){let h=S().history;$("historyList").innerHTML=h.length?h.map(r=>`<div class="review-row"><div class="meta">${new Date(r.date).toLocaleString()}</div><div><h3>${r.mode==="mixed"?"Mixed Challenge":`${SUBJECTS[r.subject]} · Level ${r.level}`}</h3><p>${r.score>=12?"Level cleared":"Round completed"}</p></div><div class="review-score">${r.score}/20</div></div>`).join(""):`<div class="review-row"><div></div><div><h3>No rounds yet.</h3></div></div>`}
function renderBadges(){let own=new Set(S().badges||[]);$("badgeGrid").innerHTML=BADGES.map(b=>`<div class="badge ${own.has(b.id)?"":"locked"}"><div class="badge-icon">${b.icon}</div><h3>${b.name}</h3><p>${b.desc}</p></div>`).join("")}
$("mixedStart").onclick=startMixed;$("nextQuestion").onclick=next;$("quitQuiz").onclick=()=>{show("map");renderMap()};$("resultMap").onclick=()=>{show("map");renderMap()};$("resultWrong").onclick=()=>{renderWrong();show("wrong")};$("wrongBookNav").onclick=()=>{renderWrong();show("wrong")};$("historyNav").onclick=()=>{renderHistory();show("history")};$("badgesNav").onclick=()=>{renderBadges();show("badges")};document.querySelectorAll(".backMap").forEach(b=>b.onclick=()=>{show("map");renderMap()});renderMap();