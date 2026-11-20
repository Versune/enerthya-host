## What

Describe the change and the smallest behavior it affects.

## Why

What problem is being solved? Include the author's use case and the user-facing pain, not just a
restatement of the title.

## User-visible behavior

What changes for someone using the panel? If nothing changes visibly, say so.

## Tests

- [ ] `npm ci && npm run typecheck`
- [ ] `npm run build`
- [ ] Manual check of the affected screen at 375 and 1440 (attach a screenshot for UI changes)
- [ ] For anything touching accounts or sessions: verified setup, sign-in, wrong password and
      cross-origin refusal still behave as before

Include the commands and results; do not mark a test that was not run.

## Limits and not covered

Failure modes, security boundaries, OS-specific behavior, and anything explicitly out of scope.

## Safety

- [ ] No passwords, session keys, account records or state-directory contents are included.
- [ ] The panel stays local: no third-party request, no telemetry, no widened bind.
- [ ] Documentation reflects any user-facing behavior or limitation.
