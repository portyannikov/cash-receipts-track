const { Markup } = require("telegraf");
const { normalizeIbanInput, validateIban } = require("./validators");

const IBAN_PROBLEM_ACTION = "iban_problem";

const ACTIONS = {
  FULL_NAME: "full_name",
  IBAN: "iban",
  IBAN_PROBLEM: "iban_problem",
  TAX_ID: "tax_id",
  PHONE: "phone",
}

const IBAN_PROMPT =
  "Будь ласка, введіть свій IBAN (має починатися з UA, без пробілів).\n\n" +
  "Якщо ви не можете його надати, натисніть кнопку нижче.";

const IBAN_PROBLEM_PROMPT =
  "Будь ласка, опишіть своїми словами, у чому полягає проблема та чому ви " +
  "не можете надати свій IBAN.";

const ibanKeyboard = Markup.inlineKeyboard([
  Markup.button.callback(
    "❗ У мене проблема з моїм IBAN",
    IBAN_PROBLEM_ACTION,
  ),
]);

const summaryText = (data) => {
  return (
    "Будь ласка, підтвердіть свої дані.:\n\n" +
    `ПІБ: ${data.full_name || "-"}\n` +
    `IBAN: ${data.iban || "-"}\n` +
    `Примітка про проблему з IBAN: ${data.iban_problem || "-"}\n` +
    `Ідентифікаційний	код: ${data.tax_id || "-"}\n` +
    `Телефон: ${data.phone || "-"}\n\n` +
    "Відправте /confirm для підтвердження, або /start, щоб заповнити форму знову"
  );
};

const registerHandlers = (bot, mqPublisher) => {
  bot.start(async (ctx) => {
    ctx.session.step = "full_name";
    ctx.session.data = {};
    await ctx.reply("Привіт! Давайте заповнимо форму.\n\nБудь ласка, введіть своє повне ім'я.");
  });

  bot.action(IBAN_PROBLEM_ACTION, async (ctx) => {
    if (ctx.session.step !== "iban") {
      await ctx.answerCbQuery();
      return;
    }
    ctx.session.data.iban = null;
    ctx.session.step = "iban_problem";
    await ctx.answerCbQuery();
    await ctx.reply(IBAN_PROBLEM_PROMPT);
  });

  bot.command("confirm", async (ctx) => {
    if (ctx.session.step !== "confirm") {
      return;
    }

    const now = new Date();
    const data = ctx.session.data;
    
    const payload = {
      "Platform": "telegram",
      "Full Name": data.full_name || null,
      "IBAN": data.iban || null,
      "IBAN Problem": data.iban_problem || null,
      "Tax ID": data.tax_id || null,
      "Phone": data.phone || null,
      "Submitted date": now.toISOString(),
    }

    try {
      await mqPublisher.publishSubmission(payload);
    } catch (error) {
      console.error("Failed to publish submission to RabbitMQ:", err);
      await ctx.reply("Під час надсилання даних сталася помилка. Спробуйте ще раз пізніше.");
      return;
    }

    ctx.session.step = null;
    ctx.session.data = {};
    await ctx.reply("Дякуємо! Вашу заявку отримано.");
  });

  bot.on("text", async (ctx) => {
    const step = ctx.session.step;
    const text = ctx.message.text;

    if (text.startsWith("/")) return;

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
        ctx.session.data.iban = normalized;
        ctx.session.data.iban_problem = null;
        ctx.session.step = ACTIONS.TAX_ID;
        await ctx.reply("Будь ласка, введіть свій ідентифікаційний код.");
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
        ctx.session.step = ACTIONS.PHONE;
        await ctx.reply("Будь ласка, введіть номер свого мобільного телефону.");
        break;
      }

      case ACTIONS.PHONE: {
        ctx.session.data.phone = text;
        ctx.session.step = "confirm";
        await ctx.reply(summaryText(ctx.session.data));
        break;
      }

      default: {
        await ctx.reply("Будь ласка, надішліть /start, щоб розпочати заповнення форми.");
      }
    }
  });
}

module.exports = { registerHandlers };