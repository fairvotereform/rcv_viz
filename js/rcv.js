// script loader
window.rcvRequire = function(url, callback) {
  var script = document.createElement("script");
  script.src = url;
  script.type="text/javascript";
  document.head.appendChild(script);
  script.addEventListener('load', callback);
}

window.rcvParamsHash = function() {
  var hash = {};

  for (var param of decodeURI(window.location.hash.slice(1) || "").split("&")) {
    var key = "";
    var val = "";

    if (param.indexOf(">=") > 0) {
      key = param.split(">=")[0];
      val = ">=" + param.split(">=")[1];
    } else if (param.indexOf("<=") > 0) {
      key = param.split("<=")[0];
      val = "<=" + param.split("<=")[1];
    } else if (param.indexOf("<") > 0) {
      key = param.split("<")[0];
      val = "<" + param.split("<")[1];
    } else if (param.indexOf(">") > 0) {
      key = param.split(">")[0];
      val = ">" + param.split(">")[1];
    } else if (param.indexOf("=") > 0) {
      key = param.split("=")[0];
      val = param.split("=")[1];
    }

    if(key.length > 0) { hash[key] = val; }
  }

  return hash;
}

window.rcvCalculate = function(opts) {
  var opts = opts || {};

  // count votes
  for (var candidateId in rcvCandidateVotes) {
    rcvCandidateVotes[candidateId] = 0;
  }

  var total = 0;

  rcvResultsData.forEach(function(ballot) {

    // filter ballots by query params and criteria passed to rcvLoad()
    for (var hash of [rcvParamsHash(), rcvConfig['criteria']]) {
      for (var key in hash) {
        if ((key in ballot) && (String(hash[key]).slice(0,2) == ">=")) {
          if (!(parseFloat(ballot[key]) >= parseFloat(String(hash[key]).slice(2)))) { return null; }
        } else if ((key in ballot) && (String(hash[key]).slice(0,2) == "<=")) {
          if (!(parseFloat(ballot[key]) <= parseFloat(String(hash[key]).slice(2)))) { return null; }
        } else if ((key in ballot) && (String(hash[key]).slice(0,1) == ">")) {
          if (!(parseFloat(ballot[key]) > parseFloat(String(hash[key]).slice(1)))) { return null; }
        } else if ((key in ballot) && (String(hash[key]).slice(0,1) == "<")) {
          if (!(parseFloat(ballot[key]) < parseFloat(String(hash[key]).slice(1)))) { return null; }
        } else if ((key in ballot) && (String(hash[key]).split("+").indexOf(ballot[key]) < 0)) {
          return null;
        }
      }
    }

    if (rcvConfig['headersFormat'] == 'ordinal' || rcvParamsHash()['headersFormat'] == 'ordinal') {
      // if CSV headers are 1,2,3, etc.
      for (var col = 1; !(ballot[col] === undefined); col++) {
        var candidateId = ballot[col];

        if (!(candidateId in rcvCandidateVotes)) {
          if ("other" in rcvCandidateVotes) { candidateId = "other"; } else { break; }
        }

        if (ballot[col].length > 0 && !rcvRemovedCandidates[candidateId]) {
          var weight = (rcvParamsHash()["weighted"] || rcvConfig["weighted"] ? parseFloat(ballot["weight"]) : 1)
          rcvCandidateVotes[candidateId] += weight;
          total += weight;
          break;
        }
      }
    } else {
      var rank = null;
      var topNonEliminatedCandidateId = null;

      // go through each candidate, and note the top-ranked non-eliminated candidate
      for (var candidateId in rcvCandidateVotes) {
        var r = parseInt(ballot[candidateId]);
        rank = (rank || (r + 1));

        if (('X' + r) in rcvCandidateVotes) {
          // the YouGov response code indicates a skipped question
        } else if (('A' + r) in rcvCandidateVotes) {
          // the YouGov response code corresponds to a special meaning, like "none of the above"
          topNonEliminatedCandidateId = 'A' + r;
        } else if (r < rank && !rcvRemovedCandidates[candidateId]) {
          // otherwise, treat it as a normal ranking
          rank = r;
          topNonEliminatedCandidateId = candidateId;
        }
      }

      if (topNonEliminatedCandidateId && !rcvRemovedCandidates[topNonEliminatedCandidateId]) {
        var weight = (rcvParamsHash()["weighted"] || rcvConfig["weighted"] ? parseFloat(ballot["weight"]) : 1)
        rcvCandidateVotes[topNonEliminatedCandidateId] += weight;
        total += weight;
      }
    }
  });

  var max = 0;
  var firstPlace = null;
  var lastPlace = null;

  for (var candidate in rcvCandidateVotes) {
    if (!(candidate in rcvRemovedCandidates) && !/^X\d+$/i.test(candidate)) {
      firstPlace = firstPlace || candidate;
      lastPlace = lastPlace || candidate;
      if (rcvCandidateVotes[candidate]  > rcvCandidateVotes[firstPlace]) { firstPlace = candidate; } else
      if (rcvCandidateVotes[candidate] == rcvCandidateVotes[firstPlace]) { firstPlace = (rcvCandidateNames[candidate] < rcvCandidateNames[firstPlace] ? candidate : firstPlace); }
      if (rcvCandidateVotes[candidate]  < rcvCandidateVotes[lastPlace])  { lastPlace  = candidate; } else
      if (rcvCandidateVotes[candidate] == rcvCandidateVotes[lastPlace])  { lastPlace  = (rcvCandidateNames[candidate] > rcvCandidateNames[lastPlace]  ? candidate : lastPlace);  }
    }

    max = Math.max(max, rcvCandidateVotes[candidate]);
  }

  setTimeout(function() {
    // resize
    for (var candidate in rcvCandidateVotes) {
      d3.select("#" + candidate + " .rcv-result-percent")
        .text((100.0 * rcvCandidateVotes[candidate] / total).toFixed(2) + "%");

      d3.select("#" + candidate + " .rcv-bar")
        .transition()
        .duration(333)
        .style("width", (100.0 * rcvCandidateVotes[candidate] / max) + "%")
    }

    setTimeout(function() {
      for (var candidate in rcvCandidateVotes) {
        d3.select("#" + candidate + " .rcv-bar")
          .transition()
          .duration(333)
          .style("background-color", (opts['recursive'] && 1.0 * max / total > 0.5 && candidate == firstPlace) ? "#ffc966" : "#acf"); // add/remove class instead
      }
    }, 333);
  }, opts['resizeDelay'] || 0);

  setTimeout(function() {
    // re-order
    var list = document.querySelector("#rcv-candidates");
    var items = list.childNodes;
    var itemsArr = [];

    for (var i in items) {
      if (items[i].nodeType == 1) { // get rid of the whitespace text nodes
        itemsArr.push(items[i]);
      }
    }

    itemsArr.sort(function(a, b) {
      if (a.id[0] == "A") { return  1; }
      if (b.id[0] == "A") { return -1; }
      if (rcvCandidateVotes[a.id] > rcvCandidateVotes[b.id]) { return -1; }
      if (rcvCandidateVotes[a.id] < rcvCandidateVotes[b.id]) { return  1; }
      return rcvCandidateNames[a.id] > rcvCandidateNames[b.id] ? 1 : -1;
    });

    for (i = 0; i < itemsArr.length; ++i) {
      list.appendChild(itemsArr[i]);
    }

    d3.select("#rcv-interactive")
      .style("display", "block");
  }, opts['sortDelay'] || 0);

  // if automatically selecting winner, iteratively remove last-place candidate one-by-one
  // until two candidates remain
  //
  // to stop once a candidate reaches 50%, change if statement to:
  //     if (opts && opts['recursive'] && 1.0 * max / total < 0.5) {
  if (opts && opts['recursive'] && rcvCandidateCount - Object.keys(rcvRemovedCandidates).length > 2) {
    setTimeout(function() {
      rcvRemoveCandidate(lastPlace, {recursive: true});
    }, opts['startDelay'] || 1333);
  }
}

// initialize
window.rcvLoad = function(config) {
  window.rcvConfig = window.rcvConfig || {};
  window.rcvCandidateCount = 0;
  window.rcvCandidateNames = {};
  window.rcvCandidateVotes = {};
  window.rcvRemovedCandidates = {};
  window.rcvResultsData = {};

  for (key in config) { rcvConfig[key] = config[key]; }

  // load D3.js
  rcvRequire("//cdnjs.cloudflare.com/ajax/libs/d3/5.11.0/d3.min.js", function() {
    var interactiveDiv = d3.select("#rcv-interactive").attr("style", "display: none")

    d3.select("#rcv-filters").remove();
    d3.select("#rcv-candidates").remove();
    d3.select("#rcv-removed-candidates").remove();
    d3.select("#rcv-credits").remove();

    var filtersDiv = interactiveDiv.append("div")
      .attr("id", "rcv-filters");

    var candidatesDiv = interactiveDiv.append("div")
      .attr("id", "rcv-candidates");

    var creditsDiv = interactiveDiv.append("div")
      .attr("id", "rcv-credits")
      .html("Powered by<br/><img src='//Democracy-for-America.github.io/rcv/images/fairvote-logo.png'><br/><img src='//Democracy-for-America.github.io/rcv/images/dfa-logo.png'>")

    var removedDiv = d3.select("body")
      .append("div")
      .attr("id", "rcv-removed-candidates");

    // load candidates csv
    d3.csv(rcvConfig["candidatesCsvUrl"] || rcvParamsHash()["candidatesCsvUrl"]).then(function(candidateData) {
      candidateData.forEach(function(candidate) {
        var candidateId = candidate["id"];
        rcvCandidateVotes[candidateId] = null;
        rcvCandidateNames[candidateId] = candidate["name"];

        if (candidateId[0] != 'X') {
          // add a row for each candidate contained in data/candidates.csv
          window.rcvCandidateCount++;

          var row = candidatesDiv
            .append("div")
            .attr("id", candidateId)
            .attr("class", "rcv-candidate-row")
            .attr("onclick", "rcvRemoveCandidate('" + candidateId + "');");

          if ("image_url" in candidate) {
            var imgWrap = row
              .append("div")
              .attr("class", "rcv-img-wrap");

            imgWrap.append("img")
              .attr("src", candidate["image_url"]);
          }

          var barWrap = row.append("div")
            .attr("class", "rcv-bar-wrap");

          barWrap.append("div")
            .attr("class", "rcv-bar");

          var resultWrap = barWrap.append("div")
            .attr("class", "rcv-result-wrap");

          resultWrap.append("span").append("strong")
            .attr("class", "rcv-result-name")
            .text(candidate["name"] + ": ");

          resultWrap.append("span")
            .attr("class", "rcv-result-percent");

          // add a removed placeholder for each candidate
          var removeWrap = removedDiv.append("div")
            .attr("id", "r-" + candidateId)
            .attr("class", "rcv-removed-wrap")
            .style("display", "none")
            .attr("onclick", "rcvAddCandidate('" + candidateId + "');");;

          var imgWrap = removeWrap.append("div")
            .attr("class", "rcv-img-wrap");

          if ("image_url" in candidate) {
            imgWrap.append("img")
              .attr("src", candidate["image_url"]);
          }

          imgWrap.append("div")
            .text(candidate["name"]);
        }
      });

      // add demographic filter links, if provided
      if ("filters" in rcvConfig) {
        filtersDiv.append("div")
          .text("Show votes from");

        for (var i = 0; i < rcvConfig["filters"].length; i++) {
          if (i > 0) { filtersDiv.append("br"); }

          for (var j = 0; j < rcvConfig["filters"][i].length; j++) {
            if (j > 0) { filtersDiv.append("span").text(" | "); }
            filtersDiv.append("strong")
              .append("a")
              .attr("href", "#" + rcvConfig["filters"][i][j][1])
              .text(rcvConfig["filters"][i][j][0]);
          }
        }
      }

      // load results csv
      d3.csv(rcvConfig["resultsCsvUrl"] || rcvParamsHash()["resultsCsvUrl"]).then(function(resultsData) {
        rcvResultsData = resultsData;
        rcvCalculate();
      });
    });
  });

  for (el of document.getElementsByClassName("rcv-autoselect")) {
    el.addEventListener("click", rcvPickWinner);
  }

  window.addEventListener("hashchange", rcvCalculate);
}

window.rcvAddCandidate = function(candidateId) {
  delete rcvRemovedCandidates[candidateId];

  setTimeout(function() {
    d3.select("#" + candidateId)
      .style("display", "block")
      .style("height", "60px")
      .style("opacity", "1");
    d3.select("#r-" + candidateId)
      .style("display", "none");
  }, 10);

  if (Object.keys(rcvRemovedCandidates).length < 1) {
    d3.select("#rcv-removed-candidates")
      .style("visible", "hidden");
    d3.select("body")
      .style("padding-bottom", "0px");
  }

  rcvCalculate();
}

window.rcvRemoveCandidate = function(candidateId, opts) {
  var opts = opts || {};
  rcvRemovedCandidates[candidateId] = true;
  d3.select("#" + candidateId)
    .transition()
    .duration(333)
    .style("opacity", "0");

  setTimeout(function() {
    d3.select("#" + candidateId)
      .transition()
      .duration(333)
      .style("height", "0px");

    setTimeout(function() {
      d3.select("#" + candidateId)
        .style("display", "none");
    }, 296);

    // reveal removed candidates div
    d3.select("#r-" + candidateId)
      .style("display", "inline-block");

    d3.select("#rcv-removed-candidates")
      .style("visibility", "visible");

    var removed = document.getElementById("rcv-removed-candidates");
    removed.appendChild(document.getElementById("r-" + candidateId));

    d3.select("body")
      .style("padding-bottom", document.querySelector("#rcv-removed-candidates").offsetHeight + "px");
  }, 333);

  var y = window.scrollY + document.querySelector("#rcv-candidates").getBoundingClientRect().bottom + document.querySelector("#rcv-removed-candidates").offsetHeight - window.innerHeight - 48;
  if (opts['recursive']) { rcvScrollTo(y, 333); }

  opts['resizeDelay'] = 333;
  opts['sortDelay'] = 666;
  rcvCalculate(opts);
}

window.rcvScrollTo = function(to, duration) {
  if (duration <= 0) return;
  var difference = to - window.scrollY;
  var perTick = difference / duration * 10;

  setTimeout(function() {
    window.scrollTo(0, window.scrollY + perTick);
    if (window.scrollY === to) return;
    rcvScrollTo(to, duration - 10);
  }, 10);
}

window.rcvPickWinner = function(event) {
  var y = window.scrollY + document.querySelector("#rcv-candidates").getBoundingClientRect().bottom + document.querySelector("#rcv-removed-candidates").offsetHeight - window.innerHeight - 48;
  var startDelay = -1;
  
  if (y > window.scrollY) {
    startDelay = 1333;
    rcvScrollTo(y, 1000);
  }

  rcvCalculate({recursive: true, startDelay: startDelay});
  event.preventDefault();
}