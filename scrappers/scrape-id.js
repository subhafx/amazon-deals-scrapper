const ScrapperProvider = require("./scrapper-provider");
const {removeNewLinesAndSpaces} = require("../helpers")
const {product_db} = require("../db/db");

const scrapperProvider = new ScrapperProvider();
const LISTING_LINK = "https://indiadesire.com/lootdeals";
const MIN_REQUIRE_DISCOUNT = 80;

async function fetchHotDeals(){
    return fetchRealtimeDeals();
}

async function fetchLootOfTheHour() {
    const $ = await scrapperProvider.getStatelessScrapper(LISTING_LINK);
    const product_elements = $("#lootdeal > div");
    console.log(product_elements.length);
}

async function fetchRealtimeDeals() {
    const $ = await scrapperProvider.getStatelessScrapper(LISTING_LINK);
    const product_elements = $("#form2 > div.container-fluid > div > div.col-xl-9.p-1 > div.container-fluid12 > div:nth-child(5) > div");
    // console.log(product_elements.length);
    let products = [];
    for (let element of product_elements){
        let details = await getProductDetailsFromProductElement(element, $);
        if(details){
            products.push(details);
        }
    }
    return products;
}

async function getProductDetailsFromProductElement(element, $) {
    let discount_value = parseInt($(element).find(".expired > span").text().split(" ")[0]);
    // console.log(discount_value);
    if(discount_value < MIN_REQUIRE_DISCOUNT)
        return;
    let product_details_element = $(element).find(":first-child");
    let product_name = $(product_details_element).find(".divcenter1 > p > a > span").text();
    let product_ind_link = $(product_details_element).find(".content-logo > a").attr("href");
    let product_store = $(product_details_element).find(".divcenter > img").attr("title");
    let price_element = $(product_details_element).find(".priceinfo");
    let original_price = parseInt($(price_element).find(":nth-child(2) > span").text().slice(1));
    let discounted_price = parseInt($(price_element).find(":nth-child(1) > span").text().slice(1));
    let product_link = await getOriginalProductURL(product_ind_link);
    // console.log(product_link);
    let details = {
        name : product_name,
        product_link : product_link,
        source_link : product_ind_link,
        product_store : product_store,
        mrp : original_price,
        discount : discount_value,
        deal_price : discounted_price
    }
    // console.log(details);
    return details;
}

async function getOriginalProductURL(source_url){
    console.log(source_url);
    let query = source_url.split("?")[1].split("&");
    let redirect_id = query[0].split("=")[1];
    let store_name = query[0].split("=")[1];
    if(store_name == "amazon"){
        await scrapperProvider.initialize();
        await scrapperProvider.openNewPage(redirect_id, source_url);
        let page =  scrapperProvider.getPage(redirect_id);
        await page.waitForSelector("#nav-logo");
        let product_link = page.url();
        await scrapperProvider.closePage(redirect_id);
        return product_link;
    }
    return source_url;
}

module.exports = {
    fetchHotDeals
}
