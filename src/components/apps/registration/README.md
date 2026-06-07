# Registration Experience

A React-based registration UI for BibleQuiz.com, hosted at `/register/event/#/<eventId>` (and `/register/event/#/<eventId>/<churchId>` once a church has been selected).

## Architecture

```
src/pages/register/event.astro              # Astro entry point
src/components/apps/registration/
  RegistrationRoot.tsx                      # Hash router + ProtectedRoute
  RegistrationProvider.tsx                  # Loads event/church/registration into outlet context
  RegistrationPage.tsx                      # Main page (sections for teams / individuals / officials / attendees)
  ChurchSelectorDialog.tsx                  # Lists administered churches, can add new
  TeamRegistrationDialog.tsx                # Edit a single team (name, division, fields, quizzers, coaches)
  RegistrationPersonDialog.tsx              # Edit a quizzer / coach / individual / official / attendee
  PersonCardDeck.tsx                        # Reusable card-deck for a list of people
  RegistrationFieldsGrid.tsx                # Wrapper around EventFieldControl in a label/control grid
  hooks/useEscapeToClose.ts                 # Capture-phase Escape handler (innermost dialog wins)
```

## Out-of-Scope / Future Work

The following pieces from the legacy `Registration.Web` `RegistrationPage` are intentionally not in v1.
Track each here so it doesn't get lost:

- [ ] **"Copy from Previous Event"** / clone teams between events
- [ ] **Forms / Waiver completion tracking** (`RegistrationForm[]`, completed-date capture)
- [ ] **E-mail event coordinator** dialog (uses `EmailService`)
- [ ] **Automated payment (Stripe) "Pay" button** that redirects to `/api/Registration/Pay`
- [ ] **Receipt page** navigation button (`/Registration/{eventId}/{churchId}/Receipt`)
- [ ] **Report page** navigation button (`/Registration/{eventId}/{churchId}/Report`)
- [ ] **Event-admin override** support (`isEventAdministrator` / `redirectToAdminView` flags)
- [ ] **Person merge/duplicate detection** when adding a new person
- [ ] **Custom waiver pages** (`WaiverPage`)
- [ ] **Authorize page** for sharing church admin (`AuthorizePage`)
- [ ] **Update `EventCard.tsx`** to link to `/register/event/#/<eventId>` instead of the legacy
      `registration.biblequiz.com` URL — do this after the new flow is validated in production.

## Escape-Key Semantics for Nested Dialogs

Each dialog registers a capture-phase `keydown` listener via `useEscapeToClose`.
On `Escape`, it calls `e.preventDefault() + e.stopImmediatePropagation() + onClose()`.
Because React effects run in mount order, the most recently mounted (innermost)
dialog's listener is registered last; since it calls `stopImmediatePropagation`
in capture phase, only the topmost dialog actually closes. Verified against the
existing pattern in `apps/event/scoring/meets/SeedFromDivisionsDialog.tsx`.