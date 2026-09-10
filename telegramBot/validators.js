const UA_IBAN_LENGTH = 29;
const UA_IBAN_PATTERN = /^UA\d{27}$/;

const normalizeIbanInput = (raw) => {
  return (raw || "").trim().toUpperCase();
}

/**
 * @param {string} value
 * @returns {{ valid: boolean, error: string|null }}
 */
const validateIban = (value) => {
  if (value.includes(" ") || value.includes("\t")) {
    return { valid: false, error: "IBAN не повинен містити пробілів. Будь ласка, введіть його як один безперервний рядок." };
  }

  if (!value.startsWith("UA")) {
    return { valid: false, error: "IBAN має починатися з «UA»." };
  }

  if (value.length !== UA_IBAN_LENGTH) {
    return { valid: false, error: `IBAN має складатися рівно з ${UA_IBAN_LENGTH} символів (ваш — ${value.length}).` };
  }

  if (!UA_IBAN_PATTERN.test(value)) {
    return { valid: false, error: "IBAN має починатися з «UA», а потім 27 цифр." };
  }

  return { valid: true, error: null };
}

const validateTaxId = (value) => {
  if (value.length === 10) {
    return { valid: true, error: null }
  }

  return { valid: false, error: "Індентифікаційний код поминен містити 10 символів" };
}

module.exports = { normalizeIbanInput, validateIban, validateTaxId, UA_IBAN_LENGTH };