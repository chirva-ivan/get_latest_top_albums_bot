const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const axios = require("axios");
const cheerio = require('cheerio');
const moment = require('moment');

const bot = new Telegraf(process.env.BOT_TOKEN);

const AMBIENT = 'ambient';
const ELECTRONIC = 'electronic';
const METAL = 'metal';
const POST_PUNK = 'post-punk';

bot.start((ctx) => {
  return ctx.replyWithHTML('Select some music', Extra.markup(
    Markup.keyboard([METAL, ELECTRONIC, AMBIENT, POST_PUNK])
  ))
});
bot.help((ctx) => ctx.reply('Select some music style'));

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

      // html parsing
      const result = html('.albumListRow')
        .map((index, domElement) => {
          const element = html(domElement);
          const title = element.find('.albumListTitle a').text();
          const date = element.find('.albumListDate').text();
          const rating = element.find('.scoreValue').text();

          return { title, date, rating }
        })
        .get()
        .sort((a, b) => {
          const dateFormat = 'MMMM D, YYYY';
          // sorting by release date
          return moment(b.date, dateFormat) - moment(a.date, dateFormat)
        })
        .map((item) => `<code>${item.title}</code>\n<i>${item.date} | Rating: ${item.rating}</i>`);

      return ctx.replyWithHTML(result.join('\n\n'));
    } catch (e) {
      console.error(e);
      return ctx.reply('try again later');
    }
  }
}

bot.startPolling();
