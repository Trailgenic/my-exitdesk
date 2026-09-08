/* Mike Ye | Native Exit Desk runtime v1.0.1. */
(function(){ function boot(){ var root=document.querySelector('[data-native-funnel="checkout"]'); if(!root || root.dataset.runtimeReady==='true')return;

root.querySelectorAll('[data-funnel-action]').forEach(function(control) {
  if (control.tagName === 'BUTTON') return;
  var button = document.createElement('button');
  Array.from(control.attributes).forEach(function(attr) {
    if (attr.name !== 'href') button.setAttribute(attr.name, attr.value);
  });
  button.type = 'button';
  while (control.firstChild) button.appendChild(control.firstChild);
  control.replaceWith(button);
});
root.querySelectorAll('[data-funnel-action="nextQ"], [data-funnel-action="showResults"]').forEach(function(button) {
  button.disabled = true;
});

(function() {

  // Read URL params
  var params = new URLSearchParams(window.location.search);
  var score = params.get('score');
  var weakest = params.get('weakest');
  var q1 = params.get('q1');

  // Tier derivation: q1 === 'a' (Under $1M) → lite ($199), else full ($499)
  var isLite = (q1 === 'a');
  var price = isLite ? '$199' : '$499';

  // Apply tier-aware copy
  var mastheadLabel = document.getElementById('ec-masthead-label');
  var title = document.getElementById('ec-title');
  var subtitle = document.getElementById('ec-subtitle');
  var calibration = document.getElementById('ec-calibration');
  var termPrice = document.getElementById('ec-term-price');
  var ctaPrice = document.getElementById('ec-cta-price');

  if (isLite) {
    mastheadLabel.textContent = 'Exit Desk · Main Street Edition';
    title.textContent = 'Buyer-Lens Audit™ — Main Street Edition';
    subtitle.textContent = 'A complete buyer-side analysis calibrated for businesses under $1M in revenue — delivered to your inbox.';
    calibration.innerHTML = '<strong>Calibrated for the Main Street buyer universe</strong> — individual SBA buyers, ETA searchers, and micro-acquirers. The actual buyer pool at sub-$1M revenue.';
  } else {
    mastheadLabel.textContent = 'Exit Desk · Full Report';
    title.textContent = 'Buyer-Lens Audit™';
    subtitle.textContent = 'A complete buyer-side analysis of your business — delivered to your inbox.';
    calibration.innerHTML = '<strong>Calibrated for institutional buyers</strong> — PE platforms, strategic acquirers, search funds, family offices, roll-up platforms.';
  }

  termPrice.textContent = price;
  ctaPrice.textContent = price;

  // Show score block if coming from diagnostic
  if (score !== null && Number.isFinite(Number(score)) && Number(score) >= 0 && Number(score) <= 100) {
    var scoreBlock = document.getElementById('ec-score-block');
    var scoreNumber = document.getElementById('ec-score-number');
    var scoreBand = document.getElementById('ec-score-band');
    var scoreWeakest = document.getElementById('ec-score-weakest');

    scoreBlock.classList.add('visible');
    scoreNumber.textContent = score;

    var band = parseInt(score);
    var bandLabel = band >= 80 ? 'Strong exit position' :
                    band >= 60 ? 'Solid foundation — specific gaps' :
                    band >= 40 ? 'Material issues to address' :
                    'Foundational work needed first';
    scoreBand.textContent = 'Your score: ' + score + ' / 100 — ' + bandLabel;

    if (weakest) {
      var weakestLabel = weakest.replace(/_/g, ' ');
      weakestLabel = weakestLabel.charAt(0).toUpperCase() +
                     weakestLabel.slice(1);
      scoreWeakest.textContent = 'Biggest gap identified: ' +
                                  weakestLabel +
                                  '. The audit goes deep on this.';
    }
  }

  window.startCheckout = function() {
    var btn = document.getElementById('ec-pay-btn');
    var loading = document.getElementById('ec-loading');
    var error = document.getElementById('ec-error');

    btn.disabled = true;
    loading.style.display = 'block';
    error.style.display = 'none';

    var payload = {
      score: score ? parseInt(score) : undefined,
      weakest: weakest || undefined,
      q1: q1 || undefined,
      q2: params.get('q2') || undefined,
      q3: params.get('q3') || undefined,
      q4: params.get('q4') || undefined,
      q5: params.get('q5') || undefined,
      q6: params.get('q6') || undefined,
      q7: params.get('q7') || undefined,
      q8: params.get('q8') || undefined,
      ref: params.get('ref') || undefined
    };

    fetch('https://my-exitdesk.vercel.app/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { if (!r.ok) throw new Error('Checkout unavailable'); return r.json(); })
    .then(function(data) {
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No URL returned');
      }
    })
    .catch(function() {
      btn.disabled = false;
      loading.style.display = 'none';
      error.style.display = 'block';
    });
  };

})();

document.getElementById('ec-pay-btn').disabled = false;


var root = document.querySelector('[data-native-funnel]');
root.addEventListener('submit', function(event) {
  var form = event.target.closest('[data-score-email]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.saveScore(form.dataset.scoreEmail);
}, true);
root.addEventListener('click', function(event) {
  var button = event.target.closest('[data-funnel-action]');
  if (!button || !root.contains(button) || button.disabled) return;
  var action = button.dataset.funnelAction;
  var arg = button.dataset.funnelArgument;
  if (action === 'selectOption') window.selectOption(button);
  else if (action === 'nextQ') window.nextQ(Number(arg));
  else if (action === 'prevQ') window.prevQ(Number(arg));
  else if (action === 'showResults') window.showResults();
  else if (action === 'saveScore') window.saveScore(arg);
  else if (action === 'startCheckout') window.startCheckout();
});
var notice = document.getElementById('funnel-runtime-notice');
if (notice) notice.remove();
root.dataset.runtimeReady = 'true';

} if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot,{once:true});}else{boot();} })();
