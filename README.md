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
$ ganache-cli --fork Ethereum-Node-URL@13027545 --unlock 0xE8E8f41Ed29E46f34E206D7D2a7D6f735A3FF2CB 
```
(You could use [Infura](https://www.infura.io/) for the node. Also, the block number is important for the test.)

Then, write in a different console within the root directory of the repository:

```
$ truffle test 
```


## Deployment 

To deploy the contract into the Ethereum-Mainnet, run:

```bash
$ truffle migrate --network ethereum_mainnet
```

Before you deploy it, you should uncomment the line 396 in the Flashy.sol file. 
With this modification the contract can make the respective fee payment to the minner. Also, you can withdraw the profit of the transaction based on the percentage you pass it. Percentage recommended: 80% minner & 20% you, but obviously it depends on the profit you're making, if it's a huge profit, that percentege to the miner could be considerably smaller.
<br />
<br />
<br />

**Note: As an advice, I really recommend you to use [Foundry](https://github.com/foundry-rs/foundry)  for your projects. It's a better tool than [Truffle](https://github.com/trufflesuite/truffle) or even [Hardhat](https://github.com/NomicFoundation/hardhat).**

**Good Luck! ;)**