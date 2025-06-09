// For a successfull flashloan the blocknumber is required at: 22429499

const { amount_In_filter, amount_Out_filter, erc20_approve, erc20_transfer, erc20_balance, weth_withdraw, getAmountsOut_router_v2, swap_router_v2, erc20_allowance } = require('./utils');

const IERC20 = artifacts.require("IERC20");
const flash = artifacts.require("Flashy");

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// ###################################################################################      Required addresses

const token_name_erc20 = { // * Measn most important for flash loans.
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',        //*
    'MATIC': '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0',
    'UNI': '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',        
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',       //*
    'AAVE': '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    'COMP': '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    'USDC': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',       //*
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',       //*
    'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',       //*
    'TOKE': '0x2e9d63788249371f1DFC918a52f8d799F4a38C94',       
    'COTI': '0xDDB3422497E61e13543BeA06989C0789117555c5',       
    'YEARN': '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',      
    'DG': '0xEE06A81a695750E71a662B51066F2c74CF4478a0',         
    'RARI': '0xFca59Cd816aB1eaD66534D82bc21E7515cE441CF',
    'CRV': '0xD533a949740bb3306d119CC777fa900bA034cd52',
    'DYDX': '0x92D6C1e31e14520e676a687F0a93788B716BEff5'
};

function swaping_keys(json){
    var ret = {};
    for(var key in json){
      ret[json[key]] = key;
    }
    return ret;
  }

const token_address_erc20 = swaping_keys(token_name_erc20);



// Note: Maximum 4 accounts for unlocking
const whales = {
    'DAI': '0x38720D56899d46cAD253d08f7cD6CC89d2c83190',
    'COTI': '0xBDcB703937a71a01E5287cE6F5f2E12567133d1E', 
    'WETH': '0xE68d531d8B4d035bf3F4BC2DaBb70f51FbB14E23',
    'RARI': '0x72A53cDBBcc1b9efa39c834A540550e23463AAcB', 
    'USDC': '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'
};

const defi = {
    'UNI_V2_ROUTER': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    'SUSHI_ROUTER': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    'UNI_ROUTER3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    'UNI_V3_ROUTER': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    'UNI_V3_ROUTER2': '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    'AAVE': '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5'
};



// ###################################################################################      Testing
contract('Flash Loan: Aave with Sushiswap & Uniswap V2', () => {
    //it('Front-running part', async () => {
    //    console.log('----------It separation ----------------------------------------------------------------------------------------------');
    //});

    beforeEach(async () => {
        const accounts = await web3.eth.personal.getAccounts();
        const my_address = accounts[9]
        // Deploy contracts
        weth = await IERC20.at(token_name_erc20['WETH']);
        toke = await IERC20.at(token_name_erc20['TOKE']);
        contract = await flash.new(my_address, defi['AAVE'], {from: my_address});
      });
    


    it('Swap simulated on Uniswap', async () => {
        const accounts = await web3.eth.personal.getAccounts();
        const account_address = accounts[1];

        console.log("Swapping on Uniswap");

        // WEHT amount to fund contract for swapping for token TOKE:
        const funding_amount = 100;
        
        // Variables
        var weth_account_balance, eth_account_balance, toke_account_balance;
        var weth_contract_balance, eth_contract_balance, toke_contract_balance;
        // Extra variables, amount_allowed;
        var amount_allowed, amount_allowed_1;
 

        console.log('-----------------------------------------------------------');
        console.log('First Balance Check');

        // Account:
        weth_account_balance = await erc20_balance(web3, token_name_erc20['WETH'], account_address, 18);
        eth_account_balance = await web3.eth.getBalance(account_address);
        toke_account_balance = await erc20_balance(web3, token_name_erc20['TOKE'], account_address, 18);
        
        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${weth_account_balance}`);
        console.log(`ETH balance of my account :${amount_Out_filter(web3, eth_account_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${toke_account_balance}`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Funding account with WETH: ');
        await erc20_transfer(web3, token_name_erc20['WETH'], whales['WETH'], account_address, funding_amount, 18);

        console.log('-----------------------------------------------------------');
        console.log('Second Balance Check');

        // Account:
        weth_account_balance = await weth.balanceOf(account_address)
        eth_account_balance = await web3.eth.getBalance(account_address);
        toke_account_balance = await toke.balanceOf(account_address);

        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(web3, weth_account_balance, 18)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(web3, eth_account_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(web3, toke_account_balance, 18)}`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('First amount approved check');
        amount_allowed = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['SUSHI_ROUTER']);
        amount_allowed_1 = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['UNI_V3_ROUTER2']);    
        console.log(`Amount: ${amount_allowed} approved from: ${account_address} to: Sushi`);
        console.log(`Amount: ${amount_allowed_1} approved from: ${account_address} to: Uni_V3`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('First Approving amount to spender');
        await erc20_approve(web3, token_name_erc20['WETH'], account_address, defi['SUSHI_ROUTER'], funding_amount, 18);
        await erc20_approve(web3, token_name_erc20['WETH'], account_address, defi['UNI_V3_ROUTER2'], funding_amount + 5, 18);
        const amount_expected = await getAmountsOut_router_v2(web3, defi['SUSHI_ROUTER'], funding_amount, 18, [token_name_erc20['WETH'], token_name_erc20['TOKE']], 18);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Second amount approved check');
        amount_allowed = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['SUSHI_ROUTER']);
        amount_allowed_1 = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['UNI_V3_ROUTER2']);   
        console.log(`Amount: ${amount_allowed} approved from: ${account_address} to: Sushi`);
        console.log(`Amount: ${amount_allowed_1} approved from: ${account_address} to: Uni_V3`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Swapping WETH for TOKE: ');
        await swap_router_v2(web3, defi['SUSHI_ROUTER'], funding_amount, 18, amount_expected, 18, [token_name_erc20['WETH'], token_name_erc20['TOKE']], account_address);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Third amount approved check');
        amount_allowed = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['SUSHI_ROUTER']);
        amount_allowed_1 = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['UNI_V3_ROUTER2']);
        console.log(`Amount: ${amount_allowed} approved from: ${account_address} to: Sushi`);
        console.log(`Amount: ${amount_allowed_1} approved from: ${account_address} to: Uni_V3`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Second Approving amount to spender (Reverting amount approved)');
        await erc20_approve(web3, token_name_erc20['WETH'], account_address, defi['UNI_V3_ROUTER2'], 0, 18);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Fourth amount approved check');
        amount_allowed = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['SUSHI_ROUTER']);
        amount_allowed_1 = await erc20_allowance(web3, token_name_erc20['WETH'], account_address, defi['UNI_V3_ROUTER2']);
        console.log(`Amount: ${amount_allowed} approved from: ${account_address} to: Sushi`);
        console.log(`Amount: ${amount_allowed_1} approved from: ${account_address} to: Uni_V3`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Third Balance Check');

        // Account:
        weth_account_balance = await weth.balanceOf(account_address)
        eth_account_balance = await web3.eth.getBalance(account_address);
        toke_account_balance = await toke.balanceOf(account_address);
        
        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(web3, weth_account_balance, 18)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(web3, eth_account_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(web3, toke_account_balance, 18)}`);
        console.log(" ");


        console.log('---------- END           ---------------------------------------');

        
    });

  
    it('Flash Loan simulated', async () => {
        const accounts = await web3.eth.personal.getAccounts();
        const my_address = accounts[9]

        console.log("Flash loan and arbitrage swapping");
        console.log('--------------------------------------------------------------');
        console.log('Contract address: ', contract.address);

        // Amount borrowed from Aave lending Pool Provider:
        const flashloan_amount = 5;
        

        var weth_account_balance, eth_account_balance, toke_account_balance;
        var weth_contract_balance, eth_contract_balance, toke_contract_balance;
 

        console.log('-----------------------------------------------------------');
        console.log('First Balance Check');

        // Account:
        weth_account_balance = await weth.balanceOf(my_address)
        eth_account_balance = await web3.eth.getBalance(my_address);
        toke_account_balance = await toke.balanceOf(my_address);
        
        // Contract: 
        weth_contract_balance = await weth.balanceOf(contract.address);
        eth_contract_balance = await web3.eth.getBalance(contract.address);
        toke_contract_balance = await toke.balanceOf(contract.address);

        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(web3, weth_account_balance, 18)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(web3, eth_account_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(web3, toke_account_balance, 18)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(web3, weth_contract_balance, 18)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(web3, eth_contract_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(web3, toke_contract_balance, 18)}`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log("Flash Loan.")
        await contract.flash_loan(
                                    token_name_erc20['WETH'],
                                    token_name_erc20['TOKE'],
                                    amount_In_filter(web3, flashloan_amount, 18),
                                    4,
                                    0,
                                    0,
                                    0,
                                    20,
                                    {from: my_address}
                                 );

        
        console.log('-----------------------------------------------------------');
        console.log('Second Balance Check');
        
        // Account:
        weth_account_balance = await weth.balanceOf(my_address)
        eth_account_balance = await web3.eth.getBalance(my_address);
        toke_account_balance = await toke.balanceOf(my_address);
        
        // Contract: 
        weth_contract_balance = await weth.balanceOf(contract.address);
        eth_contract_balance = await web3.eth.getBalance(contract.address);
        toke_contract_balance = await toke.balanceOf(contract.address);

        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(web3, weth_account_balance, 18)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(web3, eth_account_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(web3, toke_account_balance, 18)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(web3, weth_contract_balance, 18)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(web3, eth_contract_balance, 18)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(web3, toke_contract_balance, 18)}`);
        console.log(" ");



        console.log('---------- END           ----------------------------------------------------------------------------------------------');
    });


    

});