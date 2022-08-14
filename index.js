require("dotenv").config({
    path: ".env.development"
});

const {Telegraf} = require("telegraf");
const scrapper_dc = require("./scrappers/scrape-dc");
const scrapper_id = require("./scrappers/scrape-id");
const {user_db} = require("./db/db");

const bot = new Telegraf(process.env.API_KEY);


bot.start( ctx => {
    const chat_id = ctx.chat.id;
    user_db.set(chat_id, ctx.chat);
    ctx.reply("Welcome to Deals")
})

bot.command("subscribe_deals", ctx => {
    user_db.set(ctx.chat.id, {
        dc_deals : true
    }, true);
    ctx.reply("Thanks for subscribing to our deals alert!!")
});

bot.command("deals", async ctx => {
    ctx.reply("Fetching best deals for you, We will notify you shortly")
    let products = await scrapper_dc.fetchHotDeals();
    console.log("product fetched")
    let deal_id_list = [];
    for (let [product_id, product] of Object.entries(products)){
        deal_id_list.push(product.deal_id);
       await ctx.reply(`
       Product: ${product.name} \n
       Product Link: ${product.product_page_link} \n
       ASIN: ${product.ASIN} \n
       Category: ${product.category} \n
       MRP: ${product.mrp} \n
       Expected Discount: ${product.discount} \n
       Previous Deal Price: ${product.last_deal_price} \n
       Live At: ${product.deal_time} \n
       Deal Id: ${product.deal_id} \n
       Timer Link: ${product.deal_timer_link}
       `);
    }
    // console.log(products);
    ctx.reply("Master Link: "+ `https://www.amazon.in/gp/goldbox/alldeals/?gb_edi=${deal_id_list.join(",")}`)
    console.log("sent")
})
bot.command("hot_deals", async ctx => {
    ctx.reply("Fetching hot deals for you, We will notify you shortly")
    // let products = await scrapper_dc.fetchHotDeals();
    try{
        let products = await scrapper_id.fetchHotDeals();
        console.log("product fetched", products.length)
        for (let product of products){
            await ctx.reply(`
           Product: ${product.name} \n
           Product link: ${product.product_link} \n
           MRP: ${product.mrp} \n
           Expected Discount: ${product.discount} \n
           Deal Price: ${product.deal_price} \n
           `);
        }
        // console.log(products);
        console.log("sent")
    }
    catch(e){
        ctx.reply("Sorry!! Something went wrong, please try again later.")
    }
    
})
bot.launch();

// scrapper_dc.fetchHotDeals().then(products => {
//     console.log(products.length)
//     console.log(products);
//     const deals_to_notify = scrapper_dc.compareDeals(products);
//     notifyDeals(deals_to_notify, products);
//     product_db.set("dc", products);
// });

function notifyDeals(product_ids_to_notify, products){
    if(product_ids_to_notify.length){
        console.log("notified")
    }
}


// scrapper_id.fetchHotDeals().then((deals) => {
//     console.log("fetched", deals.length);
//     console.log(deals);
// })
// scrapper_id.getOriginalProductURL("https://indiadesire.com/Redirect?redirectpid1=B07QKV8QML&store=amazon")
//     .then(() => {
//         console.log("done")
//     })
console.log("started")

