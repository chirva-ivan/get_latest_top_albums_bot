const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const axios = require("axios");
const cheerio = require('cheerio');
const moment = require('moment');

const AMBIENT = 'ambient';
const ELECTRONIC = 'electronic';
const METAL = 'metal';
const POST_PUNK = 'post-punk';

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

module.exports = (ctx) => {
  const message = ctx.update.message.text;
  const sticker = 'CAADAgADvAIAAuPwEwzKSnJLsIPPdwI';
  const currentYear = new Date().getFullYear();

  switch (message) {
    case '/start':
      return ctx.replyWithHTML('Select some music', Extra.markup(
        Markup.keyboard([METAL, ELECTRONIC, AMBIENT, POST_PUNK])
      ));
    case '/help':
      return ctx.reply('Select some music style');
    case METAL:
      return  getContent(`https://www.albumoftheyear.org/genre/40-metal/${currentYear}/`, METAL)(ctx);
    case ELECTRONIC:
      return  getContent(`https://www.albumoftheyear.org/genre/6-electronic/${currentYear}/`, ELECTRONIC)(ctx);
    case AMBIENT:
      return  getContent(`https://www.albumoftheyear.org/genre/34-ambient/${currentYear}/`, AMBIENT)(ctx);
    case POST_PUNK:
      return getContent(`https://www.albumoftheyear.org/genre/23-post-punk/${currentYear}/`, POST_PUNK)(ctx);
    default:
      return ctx.replyWithSticker(sticker);
  }
};
