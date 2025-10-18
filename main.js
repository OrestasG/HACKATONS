window.onload = function () {
  const bolt = document.getElementById('bolt');
  const tooltip = document.getElementById('tooltip');
  const stages = document.querySelectorAll('.stage');
  const pathEl = document.getElementById('dynamicPath');

  function generatePathFromStages() {
    const coords = Array.from(stages).map((s) => {
      const t = s.getAttribute('transform');
      const match = /translate\(([^,]+),([^)]+)\)/.exec(t);
      return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
    });

    let d = `M${coords[0].x},${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const midX = (coords[i - 1].x + coords[i].x) / 2;
      const midY = (coords[i - 1].y + coords[i].y) / 2;
      d += ` Q${midX},${midY} ${coords[i].x},${coords[i].y}`;
    }
    pathEl.setAttribute('d', d);
  }

  function moveBoltTo(stage) {
    const t = stage.getAttribute('transform');
    const m = /translate\(([^,]+),([^)]+)\)/.exec(t);
    if (!m) return;
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    bolt.style.left = `${x}px`;
    bolt.style.top = `${y}px`;
  }

  function showTooltip(stage) {
    const t = stage.getAttribute('transform');
    const m = /translate\(([^,]+),([^)]+)\)/.exec(t);
    if (!m) return;
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    tooltip.innerHTML = `<strong>${stage.dataset.name}</strong>${stage.dataset.desc}`;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y - 25}px`;
    tooltip.classList.add('show');
    clearTimeout(window.ttHide);
    window.ttHide = setTimeout(() => tooltip.classList.remove('show'), 4500);
  }

  generatePathFromStages();
  moveBoltTo(stages[0]);

  stages.forEach((stage) =>
    stage.addEventListener('click', () => {
      moveBoltTo(stage);
      showTooltip(stage);
    })
  );

  // Skaičiavimai
  const VAT = 0.21;
  const regulated = {
    transmission: 0.0009,
    distribution: 0.026,
    balancing: 0.01,
    metering: 0.002,
  };

  const kwhRange = document.getElementById('kwhRange');
  const kwhLabel = document.getElementById('kwhLabel');
  const planSelect = document.getElementById('planSelect');
  const costTable = document.getElementById('costTable');
  const totalCost = document.getElementById('totalCost');

  kwhRange.addEventListener('input', updateCosts);
  planSelect.addEventListener('change', updateCosts);
  document.getElementById('playJourney').addEventListener('click', () => {
    stages.forEach((s, i) =>
      setTimeout(() => {
        moveBoltTo(s);
        showTooltip(s);
      }, i * 800)
    );
  });

  function updateCosts() {
    const kwh = parseFloat(kwhRange.value);
    kwhLabel.textContent = kwh;
    const retailWithVAT = parseFloat(planSelect.value);
    const retailNet = retailWithVAT / (1 + VAT);
    const regulatedSum = Object.values(regulated).reduce((a, b) => a + b, 0);
    let supplierPart = retailNet - regulatedSum;
    if (supplierPart < 0) supplierPart = 0;
    const supplierShare = supplierPart * 0.3;
    const generationShare = supplierPart * 0.7;

    const mapping = [
      { key: 'Energijos šaltinis / gamyba', val: generationShare },
      { key: 'Perdavimo tinklas', val: regulated.transmission },
      { key: 'Skirstymo tinklas', val: regulated.distribution },
      { key: 'Balansavimas', val: regulated.balancing },
      { key: 'Tiekėjo paslaugos', val: supplierShare },
      { key: 'Skaitikliai ir duomenys', val: regulated.metering },
    ];

    costTable.innerHTML = '';
    let sumNet = mapping.reduce((sum, m) => sum + m.val * kwh, 0);
    const vat = sumNet * VAT;
    const total = sumNet + vat;

    mapping.forEach((m) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m.key}</td><td>${(m.val * kwh).toFixed(4)} €</td>`;
      costTable.appendChild(tr);
    });

    const vatRow = document.createElement('tr');
    vatRow.innerHTML = `<td>PVM (21%)</td><td>${vat.toFixed(4)} €</td>`;
    costTable.appendChild(vatRow);
    totalCost.textContent = total.toFixed(4) + ' €';

    drawChart(mapping, kwh, vat);
  }

  function drawChart(mapping, kwh, vat) {
    const ctx = document.getElementById('chart');
    const labels = mapping.map((m) => m.key).concat(['PVM']);
    const data = mapping.map((m) => m.val * kwh).concat([vat]);
    const colors = ['#90be6d', '#ffd166', '#06d6a0', '#118ab2', '#3a86ff', '#8ecae6', '#f3722c'];
    if (window.costChart) window.costChart.destroy();
    window.costChart = new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { plugins: { legend: { position: 'bottom' } }, responsive: true },
    });
  }

  updateCosts();
};
