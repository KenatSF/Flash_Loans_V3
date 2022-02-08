# Aave Flash Loan and arb_swap 

## Dependencies

* Node v14.17.5
* npm 6.14.14
* Ganache CLI v6.12.2
* Truffle v5.1.55 

Packages and their versions are in the "package.json" file

## Resources

* [Aave](https://github.com/aave)
* [Uniswap](https://github.com/Uniswap)
* [Flashbots ](https://github.com/flashbots)

## Testing

The testing is optimized for a successful arbitrage with a Flash Loan. 

Before running the test you should run in a console:

```
ganache-cli --fork EthereumNode-URL@13027545 --unlock 0xE8E8f41Ed29E46f34E206D7D2a7D6f735A3FF2CB 
```
(The block number is important for the testing).

Then, to run the test:

```
truffle test 
```


## Deployment 

To deploy the contract to the Ethereum-Mainnet, run:

```bash
$ truffle migrate --network ethereum_mainnet
```

Before deploy it, you should uncomment the line 383 in the Flashy.sol file, this will allow to the contract make the fee payment to the minner and also you will be able to withdraw the profit according the percentage you pass it, percentage recommended: 80% minner & 20% you.