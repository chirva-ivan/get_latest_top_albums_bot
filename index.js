const axios = require("axios");
const cheerio = require('cheerio');
const moment = require('moment');
const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Welcome!'));
bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', async (ctx) => {
  try {
    ctx.reply('loading...');

    const url = 'https://www.albumoftheyear.org/genre/40-metal/2018/';
    const response = await axios.get(url);
    const html = cheerio.load(response.data);

    const result = html('.albumListRow')
      .map((index, domElement) => {
        const element = html(domElement);
        const title = element.find('.albumListTitle a').text();
        const date = element.find('.albumListDate').text();
        const raiting = element.find('.scoreValue').text();

        return {title, date, raiting}
      })
      .get()
      .sort((a, b) => moment(b.date, 'MMMM D, YYYY') - moment(a.date, 'MMMM D, YYYY'))
      .map((item) => `${item.title} | ${item.date} | ${item.raiting}/100`);

    return ctx.reply(result.join('\n'));
  } catch (e) {
    console.error(e);
    return ctx.reply('try again later');
  }

});

bot.startPolling();
