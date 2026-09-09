# WI-000 Project Bootstrap

~~~yaml
id: WI-000
title: Project Bootstrap
owner: R00
verifier: R07
orchestrator: R00
productOwner: User
status: IN_PROGRESS
priority: P0
dependencies: []
rolePlan: docs/governance/ROLE_PLAN.md
scope:
  in: [project-root-confirmation, local-git-init, ignore-rules, runtime-baseline, package-manager, docker-decision, governance-directories, baseline-build-test]
  out: [remote-repository, push, deployment, native-desktop-packaging, paid-provider-credentials]
realTestRequirements: RT-01, RT-05, RT-07
readinessStatus: READY for bootstrap; real media acceptance remains host-native
review: R07 must inspect files and rerun baseline commands
decision: Host-native web-first; DOCKER_MODE=none
artifacts: docs/governance/PROJECT_DISCOVERY.md, docs/governance/SOURCE_OF_TRUTH.md, docs/governance/ROLE_PLAN.md, docs/governance/REAL_TEST_READINESS.md
next: create the minimal typed app shell, then implement WI-002/WI-003 slice with TDD
lastUpdated: 2026-09-08
~~~

## Acceptance checklist

- [ ] Root confirmed as F:/CCPJ/CueCut3.
- [ ] Git initialized locally; no push or remote creation.
- [ ] Ignore/editor/runtime rules present.
- [ ] Docker mode documented as none.
- [ ] Baseline build/test commands recorded with exit codes.
- [ ] Verifier evidence written separately from implementation notes.

