async function postChart(){
  const date=document.getElementById('date').value;
  const time=document.getElementById('time').value;
  const place=document.getElementById('place').value;
  const res=await fetch('/api/charts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date,time,place})});
  const j=await res.json();
  document.getElementById('rawJson').textContent=JSON.stringify(j,null,2);
}
document.getElementById('formRoot').addEventListener('submit',e=>{e.preventDefault();postChart();});
