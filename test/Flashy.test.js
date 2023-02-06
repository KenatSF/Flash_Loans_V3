// For a successfull flashloan the blocknumber is required at: 13027545 

const IERC20 = artifacts.require("IERC20");
const flash = artifacts.require("Flashy");

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const Web3 = require('Web3');
url = 'http://localhost:8545'
const web3 = new Web3(url);

// ###################################################################################      Functions for converting uint format to decimal and vice versa
function amount_In_filter(n) {
    return web3.utils.toWei(n.toString(), "ether");
}

function amount_Out_filter(n) {
    return web3.utils.fromWei(n.toString(), "ether");
}

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

const my_address = process.env.ADDRESS_PRIVATE_KEY_TEST1;


// Note: Maximum 4 accounts for unlocking
const whales = {
    'DAI': '0x38720D56899d46cAD253d08f7cD6CC89d2c83190',
    'COTI': '0xBDcB703937a71a01E5287cE6F5f2E12567133d1E', 
    'WETH': '0xE8E8f41Ed29E46f34E206D7D2a7D6f735A3FF2CB',
    'RARI': '0x72A53cDBBcc1b9efa39c834A540550e23463AAcB', 
    'USDC': '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'
};

const defi = {
    'UNI_ROUTER': '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    'SUSHI_ROUTER': '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    'UNI_ROUTER3': '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    'AAVE': '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5'
};


// ###################################################################################      Testing
contract('Flash Loan: Aave with Sushiswap, Uniswap V2 & Uniswap V3', () => {
    //it('Front-running part', async () => {
    //    console.log('----------It separation ----------------------------------------------------------------------------------------------');
    //});

    it('Simulated swap on Sushiswap', async () => {
        console.log("Swapping on Sushiswap");
        console.log('-----------------------------------------------------------------------------------------------------------');
        // Deploy contracts
        const weth = await IERC20.at(token_name_erc20['WETH']);
        const toke = await IERC20.at(token_name_erc20['TOKE']);

        const swapping = await flash.new(my_address, defi['AAVE']);
        console.log('-----------------------------------------------------------');
        console.log('Contract address: ', swapping.address);

        // Amount to fund contract for swapping for token TOKE:
        const funding_amount = 39.8616379045;
        

        var weth_account_balance, eth_account_balance, toke_account_balance;
        var weth_contract_balance, eth_contract_balance, toke_contract_balance;
 

        console.log('-----------------------------------------------------------');
        console.log('First Balance Check');

        // Account:
        weth_account_balance = await weth.balanceOf(my_address)
        eth_account_balance = await web3.eth.getBalance(my_address);
        toke_account_balance = await toke.balanceOf(my_address);
        
        // Contract: 
        weth_contract_balance = await weth.balanceOf(swapping.address);
        eth_contract_balance = await web3.eth.getBalance(swapping.address);
        toke_contract_balance = await toke.balanceOf(swapping.address);

        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(weth_account_balance)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(eth_account_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(toke_account_balance)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(weth_contract_balance)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(eth_contract_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(toke_contract_balance)}`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Funding contract with WETH: ');
        await weth.transfer(swapping.address, amount_In_filter(funding_amount), {from: whales['WETH']});
        

        console.log('-----------------------------------------------------------');
        console.log('Second Balance Check');

        // Account:
        weth_account_balance = await weth.balanceOf(my_address)
        eth_account_balance = await web3.eth.getBalance(my_address);
        toke_account_balance = await toke.balanceOf(my_address);
        
        // Contract: 
        weth_contract_balance = await weth.balanceOf(swapping.address);
        eth_contract_balance = await web3.eth.getBalance(swapping.address);
        toke_contract_balance = await toke.balanceOf(swapping.address);

        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(weth_account_balance)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(eth_account_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(toke_account_balance)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(weth_contract_balance)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(eth_contract_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(toke_contract_balance)}`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log('Swapping WETH for TOKE: ');
        await swapping.sushi(token_name_erc20['WETH'], token_name_erc20['TOKE'], amount_In_filter(funding_amount));


        console.log('-----------------------------------------------------------');
        console.log('Third Balance Check');

        // Account:
        weth_account_balance = await weth.balanceOf(my_address)
        eth_account_balance = await web3.eth.getBalance(my_address);
        toke_account_balance = await toke.balanceOf(my_address);
        
        // Contract: 
        weth_contract_balance = await weth.balanceOf(swapping.address);
        eth_contract_balance = await web3.eth.getBalance(swapping.address);
        toke_contract_balance = await toke.balanceOf(swapping.address);

        console.log(" ");
        console.log('Account: ');
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(weth_account_balance)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(eth_account_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(toke_account_balance)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(weth_contract_balance)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(eth_contract_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(toke_contract_balance)}`);
        console.log(" ");

        console.log('---------- END           ----------------------------------------------------------------------------------------------');
    });

  
    it('Simulated Flash Loan', async () => {
        console.log("Flash loan and arbitrage swapping");
        console.log('-----------------------------------------------------------------------------------------------------------');
        // Deploy contracts
        const weth = await IERC20.at(token_name_erc20['WETH']);
        const toke = await IERC20.at(token_name_erc20['TOKE']);

        const contract = await flash.new(my_address, defi['AAVE']);
        console.log('-----------------------------------------------------------');
        console.log('Contract address: ', contract.address);

        // Amount for borrowing from Aave lending Pool Provider:
        const flashloan_amount = 14.036556890115856282;
        

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
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(weth_account_balance)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(eth_account_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(toke_account_balance)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(weth_contract_balance)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(eth_contract_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(toke_contract_balance)}`);
        console.log(" ");


        console.log('-----------------------------------------------------------');
        console.log("Flash Loan.")
        await contract.flash_loan(token_name_erc20['WETH'], token_name_erc20['TOKE'], amount_In_filter(flashloan_amount), 4, 0, 0, 0, 50);

        
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
        console.log(`${token_address_erc20[weth.address]} balance of my account :${amount_Out_filter(weth_account_balance)}`);
        console.log(`ETH balance of my account :${amount_Out_filter(eth_account_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my account :${amount_Out_filter(toke_account_balance)}`);
        console.log(" ");
        console.log('Contract: ');
        console.log(`${token_address_erc20[weth.address]} balance of my contract :${amount_Out_filter(weth_contract_balance)}`);
        console.log(`ETH balance of my contract :${amount_Out_filter(eth_contract_balance)}`);
        console.log(`${token_address_erc20[toke.address]} balance of my contract :${amount_Out_filter(toke_contract_balance)}`);
        console.log(" ");


        console.log('---------- END           ----------------------------------------------------------------------------------------------');
    });


    

});