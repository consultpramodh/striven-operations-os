# Revenue Template Lab — research basis

Date: 2026-09-21

This prototype uses current workflow/product signals to choose commercially meaningful examples. The economics shown in the UI are transparent scenario assumptions, not forecasts or guaranteed profit.

## Included templates

1. **Abandoned Booking Rescue**
   - Market signal: ServiceTitan reported a 7% recovery rate in an abandoned-booking SMS follow-up example.
   - Demo math: 100 abandoned inquiries × 7% recovery × $250 average job = $1,750/month.
   - Source: ServiceTitan, Fall 2025 Benchmark Report recap.

2. **Quote-to-Close Rescue**
   - Market signal: current HubSpot sales automation guidance emphasizes faster, consistent follow-up; Zapier's current sales template catalog prominently includes stale-deal audits, automated lead follow-up, lead qualification, and routing.
   - Demo math: 40 open quotes × $2,500 average quote × 5% incremental win rate = $5,000/month.
   - This 5% is a scenario assumption, not an external benchmark.

3. **Smart Service Dispatch**
   - Market signal: ServiceTitan's field-service trend coverage emphasizes automated scheduling/dispatch using technician availability, skill, job location, customer preferences, traffic, capacity, and route optimization.
   - Demo math: 3 technicians × 1 avoidable hour/day × 20 workdays = 60 technician-hours/month.
   - Translate saved hours using real loaded labor cost or marginal booking contribution.

4. **Accounts Receivable Recovery**
   - Market signal: QuickBooks Canada currently promotes automated payment reminders, scheduled invoicing, payment-status updates, and reconciliation.
   - Demo math: $20,000 overdue × 10% accelerated collection = $2,000 accelerated cash.
   - This is cash timing, not incremental revenue.

5. **Maintenance Recall Engine**
   - Market signal: Housecall Pro's recent maintenance guidance emphasizes recurring reminders and automatic scheduling; its 2025 homeowner survey says 43% appreciate maintenance reminders.
   - Demo math: 500 due assets × 4% booked × $200 average service = $4,000 campaign revenue.
   - The 4% booking rate is a scenario assumption.

6. **Review + Referral Flywheel**
   - Market signal: Housecall Pro's 2025 growth playbook recommends automated review requests after completed jobs, customer segmentation, and automated follow-up.
   - No generic revenue number is shown because economics depend heavily on review conversion, referral conversion, customer value, and attribution.

## Safety / interpretation

- No template sends a live Striven mutation.
- **Test branch** stops at the first R2 action.
- **Dry run** and **Replay historical** simulate action nodes and continue end-to-end.
- A future business case should replace every demo assumption with tenant-specific volume, conversion, average value, labor cost, and margin data.
