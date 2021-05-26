var parseDate = d3.timeParse("%Y");
    var bisectDate = d3.bisector(function(d) {  return d.year;  }).left;
    var formatValue = d3.format(",");
    var dateFormatter = d3.timeFormat("%Y");

    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 0, bottom: 30, left: 50},
        width = 350 - margin.left - margin.right,
        height = 150 - margin.top - margin.bottom;
    
    //Read the data
    d3.csv("./data/General/DR_combined5.csv", function(error, data) {
        if (error) throw error;

        data.forEach(function(d) {
          d.year = parseDate(d.year);
        });

        var sumstat = d3.nest()
            .key(function(d) {return d.ClimateEvent})
            .entries(data);

        var allKeys;

        allKeys = sumstat.map(function(d) {  return d.key  });

        var svg = d3.select("#my_dataviz_smallmultiples")
            .selectAll("uniqueChart")
            .data(sumstat)
            .enter()
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

        var x = d3.scaleTime()
          .domain(d3.extent(data, function(d) {  return d.year; }))
          .range([ 0, width ]);
        var xAxis = svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x).ticks(3));


        var y = d3.scaleLinear()
          .domain([d3.min(data, function(d) {  return +d.n;  }), d3.max(data, function(d) {  return +d.n;   })]) 
          .range([ height, 0 ]);
        var yAxis = svg.append("g")
        .attr("class", "myYaxis")
        .call(d3.axisLeft(y).ticks(0));

        var yAxisLabel = svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 20)
        .attr("x",0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle");

        var color = d3.scaleOrdinal()
            .domain(allKeys)
            .range(['#1f77b4','#aec7e8','#ff7f0e','#ffbb78','#2ca02c']);

        svg
            .append("path")
                .attr("fill", "none")
                .attr("stroke", function(d){ return color(d.key) })
                .attr("stroke-width", 1.9)
                .attr("d", function(d){
                    return d3.line()
                        .x(function(d) { return x(d.year); })
                        .y(function(d) { return y(+d.n); })
                        (d.values)
                });

        svg
            .append("text")
            .attr("text-anchor", "start")
            .attr("y", -5)
            .attr("x", 0)
            .text(function(d){ return(d.key)})
            .style("font-size", "12.5px")
            .style("fill", function(d){ return color(d.key) });
  
    });