const Koa = require('koa');
const Router = require('koa-router');
const Crawler = require("crawler");
const staticServer = require('koa-static');
const path = require('path');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');
const cheerio = require('cheerio');

const app = new Koa();
const router = new Router();

let crawlerContent = null;
let saveUrl = null;

router.post('/crawler',  async (ctx, next) => {
    let url = ctx.request.body.url;
    let keyword = ctx.request.body.keyword;
    let type = ctx.request.body.type;

    if (crawlerContent == null || saveUrl != url) {
        let res = await new Promise((resolve, reject) => {
            crawler(url, function (error, res, done) {
                if (error) {
                    console.log(error);
                } else {
                    // fs.writeFile(`${__dirname}/crawler.html`, body, function (error) {
                    //     console.log(error);
                    // });

                    resolve(res.body);
                }
                done();
            });
        });
        // res = JSON.stringify(res);
        saveUrl = url;
        crawlerContent = res;
    } 

    let parseArr = parse(crawlerContent,type, keyword);
    ctx.body = parseArr;
});

function parse(html, type, keyword) {
    
    const $ = cheerio.load(html);
    
    let selectors = $(type);
    if (keyword == 'custom') {
        selectors = $.html(type);
    }
    // $ is Cheerio by default
    //a lean implementation of core jQuery designed specifically for the server
    if (typeof selectors != 'string') {
        let aArr = [];
        for (var i = 0; i < selectors.length; i++) {
            let $link = $(selectors[i]);
            let val = null;
            switch (keyword) {
                case 'href':
                    val = $link.attr('href');
                    break;
                case 'text':
                    val = {
                        text: $link.text(),
                        href: $link.attr('href')
                    };
                    break;
                default:
                    val = $link.attr('src');
                    break;
            }
            aArr.push({
                type: type,
                val: val,
                keyword: keyword,

            });
        }
        return aArr;
    } else {
        console.log(selectors);
        return selectors;
    }

}


function crawler(url, callback) {
    var c = new Crawler({
        maxConnections: 10,
        // This will be called for each crawled page
        callback: callback
    });

// Queue just one URL, with default callback
    c.queue(url);
}



app
    .use(bodyParser())
    .use(router.routes())
    .use(staticServer(
       path.join(__dirname, './static')
    ))
    .use(router.allowedMethods());

app.listen(3000, () => {
    console.log('listen 3000');
});


// crawler();