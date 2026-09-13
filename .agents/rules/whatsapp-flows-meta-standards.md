# Meta WhatsApp Flows (v7.3) Rules & Standards

## 1. Multi-Step Screen Navigation & Data Models
- **Empty Navigate Payloads**: For `navigate` actions carrying user form fields forward, keep `payload: {}`. In Meta Flow JSON v4.0+, user inputs are accessed globally on subsequent screens via `${screen.<SOURCE_SCREEN>.form.<field_name>}`.
- **Data Model Schema Requirement**: If a `navigate` action passes any non-empty keys in `payload`, the destination screen's `data` property MUST declare schema for every single key with `type` and mandatory `__example__`:
  ```json
  "data": {
    "field_name": {
      "type": "string",
      "__example__": "sample_value"
    }
  }
  ```
  Failure to do so triggers the Meta error: `Following fields are missing in the next screen's data model: [...]`.
- **Dynamic Data References**: Any component referencing `${data.<field>}` requires that `<field>` be declared in the local screen's `data` model with an `__example__` property.

## 2. Screen State Machine Invariants
- **Non-Terminal Screens**:
  - `terminal: false`
  - MUST NOT have `success` property.
  - Footer action MUST be `navigate` (with valid target `next.name`) or `data_exchange`, NEVER `complete`.
- **Terminal Screen**:
  - `terminal: true`
  - `success: true`
  - Footer action MUST be `complete` (or `data_exchange`), NEVER `navigate`.

## 3. Screen IDs & Naming
- Screen IDs must match regex `^[A-Za-z_]+$`. No digits, hyphens, or special characters. Convert digits to English words (`_ONE_`, `_TWO_`).
- `SUCCESS` is a reserved Meta keyword and cannot be used as a screen ID.

## 4. Quality Validation Gate
- Always run pre-flight quality validation before saving drafts or uploading to Meta/Zernio.
- Prevent saving drafts with critical schema errors.
