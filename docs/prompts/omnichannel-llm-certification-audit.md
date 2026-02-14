# Centralized LLM Certification Prompt — Omnichannel Development

**Shell + Responsive + UX System Audit for SMB Omnichannel**

Use this prompt with an LLM to audit, validate and certify that **omnichannel development improvements** (shell, responsive behavior, UX system) follow best practices. Scope: omnichannel module and its shell integration. Copy the section below into your LLM of choice.

---

## Prompt (copy from here)

You are auditing the **omnichannel** module of a SaaS platform designed for SMBs — the development work that delivers the shell, responsive layout, and UX system. The product is white-label and competes with Zendesk, Intercom, and similar tools.

The goal of the **omnichannel redesign** is to:

- Make the shell immersive like WhatsApp Web
- Remove heavy top headers
- Use a vertical app rail
- Centralize global profile/settings
- Prioritize Inbox-first experience
- Follow clean design system principles
- Ensure excellent responsive behavior across large, medium, small screens

Your task is to validate whether the **omnichannel implementation** (shell, responsive, UX) follows best practices and that development improvements are correctly applied.

---

### 1. Shell Architecture Validation

Verify that:

**Navigation**

- There is only ONE primary navigation axis (vertical rail)
- No duplicated navigation (no top + side redundancy)
- Breadcrumbs are removed
- Global profile is located inside the main menu (bottom of rail)

**Layout Structure**

- **Large screens:** Rail | Context Panel | Main Area | Optional Right Panel
- **Medium screens:** Rail | Context Panel | Main Area
- **Small screens:** Context and Chat switch between views; Right panel becomes modal
- **Mobile:** Sequential single-screen flow

Confirm:

- No horizontal heavy header
- No unnecessary navigation layers
- Context is visually clear without breadcrumbs

---

### 2. Responsive System Validation

Validate that responsive behavior follows:

**Breakpoints**

- Large: ≥1440px
- Medium: 1024–1439px
- Small: 768–1023px
- Mobile: <768px

**Collapse Priority**

When shrinking screen:

1. Metrics hide first
2. Right panel hides second
3. Context panel hides third
4. Chat never hides

**Layout Behavior**

- Large: 3–4 columns
- Medium: 3 columns
- Small: 2 columns max
- Mobile: 1 column only

Confirm:

- No squeezed UI
- No broken multi-column layouts on small screens
- Tables adapt properly
- Dashboard grid reduces columns progressively

---

### 3. Design System Compliance

Validate adherence to:

**Hierarchy**

- Maximum 3 visual hierarchy levels
- Primary actions clearly distinguished
- No equal-weight UI noise

**Color Usage**

- Brand color only for primary actions
- Semantic colors only for system states (Open, Waiting, Overdue, Closed)
- No decorative misuse of status colors

**Spacing**

- 8pt grid system respected
- Consistent padding across components

**Buttons**

- Only 3 types: Primary, Secondary, Ghost
- No excessive variants

---

### 4. Inbox-First Experience Validation

Confirm:

- Inbox is default landing page
- Conversation urgency is visually clear
- Status states limited to 4 maximum
- SLA indicators are visible but not intrusive
- Chat is immersive and prioritized
- Customer info panel is contextual, not dominant

Ensure: The product feels like a messaging app with intelligence layered in — not a dashboard with chat inside.

---

### 5. Simplicity for SMB Validation

Confirm:

- No enterprise-level complexity exposed by default
- Advanced features are progressively disclosed
- Onboarding is guided
- Empty states provide actionable next steps
- Feature density does not overwhelm small teams

---

### 6. UX Quality Checklist

Audit for:

- No duplicate navigation
- No inconsistent spacing
- No unclear active states
- Hover feedback exists
- Micro-interactions are subtle (150–250ms)
- No animation overload
- Density adapts to screen size

---

### 7. Product Strategic Alignment

Confirm the product positioning reflects:

- Simplicity over feature overload
- Speed over configuration complexity
- Clarity over enterprise abstraction
- WhatsApp-like immersion with business intelligence

---

### Output Requirement

Provide:

1. **Compliance Score (0–100)**
2. **List of Critical Issues**
3. **List of Moderate Improvements**
4. **List of Minor Enhancements**
5. **Strategic Risk Analysis** (if any)
6. **Final Certification Verdict:**
   - **Certified Best Practice**
   - **Needs Refinement**
   - **Structural Redesign Required**

Be strict. Do not be polite. Evaluate like a senior product auditor.

---

### Optional Add-On

You may also evaluate:

- Whether the product feels modern (2026 SaaS standard)
- Whether it can scale visually to enterprise without redesign
- Whether the white-label capability is preserved in the shell

---

This prompt ensures: structural integrity, UX maturity, responsive consistency, SMB alignment, and competitive positioning validation for **omnichannel development improvements**.
