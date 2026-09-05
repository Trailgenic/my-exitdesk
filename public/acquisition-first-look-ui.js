(function () {
  'use strict';
  const form = document.getElementById('afl-form');
  if (!form || form.dataset.initialized) return;
  const api = window.AcquisitionFirstLook;
  if (!api) return;
  form.dataset.initialized = 'true';
  const get = id => document.getElementById('afl-' + id);
  const steps = Array.from(form.querySelectorAll('[data-step]'));
  let step = 0, result = null;
  function showStep(index, focus = true) {
    step = index;
    steps.forEach((section, i) => { section.hidden = i !== step; });
    get('progress').textContent = 'Step ' + (step + 1) + ' of 3 · ' + steps[step].dataset.title;
    get('bar').style.width = ((step + 1) / 3 * 100) + '%';
    get('back').disabled = step === 0;
    get('next').textContent = step === 2 ? 'Build my first-look brief →' : 'Continue →';
    get('error').hidden = true;
    if (focus) steps[step].querySelector('h2').focus();
  }
  function validateStep() {
    const fields = Array.from(steps[step].querySelectorAll('input, select, textarea'));
    const invalid = fields.find(field => !field.checkValidity());
    if (invalid) {
      get('error').textContent = 'Check the highlighted field. Use plain USD amounts; leave unknown numbers blank.';
      get('error').hidden = false;
      invalid.reportValidity();
      invalid.focus();
      return false;
    }
    return true;
  }
  const read = () => Object.fromEntries(new FormData(form).entries());
  const fillList = (id, items, empty) => {
    const list = get(id);
    list.replaceChildren();
    (items.length ? items : [{ detail: empty }]).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.detail;
      list.appendChild(li);
    });
  };
  function render() {
    try { result = api.evaluate(read()); }
    catch (error) { get('error').textContent = error.message; get('error').hidden = false; return; }
    get('name').textContent = result.input.name;
    get('posture').textContent = result.posture;
    get('rationale').textContent = result.rationale;
    get('counts').textContent = result.risks.length + ' risks to investigate · ' + result.gaps.length + ' evidence gaps';
    get('ratio').textContent = result.multiple === null ? 'Ratio unavailable' : result.multiple.toFixed(2) + '× asking EV / reported EBITDA';
    get('ratio-note').textContent = result.multipleNote;
    get('source-note').textContent = result.input.source || 'No source note provided.';
    get('thesis-note').textContent = result.input.thesis || 'No acquisition rationale provided.';
    const money = value => value === null ? 'Unknown' : '$' + value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    get('economics').textContent = 'Revenue: ' + money(result.input.revenue) + ' · Reported ' + result.input.metric.toUpperCase() + ': ' + money(result.input.earnings) + ' · Asking price (' + result.input.priceBasis + '): ' + money(result.input.price) + ' · USD';
    fillList('risks', result.risks, 'None identified from these answers. This is not assurance that none exist.');
    fillList('gaps', result.gaps, 'No first-look gaps identified from the supplied answers. Underlying records still require diligence.');
    fillList('questions', result.questions, 'Start the next-stage work below and verify the supplied answers against records.');
    fillList('positives', result.positives, 'No supporting inputs identified yet.');
    fillList('next-stage', result.nextStage.map(detail => ({ detail })), '');
    form.hidden = true;
    get('sample-row').hidden = true;
    get('result').hidden = false;
    get('result').focus();
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validateStep()) return;
    if (step < 2) showStep(step + 1); else render();
  });
  get('back').addEventListener('click', () => { if (step > 0) showStep(step - 1); });
  get('edit').addEventListener('click', () => {
    get('result').hidden = true; form.hidden = false; get('sample-row').hidden = false; showStep(0);
  });
  get('reset').addEventListener('click', () => {
    form.reset(); result = null; get('result').hidden = true; form.hidden = false; get('sample-row').hidden = false; showStep(0);
  });
  function loadSample() {
    Object.entries(api.sample).forEach(([key, value]) => { if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value; });
    render();
  }
  get('sample').addEventListener('click', loadSample);
  get('download').addEventListener('click', () => {
    if (!result) return;
    const blob = new Blob([api.brief(result, new Date().toISOString())], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'Acquisition_Lens_First_Look.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  get('print').addEventListener('click', () => window.print());
  showStep(0, false);
  if (window.location.hash === '#sample') loadSample();
})();
