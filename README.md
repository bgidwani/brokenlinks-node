# Broken Links

This is a sample code that can be used to crawl a website and identify any broken `href` links on the site. The project uses Node.js and [Puppeteer](https://github.com/puppeteer/puppeteer) package for crawling the site.

Pupperteer was used since it uses headlesss browser to navigate to a URL and will execute javascript used on the page. This helps in crawling SPA website built using React, Angular or similar Javascript frameworks.

## Running the crawler

1. Download the code
1. Update `mainSiteUrl` in `index.js` to point to the URL that needs to be crawled
1. Update `MAX_URLS_TO_CRAWL` in `index.js`to a suitable value, so the crawler does not run for ever
1. Run `yarn` from terminal to install dependencies
1. Run `node index.js` from terminal

Once the process completes, the list of various urls is printed in console along with response status and the parent page that contains the link.

Note: The crawler tries to verify all external links available on the site, though it does not process any further links available on the external page

## Further improvements

1. Some websites prevent crawlers from retrieving the page so need to handle that in code
1. Store the output in a local database or CSV file instead of printing it in console window

## NOTE

The code is provided for learning purpose only. Do not use this to crawl a site that is not controlled by you. Do get permission from website owner before crawling or scraping their site
