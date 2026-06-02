const FASTAPI = process.env.FASTAPI_URL || 'http://localhost:8000';

export const definition = {
  type: 'function',
  function: {
    name: 'capture_lead',
    description: "Save a customer's contact info and interest to the dealership CRM for follow-up.",
    parameters: {
      type: 'object',
      properties: {
        name:     { type: 'string', description: "Customer's full name" },
        phone:    { type: 'string', description: "Customer's phone number" },
        email:    { type: 'string', description: "Customer's email address" },
        interest: { type: 'string', description: "What they're interested in (e.g. '2024 Toyota Camry', 'electric vehicles')" },
      },
      required: ['name', 'phone', 'email', 'interest'],
    },
  },
};

export async function handler({ name, phone, email, interest }) {
  const res = await fetch(`${FASTAPI}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      phone,
      subject: `New Lead – ${interest}`,
      message: `Lead captured via chatbot.\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nInterest: ${interest}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save lead');
  }

  return {
    success: true,
    message: `Thanks, ${name}! Your info is saved and our team will reach out at ${email} or ${phone} about ${interest}. We typically respond within 30 minutes during business hours.`,
  };
}
