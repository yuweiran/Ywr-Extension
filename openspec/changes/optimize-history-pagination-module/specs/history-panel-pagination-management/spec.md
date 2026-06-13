## ADDED Requirements

### Requirement: History Panel Uses Fixed-Height Paginated Layout
The system SHALL render the History panel within a fixed-height viewport and SHALL present history entries in discrete pages.

#### Scenario: Initial history render uses pagination
- **WHEN** the History panel is rendered with one or more history entries
- **THEN** the system shows only entries for the current page within a fixed-height list area

#### Scenario: User navigates between pages
- **WHEN** the user activates next or previous page control
- **THEN** the system updates the list to the target page and keeps the panel height unchanged

### Requirement: History Panel Retains At Most 100 Recent Entries
The system SHALL enforce a maximum of 100 history entries for the History panel dataset and SHALL keep the most recent 100 entries.

#### Scenario: Incoming history dataset exceeds maximum
- **WHEN** more than 100 entries are available for rendering
- **THEN** the system retains only the most recent 100 entries and excludes older entries from panel rendering

#### Scenario: Incoming history dataset is within maximum
- **WHEN** 100 or fewer entries are available for rendering
- **THEN** the system renders all available entries without dropping any

### Requirement: History Entries Support Single Delete
The system SHALL allow users to delete an individual history entry from the History panel.

#### Scenario: Delete one history entry
- **WHEN** the user triggers delete on a specific history entry
- **THEN** the system removes only that entry and refreshes pagination state to a valid page

### Requirement: History Panel Supports Clear-All Action
The system SHALL provide a clear-all action that removes all history entries shown in the History panel scope.

#### Scenario: Clear-all is confirmed
- **WHEN** the user triggers clear-all and confirms the action
- **THEN** the system removes all history entries and shows the empty-state History panel

#### Scenario: Clear-all is canceled
- **WHEN** the user triggers clear-all and cancels confirmation
- **THEN** the system keeps all history entries unchanged

### Requirement: Long History Text Is Truncated With Hover Reveal
The system SHALL truncate history link text that exceeds available row width using ellipsis and SHALL expose full text on hover.

#### Scenario: Entry text exceeds row width
- **WHEN** a history entry text is longer than available display width
- **THEN** the row displays truncated text with ellipsis and preserves layout width

#### Scenario: User hovers truncated text
- **WHEN** the user hovers a truncated history entry text
- **THEN** the system reveals the full text content via hover-accessible detail
