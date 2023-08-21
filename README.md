
# Mopsus Snap

Mopsus Snap utilizes *pre-execution* technology to predict the users' balance changes of transactions and provide security checks before signing transactions.

## Application Scenario
Web3 users leverage wallets to sign transactions to join the DeFi ecosystem, however, most users lack the understanding of transaction content and impact.
This ignorance causes users to be deceived by phishers, mistakenly sign malicious transactions, and cause losses to their own assets.

## Snap Features

### Balance Change Check

Mopsus Snap integrates BlockSec Mopsus API, realizes transaction pre-running, and predicts the impact of transactions on user account assets (ERC-20 tokens). 


### Security Check

Mopsus Snap provides the ability to check the security of transactions, thereby preventing most phishing, scams, and other behaviors that endanger users. The snap integrates the address tags of the BlockSec AML team, including Fake_Phishing addresses and scam token addresses. Specifically, the snap provides the following security check:
- Address security check
- Token security check 

## Getting Started

Clone the template-snap repository [using this template](https://github.com/MetaMask/template-snap-monorepo/generate) and setup the development environment:

```shell
yarn install && yarn start
```
# Use case

## Risk Address Warning
Sending ETH to 0xe15e7a2dda262e7b4f497f7e74e0aae5f8bd87f1 (Fake_Phishing) will be warned by dangerous address detection.
## Scam Token Warning
Swap USDT to 0xe3D53306be55EFF65E6A9C6fF40552c467f85482 (Fake_Phishing186264) will be warned by dangerous token detection.

## License

Snap is MIT licensed.


## About US
[BlockSec](https://blocksec.com/#about) is dedicated to building blockchain security infrastructure. The team is founded by top-notch security researchers and experienced experts from both academia and industry.
We have published multiple blockchain security papers in prestigious conferences, reported several zero-day attacks of DeFi applications, and successfully protected digital assets that are worth more than 5 million dollars by blocking multiple attacks.

