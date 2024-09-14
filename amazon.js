const puppeteer = require("puppeteer");
const fs = require("fs");
const itemsArray = [];
let total = 0;
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"],
    userDataDir: "./amazontmp",
  });
  const page = await browser.newPage();

  await page.goto(
    "https://www.amazon.com/s?k=gaming+pc+chair&crid=1Z4O64L9BX87S&qid=1725716985&sprefix=gaming+pc+ch%2Caps%2C430&ref=sr_pg_1",
    { waitUntil: "load" }
  );

  let isLastPage = false;
  while (!isLastPage) {
    await page.waitForSelector(
      '#search > div.s-desktop-width-max.s-desktop-content.s-opposite-dir.s-wide-grid-style.sg-row > div.sg-col-20-of-24.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span.rush-component.s-latency-cf-section > div.s-main-slot.s-result-list.s-search-results.sg-row > div[data-component-type="s-search-result"]'
    );

    await autoScroll(page);
    await getItems(page);

    const nextBtn = await page.$(
      " div > div > span > a.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator"
    );

    if (nextBtn) {
      isLastPage = false;
      await Promise.all([
        nextBtn.click(),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
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


  await fs.writeFileSync(
    "./amazonProducts.json",
    JSON.stringify(itemsArray),
    "utf8"
  );

  await browser.close();
})();

async function getItems(page) {
  await page.waitForSelector(
    "#search > div.s-desktop-width-max.s-desktop-content.s-opposite-dir.s-wide-grid-style.sg-row > div.sg-col-20-of-24.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span.rush-component.s-latency-cf-section > div.s-main-slot.s-result-list.s-search-results.sg-row > div"
  );

  const cards = await page.$$(
    '#search > div.s-desktop-width-max.s-desktop-content.s-opposite-dir.s-wide-grid-style.sg-row > div.sg-col-20-of-24.s-matching-dir.sg-col-16-of-20.sg-col.sg-col-8-of-12.sg-col-12-of-16 > div > span.rush-component.s-latency-cf-section > div.s-main-slot.s-result-list.s-search-results.sg-row > div[data-component-type="s-search-result"]'
  );
  total += cards.length;
  for (let i = 0; i < cards.length; i++) {
    let card = await cards[i];
    try {
      let title;
      try {
        title = await card.$eval("h2 > a > span", (el) => el.innerText.trim());
      } catch (error) {
        title = null;
      }
      let price;
      try {
        price = await card.$eval(
          "div.a-section.a-spacing-none.a-spacing-top-small.s-price-instructions-style > div > div:nth-child(1) > a > span > span.a-offscreen",
          (el) => el.innerText.trim()
        );
      } catch (error) {
        price = await card.$eval(
          " div.a-section.a-spacing-small.puis-padding-left-small.puis-padding-right-small > div.a-section.a-spacing-none.a-spacing-top-mini.puis-interactive-asin-expander-hide > div > span.a-color-base",
          (el) => el.innerText.trim()
        );
      }

      let rate;
      try {
        rate = await card.$eval(
          "div.a-row.a-size-small > span:nth-child(1) > span > a > i > span",
          (el) => el.innerText.trim()
        );
      } catch (error) {
        rate = null;
      }

      let img;
      try {
        img = await card.$eval("span > a > div > img", (el) => el.src);
      } catch (error) {
        img = null;
      }

      let item = { title, price, rate, img };
      itemsArray.push(item);
    } catch (error) {
      console.log(`Error extracting data from card ${i}: ${error}`);
    }
  }
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 500;
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
