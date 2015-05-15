//Use CommonJS style via browserify to load other modules
// require("./lib/social");
require("./lib/ads");
require("component-responsive-frame/child");

var loans = window.loanData;
var figure = document.querySelector("figure.heatmap");
var bounds = loans.bounds;

var augment = function(data) {
  data.ratio = {
    clayton: data.clayton / bounds.count.max,
    count: data.count / bounds.count.max,
    other: data.other / bounds.count.max
  }
}

var canvas = document.querySelector(".shader");
var context = canvas.getContext("2d");

var scaleRate = rate => (bounds.rate.max - rate) / (bounds.rate.max - bounds.rate.min + .5);
var scaleAmount = amount => (amount - bounds.amount.min) / (bounds.amount.max + 5 - bounds.amount.min);

var mode = "current";

var redraw = function() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  context.fillStyle = "rgba(0, 0, 0, .3)";
  context.strokeStyle = "white";
  context.setLineDash([5, 5]);
  //create current path
  context.beginPath();
  context.moveTo(-10, scaleRate(8.5) * canvas.height);
  context.lineTo(scaleAmount(50) * canvas.width, scaleRate(8.5) * canvas.height);
  context.lineTo(scaleAmount(50) * canvas.width, scaleRate(6.5) * canvas.height);
  context.lineTo(canvas.width + 10, scaleRate(6.5) * canvas.height);
  context.lineTo(canvas.width + 10, -10);
  context.lineTo(-10, -10);
  if (mode == "current") {
    //shade this area
    console.log("filling current");
    context.closePath();
    context.fill();
    return;
  }
  console.log("stroke current, fill proposed");
  context.stroke();

  //create proposed path
  context.beginPath();
  context.moveTo(-10, scaleRate(10) * canvas.height);
  context.lineTo(scaleAmount(75) * canvas.width, scaleRate(10) * canvas.height);
  context.lineTo(scaleAmount(75) * canvas.width, scaleRate(6.5) * canvas.height);
  context.lineTo(canvas.width + 10, scaleRate(6.5) * canvas.height);
  context.lineTo(canvas.width + 10, -10);
  context.lineTo(-10, -10);
  context.fill();
};

redraw();
window.addEventListener("resize", redraw);

loans.data.forEach(function(loan) {
  if (loan.gap) return;
  augment(loan);
  var div = document.createElement("div");
  div.className = "cell";
  var r = scaleRate(loan.rate);
  div.style.top = Math.round(r * 1000) / 10 + "%";
  var c = scaleAmount(loan.amount);
  div.style.left = Math.round(c * 1000) / 10 + "%";
  div.setAttribute("data-rate", loan.rate);
  div.setAttribute("data-amount", loan.amount);
  div.setAttribute("data-count", loan.count);
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
  // add the protection shading
  // if ((loan.amount < 50 && loan.rate > 8.5) || (loan.amount >= 50 && loan.rate > 6.5)) {
  //   div.classList.add("current");
  // }
  // if ((loan.amount < 75 && loan.rate > 10) || (loan.amount >= 75 && loan.rate > 6.5)) {
  //   div.classList.add("proposed");
  // }
  figure.appendChild(div);
});

var steps = ["count", "clayton", "other", "current", "proposed", "clayton proposed", "other proposed"];

//world's simplest navigation
document.body.addEventListener("click", function(e) {
  var step = e.target.getAttribute("data-goto");
  if (!step) return;
  document.body.setAttribute("data-step", step);
  mode = step.indexOf("proposed") > -1 ? "proposed" : "current";
  redraw();
});

document.body.addEventListener("click", function(e) {
  var increment = e.target.getAttribute("data-increment");
  if (!increment) return;
  var now = document.body.getAttribute("data-step");
  var index = steps.indexOf(now);
  if (index == -1) return console.error("bad state!");
  index += increment * 1;
  if (index < 0 || index == steps.length) return;
  var step = steps[index];
  mode = step.indexOf("proposed") > -1 ? "proposed" : "current";
  redraw();
  document.body.setAttribute("data-step", step);
});