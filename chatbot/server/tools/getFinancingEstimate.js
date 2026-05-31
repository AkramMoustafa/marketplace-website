import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const CREDIT_RATE_MAP = {
  'excellent': { rate: 4.9, label: 'Excellent (750+)' },
  'good': { rate: 6.9, label: 'Good (700–749)' },
  'fair': { rate: 9.9, label: 'Fair (650–699)' },
  'poor': { rate: 14.9, label: 'Poor (below 650)' },
};

function monthlyPayment(principal, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

export const getFinancingEstimateTool = tool(
  async ({ budget, down_payment, credit_score_range }) => {
    const creditKey = credit_score_range.toLowerCase().split(' ')[0];
    const creditInfo = CREDIT_RATE_MAP[creditKey] || CREDIT_RATE_MAP['fair'];

    const loanAmount = budget - down_payment;

    if (loanAmount <= 0) {
      return JSON.stringify({
        message: `Great news! With a $${down_payment.toLocaleString()} down payment on a $${budget.toLocaleString()} vehicle, you'd pay it in full — no loan needed!`,
      });
    }

    const options = [
      { term: 36, label: '3 years' },
      { term: 48, label: '4 years' },
      { term: 60, label: '5 years' },
      { term: 72, label: '6 years' },
    ].map(({ term, label }) => ({
      term,
      label,
      monthly: Math.round(monthlyPayment(loanAmount, creditInfo.rate, term)),
      totalCost: Math.round(monthlyPayment(loanAmount, creditInfo.rate, term) * term),
    }));

    const summary = options.map(o =>
      `• ${o.label} (${term2str(o.term)}): ~$${o.monthly}/mo — total $${o.totalCost.toLocaleString()}`
    ).join('\n');

    return JSON.stringify({
      budget,
      downPayment: down_payment,
      loanAmount,
      creditTier: creditInfo.label,
      apr: `${creditInfo.rate}%`,
      options,
      message: `Based on a $${budget.toLocaleString()} vehicle, $${down_payment.toLocaleString()} down, and ${creditInfo.label} credit at ${creditInfo.rate}% APR:\n\n${summary}\n\nThese are estimates. Our finance team can often find better rates — want me to connect you?`,
    });
  },
  {
    name: 'get_financing_estimate',
    description: 'Calculate estimated monthly car payments based on budget, down payment, and credit score range.',
    schema: z.object({
      budget: z.number().describe('Total vehicle price / budget in dollars (e.g. 35000)'),
      down_payment: z.number().describe('Down payment amount in dollars (e.g. 5000)'),
      credit_score_range: z.string().describe('Credit score range: "excellent" (750+), "good" (700-749), "fair" (650-699), or "poor" (below 650)'),
    }),
  }
);

function term2str(months) {
  return `${months} months`;
}
