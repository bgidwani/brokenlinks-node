const puppeteer = require('puppeteer');
const parse = require('url-parse');
const https = require('https');

const mainSiteUrl = '<WEB_SITE_TO_CRAWL>'';
const MAX_URLS_TO_CRAWL = 10
let mainSiteDomain = '';
let pagesCrawled = 0;     // counter to keep track of pages that have been crawled by the process
const crawledUrls = [];   // list of pages crawled
const brokenUrls = [];    // list of broken links

const run = async () => {
    // identify the domain of the main site
    mainSiteDomain = getDomain(mainSiteUrl);
    console.log('Main domain -', mainSiteDomain);

    console.log('Starting the crawler');

    try {
        await startCrawler(mainSiteUrl);
    } catch (error) {
        console.log(error);
    }

    console.log('Crawling complete, list of Broken links:');

    //console.log(crawledUrls);
    console.log(brokenUrls);
};

const delay = (time) => {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    })
}

const http_async = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            res.on('data', (chunk) => {
                // console.log('Inside data');
            });
            res.on('end', () => {
                //console.log('Inside end');
                if (res.statusCode >= 200 && res.statusCode <= 299) {
                    resolve({ statusCode: res.statusCode });
                } else {
                    reject({ statusCode: res.statusCode });
                }
            });
            res.on('error', () => {
                //console.log('Inside error 1');
                reject(err);
            });
        }).on('error', (err) => {
            console.log('Inside error 2');
            reject(err);
        });
    });
}

const startCrawler = async (url) => {
    /* Initiate the Puppeteer browser */
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    /* use Array based stack to keep track of urls being crawled */
    const urlStack = [];
    urlStack.push({
        url: url,
        parent: ''
    });

    while ((pagesCrawled < MAX_URLS_TO_CRAWL) && (urlStack.length > 0)) {
        // pop the first item from the stack
        let item = urlStack.shift();

        // skip if the url has already been crawled
        if (wasUrlCrawled(item.url)) {
            continue;
        }

        console.log('Trying to crawl', item.url);
        // wait for little while, before making the request
        await delay(1000);
        let urlStatus = -999;

        if (item.url.endsWith('.pdf')) {
            // puppeteer cannot load PDF documents
            let response = await http_async(item.url);
            if (response) {
                urlStatus = response.statusCode;
            }
        } else {
            let response = await page.goto(item.url);
            if (response) {
                urlStatus = response.status();
            }
            // wait for the page to load
            await delay(1000);
        }

        pagesCrawled += 1;

        crawledUrls.push({
            parent: item.parent,
            url: item.url,
            status: urlStatus
        });

        if (urlStatus !== 200) {
            brokenUrls.push({
                parent: item.parent,
                url: item.url,
                status: urlStatus
            });
        }

        // don't get links from the url, if it is not
        // part of the same domain
        if (!isSameDomain(item.url)) {
            continue;
        }

        /* retrieve the links */
        let links = await getLinks(page);
        //console.log(`Links on ${url}`, links);
        /* iterate over the links */
        for (i in links) {
            urlStack.push({
                url: links[i],
                parent: item.url
            });
        }
    }

    //close the page and the browser
    await page.close();
    await browser.close();
}

// Determine whether a URL is in a list of crawled URLs
const wasUrlCrawled = (url) => {
    let http_version = url.replace("https://", "http://").replace("://www.", "://");
    let https_version = url.replace("http://", "https://").replace("://www.", "://");
    let link_crawled = false;

    for (i in crawledUrls) {
        let item = crawledUrls[i].url;
        item = item.replace("://www.", "://");
        if (item === http_version || item === https_version) {
            link_crawled = true;
            break;
        }
    }

    return link_crawled;
};

// Retrieve the domain of the href link
const getDomain = (link) => {
    let parsedUrl = new parse(link);
    let hostname = parsedUrl.hostname;
    let fragments = hostname.split('.');

    const domain = `${fragments[fragments.length - 2]}.${fragments[fragments.length - 1]}`;

    return domain;
};

// Determine whether the link points to the same domain as the main site
const isSameDomain = (link) => {
    return getDomain(link) === mainSiteDomain;
};

const stripFragementIdentifiers = (link) => {
    let fragments = link.split('#');
    return fragments[0];
};

const isNullOrEmpty = (link) => {
    return (link === undefined ||
        link === null ||
        link === '');
};

// Returns a list of links from from a page to be crawled
const getLinks = async (puppeteerPage) => {
    let links = [];
    let hrefs = await puppeteerPage.evaluate(() => {
        let data = Array.from(document.querySelectorAll('a'));
        return data.map(link => link.href);
    });

    for (i in hrefs) {
        let href = stripFragementIdentifiers(hrefs[i]);

        if (!isNullOrEmpty(href)) {
            if (!wasUrlCrawled(href)) {
                links.push(href);
            }
        }
    }

    return links;
};

run();
