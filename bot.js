const { HTTPRequest } = require('puppeteer')
const puppeteer = require('puppeteer-extra')
const cron = require('node-cron')

console.log('\nRunning...')

// Scheduled to launch 10:31:00 AM
cron.schedule('0 31 10 * * *', () => {

    // Website details
    const URL = 'https://www.thewebsite.com/store/'
    const cartURL = 'https://www.thewebsite.com/store/cart/'

    // Login details
    const email = 'email@gmail.com'
    const password = 'emailpassword'

    // Desired product details
    const keywordOne = 'first item description'
    const priceOne = '81.00' // first item price
    const keywordTwo = 'second item description'
    const priceTwo = '495.00' // second item price

    // CC details
    const ccName = 'John Doe'
    const ccNumber = '00011111100000'
    const ccExpMonth = '01'
    const ccExpYear = '2023'
    const ccSecurityNumber = '0101'

    // add stealth plugin and use defaults (all evasion techniques)
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36'
    const StealthPlugin = require('puppeteer-extra-plugin-stealth')
    puppeteer.use(StealthPlugin())

    const storebot = async function() {

        // Open browser and webpage
        const browser = await puppeteer.launch({headless: false, slowMo: 50});
        const mainPage = await browser.newPage();
        await mainPage.setUserAgent(userAgent);
        await mainPage.goto(URL);
        const reqPage = await browser.newPage();
        await reqPage.setUserAgent(userAgent)
        await mainPage.bringToFront();
    
        // Grab product info from page
        const availability = await mainPage.$$eval(".tocart a", el => el.map(el => el.textContent));
        const productID = await mainPage.$$eval("div[class='price']", el => el.map(el => el.getAttribute('data-publishproductid')));
        const productText = await mainPage.$$eval("h4[class='title']", el => el.map(el => el.textContent));
        const productPrice = await mainPage.$$eval("div[class='price']", el => el.map(el => el.textContent));
        const buyID = []

        // Find desired products
        for (i=0; i<availability.length; i++) {
            if (availability[i] === 'Add To Cart' && ((productText[i].includes(keywordOne) && productPrice[i].includes(priceOne)) || (productText[i].includes(keywordTwo) && productPrice[i].includes(priceTwo)))) {
                buyID.push(productID[i])
                console.log(`${productID[i]} is available`)
            }
        }

        // Add desired products to cart
        if (buyID == '') {
            console.log('\nNone of the items you want are currently available!');
        
        } else {
            for (i=0; i<buyID.length; i++) {
                await reqPage.goto(`https://www.thewebsite.com/store/product/addtocart/?productId=${buyID[i]}`)
                console.log(`Product ID ${buyID[i]} added to cart`)
            }

            // Checkout
            await mainPage.goto(cartURL);
            await mainPage.click("a[class='btn-text-icon btn-bg-primary']");

            // Login
            await mainPage.type("input[id='login_username']", email)
            await mainPage.type("input[id='login_password']", password)
            await mainPage.click('#loginButton')

            // Input Fields and Buy
            await mainPage.$eval("#radioPaymentProviders2", el => el.parentElement.click());
            await mainPage.type("input[id='CardHolderName']", ccName);
            await mainPage.type("input[id='CredidCardNumber']", ccNumber);
            await mainPage.type("input[id='CredidCardExpMonth']", ccExpMonth);
            await mainPage.type("input[id='CredidCardExpYear']", ccExpYear);
            await mainPage.type("input[id='CredidCardCVCNumber']", ccSecurityNumber);
            await mainPage.$eval("input[id='checkoutTermsAndConditions-Box']", el => el.click())
            await mainPage.click("#btnCompleteCheckout");

            for (i=0; i<buyID.length; i++) {
                console.log(`Successfully ordered Product ID: ${buyID[i]}`)
            }
        }

        // Close session
        await reqPage.close();
        await mainPage.close();
    
    }();

    console.log('\nRunning...')

});