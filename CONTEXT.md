# BibleQuiz.com Domain Context

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
- **Merge** — Combine duplicate churches (at Church scope) or duplicate people (at People scope)
- **Impersonate** — Become another user (People scope only, requires Organization admin without competition type restriction)

### Impersonation

Impersonation is **only available at the People scope** and **only to users with Organization-level admin permissions without competition type restriction**.

When impersonating:
- User gains access as if they were the impersonated person
- User's name appears in all logs
- A stop button appears in the banner to end impersonation
- Cannot impersonate another user while impersonating
- Cannot modify permissions while impersonating

Navigation after impersonation: Redirect to homepage (`/`) to refresh and load impersonated user's context.

### Authorization

**Menu item visibility** — "Permissions" appears in the user menu only if the user has at least **Church-level** administrative permissions.

**Page access** — The Permissions page is protected; only accessible to users with at least Church-level admin permissions.

**Merge & Impersonate visibility** — Only shown/enabled for users with **Organization-level** permissions **without** a competition type restriction.
