const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

let browser = null;

class ScrapperProvider{
    browser = null;
    pages = {};
    responses = {};
    scrappers = {};

    async initialize(){
        if(this.browser) return ;
        this.browser = await puppeteer.launch({ headless: true });
        return this;
    }

    async openNewPage(name, url){
        if(!this.browser) throw new Error("Browser is not initialized, please call initialize() first")
       this.pages[name] = await this.browser.newPage();
       this.responses[name] = await this.pages[name].goto(url);
       return this;
    }

    getPage(name){
        if(!this.browser) throw new Error("Browser is not initialized, please call initialize() first")
        if(!this.pages[name]) throw new Error("Page not found");
        return this.pages[name];
    }

    async getResponse(name) {
        if(!this.browser) throw new Error("Browser is not initialized, please call initialize() first")
        if(!this.responses[name]) throw new Error("Response not found");
        return this.responses[name];
    }

    async getScrapper(pageName){
        if(!this.scrappers[pageName]){
            if(!this.pages[pageName]) throw new Error("Page not found with this name, Please call openNewPage() with your url first");
            const content = await this.pages[pageName].content();
            this.scrappers[pageName] = cheerio.load(content);
        }
        return this.scrappers[pageName];
    }

    async getStatelessScrapper(page_link, pageName = "stateless-page"){
        await this.initialize();
        await this.openNewPage(pageName, page_link);
        const content = await this.pages[pageName].content();
        await this.closePage(pageName);
        delete this.pages[pageName];
        return cheerio.load(content);
    }

    async closePage(pageName){
        if(this.pages[pageName]){
            await this.pages[pageName].close();
        }
    }

    async closeBrowser(){
        if(this.browser){
            await this.browser.close();
        }
    }
}

module.exports = ScrapperProvider;
