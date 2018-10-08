const axios = require("axios");
const cheerio = require('cheerio');
const moment = require('moment');
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

const bot = new Telegraf(process.env.BOT_TOKEN);

const METAL = 'metal';
const ELECTRONIC = 'electronic';
const AMBIENT = 'ambient';
const POST_PUNK = 'post-punk';

bot.start((ctx) => {
  return ctx.replyWithHTML('Select some music', Extra.markup(
    Markup.keyboard([METAL, ELECTRONIC, AMBIENT, POST_PUNK])
  ))
});
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('sticker', (ctx) => ctx.reply('👍'));

bot.hears(METAL, getContent('https://www.albumoftheyear.org/genre/40-metal/2018/', METAL));
bot.hears(ELECTRONIC, getContent('https://www.albumoftheyear.org/genre/6-electronic/2018/', ELECTRONIC));
bot.hears(AMBIENT, getContent('https://www.albumoftheyear.org/genre/34-ambient/2018/', AMBIENT));
bot.hears(POST_PUNK, getContent('https://www.albumoftheyear.org/genre/23-post-punk/2018/', POST_PUNK));

function getContent(url, type) {
  return async (ctx) => {
    try {
      ctx.reply(`loading some ${type}...`);
      const response = await axios.get(url);
      const html = cheerio.load(response.data);

      const result = html('.albumListRow')
        .map((index, domElement) => {
          const element = html(domElement);
          const title = element.find('.albumListTitle a').text();
          const date = element.find('.albumListDate').text();
          const rating = element.find('.scoreValue').text();

          return {title, date, rating}
        })
        .get()
        .sort((a, b) => {
          const dateFormat = 'MMMM D, YYYY';
          return moment(b.date, dateFormat) - moment(a.date, dateFormat)
        })
        .map((item) => `${item.title} | ${item.date} | ${item.rating}`);

      return ctx.reply(result.join('\n'));
    } catch (e) {
      console.error(e);
      return ctx.reply('try again later');
    }
  }
}

bot.startPolling();
