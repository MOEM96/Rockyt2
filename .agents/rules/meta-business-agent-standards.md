# Meta Business Agent (Astra) Implementation & Rollout Standards

## 1. Setup Order & Prerequisites
Meta Business Agent is provisioned and operated via Zernio API and Meta Graph API on official WhatsApp Business Platform (Cloud API) phone numbers.

Follow this exact setup lifecycle:
1. **Eligibility Evaluation**:
   - Verify 6 Meta criteria:
     - Vertical: Supported (Retail, E-commerce, Services, etc. — NOT Finance, Health, Alcohol, Gambling).
     - Platform: Cloud API managed (not consumer WhatsApp Business mobile app).
     - Standing: Account in good standing (quality rating not RED).
     - Country: Authorized country.
     - Coexistence: No conflicting in-app Business AI on the same number.
     - Trust: Account meets Meta trust and verification standards.
2. **Manual Steps**:
   - **Terms Acceptance**: Must be accepted in [WhatsApp Manager](https://business.facebook.com/latest/whatsapp_manager/) (Meta Business Agent tab).
   - **Payment Method**: Attached in [Billing Hub](https://business.facebook.com/latest/billing_hub/) for live token delivery.
3. **Onboarding**:
   - Call `POST .../business-agent/onboard` once to create the agent.
   - Meta takes ~60 seconds to prepare the agent before configuration calls succeed.
4. **Knowledge Base Ingestion**:
   - `PUT .../business-information`: Name, description, operating hours, policies.
   - `POST .../faqs`: Grounded Q&As.
   - `POST .../websites`: Public URLs for crawling.
   - `POST .../files`: Uploaded support documents and product manuals.
5. **Voice & Skills**:
   - `POST .../skills`: System instructions, tone (Friendly, Professional, Direct, Empathetic), human handoff threshold.
6. **Connectors (Tools & Actions)**:
   - External action tools: Appointment bookings (Cal.com/Calendly), Payments (Dodo Payments/Stripe), and custom webhooks.
7. **Sandbox Testing**:
   - Always test via `POST .../test-messages` (zero token charges).
8. **Controlled Rollout**:
   - Start with `ai_audience: ALLOWLISTED_ONLY` and add tester numbers to `.../allowlist`.
   - Only set `ai_audience: EVERYONE` once testing confirms reliable behavior.

## 2. Thread Control & Inbox Handover
- While the agent holds a conversation, inbound customer messages arrive on webhook `standby: true`.
- When a human support agent sends a message from the inbox, control is taken automatically.
- To hand control back to Meta Business Agent, call Thread Control with action `release`.
