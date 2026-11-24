const CATS=['Rent','Food','Transport','Entertainment','Utilities','Education','Healthcare','Other'];
const PROFILES={
 salaried:{name:'Salaried professional',save:.20,needs:['Rent','Food','Transport','Utilities','Healthcare'],
  income:[{src:'Salary',amt:85000}],
  exp:{Rent:24000,Food:11000,Transport:5000,Entertainment:14000,Utilities:3500,Other:6000},
  goal:'Save 20% of income each month'},
 student:{name:'College student',save:.10,needs:['Rent','Food','Transport','Education'],
  income:[{src:'Monthly allowance',amt:15000}],
  exp:{Rent:6000,Food:4500,Transport:1200,Entertainment:3800,Education:900,Other:1500},
  goal:'Keep discretionary spending under 25%'},
 freelancer:{name:'Freelancer',save:.25,needs:['Rent','Food','Utilities','Healthcare'],
  income:[{src:'Client A',amt:32000},{src:'Client B',amt:14000},{src:'Client C',amt:6000}],
  exp:{Rent:18000,Food:7000,Transport:2500,Entertainment:4000,Utilities:3000,Other:8000},
  history:[62000,41000,70000,38000,55000,52000],
  goal:'Build an emergency fund of 6 months of essentials'},
 household:{name:'Household manager',save:.15,needs:['Rent','Food','Utilities','Education','Healthcare'],
  income:[{src:'Partner 1',amt:70000},{src:'Partner 2',amt:45000}],
  exp:{Rent:30000,Food:22000,Transport:8000,Entertainment:6000,Utilities:9000,Education:14000,Healthcare:9000,Other:5000},
  goal:'Save 15% and keep groceries within budget'}
};
let S={profile:'salaried',income:[],expenses:[],key:null,tab:'Dashboard'};
const fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const sum=a=>a.reduce((x,y)=>x+y,0);
const $=s=>document.querySelector(s);
function save(){try{localStorage.setItem('pfa',JSON.stringify(S))}catch(e){}}
function load(){try{const r=localStorage.getItem('pfa');if(r){S=Object.assign(S,JSON.parse(r));return true}}catch(e){}return false}
function seed(p){const P=PROFILES[p];S.profile=p;S.income=P.income.map(i=>({...i}));
 S.expenses=[];Object.entries(P.exp).forEach(([c,t])=>{const parts=c==='Food'?4:1;for(let k=0;k<parts;k++)S.expenses.push({cat:c,amt:Math.round(t/parts),date:'2026-09-'+String(3+k*7).padStart(2,'0'),note:parts>1?'Week '+(k+1):''})});save()}
function stats(){const P=PROFILES[S.profile],inc=sum(S.income.map(i=>i.amt)),by={};
 CATS.forEach(c=>by[c]=0);S.expenses.forEach(e=>by[e.cat]+=e.amt);
 const spent=sum(Object.values(by)),needsShare=P.needs.length?.5:.5;
 // budget: savings first, needs get 55% of remaining share, wants the rest
 const saveT=inc*P.save,spend=inc-saveT,needCats=P.needs,wantCats=CATS.filter(c=>!needCats.includes(c));
 const needW=needCats.reduce((a,c)=>a+Math.max(by[c],1),0),wantW=.35;
 const limits={};const needPool=spend*.65,wantPool=spend*.35;
 needCats.forEach(c=>limits[c]=needPool*Math.max(by[c],1)/needW*.97+ (by[c]===0?0:0));
 // cap needs limits to no less than current if within pool; simple proportional otherwise
 wantCats.forEach(c=>limits[c]=wantPool/wantCats.length);
 return{P,inc,by,spent,saved:inc-spent,limits,saveT,rate:inc?(inc-spent)/inc:0}}
function advice(st){const t=[],{P,inc,by,limits,saved,rate}=st;
 Object.keys(by).forEach(c=>{if(by[c]>limits[c]*1.02&&by[c]>0)t.push({w:1,m:`${c} is ${fmt(by[c]-limits[c])} over its ${fmt(limits[c])} limit. Trim it first.`})});
 if(rate<P.save)t.push({w:1,m:`You saved ${(rate*100).toFixed(0)}% against a ${(P.save*100).toFixed(0)}% target. Closing the gap needs ${fmt(st.saveT-saved)} more each month.`});
 else t.push({m:`You are ahead of your ${(P.save*100).toFixed(0)}% savings target. Move the surplus of ${fmt(saved-st.saveT)} into savings on payday.`});
 if(S.profile==='student'){const d=by.Entertainment+by.Other;t.push({w:d/inc>.25,m:`Discretionary spending is ${(d/inc*100).toFixed(0)}% of your allowance. Set a weekly cap of ${fmt(inc*.25/4)}.`})}
 if(S.profile==='freelancer'){const h=[...(P.history||[]),inc],avg=sum(h)/h.length,low=h.filter(x=>x<avg*.8).length;
  const ess=sum(P.needs.map(c=>by[c]));
  t.push({w:low>1,m:`${low} of your last ${h.length} months earned under 80% of average (${fmt(avg)}). Budget from your lowest recent month, not your best one.`});
  t.push({m:`An emergency fund of 6 months of essentials is ${fmt(ess*6)}. At ${fmt(Math.max(saved,0))}/month that takes ${saved>0?Math.ceil(ess*6/saved):'—'} months. Save more in high-income months.`})}
 if(S.profile==='household'){const g=by.Food;t.push({w:g>limits.Food,m:`Groceries are ${(g/inc*100).toFixed(0)}% of household income. Plan weekly meals and buy staples in bulk to bring it down.`})}
 if(S.profile==='salaried')t.push({m:'Set an automatic transfer to savings on salary day so saving happens before spending.'});
 return t}
const TABS=['Dashboard','Income','Expenses','Budget plan','Monthly report','API key'];
function render(){
 $('#tabs').innerHTML=TABS.map(t=>`<button role="tab" aria-selected="${t===S.tab}" data-t="${t}">${t}</button>`).join('');
 document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{S.tab=b.dataset.t;render()});
 const st=stats(),v=$('#view');
 ({Dashboard:dash,Income:incomeV,Expenses:expV,'Budget plan':budget,'Monthly report':report,'API key':apiV})[S.tab](v,st);save()}
function dash(v,st){const tips=advice(st).slice(0,3);
 v.innerHTML=`<div class="grid">
 <div class="panel"><div class="mute">Income this month</div><div class="big">${fmt(st.inc)}</div></div>
 <div class="panel"><div class="mute">Spent</div><div class="big">${fmt(st.spent)}</div></div>
 <div class="panel"><div class="mute">Saved</div><div class="big ${st.saved>=st.saveT?'good':'bad'}">${fmt(st.saved)}</div><div class="mute">Target ${fmt(st.saveT)}</div></div></div>
 <div class="panel" style="margin-top:14px"><h2>Spending by category</h2>${bars(st)}</div>
 <div class="panel" style="margin-top:14px"><h2>Advisor says</h2>${tips.map(t=>`<div class="tip ${t.w?'warn':''}">${t.m}</div>`).join('')}
 <p class="mute">Goal: ${st.P.goal}</p></div>`}
function bars(st){return CATS.filter(c=>st.by[c]>0||st.limits[c]).map(c=>{const b=st.by[c],l=st.limits[c]||1,p=Math.min(b/l*100,100);
 return `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between"><span>${c}</span><span class="${b>l*1.02?'bad':''}">${fmt(b)} of ${fmt(l)}</span></div><div class="bar"><i class="${b>l*1.02?'over':''}" style="width:${p}%"></i></div></div>`}).join('')}
function incomeV(v,st){
 v.innerHTML=`<div class="panel"><h2>Log income</h2><div class="row noprint"><input id="isrc" placeholder="Source (e.g. Client A)"><input id="iamt" type="number" min="0" placeholder="Amount"><button class="btn" id="iadd">Add income</button></div>
 <div class="scroll"><table><tr><th>Source</th><th class="n">Amount</th><th></th></tr>${S.income.map((i,k)=>`<tr><td>${esc(i.src)}</td><td class="n">${fmt(i.amt)}</td><td class="n"><button class="btn alt" data-d="${k}">Remove</button></td></tr>`).join('')||'<tr><td colspan=3 class="mute">No income yet. Add your first source above.</td></tr>'}</table></div>
 <p><b>Total: ${fmt(st.inc)}</b></p></div>`;
 $('#iadd').onclick=()=>{const a=+$('#iamt').value,s=$('#isrc').value.trim();if(!s||!(a>0))return alert('Enter a source and an amount above zero.');S.income.push({src:s,amt:a});render()};
 v.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.income.splice(+b.dataset.d,1);render()})}
function expV(v,st){
 v.innerHTML=`<div class="panel"><h2>Log an expense</h2><div class="row noprint"><select id="ecat">${CATS.map(c=>`<option>${c}</option>`).join('')}</select><input id="eamt" type="number" min="0" placeholder="Amount"><input id="edate" type="date" value="2026-09-29"><input id="enote" placeholder="Note (optional)"><button class="btn" id="eadd">Add expense</button></div>
 <div class="scroll"><table><tr><th>Date</th><th>Category</th><th>Note</th><th class="n">Amount</th><th></th></tr>${S.expenses.slice().map((e,k)=>[e,k]).sort((a,b)=>b[0].date.localeCompare(a[0].date)).map(([e,k])=>`<tr><td>${e.date}</td><td>${e.cat}</td><td>${esc(e.note||'')}</td><td class="n">${fmt(e.amt)}</td><td class="n"><button class="btn alt" data-d="${k}">Remove</button></td></tr>`).join('')||'<tr><td colspan=5 class="mute">No expenses yet. Add one above.</td></tr>'}</table></div></div>`;
 $('#eadd').onclick=()=>{const a=+$('#eamt').value;if(!(a>0))return alert('Enter an amount above zero.');S.expenses.push({cat:$('#ecat').value,amt:a,date:$('#edate').value||'2026-09-29',note:$('#enote').value});render()};
 v.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.expenses.splice(+b.dataset.d,1);render()})}
function budget(v,st){
 v.innerHTML=`<div class="panel"><h2>Your budget plan</h2><p class="mute">Built for: ${st.P.name}. Savings come off the top (${(st.P.save*100).toFixed(0)}% = ${fmt(st.saveT)}), then essentials get 65% of what remains and everything else 35%.</p>
 <div class="scroll"><table><tr><th>Category</th><th>Type</th><th class="n">Limit</th><th class="n">Spent</th><th class="n">Left</th></tr>${CATS.map(c=>{const l=st.limits[c],b=st.by[c];return `<tr><td>${c}</td><td>${st.P.needs.includes(c)?'Essential':'Flexible'}</td><td class="n">${fmt(l)}</td><td class="n">${fmt(b)}</td><td class="n ${b>l*1.02?'bad':'good'}">${fmt(l-b)}</td></tr>`}).join('')}</table></div></div>
 <div class="panel" style="margin-top:14px"><h2>Saving suggestions</h2>${advice(st).map(t=>`<div class="tip ${t.w?'warn':''}">${t.m}</div>`).join('')}</div>`}
function report(v,st){const over=CATS.filter(c=>st.by[c]>st.limits[c]*1.02&&st.by[c]>0);
 v.innerHTML=`<div class="panel"><h2>Monthly report: September 2026</h2>
 <div class="grid"><div><div class="mute">Income</div><div class="big">${fmt(st.inc)}</div></div><div><div class="mute">Expenses</div><div class="big">${fmt(st.spent)}</div></div><div><div class="mute">Savings</div><div class="big ${st.saved>=0?'good':'bad'}">${fmt(st.saved)}</div><div class="mute">${(st.rate*100).toFixed(1)}% of income</div></div></div>
 <h3 style="margin:22px 0 8px">Over budget</h3>${over.length?over.map(c=>`<div class="tip warn">${c}: ${fmt(st.by[c])} spent, ${fmt(st.by[c]-st.limits[c])} over.</div>`).join(''):'<p class="good">Every category stayed within its limit.</p>'}
 <h3 style="margin:22px 0 8px">Goals for next month</h3><div class="tip">${st.P.goal}.</div><div class="tip">Save at least ${fmt(st.saveT)}.</div>${over.slice(0,2).map(c=>`<div class="tip">Bring ${c} down to ${fmt(st.limits[c])}.</div>`).join('')}
 <button class="btn alt noprint" onclick="window.print()">Print or save as PDF</button></div>`}
function apiV(v){
 const k=S.key;
 v.innerHTML=`<div class="panel"><h2>API key</h2><p class="mute">Use this key to let your Flask backend or other apps send expenses to this tracker. The key is created and kept in this browser only.</p>
 ${k?`<div class="keybox" id="kv">${k.slice(0,12)+'•'.repeat(24)+k.slice(-4)}</div><div class="row noprint"><button class="btn" id="kshow">Show key</button><button class="btn alt" id="kcopy">Copy key</button><button class="btn danger" id="krev">Revoke key</button></div>`:`<p>No key yet.</p><button class="btn" id="kgen">Generate API key</button>`}
 <h3 style="margin:22px 0 8px">Check the key in Flask</h3>
<pre><code>from flask import Flask, request, jsonify, abort
import os
app = Flask(__name__)
API_KEY = os.environ["PFA_API_KEY"]  # paste your key here

@app.post("/api/expenses")
def add_expense():
    if request.headers.get("X-API-Key") != API_KEY:
        abort(401)
    data = request.get_json()
    # save with SQLAlchemy: Expense(category=..., amount=...)
    return jsonify(ok=True), 201</code></pre>
 <p class="mute">Send it as the <code>X-API-Key</code> header. Keep it out of public code and rotate it if it leaks.</p></div>`;
 if(!k)$('#kgen').onclick=()=>{const a=new Uint8Array(20);crypto.getRandomValues(a);S.key='pfa_live_'+[...a].map(x=>x.toString(16).padStart(2,'0')).join('');render()};
 else{let shown=false;$('#kshow').onclick=e=>{shown=!shown;$('#kv').textContent=shown?k:k.slice(0,12)+'•'.repeat(24)+k.slice(-4);e.target.textContent=shown?'Hide key':'Show key'};
  $('#kcopy').onclick=e=>{try{navigator.clipboard.writeText(k);e.target.textContent='Copied'}catch(x){e.target.textContent='Select and copy manually'}};
  $('#krev').onclick=()=>{if(confirm('Revoke this key? Apps using it will stop working.')){S.key=null;render()}}}}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
$('#profile').innerHTML=Object.entries(PROFILES).map(([k,p])=>`<option value="${k}">${p.name}</option>`).join('');
$('#profile').onchange=e=>{seed(e.target.value);render()};
if(!load())seed('salaried');
$('#profile').value=S.profile;render();
