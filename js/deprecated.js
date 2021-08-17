/**
 * @dev For Midgard v1, DEPRECATED
 */
 const getPricesV1 = async (asset) => {
  let priceData = await $.get(
    `${THOR_NODE}/assets?asset=BNB.BUSD-BD1,${asset}`
  );
  return {
    runePriceUsd: 1 / priceData[0].priceRune,
    assetPriceUsd: priceData[1].priceRune / priceData[0].priceRune,
  };
};

/**
 * @dev For Midgard v1. DEPRECATED
 */
 const getDataFromMidgardV1 = async (pool, from) => {
  let now = Math.floor(new Date().getTime() / 1000);
  let busdData = await $.get(
    `${THOR_NODE}/history/pools?pool=BNB.BUSD-BD1&interval=hour&from=${from}&to=${now}`
  );
  let assetData = await $.get(
    `${THOR_NODE}/history/pools?pool=${pool}&interval=hour&from=${from}&to=${now}`
  );
  let assetDataCurrent = await $.get(`${THOR_NODE}/pools/detail?asset=${pool}`);

  let data = [];
  for (let i = 0; i < assetData.length; i++) {
    let { time, assetDepth, runeDepth } = assetData[i];
    let runePriceUsd = 1 / busdData[i].price;
    let assetPriceUsd = (runePriceUsd * runeDepth) / assetDepth;

    data.push({
      time,
      assetDepth,
      runeDepth,
      assetPriceUsd,
      runePriceUsd,
    });
  }

  // Calculate (approximate) liquidity units
  data[data.length - 1].liquidityUnits = assetDataCurrent[0].poolUnits;
  for (let i = data.length - 2; i >= 0; i--) {
    data[i].liquidityUnits =
      data[i + 1].liquidityUnits - assetData[i + 1].unitsChanges;
    // console.log(data[i]);
  }

  console.log("Fetched pool data:\n", data);
  return data;
};
