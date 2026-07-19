# Footer and Classes Polish Design

## Goal

Make the landing-page footer easier to scan, simplify the Classes page around
the tutor's already-complete class catalogue, improve class-card readability,
and use evidence-based monthly fees for the ten live classes.

## Approved scope

### Landing footer

- Keep the existing four text links and destinations.
- Add a small outline icon before each label:
  - sparkles for Features;
  - route or steps for How it works;
  - user or login for Tutor login;
  - shield and question mark for Privacy and FAQ.
- Use inline decorative SVGs that inherit the link colour and are hidden from
  assistive technology. Link text remains the accessible name.
- Use one shared footer-link layout rule with consistent icon size, spacing,
  focus treatment, and mobile wrapping.

### Classes page

- Remove the Add class button and the class-creation entry point because the
  required Grade 10 and Grade 11 catalogue is already populated.
- Retain the existing class detail dialog for editing through Manage > Edit
  details. Existing enrolment, attendance, archive, and roster controls remain.
- Change the empty-state copy so it does not instruct the tutor to create a
  class.
- Increase vertical separation between class time, class name, availability
  label, and action row. The availability content and meaning do not change.
- Preserve responsive card layout and 44-pixel minimum interactive targets.

### Monthly fees

- Set every active live Grade 10 and Grade 11 class to LKR 1,200 per month.
- Apply the change incrementally to the existing rows; do not recreate classes
  or run the destructive baseline schema.
- Use one auditable data migration that targets the approved ten active class
  definitions owned by the demo tutor.
- Verify the affected class count and final fee values after applying it live.

The LKR 1,200 figure follows current EDUS listings for Grade 10 and its 2026
Grade 11 programme, which offer the same Maths, Science, English, Tamil, and
History group-class subjects at that monthly price.

## Validation

- Add or update frontend tests for footer icons, absence of Add class, retained
  edit access, and the revised class-card structure.
- Run frontend tests, backend tests, formatting checks, and the production
  build.
- Inspect the landing footer and Classes page at mobile and desktop widths,
  checking wrapping, spacing, overflow, focus visibility, and control sizes.
- Query live Supabase after the migration and confirm all ten approved active
  classes have `monthly_fee = 1200`.
- Commit and push only after all checks pass, then verify Git hash parity and
  both Vercel production deployments.

## Out of scope

- Adding or deleting subjects, grades, or class records.
- Changing attendance availability rules or status wording.
- Changing student enrolment, fee-payment, or attendance-record behaviour.
- Automatically deriving future prices from third-party websites.
