// Chaosnet
// const THOR_NODE = "https://chaosnet-midgard.bepswap.com/v1";

// Multichain Testsnet
// const THOR_NODE = 'https://testnet.midgard.thorchain.info/v2';

// Multichain Chaosnet
const THOR_NODE = "https://midgard.thorchain.info/v2";

let coins = null;
let coinSelected = null;

let languages = null;
let languageSelected = null;

let results = {
  totalValue: null,
  feeVsIL: null,
  PLBreakdown: null,
  yield: null,
  prediction: null,
};

let vars = {}; // query string variables

const showSpinner = () => {
  console.log("Showing spinner");
  $("#spinnerContainer").fadeIn();
};

const hideSpinner = () => {
  console.log("Hiding spinner");
  $("#spinnerContainer").fadeOut();
};

const showOverlay = () => {
  console.log("Showing overlay");
  $("#chartOverlay").fadeIn();
};

const hideOverlay = () => {
  console.log("Hiding overlay");
  $("#chartOverlay").fadeOut();
};

const _languageOption = (id, lang) => {
  return `
  <li
    class="dropdown-item d-flex align-items-center ${
      lang.enabled ? "" : "disabled"
    }"
    onclick="javascript:setLanguage('${id}')"
  >
    <div class="me-3">
      <img src="${lang.icon}" class="flag border">
    </div>
    <span class="me-3">${lang.name}</span>
  </li>`;
};

const generateLanguageOptions = (languages) => {
  let dropdown = $("#languagesDropdown");
  for (id of [...Object.keys(languages)].sort()) {
    dropdown.append(_languageOption(id, languages[id]));
  }
};

const updateSelectedLanguage = (id) => {
  console.log("User selected language:", id);
  let lang = languages[id];
  $("#selectedLanguage").html(`
    <div class="me-3">
      <img src="${lang.icon}" class="flag">
    </div>
    <span class="me-2">${lang.name}</span>
  `);
};

const setLanguage = (id) => {
  updateSelectedLanguage(id);
  // To be implemented
};

const _coinOption = (coin) => {
  return `
  <li
    class="dropdown-item d-flex align-items-center"
    onclick="updateSelectedCoin(${coin.index}); updateQueryString('asset', coinSelected.asset);">
    <div class="image-cropper me-3">
      <img src="${coin.icon}" class="icon">
    </div>
    <span class="me-auto">${coin.name}</span>
    <span class="ms-auto">${coin.chain} &middot; ${coin.symbol}</span>
  </li>`;
};

const generateCoinOptions = (coins) => {
  let dropdown = $("#coinsDropdown");
  dropdown.html("");
  for (coin of coins) {
    dropdown.append(_coinOption(coin));
  }
};

const updateSelectedCoin = (index) => {
  console.log("Coin selected:", coins[index].name);
  coinSelected = coins[index];
  $("#selectedCoin").html(`
    <div class="image-cropper me-3">
      <img src="${coinSelected.icon}" class="icon">
    </div>
    <span class="me-auto" style="font-size: 1.25rem;">
      ${coinSelected.chain} &middot; ${coinSelected.symbol}
    </span>
  `);
  $("#predictFormAssetName").html(coinSelected.symbol);
};

const findMatchedCoins = (query) => {
  let matches = [];
  for (coin of coins) {
    if (
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.asset.toLowerCase().includes(query.toLowerCase())
    ) {
      matches.push(coin);
    }
  }
  return matches;
};

const setActiveToggle = (toggle) => {
  toggle.parent().parent().find(".nav-link").removeClass("active");
  toggle.addClass("active");
};

const isValidDate = (d) => {
  return d instanceof Date && !isNaN(d);
};

const parseInteger = (x) => {
  if (typeof x == "string") return parseInt(x.replace(/,/g, ""));
  else return x;
};

const parseFloatTwoDecimals = (x) => {
  return parseInteger(x.split(".")[0]) + parseInteger(x.split(".")[1]) / 1000;
};

const formatInteger = (x) => {
  return parseInteger(x)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const formatFloatTwoDecimals = (x) => {
  return (
    formatInteger(x.split(".")[0]) +
    "." +
    parseFloat(x).toFixed(2).split(".")[1]
  );
};

const parseQueryString = () => {
  let query = window.location.search.substring(1).split("&");
  let vars = {};
  for (let pair of query) {
    pair = pair.split("=");
    vars[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return vars;
};

// https://stackoverflow.com/a/41542008
const updateQueryString = (key, val) => {
  var searchParams = new URLSearchParams(window.location.search);
  searchParams.set(key, val);
  var newRelativePathQuery =
    window.location.pathname + "?" + searchParams.toString();
  history.pushState(null, "", newRelativePathQuery);
};

const updatePredictFormPrices = () => {
  getPrices(coinSelected.asset).then((prices) => {
    $("#priceInputRune").val(
      formatFloatTwoDecimals(prices.runePriceUsd.toString())
    );
    $("#priceInputAsset").val(
      formatFloatTwoDecimals(prices.assetPriceUsd.toString())
    );
  });
};

$(async () => {
  $("#coinsInput").keyup(function () {
    let query = $(this).val();
    if (query.length > 0) {
      $("#coinsDropdownTitle").html("Search result");
      generateCoinOptions(findMatchedCoins(query).slice(0, 15));
    } else {
      $("#coinsDropdownTitle").html("Top pools");
      generateCoinOptions(coins.slice(0, 10));
    }
  });

  $("#amountInvestedInput").keyup(function () {
    let val = $(this).val();
    $(this).val(formatInteger(val));
    updateQueryString("amount", parseInteger(val));
  });

  $("#dateInvestedInput").change(function () {
    updateQueryString("date", $(this).val());
  });

  $("#amountInvestedInput2").keyup(function () {
    let val = $(this).val();
    $(this).val(formatInteger(val));
  });

  // $('#priceInputRune, #priceInputAsset').keyup(function () {
  //   let val = $(this).val();
  //   $(this).val(formatFloatTwoDecimals(val));
  // });

  $("#toggler1").click(function (event) {
    event.preventDefault();
    setActiveToggle($(this));

    $("#canvas1").show();
    $("#canvas2").hide();
    $("#canvas3").hide();
    $("#canvas4").hide();
    $("#canvas5And6Container").hide();

    $("#simulateForm").show();
    $("#predictForm").hide();
    $("#resultText").html(getTotalValueText());

    if (results.totalValue) {
      hideOverlay();
    } else {
      showOverlay();
    }
  });

  $("#toggler2").click(function (event) {
    event.preventDefault();
    setActiveToggle($(this));

    $("#canvas1").hide();
    $("#canvas2").show();
    $("#canvas3").hide();
    $("#canvas4").hide();
    $("#canvas5And6Container").hide();

    $("#simulateForm").show();
    $("#predictForm").hide();
    $("#resultText").html(getFeeVsILText());

    if (results.feeVsIL) {
      hideOverlay();
    } else {
      showOverlay();
    }
  });

  $("#toggler3").click(function (event) {
    event.preventDefault();
    setActiveToggle($(this));

    $("#canvas1").hide();
    $("#canvas2").hide();
    $("#canvas3").show();
    $("#canvas4").hide();
    $("#canvas5And6Container").hide();

    $("#simulateForm").show();
    $("#predictForm").hide();
    $("#resultText").html(getPLBreakdownText());

    if (results.PLBreakdown) {
      hideOverlay();
    } else {
      showOverlay();
    }
  });

  $("#toggler4").click(function (event) {
    event.preventDefault();
    setActiveToggle($(this));

    $("#canvas1").hide();
    $("#canvas2").hide();
    $("#canvas3").hide();
    $("#canvas4").show();
    $("#canvas5And6Container").hide();

    $("#simulateForm").show();
    $("#predictForm").hide();
    $("#resultText").html(getYieldText());

    if (results.yield) {
      hideOverlay();
    } else {
      showOverlay();
    }
  });

  $("#toggler5").click(function (event) {
    event.preventDefault();
    setActiveToggle($(this));

    $("#canvas1").hide();
    $("#canvas2").hide();
    $("#canvas3").hide();
    $("#canvas4").hide();
    $("#canvas5And6Container").show();

    $("#simulateForm").hide();
    $("#predictForm").show();
    $("#resultText").html(getPredictText());

    if (results.prediction) {
      hideOverlay();
    } else {
      showOverlay();
    }
  });

  $("#submitBtn2").click((event) => {
    event.preventDefault();

    let amountInvested = parseInteger($("#amountInvestedInput").val());
    if (isNaN(amountInvested)) {
      amountInvested = 10000;
    }

    let dateInvested = new Date($("#dateInvestedInput").val());
    if (isValidDate(dateInvested)) {
      $("#dateInvestedInput").removeClass("is-invalid");
    } else {
      $("#dateInvestedInput").addClass("is-invalid");
      return console.log(`Invalid date!`);
    }

    console.log(
      `User submitted amount ${amountInvested} and date ${dateInvested}`
    );

    showSpinner();
    getDataFromMidgard(
      (pool = coinSelected.asset),
      (from = dateInvested.getTime() / 1000)
    ).then((data) => {
      hideOverlay();

      results.totalValue = calculateTotalAssetValue(amountInvested, data);
      plotTotalAssetValue(results.totalValue);

      results.feeVsIL = calculateFeeVsIL(data);
      plotFeeVsIL(results.feeVsIL);

      results.PLBreakdown = calculatePLBreakdown(amountInvested, data);
      plotPLBreakdown(results.PLBreakdown);

      results.yield = calculateYield(data);
      plotYield(results.yield);

      $("#toggler1").trigger("click");
      hideSpinner();
    });
  });

  // Placeholder images
  drawPlaceholderImage($("#canvas1")[0], "images/placeholder1.png");
  drawPlaceholderImage($("#canvas2")[0], "images/placeholder2.png");
  drawPlaceholderImage($("#canvas3")[0], "images/placeholder3.png");
  drawPlaceholderImage($("#canvas4")[0], "images/placeholder4.png");
  drawPlaceholderImage($("#canvas5")[0], "https://via.placeholder.com/594x509");
  drawPlaceholderImage($("#canvas6")[0], "https://via.placeholder.com/594x509");

  // Generate language selector options
  $.get("js/languages.json").then((_languages) => {
    languages = _languages;
    generateLanguageOptions(languages);
    setLanguage("en-us"); // default: en-us
  });

  // Generate coin selector options
  Promise.all([$.get("js/coins.json"), $.get(`${THOR_NODE}/pools`)])
    .then(([_coins, poolData]) => {
      // Record RUNE depth of each asset pool
      for (pool of poolData) {
        let coin = _coins.find((obj) => obj.asset == pool.asset);
        if (coin) {
          coin.depth = parseInt(pool.runeDepth);
          console.log(`Coin: ${coin.asset}\nDepth: ${coin.depth}`);
        }
      }

      // Sort coins by depth in descending order
      coins = _coins.sort((a, b) => {
        if (a.depth > b.depth) return -1;
        else if (a.depth < b.depth) return 1;
        else return 0;
      });

      // Give each coin an index
      for (i = 0; i < coins.length; i++) {
        coins[i].index = i;
      }

      console.log("Fetch list of coins:\n", coins);

      updateSelectedCoin(0);
      $("#coinsInput").trigger("keyup");
    })
    .then(() => {
      let vars = parseQueryString();
      console.log("Query string parsed:\n", vars);

      if ("asset" in vars) {
        for (coin of coins) {
          if (coin.asset == vars.asset) {
            updateSelectedCoin(coin.index);
            break;
          }
        }
      } else {
        updateQueryString("asset", coinSelected.asset);
      }

      if ("amount" in vars) {
        $("#amountInvestedInput").val(vars.amount).trigger("keyup");
      } else {
        updateQueryString("amount", "10000");
      }

      if ("date" in vars) {
        $("#dateInvestedInput").val(vars.date).trigger("keyup");
      }

      if ("asset" in vars && "date" in vars) {
        $("#submitBtn2").trigger("click");
      }
    })
    .then(updatePredictFormPrices);

  // Check size of viewport. Warn user if window is too small
  if ($(window).width() < 1200) {
    alert(
      "It seems you are accessing this site using a mobile device.\n" +
        "It is recommended to use a desktop browser for the best experience."
    );
  }
});
