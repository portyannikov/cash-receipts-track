# Chatbot – Technical Specification

## Platform Priority

The chatbot should be built for the following platforms, in order of priority:

1. Signal
2. WhatsApp
3. Telegram
4. Viber

## Functionality

### 1. Input Form

When a user enters the chat, they immediately see the following fields to fill in:

| # | Field | Notes |
|---|-------|-------|
| a | Full name | No validation — user may enter anything or leave blank |
| b | IBAN | **Validated**: checks character count/correctness for a valid IBAN; spaces are not allowed; field is pre-filled with `UA` |
| c | Tax ID (Identification code) | No validation — character count only *(to be defined — see open question below)* |
| d | Mobile phone | No validation |
| e | "I have a problem" | Field is pre-filled with placeholder text; on focus/click the text disappears and the user types their own explanation: *"Please describe in your own words what the problem is and why you cannot provide your IBAN."* No validation *(character limit — to be defined)* |

> **Note:** Fields **a, c, d, e** have no input validation — the user may enter anything, invalid data, or leave them empty. Only field **b (IBAN)** is validated.

### 2. Submit Button

- A "Send" (Відправити) button submits the form.
- On submission, the system also records: **date, time, and seconds (timestamp)**.

### 3. Data Export Format

The submitted data is sent/stored in a structured format. Options under consideration:

- a. Excel file (`.xlsx`)
- b. CSV file, semicolon (`;`) delimited
- c. Other formats — *TBD*

### 4. Data Storage / Append Logic

- On submission, the data is appended as a new row/line to a file located at a URL on the technical site's domain.
- If the file already exists → new entry is appended as the next line.
- If the file does not exist → a new file is created and the entry becomes the first line.

---

## Out of Scope (Post-Chatbot Process)

### 5. Data Retrieval

- The file is periodically retrieved from the domain.
- Retrieved data is then processed into the brigade's internal record-keeping / accounting systems.

---

## Open Questions

- [ ] Exact character-count validation rules for the **Tax ID (Identification code)** field
- [ ] Character limit (if any) for the **"I have a problem"** free-text field
- [ ] Final decision on export format (Excel vs. CSV vs. other)
- [ ] Frequency/method of periodic file retrieval for step 5