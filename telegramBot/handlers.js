const { Markup } = require("telegraf");
const { normalizeIbanInput, validateIban, getMfis } = require("./validators");

const ACTIONS = {
  FULL_NAME: "full_name",
  IBAN: "iban",
  IBAN_PROBLEM: "iban_problem",
  TAX_ID: "tax_id",
  TAX_ID_PROBLEM: "tax_id_problem",
  PHONE: "phone",
}

const IBAN_PROMPT =
  "Будь ласка, введіть свій IBAN (має починатися з UA, без пробілів).\n\n" +
  "Якщо ви не можете його надати, натисніть кнопку нижче.";

const IBAN_PROBLEM_PROMPT =
  "Будь ласка, опишіть своїми словами, у чому полягає проблема та чому ви " +
  "не можете надати свій IBAN.";

const TAX_ID_PROBLEM_PROMPT =
  "Будь ласка, опишіть своїми словами, у чому полягає проблема та чому ви " +
  "не можете надати свій ідентифікаційний код.";

const ibanKeyboard = Markup.inlineKeyboard([
  Markup.button.callback(
    "❗ У мене проблема з моїм IBAN",
    ACTIONS.IBAN_PROBLEM,
  ),
]);

const TaxIdKeyboard = Markup.inlineKeyboard([
    Markup.button.callback(
    "❗ У мене проблема з моїм ідентифікаційним кодом",
    ACTIONS.TAX_ID_PROBLEM,
  ),
])

const CONFIRM_ACTION = 'confirm_submission';
const RESTART_ACTION = 'restart_form';

const confirmKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('✅ Підтвердити', CONFIRM_ACTION)],
  [Markup.button.callback('🔁 Заповнити заново', RESTART_ACTION)],
]);

const summaryText = (data) => {
  return (
    "Будь ласка, підтвердіть свої дані:\n\n" +
    `ПІБ: ${data.full_name || "-"}\n` +
    `IBAN: ${data.iban || "-"}\n` +
    `Примітка про проблему з IBAN: ${data.iban_problem || "-"}\n` +
    `Ідентифікаційний	код: ${data.tax_id || "-"}\n` +
    `Примітка про проблему з ідентифікаційним	кодом: ${data.tax_id_problem || "-"}\n` +
    `Телефон: ${data.phone || "-"}\n\n`
  );
};

const registerHandlers = (bot, mqPublisher) => {
  bot.start(async (ctx) => {
    ctx.session.step = "full_name";
    ctx.session.data = {};
    await ctx.reply("Привіт! Давайте заповнимо форму.\n\nБудь ласка, введіть своє повне ім'я.");
  });

  bot.action(ACTIONS.IBAN_PROBLEM, async (ctx) => {
    if (ctx.session.step !== "iban") {
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.data.iban = null;
    ctx.session.step = "iban_problem";
    await ctx.answerCbQuery();
    await ctx.reply(IBAN_PROBLEM_PROMPT);
  });

  bot.action(ACTIONS.TAX_ID_PROBLEM, async (ctx) => {
    if (ctx.session.step !== ACTIONS.TAX_ID) {
      await ctx.answerCbQuery();
      return;
    }

    ctx.session.data.tax_id = null;
    ctx.session.step = ACTIONS.TAX_ID_PROBLEM;

    await ctx.answerCbQuery();
    await ctx.reply(TAX_ID_PROBLEM_PROMPT);
  });

  bot.action(CONFIRM_ACTION, async (ctx) => {
    if (ctx.session.step !== 'confirm') {
      await ctx.answerCbQuery();
      return;
    }

    const now = new Date();
    const data = ctx.session.data;
    
    const payload = {
      "Platform": "telegram",
      "Full Name": data.full_name || null,
      "IBAN": data.iban || null,
      "Bank Name": data.bankName || null,
      "IBAN Problem": data.iban_problem || null,
      "Tax ID": data.tax_id || null,
      "Tax ID problem": data.tax_id_problem || null,
      "Phone": data.phone || null,
      "Submitted date": now.toISOString(),
    }

    try {
      await mqPublisher.publishSubmission(payload);
    } catch (error) {
      console.error("Failed to publish submission to RabbitMQ:", error);
      await ctx.reply("Під час надсилання даних сталася помилка. Спробуйте ще раз пізніше.");
      return;
    }

    ctx.session.step = null;
    ctx.session.data = {};
    await ctx.answerCbQuery();
    await ctx.reply("Дякуємо! Вашу заявку отримано.");
  });

  bot.action(RESTART_ACTION, async (ctx) => {
    ctx.session.step = 'full_name';
    ctx.session.data = {};
    await ctx.answerCbQuery();
    await ctx.reply("Добре, почнімо заново.\n\nВведіть ваше повне ім'я.");
  });

  bot.on("text", async (ctx) => {
    const step = ctx.session.step;
    const text = ctx.message.text;

    if (text.startsWith("/")) return;
    
    const response = await fetch("https://bank.gov.ua/NBU_BankInfo/get_data_branch?typ=0&json");
    const banks = await response.json();


    switch(step) {
      case ACTIONS.FULL_NAME: {
        ctx.session.data.full_name = text;
        ctx.session.step = ACTIONS.IBAN;
        await ctx.reply(IBAN_PROMPT, ibanKeyboard);
        break;
      }

      case ACTIONS.IBAN: {
        const normalized = normalizeIbanInput(text);
        const { valid, error } = validateIban(normalized);
        if (!valid) {
          await ctx.reply(`${error}\n\n${IBAN_PROMPT}`, ibanKeyboard);
          return;
        }
        const mfis = getMfis(normalized);
        const bank = banks.find(bank => String(bank.MFO) === String(mfis));
        if (bank) {
          ctx.session.data.bankName = bank.SHORTNAME;
        }

        ctx.session.data.iban = normalized;
        ctx.session.data.iban_problem = null;
        ctx.session.step = ACTIONS.TAX_ID;
        await ctx.reply("Будь ласка, введіть свій ідентифікаційний код.", TaxIdKeyboard);
        break;
      }

      case ACTIONS.IBAN_PROBLEM: {
        ctx.session.data.iban_problem = text;
        ctx.session.step = ACTIONS.TAX_ID;
        await ctx.reply("Будь ласка, введіть свій ідентифікаційний код.");
        break;
      }

      case ACTIONS.TAX_ID: {
        ctx.session.data.tax_id = text;
        ctx.session.data.tax_id_problem = null;
        ctx.session.step = ACTIONS.PHONE;
        await ctx.reply("Будь ласка, введіть номер свого мобільного телефону.");
        break;
      }

      case ACTIONS.TAX_ID_PROBLEM: {
        ctx.session.data.tax_id_problem = text;
        ctx.session.step = ACTIONS.PHONE;
        await ctx.reply("Будь ласка, введіть номер свого мобільного телефону.");
        break;
      }

      case ACTIONS.PHONE: {
        ctx.session.data.phone = text;
        ctx.session.step = "confirm";
        await ctx.reply(summaryText(ctx.session.data), confirmKeyboard);
        break;
      }

      default: {
        await ctx.reply("Будь ласка, надішліть /start, щоб розпочати заповнення форми.");
      }
    }
  });
}

module.exports = { registerHandlers };