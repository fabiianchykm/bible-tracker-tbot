const { Telegraf } = require('telegraf');

const bot = new Telegraf('7947525147:AAFGXxKlWWCDCTVd5vqyw5ssrB69BRE_K_Y');
const users = new Set(); // замість бази, для прикладу

bot.start((ctx) => {
  const userId = ctx.from.id;
  if (!users.has(userId)) {
    users.add(userId);
    ctx.reply(`👋 Вітаю, ${ctx.from.first_name}! Радий бачити тебе вперше.`);
  } else {
    ctx.reply(`👋 Знову привіт, ${ctx.from.first_name}!`);
  }
});

bot.telegram.setChatMenuButton({
  menu_button: {
    type: "web_app",
    text: "Відкрити додаток",
    web_app: {
      url: "https://google.com"
    }
  }
});

bot.start((ctx) => ctx.reply('Привіт! Я твій Telegram-бот 👋'));
bot.help((ctx) => ctx.reply('Надішли /start щоб почати'));

bot.command('hello', (ctx) => ctx.reply('Привіт від твого бота!'));

bot.on('text', (ctx) => {
  ctx.reply(`Ти написав: ${ctx.message.text}`);
});


bot.launch();

console.log('Бот запущено...');