const axios = require("axios");
const { Network, Alchemy } = require("alchemy-sdk");

const settings = {
  apiKey: "",
  network: Network.ETH_MAINNET,
};
const alchemy = new Alchemy(settings);

const query = `
{
  user(id: "0x76c9985d294d9aeadd33f451bfb59bc69b20c474") {
    liquidityPositions {
      pair {
        id
        token0 {
          totalSupply
          symbol
          tradeVolume
          id
        }
        token0Price
        token1Price
        token1 {
          symbol
          totalSupply
          tradeVolume
          id
        }
        volumeUSD
        untrackedVolumeUSD
        totalSupply
        volumeToken0
        volumeToken1
      }
      liquidityTokenBalance
    }
  }
}
`;

async function getUserData() {
    // Make a request to the The Graph API to get the user's liquidity positions data
    const response = await axios.post(
      "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
      {
        query,
      }
    );
  
    // Get the liquidity positions data
    const liquidityPositions = response.data.data.user.liquidityPositions;
  
    // Create a set to store unique transactions
    const uniqueTransactions = new Set();
  
    // Loop through each liquidity position
    liquidityPositions.forEach(async (position) => {
      // If the user has a non-zero balance in the liquidity token
      if (position.liquidityTokenBalance !== "0") {
        // Get the ID of the pool
        const id = position.pair.id;

        const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${position.pair.token0.symbol}`, {
          headers: {
            'X-CMC_Pro_API_Key': '66d708d2-ad5b-4032-9885-b23fb4c6d8d0'
          }
        });
      
        const token0price = response.data.data[position.pair.token0.symbol].quote.USD.price;

        const response1 = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${position.pair.token1.symbol}`, {
          headers: {
            'X-CMC_Pro_API_Key': '66d708d2-ad5b-4032-9885-b23fb4c6d8d0'
          }
        });
      
        const token1price = response1.data.data[position.pair.token1.symbol].quote.USD.price;
        
      
  
        // Make a call to the Alchemy API to get the transactions data
        const res = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          fromAddress: "0x76c9985d294d9aeadd33f451bfb59bc69b20c474",
          // pass the id gotten from the liquidity position data and pass it as a parameter
          toAddress: id,
          excludeZeroValue: true,
          category: ["erc20", "erc1155", "external", "internal"],
        });
        
        // Loop through each transaction
        res.transfers.forEach(async (txn) => {
          // If the transaction is unique
          if (!uniqueTransactions.has(txn.hash)) {
            // Add the transaction hash to the set of unique transactions
            uniqueTransactions.add(txn.hash);
  
            // Get the hash of the transaction
            const txnHash = txn.hash;
  
            // Make a POST request to get the mint data
            const mintResponse = await axios.post(
              "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
              {
                query: `{
              mint(id: "${txnHash}-0") {
                timestamp
                amount0
                amount1
              }
              
            }`,
              }
            );
            // Get the mint data
            const mint = mintResponse.data.data.mint;
            // If the mint data exists
            if (mint) {
              const timestamp = mint.timestamp; 
       
              const day = Math.floor(timestamp / 86400);
              const response0 = await axios.post(
                "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
                {
                  query: `{
                   tokenDayData(id: "${position.pair.token0.id}-${day}")  {
                    priceUSD
                  }
                   
                }`,
              }
            );
            const response1 = await axios.post(
                "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2",
                {
                  query: `{
                   tokenDayData(id: "${position.pair.token1.id}-${day}")  {
                    priceUSD
                  }
                   
                }`,
              }
            );
        
            const priceUSD = response0.data.data.tokenDayData.priceUSD;
            const priceUSD1 = response1.data.data.tokenDayData.priceUSD;

              // Convert the timestamp to a human-readable date and time
              const time =new Date(timestamp * 1000).toLocaleString();
             
              // Log the transaction data to the console
              console.log("Transaction hash: ", txnHash);
              console.log("Token0 price on the data of deposit: ", priceUSD);
              console.log("Token1 price on the data of deposit: ", priceUSD1);
              console.log( "Token0 amount: ", mint.amount0, position.pair.token0.symbol);
              console.log("current token1 price:", token0price);
              console.log("current token0 Price:", token1price);
              console.log( "Token1 amount: ", mint.amount1, position.pair.token1.symbol);
              console.log("pool address:", id);
            }
          }
        });
      }
    });
  }
  
  getUserData();
