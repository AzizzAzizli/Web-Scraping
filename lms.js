require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
let subjects = [];
let resultData = {

};
(async () => {
    const browser = await puppeteer.launch({ headless: false, defaultViewport: null, userDataDir: './lmstmp'});
    const page = await browser.newPage();
    await page.goto('http://lms.adnsu.az/adnsuEducation/login.jsp');

    await page.waitForSelector('#username');

    await page.type('#username', process.env.USER_NAME);
    await page.type('#password', process.env.USER_PASSWORD);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
    await page.waitForSelector('#content > div.row > div:nth-child(1) > div.card.profile-view > div.pv-body > h2');
    const name = await page.$eval('#content > div.row > div:nth-child(1) > div.card.profile-view > div.pv-body > h2', el => el.innerText.trim());
    resultData.name = name;
    await page.waitForSelector('#sidebar > div > ul.nav > ul > li:nth-child(2)', { visible: true });
    await page.click('#sidebar > div > ul.nav > ul > li:nth-child(2)');
    await page.waitForSelector('#operationDiv > div.col-sm-5.col-lg-3.col-md-3.p-l-10.ui-sortable > div > div > div > div:nth-child(1) > div > button', { visible: true });
    await page.click('#operationDiv > div.col-sm-5.col-lg-3.col-md-3.p-l-10.ui-sortable > div > div > div > div:nth-child(1) > div > button');
    await page.waitForSelector('#operationDiv > div.col-sm-5.col-lg-3.col-md-3.p-l-10.ui-sortable > div > div > div > div:nth-child(1) > div > div > ul > li:nth-child(13) > a');
    await page.click('#operationDiv > div.col-sm-5.col-lg-3.col-md-3.p-l-10.ui-sortable > div > div > div > div:nth-child(1) > div > div > ul > li:nth-child(14) > a');
    await page.waitForSelector('#accordion > div:nth-child(1)');

    const subjectCards = await page.$$('#accordion > div');

    for (let i = 0; i < subjectCards.length; i++){
        try {
            console.log(i);
            
            // await new Promise((resolve) => setTimeout(resolve, 1000));
            const updatedSubjectBoxes = await page.$$('#accordion > div');
            const subject = updatedSubjectBoxes[i];

            await subject.waitForSelector('div > div.state-link > a');
            const subjBtn = await subject.$('div > div.state-link > a');
            await subjBtn.click();

            const result = await getSubjectDetails(page);
            subjects.push(result);

            await page.waitForSelector('#accordionDiv > div.row.m-t-15 > div.col-md-4.col-xs-12.ui-sortable > div > a');
            await page.$eval('#accordionDiv > div.row.m-t-15 > div.col-md-4.col-xs-12.ui-sortable > div > a',el=>el.click());
          
            await page.waitForSelector('#accordion > div:nth-child(1)');
           
       
        } catch (error) {
            console.log('error for',subjectCards[i],error);
        };
    };
    resultData.data = subjects;
    console.log(resultData);
    await fs.writeFileSync('./lmsUserData.json', JSON.stringify(resultData), 'utf8');
    await browser.close();
})()


async function getSubjectDetails(page) {
    await page.waitForSelector('#accordionDiv > div.col-md-12.mob-fix > ul > li:nth-child(5) > a')
    const subjectName = await page.$eval('#content > div.header-style.m-t-27 > h1', el => el.innerText.trim());
    await page.$eval('#accordionDiv > div.col-md-12.mob-fix > ul > li:nth-child(5) > a', el => el.click())
    await page.waitForSelector('#\\31 000017 > div > div > ul > li:nth-child(2) > a > span')
    await page.$eval('#\\31 000017 > div > div > ul > li:nth-child(2) > a > span', el => el.click())
    await page.waitForSelector('#journal-2 > div > div > a');
    await page.$eval('#journal-2 > div > div > a', el => el.click());
    await page.waitForSelector('#resultJournal > thead > tr > th');
    
    const tableHead = await page.$$('#resultJournal > thead > tr > th');
    const tableBody = await page.$$('#resultJournal > tbody > tr > td');

    const subjectData = {
        subjectName,
    };

    for (let i = 2; i < tableHead.length; i++){
        
        const title = await tableHead[i].evaluate(el => el.innerText.trim());
        const result = await tableBody[i].evaluate(el => el.innerText.trim());

        subjectData[title] = result;
    }
  

 
    return subjectData;
};