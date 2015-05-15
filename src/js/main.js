//Use CommonJS style via browserify to load other modules
// require("./lib/social");
require("./lib/ads");
require("component-responsive-frame/child");

var dot = require("dot");
dot.templateSettings.varname = "data";
dot.templateSettings.evaluate = /<%([\s\S]+?)%>/g;
dot.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;
var tipTemplate = dot.template(require("./_tooltip.html"));

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
  context.strokeStyle = "black";
  context.lineWidth = 2;
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
    context.fill();
    return;
  }
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
  // context.strokeStyle = "black";
  // context.stroke();
};

redraw();
window.addEventListener("resize", redraw);

var steps = 8;
var lookup = {};

loans.data.forEach(function(loan) {
  if (loan.gap) return;
  augment(loan);
  var key = loan.rate + "-" + loan.amount
  lookup[key] = loan;
  var div = document.createElement("div");
  div.className = "cell";
  var r = scaleRate(loan.rate);
  div.style.top = Math.round(r * 1000) / 10 + "%";
  var c = scaleAmount(loan.amount);
  div.style.left = Math.round(c * 1000) / 10 + "%";
  div.setAttribute("data-rate", loan.rate);
  div.setAttribute("data-amount", loan.amount);
  div.setAttribute("data-count", loan.count);
  div.setAttribute("data-lookup", key);
  //cover loans that happen
  if (loan.gap) {
    div.classList.add("gap");
  } else {
    var ratio = loan.ratio;
    for (var key in ratio) {
      for (var i = steps; i >= 0; i--) {
        if (ratio[key] > (1 / steps * i)) {
          div.classList.add(key + "-" + (i + 1));
          break;
        }
      }
    }
  }
  figure.appendChild(div);
});

//add the axes
var x = figure.querySelector(".x-axis");
for (var i = bounds.amount.min; i < bounds.amount.max; i += 10) {
  var label = document.createElement("label");
  label.style.left = scaleAmount(i) * 100 + "%";
  label.innerHTML = i;
  x.appendChild(label);
}

var y = figure.querySelector(".y-axis");
for (var i = Math.ceil(bounds.rate.min); i <= bounds.rate.max; i++) {
  var label = document.createElement("label");
  label.style.top = scaleRate(i) * 100 + "%";
  label.innerHTML = i + "%";
  y.appendChild(label);
}

var steps = ["count", "clayton", "other", "current count", "proposed count", "clayton proposed", "other proposed"];

//world's simplest navigation
document.body.addEventListener("click", function(e) {
  var step = e.target.getAttribute("data-goto");
  if (!step) return;
  document.body.setAttribute("data-step", step);
  document.querySelector("nav .selected").classList.remove("selected");
  e.target.classList.add("selected");
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
  document.querySelector("nav .selected").classList.remove("selected");
  document.querySelector(`nav a[data-goto="${step}"]`).classList.add("selected");
  mode = step.indexOf("proposed") > -1 ? "proposed" : "current";
  redraw();
  document.body.setAttribute("data-step", step);
});

//hover notification
var tooltip = figure.querySelector(".tooltip");
// figure.addEventListener("mouseenter", () => tooltip.classList.add("show"));
figure.addEventListener("mouseleave", () => tooltip.classList.remove("show"));
figure.addEventListener("mousemove", function(e) {
  var bounds = figure.getBoundingClientRect();
  var x = e.clientX - bounds.left;
  var y = e.clientY - bounds.top;
  canvas.style.display = "none";
  var element = document.elementFromPoint(e.clientX, e.clientY);
  canvas.style.display = "block";
  var key = element.getAttribute("data-lookup");
  if (!key) return tooltip.classList.remove("show");
  var data = lookup[key];
  if (!data) return tooltip.classList.remove("show")
  tooltip.classList.add("show");
  tooltip.style.left = x + "px";
  tooltip.style.top = y + "px";
  tooltip.classList.toggle("right", x > bounds.width / 2);
  tooltip.innerHTML = tipTemplate(data);
});