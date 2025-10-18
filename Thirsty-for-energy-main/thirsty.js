const steps = [
  { id: "gen", title: "Gamyba / rinka", desc: "Energijos įsigijimo kaina biržoje, generatorių sąnaudos ir tiekėjo išlaidos." },
  { id: "trans", title: "Perdavimo tinklas", desc: "Aukštos įtampos perdavimas nuo elektrinių iki regionų." },
  { id: "dist", title: "Skirstymo tinklas", desc: "Mažesnės įtampos tinklai tiekia elektrą iki jūsų namų." },
  { id: "bal", title: "Balansavimas", desc: "Užtikrina gamybos ir vartojimo balansą, tinklo stabilumą." },
  { id: "supp", title: "Tiekėjo paslaugos", desc: "Sąskaitų administravimas, klientų aptarnavimas, tiekėjo marža." },
  { id: "meter", title: "Skaitiklis ir duomenys", desc: "Skaitiklių priežiūra ir duomenų perdavimas tiekėjui." },
  { id: "home", title: "Namai", desc: "Galutinė stotelė – tavo namai!" }
];

const VAT = 0.21;
const regulated = { transmission:0.000893, distribution:0.02639, balancing:0.01, metering:0.002 };

window.addEventListener("load", () => {
  const svgObj = document.getElementById("svgPath");
  const bolt = document.getElementById("bolt");
  const tooltip = document.getElementById("tooltip");
  const kwhRange = document.getElementById("kwhRange");
  const kwhLabel = document.getElementById("kwhLabel");
  const planSelect = document.getElementById("planSelect");
  const costTable = document.getElementById("costTable");
  const totalCost = document.getElementById("totalCost");

  svgObj.addEventListener("load", () => {
    const svgDoc = svgObj.contentDocument;
    steps.forEach(step => {
      const el = svgDoc.getElementById(step.id);
      if (!el) return;
      el.classList.add("stage-icon");
      el.addEventListener("click", () => moveBoltTo(el, step));
    });
  });

  function moveBoltTo(target, step) {
    const rect = target.getBoundingClientRect();
    const parentRect = document.getElementById("roadmap").getBoundingClientRect();
    const x = rect.left - parentRect.left + rect.width / 2;
    const y = rect.top - parentRect.top + rect.height / 2;

    bolt.style.left = ${x}px;
    bolt.style.top = ${y}px;

    tooltip.textContent = step.desc;
    tooltip.style.left = ${x}px;
    tooltip.style.top = ${y - 40}px;
    tooltip.style.opacity = 1;
  }

  kwhRange.addEventListener("input", updateCosts);
  planSelect.addEventListener("change", updateCosts);

  function updateCosts(){
    const kwh = parseFloat(kwhRange.value);
    kwhLabel.textContent = kwh;
    const retailWithVAT = parseFloat(planSelect.value);
    const retailNet = retailWithVAT / (1 + VAT);

    const regulatedSum = regulated.transmission + regulated.distribution + regulated.balancing + regulated.metering;
    let supplierPart = retailNet - regulatedSum;
    if (supplierPart < 0) supplierPart = 0;

    const supplierShare = supplierPart * 0.3;
    const generationShare = supplierPart * 0.7;

    const mapping = [
      {key:'Gamyba / rinka',val:generationShare},
      {key:'Perdavimo tinklas',val:regulated.transmission},
      {key:'Skirstymo tinklas',val:regulated.distribution},
      {key:'Balansavimas',val:regulated.balancing},
      {key:'Tiekėjo paslaugos',val:supplierShare},
      {key:'Skaitiklis ir duomenys',val:regulated.metering},
    ];

    costTable.innerHTML='';
    let sumNet = 0;
    mapping.forEach(m => { sumNet += m.val*kwh; });
    const vat = sumNet*VAT; const total = sumNet+vat;

    mapping.forEach(m=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${m.key}</td><td>${(m.val*kwh).toFixed(4)} €</td>`;
      costTable.appendChild(tr);
    });
    const vatRow=document.createElement('tr');
    vatRow.innerHTML=`<td>PVM (21%)</td><td>${vat.toFixed(4)} €</td>`;
    costTable.appendChild(vatRow);
    totalCost.textContent=total.toFixed(4)+' €';

    drawChart(mapping,kwh,vat,total);
  }

  function drawChart(mapping,kwh,vat,total){
    const ctx=document.getElementById('chart');
    const labels=mapping.map(m=>m.key).concat(['PVM']);
    const data=mapping.map(m=>m.val*kwh).concat([vat]);
    if(window.costChart)window.costChart.destroy();
    window.costChart=new Chart(ctx,{type:'pie',data:{labels:labels,datasets:[{data:data}]}});
  }

  updateCosts();
});
document.addEventListener("DOMContentLoaded", () => {
  const bolt = document.getElementById("bolt");
  const tooltip = document.getElementById("tooltip");
  const svg = document.getElementById("pathSvg");

  const stages = svg.querySelectorAll(".stage");

  // nustatome pradinę vietą (gamyba)
  let current = stages[0];
  moveBoltTo(current);

  stages.forEach(stage => {
    stage.addEventListener("click", () => {
      moveBoltTo(stage);
      showTooltip(stage);
    });
  });

  function moveBoltTo(stage) {
    const transform = stage.getAttribute("transform");
    const match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
    if (!match) return;
    const [_, x, y] = match.map(Number);

    // animuota kelionė iki tikslo
    bolt.style.left = ${x}px;
    bolt.style.top = ${y}px;
  }

  function showTooltip(stage) {
    const transform = stage.getAttribute("transform");
    const match = /translate\(([^,]+),([^)]+)\)/.exec(transform);
    if (!match) return;
    const [_, x, y] = match.map(Number);

    const name = stage.dataset.name;
    const desc = stage.dataset.desc;

    tooltip.innerHTML = <strong>${name}</strong><br>${desc};
    tooltip.style.left = ${x}px;
    tooltip.style.top = ${y}px;
    tooltip.classList.add("show");

    // automatiškai slepiam po kelių sekundžių
    clearTimeout(window.tooltipTimer);
    window.tooltipTimer = setTimeout(() => tooltip.classList.remove("show"), 5000);
  }
});
