## 1. History UI Structure

- [x] 1.1 Update History section markup to include fixed-height list viewport and pagination controls.
- [x] 1.2 Add a clear-all action control in the History module and wire confirmation UX entry point.

## 2. History Data and Pagination Logic

- [x] 2.1 Add History page state (current page, page size, total pages) in the section module.
- [x] 2.2 Enforce recent-100 cap before rendering and slice entries by current page.
- [x] 2.3 Recompute and clamp pagination state after single-item delete and clear-all operations.

## 3. Deletion Behaviors

- [x] 3.1 Keep existing single-item delete behavior working correctly with paged data indices.
- [x] 3.2 Implement clear-all flow to remove all History entries in panel scope and refresh to empty state.

## 4. Styling and Overflow Handling

- [x] 4.1 Add CSS for fixed-height History viewport and stable pagination layout in sidebar width constraints.
- [x] 4.2 Apply text-overflow ellipsis styles for long History text and preserve row alignment.
- [x] 4.3 Add hover full-text reveal behavior (for example title attribute or equivalent) for truncated entries.

## 5. Validation

- [ ] 5.1 Manually verify pagination transitions, including first/last-page boundaries.
- [ ] 5.2 Manually verify cap behavior with datasets below, at, and above 100 entries.
- [ ] 5.3 Manually verify single delete, clear-all confirm/cancel, and truncation hover behavior.
