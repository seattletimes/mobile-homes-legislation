var app = require("./app");

app.controller("Heatmap", ["$scope", function($scope) {

  $scope.loans = window.loanData.data;

  var max = window.loanData.max;

  $scope.colorFilter = "count";

  var blend = function(start, end, blend) {
    var r = ((start >> 16 & 0xFF) * (1 - blend)) + ((end >> 16 & 0xFF) * blend);
    var g = ((start >> 8 & 0xFF) * (1 - blend)) + ((end >> 8 & 0xFF) * blend);
    var b = ((start & 0xFF) * (1 - blend)) + ((end & 0xFF) * blend);
    return (r << 16) + (g << 8) + b;
  }

  $scope.getStyles = function(loan) {
    var position = {
      top: (loan.rate - 1) / (max.rate - 1) * 100 + "%",
      left: loan.amount / max.amount * 100 + "%"
    }
    var count = loan[$scope.colorFilter];
    var top = max.count;//[$scope.colorFilter];
    var color = blend(0xFF0000, 0x00FF00, count / top);
    position.background = "#" + color.toString(16);
    return position;
  }

}]);