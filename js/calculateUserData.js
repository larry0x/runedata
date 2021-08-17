/**
 * @dev Future: for Midgard v2
 */
const getPrices = async (asset) => {
  let priceData = await $.get(`${THOR_NODE}/pool/${asset}`);
  return {
    runePriceUsd: priceData.assetPriceUSD / priceData.assetPrice,
    assetPriceUsd: priceData.assetPriceUSD,
  };
};

/**
 * @dev Future: for Midgard v2
 */
const getDataFromMidgard = async (pool, from) => {
  let now = Math.floor(Date.now() / 1000);
  let to = from;
  let data = [];

  // Midgard v2 only returns up to 100 intervals when querying historical data
  // Thus we have to split to multiple requests
  while (to < now) {
    to = Math.min(
      from + 4 * 24 * 60 * 60, // 96 hours
      now
    );

    console.log(`Fetching data from ${from} to ${to}`);

    let { intervals } = await $.get(
      `${THOR_NODE}/history/depths/${pool}?from=${from}&to=${to}&interval=hour`
    );

    for (interval of intervals) {
      let {
        assetDepth,
        assetPriceUSD,
        liquidityUnits,
        runeDepth,
        startTime,
      } = interval;

      data.push({
        time: startTime,
        liquidityUnits: liquidityUnits,
        assetDepth: assetDepth,
        runeDepth: runeDepth,
        assetPriceUsd: assetPriceUSD,
        runePriceUsd: (assetPriceUSD * assetDepth) / runeDepth,
      });
    }

    from = to;
  }

  console.log("Fetched pool data:\n", data);
  return data;
};

const calculateTotalAssetValue = (amountInvested, data) => {
  let result = {
    totalValueLP: [],
    totalValueHodl: [],
    totalValueRune: [],
    totalValueAsset: [],
  };

  for (let i = 0; i < data.length; i++) {
    let x = new Date(data[i].time * 1000);
    result.totalValueLP.push({
      x,
      y:
        (amountInvested *
          ((data[i].runePriceUsd * data[i].runeDepth) /
            data[i].liquidityUnits)) /
        ((data[0].runePriceUsd * data[0].runeDepth) / data[0].liquidityUnits),
    });
    result.totalValueHodl.push({
      x,
      y:
        0.5 *
        amountInvested *
        (data[i].runePriceUsd / data[0].runePriceUsd +
          data[i].assetPriceUsd / data[0].assetPriceUsd),
    });
    result.totalValueRune.push({
      x,
      y: (amountInvested * data[i].runePriceUsd) / data[0].runePriceUsd,
    });
    result.totalValueAsset.push({
      x,
      y: (amountInvested * data[i].assetPriceUsd) / data[0].assetPriceUsd,
    });
  }

  console.log("Calculated total value data:\n", result);
  return result;
};

const calculateFeeVsIL = (data) => {
  let result = {
    feeIncome: [],
    impermLoss: [],
    totalGains: [],
  };

  for (let i = 0; i < data.length; i++) {
    let x = new Date(data[i].time * 1000);
    let priceSwing =
      data[i].assetDepth /
      data[i].runeDepth /
      (data[0].assetDepth / data[0].runeDepth);

    let totalLP =
      (data[i].runePriceUsd * data[i].runeDepth) /
      data[i].liquidityUnits /
      ((data[0].runePriceUsd * data[0].runeDepth) / data[0].liquidityUnits);
    let totalHodl =
      0.5 *
      (data[i].runePriceUsd / data[0].runePriceUsd +
        data[i].assetPriceUsd / data[0].assetPriceUsd);

    result.feeIncome.push({
      x,
      y:
        Math.sqrt(data[i].assetDepth * data[i].runeDepth) /
          data[i].liquidityUnits /
          (Math.sqrt(data[0].assetDepth * data[0].runeDepth) /
            data[0].liquidityUnits) -
        1,
    });
    result.impermLoss.push({
      x,
      y: (2 * Math.sqrt(priceSwing)) / (priceSwing + 1) - 1,
    });
    result.totalGains.push({
      x,
      y: totalLP / totalHodl - 1,
    });
  }

  console.log("Calculated fee vs LP data:\n", result);
  return result;
};

const calculatePLBreakdown = (amountInvested, data) => {
  let start = { ...data[0] };
  let end = { ...data[data.length - 1] };

  let userUnits =
    amountInvested /
    ((2 * start.runePriceUsd * start.runeDepth) / start.liquidityUnits);

  for (state of [start, end]) {
    state.runeBalance = (userUnits * state.runeDepth) / state.liquidityUnits;
    state.assetBalance = (userUnits * state.assetDepth) / state.liquidityUnits;
    state.totalValue = 2 * state.runeBalance * state.runePriceUsd;
    state.kValue = state.runeBalance * state.assetBalance;
  }
  console.log(start);
  console.log(end);

  let growth = Math.sqrt(end.kValue / start.kValue);

  // P&L due to RUNE price movement
  let runeMovement =
    start.runeBalance * (end.runePriceUsd - start.runePriceUsd);

  // P&L due to Asset price movement
  let assetMovement =
    start.assetBalance * (end.assetPriceUsd - start.assetPriceUsd);

  // RUNE & Asset balances at end IF NO FEE WAS RECEIVED
  let runeBalanceNoFee = end.runeBalance / growth;
  let assetBalanceNoFee = end.assetBalance / growth;

  // Fee income
  let fees =
    (end.runeBalance - runeBalanceNoFee) * end.runePriceUsd +
    (end.assetBalance - assetBalanceNoFee) * end.assetPriceUsd;

  // Imperm loss
  let impermLoss =
    (runeBalanceNoFee - start.runeBalance) * end.runePriceUsd +
    (assetBalanceNoFee - start.assetBalance) * end.assetPriceUsd;

  // Total
  let total = runeMovement + assetMovement + fees + impermLoss;

  let result = {
    runeMovement: {
      value: runeMovement,
      percentage: runeMovement / start.totalValue,
    },
    assetMovement: {
      value: assetMovement,
      percentage: assetMovement / start.totalValue,
    },
    fees: {
      value: fees,
      percentage: fees / start.totalValue,
    },
    impermLoss: {
      value: impermLoss,
      percentage: impermLoss / start.totalValue,
    },
    total: {
      value: total,
      percentage: total / start.totalValue,
    },
  };

  console.log("Calculated P&L breakdown:\n", result);
  return result;
};

const _apy = (start, end, days) => {
  let kValuePerUnit = {
    start: Math.sqrt(start.runeDepth * start.assetDepth) / start.liquidityUnits,
    end: Math.sqrt(end.runeDepth * end.assetDepth) / end.liquidityUnits,
  };
  return (kValuePerUnit.end / kValuePerUnit.start) ** (365 / days) - 1;
};

const calculateYield = (data) => {
  let result = {
    oneDayAPY: {
      labels: [],
      data: [],
    },
    sevenDayAPY: [],
  };

  // Calculate 1-day APY
  for (let i = 24; i < data.length; i += 24) {
    result.oneDayAPY.labels.push(new Date(data[i].time * 1000));
    result.oneDayAPY.data.push(_apy(data[i - 24], data[i], 1));
  }

  // Calculate 7-day APY
  for (let i = 24 * 7; i < data.length; i++) {
    result.sevenDayAPY.push({
      x: new Date(data[i].time * 1000),
      y: _apy(data[i - 24 * 7], data[i], 7),
    });
  }

  console.log("Calculated APY:\n", result);
  return result;
};

const predictFutureReturns = () => {
  // to be implemented
};
