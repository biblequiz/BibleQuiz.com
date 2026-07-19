# BibleQuiz.com Domain Context

## People & Identity

**Person** — The registration system record for an individual. Stores personal details (first name, last name, email, date of birth, phone, address, church assignment), competition type preference, and notification settings. Managed via the People API. A Person may or may not be a user.

**Account Profile** — The browser-side representation of the authenticated session. Derived from the auth token and a profile API call; not stored server-side. Contains the linked Person ID, display name, permission grants, and session state. Distinct from Person: Account Profile is about auth and permissions, Person is about identity and registration data.

**Competition Type** — Currently two values: JBQ (Junior Bible Quiz, id `agjbq`) and TBQ (Teen Bible Quiz, id `agtbq`). Used to restrict permissions and set a person's default event type preference. Not expected to expand.

## Permissions & Administration

### Core Concepts

**Permission Scope** — The hierarchical level at which administrative permissions are granted:
- **Organization** — System-wide admin
- **Region** — Admin for a geographic region
- **District** — Admin for a sub-region within a region
- **Church** — Admin for a specific church

**Permission Type** — Currently only `Administrator` (future extensibility for other types)

**Competition Type Restriction** — Optional constraint on permissions. When set, restricts the admin's authority to only that competition type (JBQ or TBQ). When null, the admin has authority over all competition types.

### Permission Workflows

**Scope-based view** — At each scope level, show people with Administrator permissions at that scope:
- Organization/Region/District: Show people who are admins at that scope, with optional competition type restrictions
- Church: Show churches (entities, not people), with access to people permissions for each church
- People: Show people (for merging and basic management)

**Capabilities by scope:**
- **Add** — Grant new Administrator permissions at the current scope
- **Modify** — Change the competition type restriction
- **Remove** — Delete existing permissions
- **Edit Person** — At People scope, edit a person's profile details (including church assignment)
- **Merge** — Combine duplicate churches (at Church scope) or duplicate people (at People scope)
- **Impersonate** — Become another user (People scope only, requires Organization admin without competition type restriction)

**Merge workflow (people and churches)**
- User selects two candidates, then chooses the **survivor** at merge time.
- For conflicting properties, user chooses the resulting value using a merge drop-down style selector per field.
- Default survivor is the first selected candidate.
- Field defaults are value-aware: when one side is null/empty and the other has a value, default to the non-null/non-empty value.
- Address fields are treated as a unit for defaulting decisions.
- If both candidates have partial-but-different address data, default all address values from the first selected candidate.
- No additional defaulting exceptions beyond grouped address behavior.
- When both values are non-empty and different, always show an explicit selector.
- Equal fields (after normalization) are hidden by default, with a count summary and optional toggle to show all fields.
- Field selections can come from either candidate regardless of which candidate is selected as survivor.
- Merge is blocked in the UI when resolved values violate required or format validation rules.
- Backend merge API contract is unchanged: submit a resolved survivor object and pass the losing record id as merge id (`mid`).
- Empty normalization rules:
	- `null`, `undefined`, and whitespace-only strings are treated as empty.
	- Numeric fields treat missing/invalid values as empty.
	- Object fields treat missing identifiers as empty.

**People merge fields (legacy parity)**
- Per-field selection is required for: first name, last name, email, date of birth, phone number, church, street address, and city/state/zip.

**Church merge fields (legacy parity)**
- Per-field selection is required for: name, district, street address, city, state, and zip.
- Selector behavior matches people merges: only show field selectors when values differ, default selection to the first candidate, allow explicit override.
- People and church merge parity ship together in the same release.

**Merge selector UX**
- Use a three-option segmented selector per field (first candidate vs second candidate vs manual entry), not a plain drop-down.
- Show source badges for each side (First, Second).
- Manual entry reuses the original field semantics for that field type rather than generic free-text inputs.
- Support keyboard navigation with radio-group style semantics.
- Long values should remain readable (wrapping/truncation with hover reveal as needed).
- Address uses one combined selector (First address vs Second address vs Manual Entry).
- Address manual entry reveals editable street/city/state/zip controls only when Manual Entry is selected for that field.
- Equal fields remain hidden by default; manual entry for those fields is available after explicitly showing unchanged fields.
- Person church manual entry uses the same church-selection behavior as PersonDialog, not free-text church naming.
- Church district manual entry allows choosing any valid district in the system.
- Church manual entry preserves the original state-to-district constraint: state selection limits valid district choices.
- Manual-entry values persist while toggling between source options within the same review session.
- Person manual address may be completely blank or fully complete; church manual address must be fully complete.
- For optional person fields, a blank manual-entry value clears the field.
- The first switch into manual entry prefills from the field's currently selected source value.
- Manual entry does not bypass required-field validation; required fields must still resolve to valid values.
- Merge success feedback uses a generalized completion message rather than per-source selection counts.
- Merge review is dirty only when the resolved merge result differs from the current computed defaults; presentational toggles do not make it dirty.
- Dirty merge review uses discard confirmation on all close paths.
- Changing the survivor resets field selections and manual-entry values to fresh defaults for that survivor choice.
- Reset to Defaults fully restores the current survivor's computed defaults and clears dirty state.
- Merge review validation runs on Continue rather than on every edit.
- Validation errors clear when the user makes a relevant edit after a failed Continue attempt.
- Entering manual mode without changing the resolved value does not make merge review dirty.
- Candidate picking stays in the panel; field-level merge decisions happen in a dedicated merge-review dialog.
- Merge submission uses two steps: review dialog first, then final irreversible confirmation modal.
- After successful merge, refresh local state in-place (preserve filters/page position) rather than full-page reload.
- Changing the survivor selector overwrites previously selected field values with the newly computed defaults.
- Review dialog includes a Reset to Defaults action that recomputes all field selections from current defaults.

### Impersonation

Impersonation is **only available at the People scope** and **only to users with Organization-level admin permissions without competition type restriction**.

When impersonating:
- User gains access as if they were the impersonated person
- User's name appears in all logs
- A stop button appears in the banner to end impersonation
- Cannot impersonate another user while impersonating
- Cannot modify permissions while impersonating
- Permissions administration is unavailable until impersonation is stopped

Navigation after impersonation: Redirect to homepage (`/`) to refresh and load impersonated user's context.

### Authorization

**Menu item visibility** — "Permissions" appears in the user menu only if the user has at least **Church-level** administrative permissions.

**Payout Manager** — A season-level finance workflow for reconciling payouts and site fees across events. Access is controlled by the dedicated `isPayoutManager` account-profile capability (not by scope-based administrator permissions).

**Page access** — The Permissions page is protected; only accessible to users with at least Church-level admin permissions.

**Merge & Impersonate visibility** — Only shown/enabled for users with **Organization-level** permissions **without** a competition type restriction.
