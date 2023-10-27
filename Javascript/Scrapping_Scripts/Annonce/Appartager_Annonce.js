const puppeteer = require('puppeteer');
const fs = require('fs');

function getCurrentDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const url = 'https://www.appartager.com/location/colocation.pl?flatshare_id=3002466189&search_id=3000001176099&city_id=1000&flatshare_type=offered&search_results=%2Flocation%2F%3Fsearch_id%3D3000001176099%26&';
    await page.goto(url);

    const data = await page.evaluate(() => {
        const imageLinks = _sr.page.photos.map(photoObj => photoObj.photo);
        const features = [...document.querySelectorAll('.property-feature-list__text')].map(el => el.textContent.trim());
        const detailsAboutRoommates = [...document.querySelectorAll('.listing-detail__content-box .feature-list dt, .listing-detail__content-box .feature-list dd')].map(el => el.textContent.trim());
        const description = document.querySelector(".listing-detail__content-box .heading + div")?.textContent.trim() || "";
        const adReference = document.querySelector(".listing-detail__content-box:last-child")?.textContent.trim() || "";
        const heading = document.querySelector(".listing-detail__listing-heading")?.textContent.trim() || "";
        const address = document.querySelector(".listing-detail__listing-header p.small-text")?.textContent.trim() || "";

        return {
            imageLinks,
            features,
            detailsAboutRoommates: detailsAboutRoommates.reduce((acc, curr, idx, srcArr) => {
                if (idx % 2 === 0) {
                    acc[curr] = srcArr[idx + 1];
                }
                return acc;
            }, {}),
            description,
            adReference,
            heading,
            address
        };
    });

    // Create the filename with the current date
    const fileName = `outputAppartager_${getCurrentDateString()}.json`;

    // Write to JSON file
    fs.writeFileSync(fileName, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data saved to ${fileName}!`);

    await browser.close();
})();

