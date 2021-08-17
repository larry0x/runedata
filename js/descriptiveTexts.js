var placeholderText = "An analysis of your LP data will be displayed here.";

const _outOrUnderperform = (val) =>
  val >= 0 ? "outperforms" : "underperforms";
const _upOrDown = (val) => (val >= 0 ? "up" : "down");
const _gainOrLose = (val) => (val >= 0 ? "will gain" : "will lose");
const _gainedOrLost = (val) => (val >= 0 ? "gained" : "lost");

const _formatTotalValue = (v) => {
  return (
    "$" +
    Math.abs(v)
      .toFixed(2)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
};

const _formatPercentChange = (pc, signed = true) => {
  if (signed) {
    sign = pc >= 0 ? "+" : "–";
  } else {
    sign = "";
  }
  color = pc >= 0 ? "green" : "red";
  pc = Math.abs(pc) * 100;
  pc = pc
    .toFixed(pc < 10 ? 1 : 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `<b style="color: ${color}">${sign}${pc}%</b>`;
};

const _getFirst = (arr) => {
  return arr[0].y;
};

const _getLast = (arr) => {
  return arr[arr.length - 1].y;
};

const getTotalValueText = () => {
  let result;
  if (!results.totalValue) {
    return placeholderText;
  } else {
    result = results.totalValue;
  }

  var totalValue = _getLast(result.totalValueLP);
  var precentChange = totalValue / _getFirst(result.totalValueLP) - 1;

  var totalValueIfHoldRune = _getLast(result.totalValueRune);
  var totalValueIfHoldRuneVsLP = totalValueIfHoldRune / totalValue - 1;

  var totalValueIfHoldAsset = _getLast(result.totalValueAsset);
  var totalValueIfHoldAssetVsLP = totalValueIfHoldAsset / totalValue - 1;

  return `
    <p>
      The current value of your investment is <b>${_formatTotalValue(
        totalValue
      )}</b>
      (${_formatPercentChange(precentChange)}).
    </p>
    <p>
      If passively helding <b>RUNE</b>, you would have <b>${_formatTotalValue(
        totalValueIfHoldRune
      )}</b>
      (${_formatPercentChange(totalValueIfHoldRuneVsLP)} vs LP).
    </p>
    <p class="mb-0">
      If passively helding <b>${
        coinSelected.symbol
      }</b>, you would have <b>${_formatTotalValue(totalValueIfHoldAsset)}</b>
      (${_formatPercentChange(totalValueIfHoldAssetVsLP)} vs LP).
    </p>
  `;
};

const getFeeVsILText = () => {
  let result;
  if (!results.feeVsIL) {
    return placeholderText;
  } else {
    result = results.feeVsIL;
  }

  var feeAccrued = _getLast(result.feeIncome);
  var impermLoss = _getLast(result.impermLoss);
  var totalGains = _getLast(result.totalGains);

  return `
    <p>
      Compared to passively holding 50:50 <b>RUNE</b> & <b>${
        coinSelected.symbol
      }</b>, you gained
      <b>${_formatPercentChange(
        feeAccrued,
        false
      )}</b> from fees & incentives, lost
      <b>${_formatPercentChange(
        impermLoss,
        false
      )}</b> due to impermanent loss (IL).
    </p>
    <p class="mb-0">
      Overall, LP ${_outOrUnderperform(
        totalGains
      )} HODL by <b>${_formatPercentChange(totalGains, false)}</b>.
    </p>
  `;
};

const getPLBreakdownText = () => {
  let result;
  if (!results.PLBreakdown) {
    return placeholderText;
  } else {
    result = results.PLBreakdown;
  }

  return `
    <p>
      You ${_gainedOrLost(result.runeMovement.value)} <b>${_formatTotalValue(
    result.runeMovement.value
  )}</b>
      (<b>${_formatPercentChange(
        result.runeMovement.percentage
      )}</b>) due to <b>RUNE</b> price going
      ${_upOrDown(result.runeMovement.value)}, and ${_gainedOrLost(
    result.assetMovement.value
  )}
      <b>${_formatTotalValue(
        result.assetMovement.value
      )}</b> (<b>${_formatPercentChange(result.assetMovement.percentage)}</b>)
      due to <b>${coinSelected.symbol}</b> going ${_upOrDown(
    result.assetMovement.value
  )}.
    </p>
    <p>
      You earned <b>${_formatTotalValue(
        result.fees.value
      )}</b> (<b>${_formatPercentChange(result.fees.percentage)}</b>)
      from fees & incentives, and lost <b>${_formatTotalValue(
        result.impermLoss.value
      )}</b>
      (<b>${_formatPercentChange(
        result.impermLoss.percentage
      )}</b>) due to impermanent loss.
    </p>
    <p class="mb-0">
      Overall, you are ${_upOrDown(result.total.value)} <b>${_formatTotalValue(
    result.total.value
  )}</b>
      (<b>${_formatPercentChange(
        result.total.percentage
      )}</b>) compared to your initial investment.
    </p>
  `;
};

const getYieldText = () => {
  let result;
  if (!results.yield) {
    return placeholderText;
  } else {
    result = results.yield;
  }

  return `
    <p class="mb-0">
      The average APY from transaction fees (excluding IL) for the last 7 days, compounded daily,
      is ${_formatPercentChange(
        result.sevenDayAPY[result.sevenDayAPY.length - 1].y
      )}.
    </p>
  `;
};

const getPredictText = () => {
  let result;
  if (!results.prediction) {
    return placeholderText;
  } else {
    result = results.prediction;
  }

  return placeholderText;
};
