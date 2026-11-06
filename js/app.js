const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),{FID,qpos,idpos,grade,itemStats,homography,mean,sd,med}=Core;
const db=new Promise((r,j)=>{const q=indexedDB.open('examflow',1);q.onupgradeneeded=()=>['students','exams','results'].forEach(s=>q.result.createObjectStore(s,{keyPath:'id'}));q.onsuccess=()=>r(q.result);q.onerror=j});
const tx=async(s,m,f)=>{const d=await db;return new Promise((res,rej)=>{const t=d.transaction(s,m),o=f(t.objectStore(s));t.oncomplete=()=>res(o.result);t.onerror=()=>rej(t.error)})};
const all=s=>tx(s,'readonly',o=>o.getAll()),put=(s,v)=>tx(s,'readwrite',o=>o.put(v)),del=(s,k)=>tx(s,'readwrite',o=>o.delete(k));
const pad=x=>String(x).padStart(8,'0'),LET='ABCDEFGHIJ';let cur=localStorage.cur||'';
const V={},names={students:'Students',exams:'Exams',scan:'Scan',results:'Results',backup:'Backup'};
$('#nav').innerHTML=Object.keys(names).map(k=>`<button data-v="${k}" onclick="show('${k}')">${names[k]}</button>`).join('');
async function show(n){document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.v==n));$('#v').innerHTML='';await V[n]()}
const examSel=E=>`<select id="ex" onchange="cur=this.value;localStorage.cur=cur">${E.map(e=>`<option value="${e.id}" ${e.id==cur?'selected':''}>${esc(e.title)}</option>`).join('')}</select>`;
const getEx=async()=>{const E=await all('exams');return[E,E.find(e=>e.id==cur)||E[0]]};
function dl(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()}
V.students=async()=>{const S=await all('students');$('#v').innerHTML=`<h2>Students (${S.length})</h2><div class=card><input id=sid placeholder="ID (digits, max 8)" inputmode=numeric><input id=sn placeholder="Full name"><input id=sc placeholder="Class"><button onclick=addS()>Add</button></div>
<div class=card>Import CSV/TXT lines: id,name,class <input type=file accept=".csv,.txt" onchange=impS(this)></div>
<div class=card><button class=t onclick=expS()>Export Excel</button><table>${S.map(s=>`<tr><td>${esc(s.id)}<td>${esc(s.name)}<td>${esc(s.cls)}<td><button onclick="delS('${s.id}')">✕</button>`).join('')}</table></div>`};
async function addS(rec,quiet){const r=rec||{id:$('#sid').value.trim(),name:$('#sn').value.trim(),cls:$('#sc').value.trim()};
if(!/^\d{1,8}$/.test(r.id)||!r.name){if(!quiet)alert('ID must be 1–8 digits and name is required.');return false}
r.id=pad(r.id);if((await all('students')).some(s=>s.id==r.id)){if(!quiet)alert('Duplicate student ID.');return false}
await put('students',r);if(!quiet)show('students');return true}
async function impS(i){const t=await i.files[0].text();let ok=0,bad=0;for(const l of t.split(/\r?\n/).filter(x=>x.trim())){const[id,name,cls]=l.split(/[,;\t]/).map(x=>x.trim());(await addS({id,name,cls:cls||''},1))?ok++:bad++}alert(`Imported ${ok}; skipped ${bad} (invalid or duplicate).`);show('students')}
async function delS(id){if(confirm('Delete student '+id+'? Their results stay stored.')){await del('students',id);show('students')}}
async function expS(){const S=await all('students'),w=XLSX.utils.book_new();XLSX.utils.book_append_sheet(w,XLSX.utils.json_to_sheet(S.map(s=>({ID:s.id,Name:s.name,Class:s.cls}))),'Students');XLSX.writeFile(w,'students.xlsx')}
V.exams=async()=>{const[E]=await getEx();$('#v').innerHTML=`<h2>Exams</h2><div class=card><input id=et placeholder="Title"><input id=en type=number min=1 max=60 placeholder="Questions (≤60)"><input id=eo type=number min=2 max=6 value=4 placeholder="Options (2–6)"><input id=em type=number value=1 step=any placeholder="Marks each"><input id=eg type=number value=0 step=any placeholder="Penalty per wrong"><input id=ep type=number value=50 placeholder="Pass %"><input id=ek placeholder="Answer key, e.g. ABCDDBA…" style="width:90%"><button onclick=addE()>Save exam</button></div>
${E.map(e=>`<div class=card><b>${esc(e.title)}</b> · ${e.nq} Q · ${e.nopt} options<br><button class=t onclick="pdfE('${e.id}')">Sheet PDF</button><button onclick="editK('${e.id}')">Edit key</button><button onclick="delE('${e.id}')">Delete</button></div>`).join('')}`};
const keyOk=(k,n,o)=>k.length==n&&[...k].every(c=>LET.indexOf(c)>=0&&LET.indexOf(c)<o);
async function addE(){const e={id:String(Date.now()),title:$('#et').value.trim(),nq:+$('#en').value,nopt:+$('#eo').value,marks:+$('#em').value,neg:+$('#eg').value,pass:+$('#ep').value,key:$('#ek').value.toUpperCase().replace(/[^A-J]/g,'')};
if(!e.title||!(e.nq>=1&&e.nq<=60)||!(e.nopt>=2&&e.nopt<=6)||!(e.marks>0)||e.neg<0||!keyOk(e.key,e.nq,e.nopt))return alert('Check fields: title, 1–60 questions, 2–6 options, and a key with exactly one valid letter per question.');
await put('exams',e);cur=e.id;localStorage.cur=cur;show('exams')}
async function editK(id){const[E]=await getEx(),e=E.find(x=>x.id==id),k=(prompt('New answer key ('+e.nq+' letters). All stored results will be re-scored.',e.key)||'').toUpperCase().replace(/[^A-J]/g,'');if(!k)return;if(!keyOk(k,e.nq,e.nopt))return alert('Invalid key.');e.key=k;await put('exams',e);alert('Key updated.')}
async function delE(id){if(!confirm('Delete exam and ALL its results?'))return;for(const r of await all('results'))if(r.examId==id)await del('results',r.id);await del('exams',id);show('exams')}
async function pdfE(id){const[E]=await getEx(),ex=E.find(x=>x.id==id),{jsPDF}=jspdf,d=new jsPDF('p','mm','a4');
FID.forEach(([x,y])=>d.rect(x-4,y-4,8,8,'F'));d.setFontSize(14);d.text(ex.title,105,24,{align:'center'});d.setFontSize(9);d.text('Name: ______________________________   Class: __________   Date: __________',25,36);
d.text('Student ID: shade ONE digit in each column (leading zeros if shorter).',30,57);d.setFontSize(6);d.setLineWidth(.3);
for(let c=0;c<8;c++)for(let n=0;n<10;n++){const[x,y]=idpos(c,n);d.circle(x,y,2.2,'S');if(!c)d.text(String(n),x-7,y+.8)}
d.setFontSize(8);d.text('Fill bubbles completely with a dark pen. Do not fold or mark near the four black squares. One answer per question.',25,118);
for(let i=0;i<ex.nq;i++){const x0=22+(i/20|0)*62;for(let k=0;k<ex.nopt;k++){const[x,y]=qpos(i,k);d.circle(x,y,2.2,'S');if(i%20==0)d.text(LET[k],x-.8,y-4)}const[,y]=qpos(i,0);d.text(String(i+1),x0+6,y+1,{align:'right'})}
d.save(ex.title.replace(/\W+/g,'_')+'_sheet.pdf')}
const Q={fill:.5,amb:.25};
function otsu(g){const h=new Array(256).fill(0);for(const v of g)h[v|0]++;let s=0,n=g.length;h.forEach((c,i)=>s+=i*c);let sb=0,wb=0,m=0,best=0,t=128;for(let i=0;i<256;i++){wb+=h[i];if(!wb)continue;const wf=n-wb;if(!wf)break;sb+=i*h[i];const d=sb/wb-(s-sb)/wf,v=wb*wf*d*d;if(v>m){m=v;t=i}}return t}
function process(img,ex,canvas){const s=Math.min(1,1600/Math.max(img.width,img.height)),W=img.width*s|0,H=img.height*s|0;if(W>H)throw Error('Photo must be portrait (upright). Rotate the image and retry.');
canvas.width=W;canvas.height=H;const cx=canvas.getContext('2d');cx.drawImage(img,0,0,W,H);const px=cx.getImageData(0,0,W,H).data,g=new Float32Array(W*H);for(let i=0;i<g.length;i++)g[i]=.299*px[i*4]+.587*px[i*4+1]+.114*px[i*4+2];
const t=otsu(g)*.85,I=new Int32Array((W+1)*(H+1));for(let y=0;y<H;y++){let r=0;for(let x=0;x<W;x++){r+=g[y*W+x]<t?1:0;I[(y+1)*(W+1)+x+1]=I[y*(W+1)+x+1]+r}}
const S=(x0,y0,x1,y1)=>{x0=Math.max(0,x0|0);y0=Math.max(0,y0|0);x1=Math.min(W,x1|0);y1=Math.min(H,y1|0);return I[y1*(W+1)+x1]-I[y0*(W+1)+x1]-I[y1*(W+1)+x0]+I[y0*(W+1)+x0]};
const w=Math.round(W*.038),rg=[[0,0],[.7,0],[.7,.7],[0,.7]],px4=rg.map(([a,b])=>{let best=-1,bx=0,by=0;for(let y=H*b|0;y<H*(b+.3)-w;y+=2)for(let x=W*a|0;x<W*(a+.3)-w;x+=2){const v=S(x,y,x+w,y+w);if(v>best){best=v;bx=x;by=y}}
if(best<.6*w*w)throw Error('Could not find all four corner squares. Retake with the whole sheet visible and evenly lit.');
let sx=0,sy=0,n=0;for(let y=by-w/2|0;y<by+1.5*w;y++)for(let x=bx-w/2|0;x<bx+1.5*w;x++)if(x>=0&&y>=0&&x<W&&y<H&&g[y*W+x]<t){sx+=x;sy+=y;n++}return[sx/n,sy/n]});
const T=homography(FID,px4),sc=Math.hypot(px4[1][0]-px4[0][0],px4[1][1]-px4[0][1])/180,r=sc*1.4;
const fill=(x,y)=>{const[u,v]=T(x,y);return S(u-r,v-r,u+r,v+r)/(4*r*r)},mark=(x,y,c)=>{const[u,v]=T(x,y);cx.strokeStyle=c;cx.lineWidth=3;cx.beginPath();cx.arc(u,v,sc*2.8,0,7);cx.stroke()};
const read=(pts,n)=>{const f=pts.map(([x,y])=>fill(x,y)),on=f.map((v,i)=>v>Q.fill?i:-1).filter(i=>i>=0),am=f.some(v=>v>Q.amb&&v<=Q.fill);let flag=am||on.length>1;pts.forEach(([x,y],i)=>{if(on.includes(i))mark(x,y,flag?'#dc2626':'#16a34a');else if(f[i]>Q.amb)mark(x,y,'#d97706')});return{a:flag?-9:on.length?on[0]:-1,flag}};
const ans=[...Array(ex.nq)].map((_,i)=>read([...Array(ex.nopt)].map((_,k)=>qpos(i,k))));
const dig=[...Array(8)].map((_,c)=>read([...Array(10)].map((_,d)=>idpos(c,d))));const sid=dig.every(d=>!d.flag&&d.a>=0)?dig.map(d=>d.a).join(''):'';
return{ans,sid}}
V.scan=async()=>{const[E,ex]=await getEx();if(!ex)return $('#v').innerHTML='<div class=card>Create an exam first.</div>';
$('#v').innerHTML=`<h2>Scan</h2><div class=card>${examSel(E)}<br><input type=file id=fi accept="image/*" multiple capture=environment onchange=runScan(this)><p>Tap the field to open the camera or choose photos. Batch: select several images. Marks needing review are shown below each sheet.</p></div><div id=out></div>`};
async function runScan(inp){const[,ex]=await getEx(),S=await all('students'),out=$('#out');
for(const f of inp.files){const card=document.createElement('div');card.className='card';out.prepend(card);card.innerHTML=`<b>${esc(f.name)}</b><br><canvas></canvas><div class=m></div>`;
try{const img=await createImageBitmap(f,{imageOrientation:'from-image'}),R=process(img,ex,card.querySelector('canvas')),bad=R.ans.map((a,i)=>a.flag?i:-1).filter(i=>i>=0);
card.querySelector('.m').innerHTML=`${bad.length||!R.sid?'<p class=w>⚠ Manual review required before saving.</p>':'<p class=ok>All marks read clearly.</p>'}
Student ID <input class=sid value="${R.sid}" placeholder="8 digits" inputmode=numeric> <span class=nm></span>
${bad.map(i=>`<div>Q${i+1}: <select data-i="${i}"><option value="x">⚠ choose…</option><option value="-1">blank</option>${[...Array(ex.nopt)].map((_,k)=>`<option value="${k}">${LET[k]}</option>`).join('')}</select></div>`).join('')}<button class=t>Save result</button>`;
const si=card.querySelector('.sid'),nm=card.querySelector('.nm'),upd=()=>{const s=S.find(x=>x.id==pad(si.value));nm.textContent=s?s.name:'(unknown student)'};si.oninput=upd;upd();
card.querySelector('button').onclick=async()=>{const a=R.ans.map(x=>x.a);for(const s of card.querySelectorAll('select')){if(s.value=='x')return alert('Resolve all flagged questions first.');a[+s.dataset.i]=+s.value}
if(!/^\d{1,8}$/.test(si.value))return alert('Enter a valid student ID.');const id=pad(si.value);if(!S.some(x=>x.id==id)&&!confirm('Student ID not in your list. Save anyway?'))return;
const k=ex.id+'_'+id,old=(await all('results')).find(r=>r.id==k);if(old&&!confirm('A result for this student and exam already exists. Replace it?'))return;
await put('results',{id:k,examId:ex.id,sid:id,ans:a,at:Date.now()});card.querySelector('button').disabled=true;card.querySelector('button').textContent='Saved ✓'}}
catch(e){card.querySelector('.m').innerHTML=`<p class=bad>${esc(e.message)}</p>`}}}
V.results=async()=>{const[E,ex]=await getEx();if(!ex)return $('#v').innerHTML='<div class=card>No exams yet.</div>';
const S=await all('students'),R=(await all('results')).filter(r=>r.examId==ex.id),nm=id=>(S.find(s=>s.id==id)||{}).name||'?',G=R.map(r=>({r,g:grade(ex,r.ans)}));
let h=`<h2>Results</h2><div class=card>${examSel(E)}<button onclick="show('results')">Show</button></div>`;
if(!R.length)return $('#v').innerHTML=h+'<div class=card>No results saved for this exam.</div>';
const sc=G.map(x=>x.g.s),st=itemStats(ex,R.map(r=>r.ans));
h+=`<div class=card><b>${R.length}</b> students · mean ${mean(sc).toFixed(2)} · median ${med(sc)} · SD ${sd(sc).toFixed(2)} · min ${Math.min(...sc)} · max ${Math.max(...sc)} · pass rate ${(100*G.filter(x=>x.g.pass).length/R.length).toFixed(0)}%<br>KR-20: ${st.kr==null?'n/a (needs ≥2 students and score variance)':st.kr.toFixed(2)} · SEM: ${st.sem==null?'n/a':st.sem.toFixed(2)} (n=${st.n}, correct-count scoring)
${R.length<30?'<p class=w>Small sample: item statistics and KR-20 are unstable below ~30 students; discrimination needs ≥10.</p>':''}</div>
<div class=card><button class=t onclick=expR()>Export Excel</button><table><tr><th>ID<th>Name<th>Score<th>%<th>Result<th>✓/✗/blank<th>${G.sort((a,b)=>b.g.s-a.g.s).map(({r,g})=>`<tr><td>${r.sid}<td>${esc(nm(r.sid))}<td>${g.s}/${g.max}<td>${g.pct.toFixed(0)}<td class=${g.pass?'ok':'bad'}>${g.pass?'Pass':'Fail'}<td>${g.c}/${g.w}/${g.b}<td><button onclick="delR('${r.id}')">✕</button>`).join('')}</table></div>
<div class=card><h3>Item analysis</h3><table><tr><th>Q<th>Key<th>p<th>D<th>${[...Array(ex.nopt)].map((_,k)=>'<th>'+LET[k]).join('')}<th>blank${st.items.map((it,i)=>`<tr><td>${i+1}<td>${ex.key[i]}<td class=${it.p<.2||it.p>.9?'w':''}>${it.p.toFixed(2)}<td class=${it.D!=null&&it.D<.2?'w':''}>${it.D==null?'–':it.D.toFixed(2)}${it.dist.map(c=>'<td>'+c).join('')}`).join('')}</table><small>p = proportion correct (flagged amber if &lt;0.20 or &gt;0.90). D = upper 27% minus lower 27% correct proportion (amber if &lt;0.20). Distractors chosen by nobody are non-functioning.</small></div>`;
$('#v').innerHTML=h;window._x={ex,G,st,nm}};
function expR(){const{ex,G,st,nm}=window._x,w=XLSX.utils.book_new();XLSX.utils.book_append_sheet(w,XLSX.utils.json_to_sheet(G.map(({r,g})=>({ID:r.sid,Name:nm(r.sid),Score:g.s,Max:g.max,Percent:+g.pct.toFixed(1),Pass:g.pass?'Pass':'Fail',Correct:g.c,Wrong:g.w,Blank:g.b}))),'Results');
XLSX.utils.book_append_sheet(w,XLSX.utils.json_to_sheet(st.items.map((it,i)=>({Q:i+1,Key:ex.key[i],p:+it.p.toFixed(3),D:it.D==null?'':+it.D.toFixed(3)}))),'Items');XLSX.writeFile(w,ex.title.replace(/\W+/g,'_')+'_results.xlsx')}
async function delR(id){if(confirm('Delete this result?')){await del('results',id);show('results')}}
V.backup=async()=>{$('#v').innerHTML=`<h2>Backup</h2><div class=card><button class=t onclick=bk()>Export full backup (JSON)</button><p>Browser data can be lost if site data is cleared. Back up regularly.</p></div><div class=card>Restore: <input type=file accept=.json onchange=rs(this)><p>Records with matching IDs are replaced after confirmation; others are kept.</p></div>`};
async function bk(){dl(new Blob([JSON.stringify({v:1,students:await all('students'),exams:await all('exams'),results:await all('results')})],{type:'application/json'}),'examflow_backup_'+new Date().toISOString().slice(0,10)+'.json')}
async function rs(i){try{const d=JSON.parse(await i.files[0].text());for(const k of['students','exams','results'])if(!Array.isArray(d[k])||d[k].some(x=>!x||!x.id))throw Error('Invalid backup file');
if(!confirm(`Import ${d.students.length} students, ${d.exams.length} exams, ${d.results.length} results? Matching IDs will be overwritten.`))return;for(const k of['students','exams','results'])for(const x of d[k])await put(k,x);alert('Restored.')}catch(e){alert(e.message)}}
if('serviceWorker'in navigator)navigator.serviceWorker.register('service-worker.js');show('students');
