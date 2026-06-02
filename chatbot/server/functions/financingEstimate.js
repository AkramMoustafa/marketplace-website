// Financing estimates are calculated locally — the /api/financing endpoint
// requires an authenticated user account, so Alex calculates an estimate
// here and directs the customer to the website to submit a full application.

const APR = { excellent: 4.9, good: 6.9, fair: 9.9, poor: 14.9 };
const LABELS = { excellent: 'Excellent (750+)', good: 'Good (700–749)', fair: 'Fair (650–699)', poor: 'Poor (below 650)' };

function monthly(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export const definition = {
  type: 'function',
  function: {
    name: 'financing_estimate',
    description: 'Calculate estimated monthly car payments based on vehicle price, down payment, and credit score.',
    parameters: {
      type: 'object',
      properties: {
        budget:             { type: 'number', description: 'Vehicle price in dollars (e.g. 35000)' },
        down_payment:       { type: 'number', description: 'Down payment amount in dollars (e.g. 5000)' },
        credit_score_range: { type: 'string', description: 'Credit tier: "excellent", "good", "fair", or "poor"' },
      },
      required: ['budget', 'down_payment', 'credit_score_range'],
    },
  },
};

export async function handler({ budget, down_payment, credit_score_range }) {
  const key = credit_score_range.toLowerCase().split(/[\s(]/)[0];
  const apr = APR[key] ?? APR.fair;
  const label = LABELS[key] ?? LABELS.fair;
  const loan = budget - down_payment;

  if (loan <= 0) {
    return { message: `With a $${down_payment.toLocaleString()} down payment on a $${budget.toLocaleString()} vehicle, you'd pay it off outright — no loan needed!` };
  }

  const options = [36, 48, 60, 72].map(mo => ({
    term: `${mo} months`,
    monthly: `$${Math.round(monthly(loan, apr, mo)).toLocaleString()}`,
    total: `$${Math.round(monthly(loan, apr, mo) * mo).toLocaleString()}`,
  }));

  const lines = options.map(o => `• ${o.term}: ~${o.monthly}/mo (total ${o.total})`).join('\n');

  return {
    budget: `$${budget.toLocaleString()}`,
    downPayment: `$${down_payment.toLocaleString()}`,
    loanAmount: `$${loan.toLocaleString()}`,
    creditTier: label,
    apr: `${apr}%`,
    options,
    message: `Estimate for $${budget.toLocaleString()} vehicle, $${down_payment.toLocaleString()} down, ${label} credit at ${apr}% APR:\n\n${lines}\n\nThese are estimates — our finance team often finds better rates. To submit a full application, visit the Financing page on our website.`,
  };
}
