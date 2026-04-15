Oracles
Oracles serve as the critical bridge between blockchain networks and real-world data, enabling smart contracts to interact with external information. HashKey Chain integrates with leading oracle providers to ensure developers have access to reliable, secure, and decentralized data feeds for building robust applications.

SUPRA Oracle
SUPRA provides HashKey Chain with advanced oracle technology delivering reliable and accurate real-world data feeds. Addressing limitations of traditional oracles such as dependency on trusted intermediaries and latency issues, SUPRA developed the Distributed Oracle Agreement (DORA) - a high-performance consensus algorithm that aggregates price data from up to 21 sources, ensuring data integrity through Byzantine Fault Tolerance.

Available Networks
SUPRA's oracle infrastructure on HashKey Chain includes Pull Oracle contracts that allow smart contracts to request and retrieve data:

Pull Oracle Model
Network	Pull Contract	Storage Contract
HashKey Chain Mainnet	0x16f70cAD28dd621b0072B5A8a8c392970E87C3dD	0x58e158c74DF7Ad6396C0dcbadc4878faC9e93d57
HashKey Chain Testnet	0x443A0f4Da5d2fdC47de3eeD45Af41d399F0E5702	0x6Cd59830AAD978446e6cc7f6cc173aF7656Fb917
Implementation Example

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./ISupraPullOracle.sol";

contract SupraConsumer {
    ISupraPullOracle public oracle;
    
    constructor(address _oracleAddress) {
        oracle = ISupraPullOracle(_oracleAddress);
    }
    
    function getBTCPrice() public view returns (uint256, uint256) {
        // pair_id for BTC/USD = 0
        (uint256 price, uint256 timestamp) = oracle.getIndexedPrice(0);
        return (price, timestamp);
    }
}
Documentation:

For detailed implementation guidelines, see the SUPRA Pull Oracle Documentation.

APRO Oracle
APRO integrates with HashKey Chain using innovative Data Push technology to deliver reliable and timely price feeds. Utilizing a threshold-based data model, APRO's decentralized node operators continuously aggregate and push updates to the blockchain when specific price thresholds are met, enhancing scalability and ensuring real-time data delivery for DeFi protocols and smart contracts.

Price Feeds
APRO provides price feeds with configurable deviation thresholds and heartbeat intervals:

HashKey Testnet
Pair	Deviation	Heartbeat	Contract Address
BTC/USD	0.5%	4h	0x64697A6Abb508079687465FA9EF99D2Da955D791
USDT/USD	0.5%	4h	0xC45D520D18A465Ec23eE99A58Dc4cB96b357E744
USDC/USD	0.1%	24h	0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27
HashKey Mainnet
Pair	Deviation	Heartbeat	Contract Address
BTC/USD	0.5%	1h	0x204ED500ab56A2E19B051561258E3A45c850360F
HSK/USD	0.5%	1h	0x86CE42c1b714149Dc3A7b169EF67b5F78A224b
USDT/USD	0.1%	24h	0x823d7f90f7A3498DB6595886b6B5dC95E6B0B7f3
USDC/USD	0.1%	24h	0x244Ce344df8837c9d938867E2Ffbf0E4B0169B56
Implementation Example

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@apro/contracts/APROPriceFeed.sol";

contract APROConsumer {
    APROPriceFeed public priceFeed;
    
    constructor(address _priceFeedAddress) {
        priceFeed = APROPriceFeed(_priceFeedAddress);
    }
    
    function getLatestPrice() public view returns (int256, uint256) {
        (
            /*uint80 roundID*/,
            int256 price,
            /*uint startedAt*/,
            uint256 timestamp,
            /*uint80 answeredInRound*/
        ) = priceFeed.latestRoundData();
        
        return (price, timestamp);
    }
}
Documentation:

For detailed integration instructions, visit APRO Documentation.

Chainlink Streams
Chainlink Streams provides verifiable price data through a decentralized network of oracles, ensuring high-quality, tamper-resistant data for smart contracts.

Network Addresses
Network	Verifier Proxy Address
HashKey Chain Mainnet	0x3278e7a582B94d82487d4B99b31A511CbAe2Cd54
HashKey Chain Testnet	0xE02A72Be64DA496797821f1c4BB500851C286C6c
Implementation Example

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ChainlinkConsumer {
    AggregatorV3Interface internal priceFeed;
    
    constructor(address _verifierProxy) {
        priceFeed = AggregatorV3Interface(_verifierProxy);
    }
    
    function getLatestPrice() public view returns (int) {
        (
            /* uint80 roundID */,
            int answer,
            /* uint startedAt */,
            /* uint timeStamp */,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();
        return answer;
    }
}
Best Practice:

When building critical financial applications, consider using multiple oracle providers for data redundancy and increased security against potential oracle failures or manipulation attempts.

Oracle Selection Guide
Oracle Provider	Update Mechanism	Best For	Unique Features
SUPRA	Pull-based	Applications requiring on-demand data	High throughput consensus algorithm (DORA)
APRO	Push-based	DeFi protocols needing real-time updates	Threshold-based updates reducing gas costs
Ethereum Global	Verify Proxy	Cross-chain applications	Multi-chain compatibility
Chainlink	Streams	Mission-critical applications	Industry-standard security and reliability
For specific integration questions or custom oracle solutions, contact the HashKey Chain developer support team.