//Use CommonJS style via browserify to load other modules
// require("./lib/social");
require("./lib/ads");
require("component-responsive-frame/child");

var loans = window.loanData;
var figure = document.querySelector("figure.heatmap");
var bounds = loans.bounds;

var augment = function(data) {
  data.ratio = {
    clayton: data.clayton / bounds.clayton.max,
    count: data.count / bounds.count.max,
    other: data.other / bounds.count.max
  }
}

loans.data.forEach(function(loan) {
  augment(loan);
  var div = document.createElement("div");
  div.className = "cell";
  div.style.top = (loan.rate - bounds.rate.min) / (bounds.rate.max + .5 - bounds.rate.min) * 100 + "%";
  div.style.left = (loan.amount - bounds.amount.min) / (bounds.amount.max + 10 - bounds.amount.min) * 100 + "%";
  div.setAttribute("data-rate", loan.rate);
  div.setAttribute("data-amount", loan.amount);
  //cover loans that happen
  if (loan.gap) {
    div.classList.add("gap");
  } else {
    var ratio = loan.ratio;
    for (var key in ratio) {
      if (ratio[key] > .8) {
        div.classList.add(key + "-5");
      } else if (ratio[key] > .6) {
        div.classList.add(key + "-4");
      } else if (ratio[key] > .4) {
        div.classList.add(key + "-3");
      } else if (ratio[key] > .2) {
        div.classList.add(key + "-2");
      } else if (ratio[key] > 0) {
        div.classList.add(key + "-1");
      }
    }
  }
  //add the protection shading
  if ((loan.amount < 50 && loan.rate > 8.5) || (loan.amount >= 50 && loan.rate > 6.5)) {
    div.classList.add("current");
  }
  if ((loan.amount < 75 && loan.rate > 10) || (loan.amount >= 75 && loan.rate > 6.5)) {
    div.classList.add("proposed");
  }
  figure.appendChild(div);
});

var steps = ["count", "clayton", "other", "current", "proposed", "clayton proposed"];

//world's simplest navigation
document.body.addEventListener("click", function(e) {
  var step = e.target.getAttribute("data-goto");
  if (!step) return;
  document.body.setAttribute("data-step", step);
});

document.body.addEventListener("click", function(e) {
  var increment = e.target.getAttribute("data-increment");
  if (!increment) return;
  var now = document.body.getAttribute("data-step");
  var index = steps.indexOf(now);
  if (index == -1) return console.error("bad state!");
  index += increment * 1;
  if (index < 0 || index == steps.length) return;
  document.body.setAttribute("data-step", steps[index]);
});