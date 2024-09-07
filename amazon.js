const puppeteer = require("puppeteer");
const fs = require('fs');
const itemsArray = [];
(async () => {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        userDataDir: './amazontmp'
    });
    const page = await browser.newPage();

    await page.goto('https://www.amazon.com/s?k=gaming+pc+chair&crid=1Z4O64L9BX87S&qid=1725716985&sprefix=gaming+pc+ch%2Caps%2C430&ref=sr_pg_1');

    let isLastPage = false;
    while (!isLastPage) {

        await page.waitForSelector('div.s-main-slot.s-result-list.s-search-results.sg-row > div');
    
        await getItems(page);

        const nextBtn = await page.$(' div > div > span > a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator');

        if (nextBtn) {
            isLastPage = false;
            await Promise.all([
                nextBtn.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2' }) 
             ]);
        } else {
            const spanButton = await page.$(
                "span.s-pagination-item.s-pagination-next.s-pagination-disabled"
              );
              if (spanButton) {
                isLastPage = true;
              }
        }
    }
   
    // console.log(itemsArray.length);
    await fs.writeFileSync('./amazonProducts.json', JSON.stringify(itemsArray));


    await browser.close();
})()

async function getItems(page) {
    await page.waitForSelector('div.s-main-slot.s-result-list.s-search-results.sg-row > div');
    
    const cards = await page.$$('div.s-main-slot.s-result-list.s-search-results.sg-row > div');

    for (let i = 0; i < cards.length; i++) {
        let card = cards[i];
        try {
            // `await` ile card.$eval kullanıyoruz
            let title = await card.$eval('h2 > a > span', el => el.innerText.trim());
            let price = await card.$eval(' div.a-section.a-spacing-none.a-spacing-top-small.s-price-instructions-style > div > div:nth-child(1) > a > span > span.a-offscreen', el => el.innerText.trim());
            let rate = await card.$eval(' div.a-row.a-size-small > span:nth-child(1) > span > a > i > span', el => el.innerText.trim());
            let poster = await card.$eval(' span > a > div > img', el => el.src);

            let item = { title,price,rate,poster };
            itemsArray.push(item);
        } catch (error) {
            // console.log(`Error extracting data from card ${i}: ${error}`);
        }
    }
}


async function scrollPage(page) {
    const viewportHeight = 800;
    await page.setViewport({ width: 1440, height: viewportHeight });
    let previousHeight;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    while (true) {
      previousHeight = currentHeight;
      await page.evaluate((_viewportHeight) => {
        window.scrollBy(0, _viewportHeight);
      }, viewportHeight);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      if (previousHeight === currentHeight) break;
    }
    
}