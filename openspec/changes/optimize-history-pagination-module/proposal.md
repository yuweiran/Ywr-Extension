## Why

The current History panel keeps growing with no paging or bulk operations, which makes it difficult to scan and maintain when many entries accumulate. This change is needed now to improve usability in limited sidebar width while preserving fast cleanup operations.

## What Changes

- Convert the History panel to a fixed-height, paginated list to keep layout stable and readable.
- Limit rendered/stored history items in the panel workflow to the most recent 100 entries.
- Keep single-item delete behavior.
- Add a "clear all" action for one-click full cleanup of history entries in the panel scope.
- Improve long URL/title rendering with ellipsis when text exceeds available width.
- Add hover behavior to reveal full history text for truncated entries.

## Capabilities

### New Capabilities
- `history-panel-pagination-management`: Provides paginated browsing, capped item count, single delete, clear-all action, and overflow/hover behavior for the History panel.

### Modified Capabilities
- None.

## Impact

- Affected UI markup in tab page History section.
- Affected History rendering and event handling logic in tab page declare/execute modules.
- Affected History styles in tab page CSS for fixed-height viewport, pagination controls, truncation, and hover display.
- Potentially affected data lifecycle when enforcing 100-item cap and clear-all behavior.
