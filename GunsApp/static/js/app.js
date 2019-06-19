var svgWidth = d3.select('#scatter').node().getBoundingClientRect().width;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 100,
  left: 100
};
// this calculates the chart area
var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold the chart,
// and shift the latter by left and top margins.
var svg = d3
  .select("#scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Initial Params
var chosenXAxis = "lawtotal"; 

// function used for updating x-scale var upon click on axis label
function xScale(data, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(data, d => d[chosenXAxis]) ,
      d3.max(data, d => d[chosenXAxis]) 
    ])
    .range([0, width]);

  return xLinearScale;

}

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale);

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return xAxis;
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]));

  return circlesGroup;
}

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  if (chosenXAxis === "lawtotal") {
    var label = "N Gun Laws:";
  }
  if (chosenXAxis === "median_income") {
    var label = "Median Income";
  }
  if (chosenXAxis === "census_popk") {
    var label = "Population (thousands)";
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function(d) {
      return (`${d.state}<br>${label} ${d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function(data) {
    toolTip.show(data);
  })
    // onmouseout event
    .on("mouseout", function(data, index) {
      toolTip.hide(data);
    });

  return circlesGroup;
}

// Retrieve data from the CSV file and execute everything below
d3.csv("/static/data/census_gunlaws_chart.csv", function(err, data) {
  if (err) throw err;

  // parse data  
  data.forEach(function(data) {
    data.lawtotal = +data.lawtotal;// initial chosen x
    data.median_income = +data.median_income; // alternate x
    data.census_popk = +data.census_popk; // alternate x #2
    data.n_incidents = +data.n_incidents; // y axis
  
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(data, chosenXAxis);

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.n_incidents)])
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis);

  // append y axis
  chartGroup.append("g")
    .call(leftAxis);

// Add a scale for bubble color
var myColor = d3.scaleLinear()
.domain(['2014', '2015', '2016', '2017'])
.range(['red', 'blue',  'grey', 'purple']);

 // Add a scale for bubble size
 var z = d3.scaleSqrt()
    .domain([0, 5000])
    .range([ 1, 20]);

 //---------------------------//
 //       HIGHLIGHT GROUP      //
 // ---------------------------//
  
 // What to do when one group is clicked
 var highlight = function(d){
  // reduce opacity of all groups
  d3.selectAll(".bubbles").style("opacity", .05)
  // except the one that is selected
  d3.selectAll(".y"+d).style("opacity", .75)
 }
  
    // And when it is not hovered anymore
  var noHighlight = function(d){
    d3.selectAll(".bubbles").style("opacity", .50)
  }

// ---------------------------//
//       LEGEND              //
// ---------------------------//

 // Add one  in the legend for each name.
    var size = 20

 // Add labels beside legend dots
    svg.selectAll("mylabels")
    .data(['2014', '2015', '2016', '2017'])
    .enter()
    .append("text")
        .attr("x", 2 + size*.8)
        .attr("y", function(d,i){ return i * (size + 5) + (size/2)}) 
        .style("fill", function(d){ return myColor(d)})
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("click", highlight)
        //.on("mouseout", noHighlight)

    svg.selectAll("mylabels")
    .data(['Reset'])
    .enter()
    .append("text")
        .attr("x", 2 + size*.8)
        .attr("y", 110) 
        .style("fill", 'black')
        .text(function(d){ return d})
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")
        .on("click", noHighlight)
  
  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", function(d) { return "bubbles y" + d.year })
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.n_incidents))
    .attr("r", function (d) { return z(d.n_incidents); } )
    .style("fill", function (d) { return myColor(d.year); } )
    ;

  // Create group for  2 x- axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width / 2}, ${height + 20})`);

  var lawtotalLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "lawtotal") // value to grab for event listener
    .classed("active", true)
    .text("N Gun Laws");

  var median_incomeLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "median_income") // value to grab for event listener
    .classed("inactive", true)
    .text("Median Income");

  var populationLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 60)
    .attr("value", "census_popk") // value to grab for event listener
    .classed("inactive", true)
    .text("Population (thoudands)");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("N Incidents");

  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup);
//
  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function() {
      // get value of selection
      var value = d3.select(this).attr("value");
      if (value !== chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(data, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis === "lawtotal") {
          lawtotalLabel
            .classed("active", true)
            .classed("inactive", false);
          median_incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          populationLabel
            .classed("active", false)
            .classed("inactive", true);
        }

        if (chosenXAxis === "median_income") {
          lawtotalLabel
            .classed("active", false)
            .classed("inactive", true);
          median_incomeLabel
            .classed("active", true)
            .classed("inactive", false);
          populationLabel
            .classed("active", false)
            .classed("inactive", true);
        }

      if (chosenXAxis === "census_popk") {
          lawtotalLabel
            .classed("active", false)
            .classed("inactive", true);
          median_incomeLabel
            .classed("active", false)
            .classed("inactive", true);
          populationLabel
            .classed("active", true)
            .classed("inactive", false);
        }
    
      }
    });
});  
