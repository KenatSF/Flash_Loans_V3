# Aave Flash Loan and Arbitrage swaps 

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
The test is optimized to get a successful arbitrage transaction. 

Follow the steps.

Write in a console the next line:

```
$ ganache-cli --fork Ethereum-Node-URL@22429499 --unlock 0xE68d531d8B4d035bf3F4BC2DaBb70f51FbB14E23 
```
(You can use [Infura](https://www.infura.io/) for the node. Also, the block number is important for the test.)

Then, write in a different console within the root directory of the repository:

```
$ truffle test 
```


## Deployment 

To deploy the contract into the Ethereum-Mainnet, run:

```bash
$ truffle migrate --network ethereum_mainnet
```

<br />
<br />
<br />

**Note: As an advice, I really recommend you to use [Foundry](https://github.com/foundry-rs/foundry)  for your projects. It's a better tool than [Truffle](https://github.com/trufflesuite/truffle) or even [Hardhat](https://github.com/NomicFoundation/hardhat).**

**Good Luck! ;)**