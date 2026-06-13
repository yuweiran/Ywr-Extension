## Context

The tab page right sidebar currently renders history entries as a continuously growing list. The sidebar has limited width and vertical space, so long text and many records degrade readability and interaction quality. Existing behavior supports per-item deletion, but there is no paging or bulk cleanup. The change must fit the current global-script architecture and keep behavior predictable for users who rely on recent-history visibility.

## Goals / Non-Goals

**Goals:**
- Introduce a fixed-height History viewport so the sidebar layout remains stable.
- Provide pagination controls for browsing history records in pages.
- Cap active History records to the most recent 100 items.
- Preserve single-item delete and add clear-all operation.
- Ensure long text is truncated with ellipsis and full content is visible on hover.
- Keep implementation compatible with current tab declare/execute module split.

**Non-Goals:**
- Redesigning the Tabs section.
- Changing browser-native history collection behavior beyond this panel's display and cleanup scope.
- Introducing new frameworks, build tooling, or external dependencies.

## Decisions

1. Fixed-height viewport with client-side pagination.
- Decision: Render history in a constrained container with overflow hidden in list items and explicit page state (current page, page size).
- Rationale: Preserves sidebar geometry and avoids performance drops from rendering many rows at once.
- Alternative considered: Infinite scroll.
- Why not: Harder to reason about in narrow sidebars and less controllable for deterministic page jumps.

2. Enforce recent-item cap at 100.
- Decision: Keep only the newest 100 entries in panel state and remove/ignore older entries from panel-managed dataset.
- Rationale: Meets requirement directly and bounds memory/render cost.
- Alternative considered: Configurable cap.
- Why not: Adds settings surface and complexity not required by the request.

3. Keep per-item delete and add clear-all action in History header/footer controls.
- Decision: Retain existing single delete event path and introduce a separate clear-all control with confirmation.
- Rationale: Supports both precise and bulk maintenance while reducing accidental destructive actions.
- Alternative considered: Immediate clear-all without confirmation.
- Why not: High risk of accidental data loss.

4. Overflow handling via CSS ellipsis plus hover reveal.
- Decision: Use single-line truncation with text-overflow ellipsis; expose full content through native title tooltip or equivalent hover detail.
- Rationale: Minimal implementation risk and works in current architecture without additional popup systems.
- Alternative considered: Multi-line clamping and custom tooltip component.
- Why not: More complex styling and interaction overhead for limited benefit.

5. Pagination recalculation on mutations.
- Decision: After delete or clear-all, recalculate total pages and clamp current page to valid bounds before re-render.
- Rationale: Prevents empty/invalid page states.
- Alternative considered: Hard reset to page 1 on any mutation.
- Why not: Degrades UX when deleting a single item on later pages.

## Risks / Trade-offs

- [Risk] History source may return entries with inconsistent text fields (title/url). -> Mitigation: Normalize display text with fallback order and safe empty handling.
- [Risk] Cap enforcement may remove entries users expected to see. -> Mitigation: Document "recent 100" behavior in capability spec and UI labeling if needed.
- [Risk] Clear-all is destructive. -> Mitigation: Add confirmation step and immediate UI/state synchronization.
- [Risk] Hover reveal using title attribute may be limited on touch devices. -> Mitigation: Keep primary truncation readable; on touch, full text remains accessible through entry interaction target behavior.

## Migration Plan

- Add UI controls and styles for fixed-height list, pagination bar, and clear-all action.
- Update history render pipeline to apply cap, page slicing, and mutation-safe page recalculation.
- Keep existing single-delete hooks and adapt to paged dataset indices.
- Validate behavior manually: empty state, exactly 100 records, >100 input, delete on last page, clear-all from any page, truncation hover.
- Rollback strategy: revert to previous non-paginated renderer and remove new controls if regressions occur.

## Open Questions

- Should clear-all operate only on panel-cached history entries or invoke full browser-history deletion scope?
- What page size gives best readability in the current sidebar dimensions (for example 10 vs 12)?
- Should the UI expose total-count text (for example "100 / 100") to make cap behavior explicit?
