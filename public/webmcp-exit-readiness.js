// Exit Desk WebMCP v1.1
// Live integration for https://www.mikeye.com/exit/score

(async function () {
  if (typeof document.modelContext?.registerTool !== 'function') {
    console.info('[Exit Desk] WebMCP is not available in this browser.');
    return;
  }

  const fields = [
    ['annual_revenue', { under_1m: 'a', '1m_3m': 'b', '3m_7m': 'c', '7m_15m': 'd', '15m_plus': 'e' }],
    ['revenue_model', { recurring_contracts: 'a', repeat_no_contracts: 'b', project_based: 'c', mixed: 'd' }],
    ['founder_absence_impact', { unchanged: 'a', slow_decline: 'b', significant_decline: 'c', stops: 'd' }],
    ['customer_concentration', { none_over_10: 'a', top_10_25: 'b', top_over_25: 'c', unsure: 'd' }],
    ['management_team', { independent: 'a', daily_ops_founder_key_decisions: 'b', staff_no_management: 'c', founder_is_management: 'd' }],
    ['margin_trend', { improving: 'a', stable: 'b', compressing: 'c', not_tracked: 'd' }],
    ['defensibility', { relationships_brand: 'a', proprietary_regulatory: 'b', specialized_team: 'c', none: 'd' }],
    ['exit_motivation', { strategic_strength: 'a', personal_next_chapter: 'b', pressure: 'c', exploring: 'd' }]
  ];

  const assessmentInputSchema = {
    type: 'object',
    properties: {
      annual_revenue: {
        type: 'string',
        enum: ['under_1m', '1m_3m', '3m_7m', '7m_15m', '15m_plus'],
        description: 'Approximate annual revenue.'
      },
      revenue_model: {
        type: 'string',
        enum: ['recurring_contracts', 'repeat_no_contracts', 'project_based', 'mixed'],
        description: 'How most revenue is generated.'
      },
      founder_absence_impact: {
        type: 'string',
        enum: ['unchanged', 'slow_decline', 'significant_decline', 'stops'],
        description: 'What happens to revenue if the founder steps away for six months.'
      },
      customer_concentration: {
        type: 'string',
        enum: ['none_over_10', 'top_10_25', 'top_over_25', 'unsure'],
        description: 'Share of revenue represented by the largest customer.'
      },
      management_team: {
        type: 'string',
        enum: ['independent', 'daily_ops_founder_key_decisions', 'staff_no_management', 'founder_is_management'],
        description: 'How independently the management team operates.'
      },
      margin_trend: {
        type: 'string',
        enum: ['improving', 'stable', 'compressing', 'not_tracked'],
        description: 'Current direction of operating margins.'
      },
      defensibility: {
        type: 'string',
        enum: ['relationships_brand', 'proprietary_regulatory', 'specialized_team', 'none'],
        description: 'The business\'s strongest source of defensibility.'
      },
      exit_motivation: {
        type: 'string',
        enum: ['strategic_strength', 'personal_next_chapter', 'pressure', 'exploring'],
        description: 'Primary reason for considering an exit.'
      }
    },
    required: fields.map(function (entry) { return entry[0]; }),
    additionalProperties: false
  };

  function toolResult(result) {
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
      structuredContent: result
    };
  }

  function readAssessmentResult() {
    const dimensions = {
      revenue_quality: Number(document.getElementById('score-rq')?.textContent || 0),
      founder_dependence: Number(document.getElementById('score-fd')?.textContent || 0),
      financial_health: Number(document.getElementById('score-fh')?.textContent || 0),
      competitive_position: Number(document.getElementById('score-cp')?.textContent || 0),
      timing_alignment: Number(document.getElementById('score-ta')?.textContent || 0)
    };
    const weakest = Object.entries(dimensions).sort(function (a, b) { return a[1] - b[1]; })[0];
    const findings = Array.from(document.querySelectorAll('#es-findings .es-finding')).map(function (node) {
      return {
        label: node.querySelector('.es-finding-label')?.textContent?.trim() || '',
        finding: node.querySelector('.es-finding-text')?.textContent?.trim() || ''
      };
    });
    const checkout = document.getElementById('es-checkout-link');
    const scoreBand = document.getElementById('es-score-band')?.textContent?.trim() || '';

    return {
      completed: Boolean(scoreBand && findings.length),
      score: Number(document.getElementById('es-score-display')?.textContent || 0),
      score_band: scoreBand,
      interpretation: document.getElementById('es-score-band-label')?.textContent?.trim() || '',
      dimensions: dimensions,
      weakest_dimension: weakest ? weakest[0] : null,
      findings: findings,
      next_step_url: checkout && checkout.offsetParent !== null ? checkout.href : null,
      note: 'This is a structured buyer-lens readiness diagnostic, not a valuation or professional opinion.'
    };
  }

  function validateAssessmentInput(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw new TypeError('Assessment input must be an object.');
    }

    const allowedKeys = new Set(fields.map(function (entry) { return entry[0]; }));
    Object.keys(input).forEach(function (key) {
      if (!allowedKeys.has(key)) throw new TypeError('Unexpected assessment field: ' + key);
    });

    fields.forEach(function (entry) {
      const key = entry[0];
      const map = entry[1];
      if (!Object.prototype.hasOwnProperty.call(map, input[key])) {
        throw new TypeError('Invalid or missing assessment field: ' + key);
      }
    });
  }

  const tools = [
    {
      name: 'run_exit_readiness_assessment',
      title: 'Run Exit Readiness Assessment',
      description: 'Run Exit Desk\'s free 8-question buyer-lens assessment using facts the user provides about their business. This changes the visible page to the scored result and returns the same result to the agent. It does not submit payment, send email, or create an account.',
      inputSchema: assessmentInputSchema,
      // This does not persist data, but it changes the visible page state.
      annotations: { readOnlyHint: false },
      execute: async function (input) {
        validateAssessmentInput(input);

        if (typeof window.selectOption !== 'function' || typeof window.showResults !== 'function') {
          throw new Error('Exit Desk assessment is not ready on this page.');
        }

        fields.forEach(function (entry, index) {
          const key = entry[0];
          const map = entry[1];
          const value = map[input[key]];
          const option = document.querySelector(
            '.es-option[data-q="' + (index + 1) + '"][data-v="' + value + '"]'
          );
          if (!option) throw new Error('Could not map assessment field: ' + key);
          window.selectOption(option);
        });

        window.showResults();
        await new Promise(function (resolve) { setTimeout(resolve, 250); });

        const result = readAssessmentResult();
        if (!result.completed) {
          throw new Error('Exit Desk did not render a complete assessment result.');
        }
        return toolResult(result);
      }
    },
    {
      name: 'get_exit_readiness_result',
      title: 'Read Exit Readiness Result',
      description: 'Read the Exit Desk score, five buyer-lens dimensions, weakest dimension, findings, and next step currently visible on this page. Use this after the owner or agent has completed the assessment. This tool does not change the page or send data.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function () {
        const result = readAssessmentResult();
        if (!result.completed) {
          return toolResult({
            completed: false,
            message: 'No completed Exit Desk assessment is visible. Complete the assessment first.',
            note: result.note
          });
        }
        return toolResult(result);
      }
    }
  ];

  const registeredTools = [];
  for (const tool of tools) {
    try {
      await document.modelContext.registerTool(tool);
      registeredTools.push(tool.name);
      console.info('[Exit Desk] WebMCP tool registered: ' + tool.name);
    } catch (error) {
      console.error('[Exit Desk] WebMCP tool registration failed: ' + tool.name, error);
    }
  }

  window.__exitDeskWebMCP = {
    version: '1.1',
    tools: registeredTools
  };
})();
