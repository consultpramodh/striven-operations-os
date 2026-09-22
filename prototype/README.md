# Workflow Lab Prototype

This isolated frontend prototype demonstrates the core Striven Operations OS workflow model without widening Stage 0 permissions.

## Prototype capabilities

- draggable modular workflow nodes;
- trigger, context, resolver, condition, action, validator, and recovery primitives;
- isolated **Test this step** execution;
- branch test, dry run, and historical replay;
- visible per-step API-call and duration receipts;
- first-class validation and human-review paths;
- an R2 mutation node that is deliberately simulated and blocked.

## Safety

This prototype makes no Striven API calls and requires no credentials. Stage 0 remains read-only: GET and explicitly verified Search operations only. Create, update, and delete business-record operations remain outside this prototype.

## Run

Open `prototype/workflow-lab.html` in a browser.
