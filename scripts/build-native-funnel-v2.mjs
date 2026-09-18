// Derive the narrowly scoped v2 release from the reviewed v1 runtimes.
// Keep v1 bytes intact for existing Webflow integrity registrations and rollback.
import fs from 'node:fs';
const read = name => fs.readFileSync(new URL('../public/'+name, import.meta.url), 'utf8');
const write = (name, value) => fs.writeFileSync(new URL('../public/'+name, import.meta.url), value);
function replaceOnce(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('Native runtime source changed: '+before);
  return source.replace(before, after);
}
let score = read('exit-score-native-v1.js');
score = replaceOnce(score, 'runtime v1.0.2.', 'runtime v2.0.0.');
score = replaceOnce(score, "return '/exit/checkout?' + params.toString();", `var referral = new URLSearchParams(window.location.search).get('ref');
if (referral && /^[a-zA-Z0-9_-]{1,64}$/.test(referral)) params.set('ref', referral);
return '/exit/checkout?' + params.toString();`);
write('exit-score-native-v2.js', score);

let checkout = read('exit-checkout-native-v1.js');
checkout = replaceOnce(checkout, 'runtime v1.0.1.', 'runtime v2.0.0.');
checkout = replaceOnce(checkout, "var q1 = params.get('q1');", `var q1 = params.get('q1');
  if (!/^[a-e]$/.test(q1 || '')) q1 = null;
  var referral = params.get('ref');
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(referral || '')) referral = undefined;
  var revenueChoice = null;`);
checkout = replaceOnce(checkout, "  // Tier derivation: q1 === 'a' (Under $1M) → lite ($199), else full ($499)", `  function renderTier() {
  // Annual revenue determines the edition; asking price is never used.`);
checkout = replaceOnce(checkout, '  ctaPrice.textContent = price;', `  ctaPrice.textContent = price;
  }
  renderTier();
  var payButton = document.getElementById('ec-pay-btn');
  if (!q1) {
    document.getElementById('ec-masthead-label').textContent = 'Exit Desk';
    document.getElementById('ec-title').textContent = 'Buyer-Lens Audit™';
    document.getElementById('ec-subtitle').textContent = 'Choose your annual revenue to see your edition and price.';
    document.getElementById('ec-calibration').textContent = 'Under $1M: Main Street Edition, $199. $1M or more: Full Report, $499.';
    document.getElementById('ec-term-price').textContent = 'Choose revenue below';
    document.getElementById('ec-cta-price').textContent = 'Choose revenue first';
    var fieldset = document.createElement('fieldset');
    fieldset.id = 'ec-revenue-choice';
    fieldset.style.cssText = 'border:1px solid #826b3f;padding:16px;margin:20px 0;font:inherit;';
    fieldset.innerHTML = '<legend>Annual business revenue</legend><label style="display:block;margin:8px 0"><input type="radio" name="checkout-revenue" value="a"> Under $1M — Main Street Edition ($199)</label><label style="display:block;margin:8px 0"><input type="radio" name="checkout-revenue" value="b"> $1M or more — Full Report ($499)</label>';
    payButton.parentNode.insertBefore(fieldset, payButton);
    revenueChoice = fieldset;
    fieldset.addEventListener('change', function(event) {
      if (event.target.name !== 'checkout-revenue' || !/^[ab]$/.test(event.target.value)) return;
      q1 = event.target.value;
      renderTier();
      payButton.disabled = false;
    });
  }
  payButton.disabled = !q1;`);
checkout = replaceOnce(checkout, "    var btn = document.getElementById('ec-pay-btn');", `    var btn = document.getElementById('ec-pay-btn');
    if (!q1 || btn.disabled) return;`);
checkout = replaceOnce(checkout, '    btn.disabled = true;', `    btn.disabled = true;
    if (revenueChoice) revenueChoice.querySelectorAll('input').forEach(function(input) { input.disabled = true; });`);
checkout = replaceOnce(checkout, "ref: params.get('ref') || undefined", 'ref: referral');
checkout = replaceOnce(checkout, '      btn.disabled = false;', `      btn.disabled = false;
      if (revenueChoice) revenueChoice.querySelectorAll('input').forEach(function(input) { input.disabled = false; });`);
checkout = replaceOnce(checkout, "document.getElementById('ec-pay-btn').disabled = false;", '// Payment availability is set only after revenue has been resolved.');
write('exit-checkout-native-v2.js', checkout);
console.log('Built native funnel v2: revenue choice and URL-based referral preservation.');
