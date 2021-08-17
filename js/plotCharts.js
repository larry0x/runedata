Chart.defaults.global.defaultFontFamily = "'Roboto', sans-serif";
Chart.defaults.global.defaultFontSize = 14;

const _formatMoney = (value, index, values) => {
  if (index == 0 || index == values.length - 1) {
    return "";
  } else {
    return (
      (value < 0 ? "–" : "") +
      "$" +
      Math.abs(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    );
  }
};

const _formatPercentage = (value, index, values) => {
  if (index == 0 || index == values.length - 1) {
    return "";
  } else {
    return (value >= 0 ? "+" : "–") + Math.abs(value) * 100 + "%";
  }
};

const _formatPriceChange = (value) => {
  let sign = "";
  if (value >= 0) sign = "+";
  else sign = "–";
  return (
    sign +
    "$" +
    Math.abs(value)
      .toFixed(0)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  );
};

const _resetCanvas = (id) => {
  let canvas = $(`#${id}`);
  let parentOfCanvas = canvas.parent();
  canvas.remove();
  parentOfCanvas.append(`<canvas id="${id}"></canvas>`);
  return $(`#${id}`);
};

const drawPlaceholderImage = (canvas, imageURL) => {
  var context = canvas.getContext("2d");
  var img = new Image();
  img.onload = () => {
    context.drawImage(img, 8, 8, canvas.width - 16, canvas.height - 16); // 8 and 16 are paddings
  };
  img.src = imageURL;
};

const plotTotalAssetValue = (result) => {
  let config = {
    type: "line",
    data: {
      datasets: [
        {
          label: "LP",
          data: result.totalValueLP,
          fill: false,
          borderColor: "red",
          borderWidth: 2,
        },
        {
          label: "hold both",
          data: result.totalValueHodl,
          fill: false,
          borderColor: "blue",
          borderWidth: 2,
        },
        {
          label: "hold RUNE",
          data: result.totalValueRune,
          fill: false,
          borderColor: "teal",
          borderWidth: 2,
        },
        {
          label: `hold ${coinSelected.symbol}`,
          data: result.totalValueAsset,
          fill: false,
          borderColor: "orange",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [
          {
            type: "time",
            display: true,
            scaleLabel: {
              display: true,
            },
            time: {
              unit: "day",
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              callback: _formatMoney,
            },
          },
        ],
      },
      elements: {
        point: {
          radius: 0,
        },
      },
    },
  };

  let canvas = _resetCanvas("canvas1");
  let chart = new Chart(canvas, config);
  return chart;
};

const plotFeeVsIL = (result) => {
  let config = {
    type: "line",
    data: {
      datasets: [
        {
          label: "fee income",
          data: result.feeIncome,
          fill: false,
          borderColor: "blue",
          borderWidth: 2,
        },
        {
          label: "impermanent loss",
          data: result.impermLoss,
          fill: false,
          borderColor: "red",
          borderWidth: 2,
        },
        {
          label: "total gains vs HODL",
          data: result.totalGains,
          fill: false,
          borderColor: "magenta",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [
          {
            type: "time",
            display: true,
            scaleLabel: {
              display: true,
            },
            time: {
              unit: "day",
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              callback: _formatPercentage,
            },
            gridLines: {
              zeroLineColor: "black",
            },
          },
        ],
      },
      elements: {
        point: {
          radius: 0,
        },
      },
    },
  };

  let canvas = _resetCanvas("canvas2");
  let chart = new Chart(canvas, config);
  return chart;
};

const _roundToZeroIfSmall = (x) => (Math.abs(x) < 1 ? +0 : x);

const _getYRangeForBarChart = (data) => {
  var max = Math.max(...data);
  var min = Math.min(...data);
  var range = max - min;
  var ymax = Math.max(max, 0) + 0.2 * range;
  var ymin = Math.min(min, 0) - 0.2 * range;
  return { ymax, ymin };
};

const _barColor = (value) => {
  return value >= 0 ? "green" : "red";
};

const _getYOffset = (value) => {
  return value >= 0 ? -5 : +22;
};

const plotPLBreakdown = (result) => {
  var data = [
    _roundToZeroIfSmall(result.runeMovement.value.toFixed(2)),
    _roundToZeroIfSmall(result.assetMovement.value.toFixed(2)),
    _roundToZeroIfSmall(result.fees.value.toFixed(2)),
    _roundToZeroIfSmall(result.impermLoss.value.toFixed(2)),
    _roundToZeroIfSmall(result.total.value.toFixed(2)),
  ];
  var { ymax, ymin } = _getYRangeForBarChart(data);

  let config = {
    type: "bar",
    data: {
      labels: [
        "RUNE price movement",
        `${coinSelected.symbol} price movement`,
        "fees & incentives",
        "impermanent loss",
        "total profit",
      ],
      datasets: [
        {
          data,
          backgroundColor: [
            _barColor(result.runeMovement.value),
            _barColor(result.assetMovement.value),
            _barColor(result.fees.value),
            _barColor(result.impermLoss.value),
            "magenta",
          ],
          borderColor: "black",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      hover: {
        animationDuration: 0,
      },
      animation: {
        duration: 1,
        onComplete: function () {
          var chartInstance = this.chart,
            ctx = chartInstance.ctx;

          ctx.font = Chart.helpers.fontString(
            Chart.defaults.global.defaultFontSize + 2,
            Chart.defaults.global.defaultFontStyle,
            Chart.defaults.global.defaultFontFamily
          );
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          this.data.datasets.forEach(function (dataset, i) {
            var meta = chartInstance.controller.getDatasetMeta(i);
            meta.data.forEach(function (bar, index) {
              var data = dataset.data[index];
              ctx.fillText(
                _formatPriceChange(data),
                bar._model.x,
                bar._model.y + _getYOffset(data)
              );
            });
          });
        },
      },
      scales: {
        xAxes: [
          {
            display: true,
            scaleLabel: {
              display: true,
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              max: ymax,
              min: ymin,
              callback: _formatMoney,
            },
            gridLines: {
              zeroLineColor: "black",
            },
          },
        ],
      },
      legend: {
        display: false,
      },
      tooltips: {
        enabled: false,
      },
    },
  };

  let canvas = _resetCanvas("canvas3");
  let chart = new Chart(canvas, config);
  return chart;
};

const _getMovingAverage = (data, window) => {
  let avg = [];
  for (let i = window; i < data.length - window; i++) {
    let sum = data
      .slice(i - window, i + window + 1)
      .reduce((prev, next) => prev + next.y, 0);
    avg.push({
      x: data[i].x,
      y: sum / (2 * window),
    });
  }
  return avg;
};

const _getYRangeRemoveOutliers = (data) => {
  ys = [...data];
  ys.sort((a, b) => a - b); // https://stackoverflow.com/questions/18496898

  // Remove 5% biggest values and 5% smallest values as outliers
  let max = ys[Math.floor(0.95 * ys.length)];
  let min = ys[Math.floor(0.05 * ys.length)];

  var range = max - min;
  var ymax = Math.max(max, 0) + 0.1 * range;
  var ymin = Math.min(min, 0) - 0.1 * range;
  return { ymax, ymin };
};

const plotYield = (result) => {
  // let { ymax, ymin } = _getYRangeRemoveOutliers(result.oneDayAPY.data);

  let config = {
    type: "bar",
    data: {
      labels: result.oneDayAPY.labels,
      datasets: [
        {
          type: "bar",
          label: "1-day APY",
          data: result.oneDayAPY.data,
          backgroundColor: "cyan",
          borderColor: "black",
          borderWidth: 1,
          order: 2,
        },
        {
          type: "line",
          label: "7-day APY",
          data: _getMovingAverage(result.sevenDayAPY, 12),
          xAxisID: "sevenDayApyX",
          fill: false,
          borderColor: "magenta",
          borderWidth: 2,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [
          {
            type: "time",
            display: true,
            stacked: true,
            scaleLabel: {
              display: true,
            },
          },
          {
            id: "sevenDayApyX",
            type: "time",
            display: false,
            stacked: false,
            scaleLabel: {
              display: false,
            },
          },
        ],
        yAxes: [
          {
            display: true,
            stacked: true,
            scaleLabel: {
              display: true,
            },
            ticks: {
              // max: ymax,
              // min: ymin,
              callback: _formatPercentage,
            },
            gridLines: {
              zeroLineColor: "black",
            },
          },
        ],
      },
      elements: {
        point: {
          radius: 0,
        },
      },
    },
  };

  let canvas = _resetCanvas("canvas4");
  let chart = new Chart(canvas, config);
  return chart;
};
