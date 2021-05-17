var parseDate = d3.timeParse("%Y");
    var bisectDate = d3.bisector(function(d) {  return d.Year;  }).left;
    var formatValue = d3.format(".1f");
    var dateFormatter = d3.timeFormat("%Y");

    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 60, bottom: 60, left: 120},
        width = (self.innerWidth / 2) - margin.left - margin.right,
        height = (self.innerHeight * 0.75) - margin.top - margin.bottom,
        tooltip = { width: 100, height: 100, x: 10, y: -30};
    
    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz_tooltip")
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");


    var tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("display", "none");
    
    //Read the data
    d3.csv("./data/General/DR_combined4.csv", function(error, data) {
      if (error) throw error;

      data.forEach(function(d) {
        d.Year = parseDate(d.Year);
      });
    
        // List of groups (here I have one group per column)
        var allGroup = d3.map(data, function(d){return(d.ClimateEvent)}).keys()

        var headerNames = d3.keys(data[0]);
    
        // add the options to the button
        d3.select("#selectButton")
          .selectAll('myOptions')
            .data(allGroup)
          .enter()
            .append('option')
          .text(function (d) { return d; }) // text showed in the menu
          .attr("value", function (d) { return d; }) // corresponding value returned by the button
    
        // A color scale: one color for each group
        var myColor = d3.scaleOrdinal()
          .domain(allGroup)
          .range(d3.schemeCategory20); 

    
        // Add X axis --> it is a date format initialising with sea level rise
        var x = d3.scaleTime()
          .domain(d3.extent(data.filter(function(d){return d.ClimateEvent==allGroup[0]}), 
          function(d) { return (d.Year); }))
          .range([ 0, width ]);
        var xAxis = svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

        svg.append("text")
          .attr("transform",
                "translate(" + (width/2) + " ," +
                                (height + margin.top + 20) + ")")
          .style("text-anchor", "middle")
          .text(headerNames[0])
          
        // Add Y axis, initialising with sea level rise
        var y = d3.scaleLinear()
          .domain([d3.min(data.filter(function(d){return d.ClimateEvent==allGroup[0]}), 
          function(d) {return +d.Value;  }), d3.max(data.filter(function(d){return d.ClimateEvent==allGroup[0]}), 
          function(d) { return +d.Value; })])
          .range([ height, 0 ]);
        var yAxis = svg.append("g")
        .attr("class", "myYaxis")
        .call(d3.axisLeft(y));

          // text label for the y axis
        var yAxisLabel = svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left + 50)
            .attr("x",0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(data[0].Label);
    
        // Initialize line with first group of the list
        var line = svg
          .append('g')
          .append("path")
            .datum(data.filter(function(d){return d.ClimateEvent==allGroup[0]}))
            .attr("d", d3.line()
              .x(function(d) { return x((d.Year)) })
              .y(function(d) { return y(+d.Value) })
            )
            .attr("stroke", function(d){ return myColor("valueA") })
            .style("stroke-width", 4) 
            .style("fill", "none")
        
        var focus = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("circle")
            .attr("r", 5);
        
        var tooltipYear = tooltip.append("div")
            .attr("class", "tooltip-year");

        
        var tooltipValue = tooltip.append("div");
        tooltipValue.append("span")
            .attr("class", "tooltip-title")
            .text(data[0].Label + ": ");

        var tooltipValueValues = tooltipValue.append("span")
            .attr("class", "tooltip-value");

        var dataBox = svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() { focus.style("display", null); tooltip.style("display", null);  })
            .on("mouseout", function() { focus.style("display", "none"); tooltip.style("display", "none"); })
            .on("mousemove", mousemove);

        function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data.filter(function(d){return d.ClimateEvent==allGroup[0]}), x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 -d0.Year > d1.Year - x0 ? d1 : d0;
          focus.attr("transform", "translate(" + x(d.Year) + "," + y(d.Value) + ")");
          tooltip.attr("style", "left:" + (x(d.Year) + 64) + "px;top:" + y(d.Value) + "px;");
          tooltip.select(".tooltip-year").text("Year: " + dateFormatter(d.Year));
          tooltip.select(".tooltip-value").text(formatValue(d.Value));

        }
    
        // A function that update the chart
        function update(selectedGroup) {
    
          // Create new data with the selection?
          var dataFilter = data.filter(function(d){return d.ClimateEvent==selectedGroup})
          
          // Updating x axis
          x.domain([d3.min(dataFilter, function(d) {  return (d.Year)  }), d3.max(dataFilter, function(d) { return (d.Year) }) ]);
          xAxis.transition().duration(1000).call(d3.axisBottom(x));


          // Updating y axis
          y.domain([d3.min(dataFilter, function(d) {  return +d.Value  }), d3.max(dataFilter, function(d) { return +d.Value }) ]);
          yAxis.transition().duration(1000).call(d3.axisLeft(y));
          yAxisLabel.transition().duration(1000).text(dataFilter[0].Label);
          
          // Give these new data to update line
          line
              .datum(dataFilter)
              .transition()
                .duration(1000)
                .attr("d", d3.line()
                  .x(function(d) { return x((d.Year)) })
                  .y(function(d) { return y(+d.Value) })
              )
              .attr("stroke", function(d){ return myColor(selectedGroup) })

          dataBox
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() { focus.style("display", null); tooltip.style("display", null);  })
            .on("mouseout", function() { focus.style("display", "none"); tooltip.style("display", "none"); })
            .on("mousemove", mousemove1);

        function mousemove1() {
            var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(dataFilter, x0, 1),
            d0 = dataFilter[i - 1],
            d1 = dataFilter[i],
            d = x0 -d0.Year > d1.Year - x0 ? d1 : d0;
          focus.attr("transform", "translate(" + x(d.Year) + "," + y(d.Value) + ")");
          tooltip.attr("style", "left:" + (x(d.Year) + 64) + "px;top:" + y(d.Value) + "px;");
          tooltip.select(".tooltip-year").text("Year: " + dateFormatter(d.Year));
          tooltip.select(".tooltip-value").text(formatValue(d.Value));
          tooltip.select(".tooltip-title").text(d.Label + ": ")

        }


        }

        // When the button is changed, run the updateChart function
        d3.select("#selectButton").on("change", function(d) {
            // recover the option that has been chosen
            var selectedOption = d3.select(this).property("value")
            // run the updateChart function with this selected option
            update(selectedOption)
        })
    
    })