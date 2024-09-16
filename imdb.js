const puppeteer = require('puppeteer');
const fs = require('fs');
const movies = [];
(async () => {
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        userDataDir:'./imdbtmp',
})

    const page = await browser.newPage();

    await page.goto('https://www.imdb.com/chart/top/?ref_=nv_mv_250');

    await page.waitForSelector('section > div > div.ipc-page-grid.ipc-page-grid--bias-left > div > ul > li:nth-child(1)');
    await autoScroll(page);
    const moviecards = await page.$$('section > div > div.ipc-page-grid.ipc-page-grid--bias-left > div > ul > li');

    for (let i = 0; i < moviecards.length; i++){
        try {
            const moviecard = moviecards[i];
            const place = await moviecard.$eval('div.ipc-title.ipc-title--base.ipc-title--title.ipc-title-link-no-icon.ipc-title--on-textPrimary.sc-b189961a-9.bnSrml.cli-title > a > h3', el => el.innerText.split('.')[0].trim());
            const title = await moviecard.$eval('div.ipc-title.ipc-title--base.ipc-title--title.ipc-title-link-no-icon.ipc-title--on-textPrimary.sc-b189961a-9.bnSrml.cli-title > a > h3', el => el.innerText.split('.')[1].trim());
            const year = await moviecard.$eval('div.sc-b189961a-7.btCcOY.cli-title-metadata > span:nth-child(1)', el => el.innerText.trim());
            const time = await moviecard.$eval('div.sc-b189961a-7.btCcOY.cli-title-metadata > span:nth-child(2)', el => el.innerText.trim());
            const age = await moviecard.$eval('div.sc-b189961a-7.btCcOY.cli-title-metadata > span:nth-child(3)', el => el.innerText.trim());
            const rating = await moviecard.$eval(' div.ipc-metadata-list-summary-item__c > div > div > span > div > span > span.ipc-rating-star--rating', el => el.innerText.trim());
            const voteCount = await moviecard.$eval('div > span > span.ipc-rating-star--voteCount', el => el.innerText.split('(')[1].split(')')[0].trim());
            const poster = await moviecard.$eval(' div.ipc-media.ipc-media--poster-27x40.ipc-image-media-ratio--poster-27x40.ipc-media--base.ipc-media--poster-m.ipc-poster__poster-image.ipc-media__img > img', el => el.src);
            const movie = {
                place, title,year,time,age,rating,voteCount,poster
            };
            movies.push(movie);
        } catch (error) {
            // console.log(error);
        }

    }
    await fs.writeFileSync('./imdbmoviesTop250.json', JSON.stringify(movies), "utf8");
// console.log(movies);
await browser.close()
})()

async function autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        let totalHeight = 0;
        const distance = 10000;
        const timer = setInterval(async () => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
  