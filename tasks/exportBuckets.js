module.exports = function(grunt) {

  grunt.registerTask("export", function() {

    var done = this.async();

    var loans = grunt.data.csv.loans.filter(function(row) {
      return row.rate;
    });

    var width = 61;
    var rateDivision = 2;
    var amountDivision = 5;

    var matrix = [];
    loans.forEach(function(loan) {
      //rates are rounded up, because the conditions are always >
      var rate = Math.ceil(loan.rate * rateDivision) / rateDivision;
      var row = rate * rateDivision;
      //amounts are rounded down, because their conditions are >=
      var amount = Math.floor(loan.amount / amountDivision) * amountDivision;
      var column = amount / amountDivision;
      if (!matrix[row]) matrix[row] = new Array(width);
      if (!matrix[row][column]) matrix[row][column] = {
        rate: rate,
        amount: amount,
        clayton: 0,
        other: 0,
        count: 0
      };
      var counter = matrix[row][column];
      counter.count++;
      if (loan.company.trim().toLowerCase() == "clayton") {
        counter.clayton++;
      } else {
        counter.other++;
      }
    });

    var reduced = [];
    for (var r = 0; r < matrix.length; r++) {
      if (!matrix[r]) matrix[r] = new Array(width);
      var arr = matrix[r];
      for (var i = 0; i < arr.length; i++) {
        if (!arr[i]) arr[i] = {
          count: 0,
          clayton: 0,
          rate: r / rateDivision,
          amount: i * amountDivision,
          other: 0,
          gap: true
        }
        reduced.push(arr[i]);
      }
    };

    var bounds = {};
    ["count", "clayton", "rate", "amount"].forEach(function(key) {
      var bound = bounds[key] = {};
      var values = reduced.filter(function(d) { return d.count }).map(function(d) { return d[key] });
      bound.max = Math.max.apply(null, values);
      bound.min = Math.min.apply(null, values);
    });

    var csv = require("csv");
    var fs = require("fs");
    csv.stringify(reduced, { header: true }, function(err, output) {
      // console.log(output);
      fs.writeFileSync("output.csv", output);
      done();
    });

  });

}