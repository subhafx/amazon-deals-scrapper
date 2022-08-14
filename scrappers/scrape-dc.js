const ScrapperProvider = require("./scrapper-provider");
const {removeNewLinesAndSpaces} = require("../helpers")
const {product_db} = require("../db/db");


const UPCOMING_DEAL_LISTING_LINK = "https://www.dealscargo.in/stores/amazon/lightning-deals/upcoming";
const MAX_PAGE_VISIT = 2;
const MIN_DISCOUNT_THRESHOLD = 50;

const maxProductsChunk = 10;

const scrapperProvider = new ScrapperProvider();

async function fetchHotDeals(){
    let total_products = {};
    try{
        for (let page =1; page <= MAX_PAGE_VISIT; page++){
            const products = await getUpcomingHotDeals(page);
            total_products = {...total_products, ...products};
        }
    }catch (e) {
        console.log("Error in fetch deal",e)
    }
    finally {
        await scrapperProvider.closeBrowser();
    }
    return total_products;
}

async function getUpcomingHotDeals(page){
    let products = {};
    try{
        let listing_link = `${UPCOMING_DEAL_LISTING_LINK}?hot=1&page=${page}`;
        const $ = await scrapperProvider.getStatelessScrapper(listing_link);
        const product_elements = $("#wrapper > div > main > div > div.row.rowtable > div.col-md-9.aside > div.product-listing > div.products-grid.four-in-row.product-variant-1.product-items > div");

        for (let i =0; i< product_elements.length; i++){
            const element = product_elements[i];
            const product_discount = parseInt($(element).find("div.label-sale > span").text());
            if(product_discount < MIN_DISCOUNT_THRESHOLD) continue;

            const link_element = $(element).find(".product-item-name > a");
            const dc_link = link_element.attr("href");
            const details = await getProductDetailsFromDC(dc_link);
            details["discount"] = product_discount+"%";
            products[details["ASIN"]] = details;
        }
    }catch (e) {
        console.log("error in fetching upcoming deals")
    }
    return products;
}

async function getProductDetailsFromDC(dc_link){
    const url_chunks = dc_link.split("?")[0].split("/");
    const product_id = url_chunks[url_chunks.length -1];
    const $ = await scrapperProvider.getStatelessScrapper(dc_link);
    const product_info_element = $("#wrapper > div > main > div.block.product-block > div > div > div.col-sm-6.col-md-8.col-lg-5 > div");
    const timer_link = $(product_info_element).find("div.product-actions > div:nth-child(2) > div > a:nth-child(1)").attr("href");
    const deal_time = $(product_info_element).find("div.countdown-circle > div > div.countdownU").data("countdown");
    const product_name = $(product_info_element).find(".product-name-wrapper > a > h1").text();
    const product_category = $(product_info_element).find(".product-availability > a > span").text();
    const product_price_info_element = $(product_info_element).find(".product-description > p");
    const product_mrp = removeNewLinesAndSpaces(product_price_info_element.text()).split(":")[1];
    // console.log(parseInt(product_mrp));
    const last_deal_price = removeNewLinesAndSpaces(product_price_info_element.find("span").text()).split(":")[1];
    let deal_id = decodeURIComponent(timer_link).split("?")[1].split("&")[1].split("=")[1];
    // console.log(last_deal_price)
    return {
        source_link : dc_link,
        ASIN : product_id,
        name : product_name,
        category: product_category,
        mrp: parseInt(product_mrp),
        last_deal_price,
        deal_id,
        deal_time,
        deal_timer_link: `https://www.amazon.in/gp/goldbox/alldeals/?gb_edi=${deal_id}`,
        product_page_link: `https://www.amazon.in/dp/${product_id}`
    }

}

function compareDeals(latest_products){
    const old_products = product_db.get("dc");
    return Object.keys(latest_products).filter(key => !old_products[key] || (parseInt(old_products[key].discount) < parseInt(latest_products[key].discount)));
}



async function getUpcomingDeals(){
    const products = [];

    try {
        await scrapperProvider.initialize();

        await scrapperProvider.openNewPage("dc-upcoming", "https://www.dealscargo.in/stores/amazon/lightning-deals/upcoming")
        const $ = await scrapperProvider.getScrapper("dc-upcoming");

        await scrapperProvider.closePage("dc-upcoming");

        const product_elements = $("#wrapper > div > main > div > div.row.rowtable > div.col-md-9.aside > div.product-listing > div.products-grid.four-in-row.product-variant-1.product-items > div")
            .slice(0 , maxProductsChunk);

        for (let i = 0; i < product_elements.length; i++) {
            // const element = product_elements[i];
            // const link_element = $(element).find(".product-item-name > a");
            // const product_name = link_element.text()
            // const dc_link = link_element.attr("href");
            // // console.log(link)
            // // const actual_link = await getProductLink(product_name, dc_link)
            // const url_chunks = dc_link.split("?")[0].split("/");
            // const product_id = url_chunks[url_chunks.length -1];
            const [product_id, product_details] = await getProductDetails(product_elements[i]);
            // product_db.set(product_id, product_details);
            products.push(product_details)
        }
    } catch (err) {
        console.log(`❌ Error: ${err.message}`);
    } finally {
        console.log("finally executed")
        await scrapperProvider.closeBrowser();
        // product_db.sync()
        console.log(`\n END`);
    }
    return products;
}


async function getProductDetails(product_element){
    const $ = await scrapperProvider.getScrapper("dc-upcoming");
    const link_element = $(product_element).find(".product-item-name > a");
    const product_name = link_element.text()
    const dc_link = link_element.attr("href");
    // console.log(link)
    // const actual_link = await getProductLink(product_name, dc_link)
    const url_chunks = dc_link.split("?")[0].split("/");
    const product_id = url_chunks[url_chunks.length -1];
    const product_discount = $(product_element).find("div.label-sale > span").text();
    return [
            product_id,
            {
            product_name,
            product_id ,
            link: `https://www.amazon.in/dp/${product_id}`,
            product_discount : parseInt(product_discount)
            }
        ]
}


async function getProductLink(product_name, product_page_url){
    console.log("fetching link of", product_name)
    await scrapperProvider.initialize();
    await scrapperProvider.openNewPage(product_name, product_page_url)
    const $ = await scrapperProvider.getScrapper(product_name);

    const link = $("#wrapper > div > main > div.block.product-block > div > div > div.col-sm-6.col-md-8.col-lg-5 > div > div.product-actions > div:nth-child(2) > div > a:nth-child(2)").attr("href");

    await scrapperProvider.closePage(product_name);

    return link.split("?")[0];
}


module.exports = {
    getUpcomingDeals,
    getUpcomingHotDeals,
    fetchHotDeals,
    compareDeals
}
