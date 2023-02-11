const axios = require("axios");

const query = `{
  user(id: "0x4589f92743872b2a0f4e0b16365f3e46842d351c") {
    liquidityPositions {
      pair {
        id
        reserve1
        reserve0
        token0 {
          symbol
          id
        }
        token1 {
          symbol
          id
        }
        totalSupply
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

  // Loop through each liquidity position
  liquidityPositions.forEach(async (position) => {
    // If the user has a non-zero balance in the liquidity token
    if (position.liquidityTokenBalance !== "0") {
      const token1amount = ((position.pair.reserve1 * position.liquidityTokenBalance) / position.pair.totalSupply).toFixed(2);
      const token0amount = ((position.pair.reserve0 * position.liquidityTokenBalance) / position.pair.totalSupply).toFixed(2);
      // Log the transaction data to the console
      console.log("Token0amount: ", token0amount);
      console.log("Token0symbol: ", position.pair.token0.symbol);
      console.log("Token1amount: ", token1amount);
      console.log("Token1symbol: ", position.pair.token1.symbol)
    }
  });
}

getUserData();
