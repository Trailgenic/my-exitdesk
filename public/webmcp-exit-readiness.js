// Exit Desk WebMCP v1.0
// Live integration for https://www.mikeye.com/exit/score

(async function () {
  if (!document.modelContext || !document.modelContext.registerTool) {
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

  try {
    await document.modelContext.registerTool({
      name: 'run_exit_readiness_assessment',
      title: 'Run Exit Readiness Assessment',
      description: 'Run Exit Desk’s free 8-question buyer-lens assessment using facts the user provides about their business. It renders the same score and findings on the page and returns the result to the agent.',
      inputSchema: {
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
            description: 'The business’s strongest source of defensibility.'
          },
          exit_motivation: {
            type: 'string',
            enum: ['strategic_strength', 'personal_next_chapter', 'pressure', 'exploring'],
            description: 'Primary reason for considering an exit.'
          }
        },
        required: [
          'annual_revenue',
          'revenue_model',
          'founder_absence_impact',
          'customer_concentration',
          'management_team',
          'margin_trend',
          'defensibility',
          'exit_motivation'
        ],
        additionalProperties: false
      },
      annotations: { readOnlyHint: true },
      execute: async function (input) {
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

        return JSON.stringify({
          score: Number(document.getElementById('es-score-display')?.textContent || 0),
          score_band: document.getElementById('es-score-band')?.textContent?.trim() || '',
          interpretation: document.getElementById('es-score-band-label')?.textContent?.trim() || '',
          dimensions: dimensions,
          weakest_dimension: weakest ? weakest[0] : null,
          findings: findings,
          next_step_url: checkout && checkout.offsetParent !== null ? checkout.href : null,
          note: 'This is a structured buyer-lens readiness diagnostic, not a valuation or professional opinion.'
        });
      }
    });

    window.__exitDeskWebMCP = {
      version: '1.0',
      tools: ['run_exit_readiness_assessment']
    };
    console.info('[Exit Desk] WebMCP tool registered: run_exit_readiness_assessment');
  } catch (error) {
    console.error('[Exit Desk] WebMCP tool registration failed:', error);
  }
})();
