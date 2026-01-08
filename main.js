const KEY="life_kpi_pro_plus_v2";
let data=JSON.parse(localStorage.getItem(KEY))||[];
let theme=localStorage.getItem("theme")||"dark";
document.body.className=theme==="light"?"light":"";

// Pillars config
const pillars=[
{title:"🕌 Faith (25 pts)", items:[
  {name:"5 ওয়াক্ত সালাত", max:10},{name:"তাহাজ্জুদ", max:5},{name:"কুরআন/দুয়া", max:5},{name:"গুনাহ এড়ানোর চেষ্টা", max:5}]},
{title:"👨‍👩‍👧 Family (20 pts)", items:[
  {name:"Daily 1 hour quality time", max:15},{name:"Weekly special care", max:5}]},
{title:"💪 Fitness (15 pts)", items:[
  {name:"Exercise / walk", max:8},{name:"Healthy food", max:4},{name:"Sleep 6–7h", max:3}]},
{title:"💰 Finance (40 pts)", items:[
  {name:"Skill learning daily", max:20},{name:"Income action", max:10},{name:"Saving habit", max:5},{name:"Output (project/content)", max:5}]}
];

const container=document.getElementById("cardsContainer");
pillars.forEach((p,i)=>{
  const card=document.createElement("div"); card.className="card"; card.id="card"+i;
  let html=`<h2>${p.title}</h2>`;
  p.items.forEach((it,j)=>{
    html+=`<div>${it.name} (${it.max}): <input type="number" class="pillar${i}" data-max="${it.max}" value="0" min="0" max="${it.max}"></div>`;
  });
  card.innerHTML=html;
  container.appendChild(card);
});

// Save daily points
function calculatePoints(cls){
  return Array.from(document.querySelectorAll(`.${cls}`))
    .reduce((a,b)=>a+Math.min(Number(b.value),Number(b.dataset.max)),0);
}
function saveDailyPoints(){
  const today=new Date().toISOString().split("T")[0];
  const entry={
    date:today,
    faith:calculatePoints("pillar0"),
    family:calculatePoints("pillar1"),
    fitness:calculatePoints("pillar2"),
    finance:calculatePoints("pillar3")
  };
  entry.total=entry.faith+entry.family+entry.fitness+entry.finance;
  data=data.filter(d=>d.date!==today);
  data.push(entry);
  localStorage.setItem(KEY,JSON.stringify(data));
  render();
  alert(`Saved ✅ Total: ${entry.total}/100`);
  sendNotification(`Today's Total: ${entry.total}/100`);
}

// Streak
function calcStreak(){
  if(!data.length) return;
  let streak=1;
  for(let i=data.length-1;i>0;i--){
    const d1=new Date(data[i].date), d2=new Date(data[i-1].date);
    if((d1-d2)/(1000*60*60*24)===1) streak++; else break;
  }
  document.getElementById("streak").innerText="🔥 Streak: "+streak+" days";
}

// Notification
function sendNotification(msg){
  if(Notification.permission==="granted") new Notification("Life KPI PRO++",{body:msg,icon:"assets/icon.png"});
}

// Render + charts
function render(){
  if(!data.length) return;
  const latest=data.at(-1);
  [0,1,2,3].forEach(i=>{
    const card=document.getElementById("card"+i);
    const pct=[latest.faith/25,latest.family/20,latest.fitness/15,latest.finance/40][i]*100;
    card.style.border=pct<60?"2px solid red":"2px solid green";
  });
  document.getElementById("dailyTotal").innerText=`${latest.total} / 100 (${Math.round(latest.total)}%)`;
  drawWeekly(); drawMonthly(); drawChallenge(); calcStreak();
}
function drawWeekly(){
  const w=data.slice(-7);
  if(!w.length) return;
  new Chart(weeklyChart,{type:'bar',data:{labels:w.map(x=>x.date),datasets:[{label:"Daily Points",data:w.map(x=>x.total),backgroundColor:w.map(x=>x.total<60?'red':'#22c55e')}]},options:{plugins:{tooltip:{enabled:true}},scales:{y:{min:0,max:100}}}});
}
function drawMonthly(){
  const map={};
  data.forEach(e=>{const m=e.date.slice(0,7); map[m]=(map[m]||[]).concat(e.total);});
  const labels=Object.keys(map); const avg=labels.map(m=>map[m].reduce((a,b)=>a+b)/map[m].length);
  if(!labels.length) return;
  new Chart(monthlyChart,{type:'line',data:{labels,datasets:[{label:"Monthly Avg",data:avg,borderColor:'#22c55e',fill:false}]},options:{plugins:{tooltip:{enabled:true}},scales:{y:{min:0,max:100}}}});
}
function drawChallenge(){
  const last30=data.slice(-30); if(!last30.length) return;
  const labels=last30.map(e=>e.date); const avg=last30.map(e=>e.total);
  new Chart(challengeChart,{type:'line',data:{labels,datasets:[{label:"Last 30 Days",data:avg,borderColor:'#facc15',fill:false}]},options:{plugins:{tooltip:{enabled:true}},scales:{y:{min:0,max:100}}}});
}

// Export / Import
function exportData(){const blob=new Blob([JSON.stringify(data)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="life_kpi_pro_plus_v2.json"; a.click();}
function importData(e){const r=new FileReader(); r.onload=()=>{data=JSON.parse(r.result);localStorage.setItem(KEY,JSON.stringify(data));render();}; r.readAsText(e.target.files[0]);}

// PDF
function exportPDF(){const {jsPDF}=window.jspdf; const pdf=new jsPDF(); pdf.setFontSize(14); pdf.text("Life KPI PRO++ v2 Report",10,10); data.slice(-10).forEach((e,i)=>{pdf.text(`${e.date}: ${e.total}/100 (F:${e.faith}|Fa:${e.family}|Fi:${e.fitness}|Fn:${e.finance})`,10,20+i*7);}); pdf.save("life_kpi_pro_plus_v2.pdf");}

// Theme
function toggleTheme(){theme=theme==="dark"?"light":"dark";localStorage.setItem("theme",theme);location.reload();}

// Daily reminder
function dailyReminder(){const now=new Date(); const notifTime=new Date(); notifTime.setHours(9,0,0,0); const delay=notifTime-now; if(delay>0) setTimeout(()=>sendNotification("⏱ Don't forget to enter today's KPI points!"),delay);}
dailyReminder(); render();
