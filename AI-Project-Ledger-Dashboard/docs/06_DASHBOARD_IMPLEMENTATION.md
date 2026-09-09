# Dashboard Implementation Notes

The React app consumes one aggregate snapshot and has seven views: Overview, Tasks, Blockers, Activity, Roles, Artifacts and Settings. Task cards always show status text plus an icon/accessible label and a 4px status bar; colors are fixed by the PRD. V1 only writes the Dashboard project registry and migration/init operations, never task status/progress/role/session.
