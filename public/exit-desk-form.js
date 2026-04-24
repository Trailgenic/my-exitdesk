(function() {

  var isSubmitting = false;
  var sessionId = null;
  var sessionEmail = null;
  var answers = {};
  var checkboxAnswers = { q21: [] };
  var currentSection = 1;

  var facilityIndustries = [
    'construction', 'manufacturing', 'food_beverage',
    'retail', 'healthcare', 'distribution'
  ];

  var preFillMap = {
    q1: { target: 'q5', map: { a: 'under_1m', b: '1m_3m', c: '3m_7m', d: '7m_15m', e: '25m_plus' } },
    q2: { target: 'q8', map: { a: 'recurring_contracts', b: 'repeat_no_contract', c: 'project_based', d: 'mixed' } },
    q3: { target: 'q13', map: { a: 'runs_normally', b: 'continues_quality_suffers', c: 'declines_significantly', d: 'effectively_stops' } },
    q4: { target: 'q10', map: { a: 'under_10', b: '10_20', c: 'over_35', d: null } },
    q5: { target: 'q14', map: { a: 'strong_independent', b: 'capable_relies_on_me', c: 'staff_no_management', d: 'i_am_the_team' } },
    q6: { target: 'q18', map: { a: 'improving', b: 'stable', c: 'compressing', d: 'dont_track' } },
    q7: { target: 'q21', map: { a: 'customer_relationships', b: 'licenses_certifications', c: 'skilled_team', d: 'nothing_meaningful' } },
    q8: { target: 'q4', map: { a: 'strategic', b: 'personal', c: 'pressure', d: 'exploring' } }
  };

  function init() {
    var params = new URLSearchParams(window.location.search);
    sessionId = params.get('session_id');

    if (!sessionId) {
      document.getElementById('ed-gate').style.display = 'block';
      return;
    }

    fetch('https://my-exitdesk.vercel.app/api/verify-session?session_id=' + sessionId)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.verified) {
          document.getElementById('ed-gate').style.display = 'block';
          return;
        }

        sessionEmail = data.email;
        document.getElementById('ed-main').style.display = 'block';

        var emailEl = document.getElementById('ed-email-display');
        if (emailEl && sessionEmail) emailEl.textContent = sessionEmail;

        var meta = data.metadata;
        Object.keys(preFillMap).forEach(function(freeQ) {
          var val = meta[freeQ];
          if (!val) return;
          var mapping = preFillMap[freeQ];
          var targetQ = mapping.target;
          var mappedVal = mapping.map[val];
          if (!mappedVal) return;

          if (targetQ === 'q21') {
            var checkboxEl = document.querySelector(
              '[data-q="q21"][data-v="' + mappedVal + '"]'
            );
            if (checkboxEl && !checkboxAnswers.q21.includes(mappedVal)) {
              checkboxAnswers.q21.push(mappedVal);
              checkboxEl.classList.add('checked');
              checkboxEl.querySelector('.ed-checkbox-marker').textContent = '\u2611';
            }
          } else {
            var optionEl = document.querySelector(
              '[data-q="' + targetQ + '"][data-v="' + mappedVal + '"]'
            );
            if (optionEl) {
              answers[targetQ] = mappedVal;
              optionEl.classList.add('selected');
            }
          }
        });
      })
      .catch(function() {
        document.getElementById('ed-gate').style.display = 'block';
      });
  }

  window.selectOption = function(el) {
    var q = el.getAttribute('data-q');
    var v = el.getAttribute('data-v');
    document.querySelectorAll('[data-q="' + q + '"]').forEach(function(o) {
      o.classList.remove('selected');
    });
    el.classList.add('selected');
    answers[q] = v;
  };

  window.toggleCheckbox = function(el) {
    var q = el.getAttribute('data-q');
    var v = el.getAttribute('data-v');
    var marker = el.querySelector('.ed-checkbox-marker');

    if (el.classList.contains('checked')) {
      el.classList.remove('checked');
      marker.textContent = '\u2610';
      checkboxAnswers[q] = checkboxAnswers[q].filter(function(x) { return x !== v; });
    } else {
      el.classList.add('checked');
      marker.textContent = '\u2611';
      if (!checkboxAnswers[q]) checkboxAnswers[q] = [];
      checkboxAnswers[q].push(v);
    }
  };

  window.handleIndustryChange = function() {
    var industry = document.getElementById('q7').value;
    var q20 = document.getElementById('q20-wrap');
    if (facilityIndustries.includes(industry)) {
      q20.style.display = 'block';
    } else {
      q20.style.display = 'none';
      delete answers['q20'];
    }
  };

  window.nextSection = function(current) {
    document.getElementById('ed-s' + current).classList.remove('active');
    var next = current + 1;
    document.getElementById('ed-s' + next).classList.add('active');
    currentSection = next;
    document.getElementById('ed-section-current').textContent = next;
    document.getElementById('ed-progress').style.width = (next / 5 * 100) + '%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.prevSection = function(current) {
    document.getElementById('ed-s' + current).classList.remove('active');
    var prev = current - 1;
    document.getElementById('ed-s' + prev).classList.add('active');
    currentSection = prev;
    document.getElementById('ed-section-current').textContent = prev;
    document.getElementById('ed-progress').style.width = (prev / 5 * 100) + '%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.submitForm = function() {
    if (isSubmitting) return;
    isSubmitting = true;

    var btn = document.getElementById('ed-submit-btn');
    var errorEl = document.getElementById('ed-error');
    var submitting = document.getElementById('ed-submitting');

    errorEl.style.display = 'none';

    var payload = {
      email: sessionEmail,
      sessionId: sessionId,
      companyName: document.getElementById('q1').value || 'Not provided',
      companyDescription: document.getElementById('q2').value || 'Not provided',
      founderRole: answers['q3'] || 'Not provided',
      exitMotivation: answers['q4'] || 'Not provided',
      revenueRange: answers['q5'] || 'Not provided',
      yearsInBusiness: answers['q6'] || 'Not provided',
      industry: document.getElementById('q7').value || 'Not provided',
      revenueModel: answers['q8'] || 'Not provided',
      recurringPercent: answers['q9'] || 'Not provided',
      customerConcentration: answers['q10'] || 'Not provided',
      customerTenure: answers['q11'] || 'Not provided',
      newBusinessSource: answers['q12'] || null,
      steppedAway: answers['q13'] || 'Not provided',
      managementTeam: answers['q14'] || 'Not provided',
      documentedSystems: answers['q15'] || 'Not provided',
      employeeCount: answers['q16'] || 'Not provided',
      ebitdaRange: answers['q17'] || 'Not provided',
      marginTrajectory: answers['q18'] || 'Not provided',
      financialClean: answers['q19'] || 'Not provided',
      facility: answers['q20'] || null,
      hardToReplicate: checkboxAnswers['q21'] || [],
      industryDynamics: answers['q22'] || 'Not provided',
      inboundInterest: answers['q23'] || 'Not provided',
      keyEmployeeRisk: answers['q24'] || 'Not provided',
      diligenceDisclosure: answers['q25'] || 'Not provided',
      openText: document.getElementById('q26').value || null
    };

    btn.disabled = true;
    document.getElementById('ed-s5').style.display = 'none';
    submitting.style.display = 'block';

    fetch('https://my-exitdesk.vercel.app/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        var successUrl = '/exit/success';
        if (sessionEmail) {
          successUrl += '?email=' + encodeURIComponent(sessionEmail);
        }
        window.location.href = successUrl;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    })
    .catch(function() {
      submitting.style.display = 'none';
      document.getElementById('ed-s5').style.display = 'block';
      btn.disabled = false;
      isSubmitting = false;
      errorEl.style.display = 'block';
    });
  };

  init();

})();
