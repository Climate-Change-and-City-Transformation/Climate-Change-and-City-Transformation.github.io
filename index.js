class China {
  constructor(id, data, title) {
    this.title = title;
    this.id = id;
    this.city = data.city;
    this.province = data.province;
    this.initSvg();
    this._tips();
    this._initProjection_city();
    this._initProjection_province();
    this.showStatus = "province";
  }

  initSvg() {
    let div = d3.select(`#${this.id}`);
    this._getWH(div);

    this.margin = { left: 90, right: 20, top: 30, bottom: 30 };
    this.innerW = this.width - this.margin.left - this.margin.right;
    this.innerH = this.height - this.margin.top - this.margin.bottom;

    this.svg = div
      .selectAll(".mysvg")
      .data(["mysvg"])
      .join("svg")
      .attr("class", "mysvg")
      .attr("width", this.width)
      .attr("height", this.height);

    this._initChartArea();
  }
  _initChartArea() {
    this.ChartArea = this.svg
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.svg
      .append("text")
      .attr("x", 20)
      .attr("y", -60)
      .attr("class", "svgtitle")
      .text("");

    this.DrawArea = this.ChartArea.append("g");
  }

  _getWH(node) {
    this.width = node.node().getBoundingClientRect().width;
    this.height = node.node().getBoundingClientRect().height;
  }

  _tips() {
    this.tool_tip = d3
      .tip()
      .attr("class", "d3-tip")
      .offset([0, 0])
      .html((e, d) => {
        console.log(d);
        return ` 
          <span>${
            this.showStatus !== "province" ? d.City_Name_en : ""
          }</span>
          <span>${d.Province_Name_en}</span>
          <span> ${d3.format(".1f")(d.value)} </span> `;
      });
    this.svg.call(this.tool_tip);
  }
  _initProjection_city() {
    //city map projection
    const projection_city = d3
      .geoMercator()
      .fitSize([this.innerW, this.innerH], this.city);
    this.city_path = d3.geoPath().projection(projection_city);
  }
  _initProjection_province() {
    //province projection
    const projection_province = d3
      .geoMercator()
      .fitSize([this.innerW, this.innerH], this.province);

    this.province_path = d3.geoPath().projection(projection_province);
  }
}

class Map extends China {
  constructor(id, data) {
    super(id, data);
    this.initScales();
  }

  initScales() {
    this.color = d3
      .scaleThreshold()
      .domain([0, 0.4, 0.9, 1, 1.1, 1.25])
      .range([
        "#D3D3D3",
        "#4d9221",
        "#a1d76a",
        "#e6f5d0",
        "#fde0ef",
        "#e9a3c9",
        "#c51b7d",
      ]);

    this.x = d3
      .scaleBand()
      .domain(["below 0", "0.4", "0.9", "1", "1.1", " above 1.25"])
      .range([0, this.innerW]);
  }

  drawCity() {
    this._drawCityMap();
    this._province_path_remove();
  }

  drawProvince() {
    this._drawProvinceMap();
  }
  drawCapital() {
    this._initProjection_city();
    let capitals = this.city.features.filter((d) => d.iscapital);
    let circles = this.ChartArea.selectAll(".capitalMap")
      .data(capitals)
      .join("circle")
      .attr("class", "capitalMap");
    circles
      .attr("cx", (d) => this.city_path.centroid(d)[0])
      .attr("cy", (d) => this.city_path.centroid(d)[1])
      .attr("r", (d) => 3)
      .attr("fill", "lightgray")
      .attr("opacity", 0.7)
      .attr("stroke", "black");
  }

  _drawCityMap() {
    // city
    this.ChartArea.selectAll(".cityPath")
      .data(this.city.features)
      .join("path")
      .raise()
      .attr("class", (d) => `cityPath  ${d.properties.Prefecture}`)
      .attr("opacity", 0)
      .attr("d", this.city_path)
      .attr("stroke-width", 0.3)
      .attr("stroke", "white")
      .attr("fill", (d) => this.color(d.value))
      .on("mouseover", this.tool_tip.show)
      .on("mouseout", this.tool_tip.hide);
  }

  _initProjection_world() {
    //world projection
    const projection_world = d3
      .geoEqualEarth()
      .scale(900)
      .translate([-880, 940]);
    this.world_path = d3.geoPath().projection(projection_world);
  }
  _drawProvinceMap() {
    this.ChartArea.selectAll(".provincePath")
      .data(this.province.features)
      .join("path")
      .lower()
      .attr("class", (d) => `provincePath  ${d.properties.ProvinceNa}`)
      .attr("d", this.province_path)
      .attr("stroke", "black")
      .attr("stroke-width", 0.3)
      .attr("fill", (d) => this.color(d.value))

      .on("mouseover", this.tool_tip.show)
      .on("mouseout", this.tool_tip.hide);
  }

  _drawWorldMap() {
    this.ChartArea.selectAll(".worldPath")
      .data(this.world.features)
      .join("path")
      .attr("class", "worldPath")
      .attr("d", this.world_path)
      .attr("stroke", "lightgray")
      .attr("fill", "gray")
      .attr("opacity", 0.2);
  }
  _province_path_remove() {
    d3.selectAll(".provincePath")
      .transition()
      .duration(2000)
      .style("opacity", 0);
  }

  _addLegend() {
    this.legendArea = this.svg
      .selectAll(".legend")
      .data(["legend"])
      .join("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.margin.left},${0})`);

    new Legend({
      color: this.color,
      xScale: this.x,
      legend_type: "threshold",
      chartArea: this.legendArea,
      x: 0,
      y: -60,
      width: this.innerW,
      height: 10,
      legend_color_count: 5,
    });
  }
}

// scatter
class Scatter extends China {
  constructor(id, data) {
    super(id, data);
    this.scatter_data = data.scatter_data;
    this.initAxis();
    this._initScale();
  }
  initAxis() {
    this.AxisY = this.ChartArea.append("g");
    this.AxisX = this.ChartArea.append("g").attr(
      "transform",
      `translate(0,${this.innerH})`
    );
  }
  _addLabel() {
    //y label
    this.ChartArea.append("text")
      .attr("transform", `translate(${this.innerW / 2},${this.innerH + 30})`)
      .text("The Rates of Emission");
    //x label
    this.ChartArea.append("text")
      .attr("transform", `translate(${-125},${this.innerH / 2}) rotate(270)`)
      .text("");
    //title
    this.svg.append("text").attr("x", 80).attr("y", 40).text("");
  }

  _initScale() {
    this.y = d3
      .scaleBand()
      .range([0, this.innerH])
      .domain(this.scatter_data.map((d) => d[0]))
      .padding(0.3);

    this.x = d3
      .scaleSqrt()
      .range([this.innerW, 0])
      .domain([d3.max(this.scatter_data, (d) => d3.max(d[1], (v) => v[1])), 0]);

    this.color = d3.scaleDiverging(d3.interpolatePiYG).domain(this.x.domain());
  }

  addAxis() {
    this._addLabel();

    this.AxisX.style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 0.8)
      .call(d3.axisBottom(this.x));

    this.AxisY.style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 0.8)
      .call(d3.axisLeft(this.y).tickSize(-this.innerW));

    this.AxisY.selectAll(".tick").select("text").attr("dy", "-0.5em");
    this.addLine();
  }
  addLine() {
    this.line = this.DrawArea.selectAll(".line")
      .data([0])
      .join("line")
      .transition()
      .duration(2000)
      .attr("x1", this.x(1))
      .attr("x2", this.x(1))
      .attr("y1", 0)
      .attr("y2", this.innerH)
      .attr("stroke", "gray")
      .attr("class", "line");
  }
  removeLine() {
    this.DrawArea.select(".line").remove();
  }

  removeAxis() {
    this.AxisX.style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0);
    // .call(d3.axisBottom(this.x));

    this.AxisY.style("opacity", 1)
      .transition()
      .duration(1000)
      .style("opacity", 0);
    // .call(d3.axisLeft(this.y).tickSize(-this.innerW));
  }
  cityPath_to_circle() {
    this._city_path_change_to_circle();
    this.provincePath_to_circle();
    this._capital_circle_remove();
    this._addLegend();
  }
  circle_to_cityPath() {
    this._circle_change_to_city_path();
  }

  provincePath_to_circle() {
    this._province_path_change_to_circle();
  }

  circle_to_provincePath() {
    this._circle_change_to_province_path();
    this._capital_circle_restore();
    this.removeLine();
  }
  _city_path_change_to_circle() {
    let city_paths = d3.selectAll(".cityPath");

    city_paths
      .transition()
      .duration(1000)
      .delay((d, i) => 10 + i * 2)
      .style("fill-opacity", 1)
      // .style("pointer-events", "none")
      .attrTween("d", (d, i) => {
        let city = d3.select(`.${d.properties.Prefecture}`);
        let path = city.attr("d");

        let interpolator = flubber.toCircle(
          path,
          this.x(d.value),
          this.y(d.Province_Name_en),
          5
        );
        return interpolator;
      });
  }
  _circle_change_to_city_path() {
    let city_paths = d3.selectAll(".cityPath");

    city_paths
      .transition()
      .duration(1200)
      .delay((d, i) => 10 + i * 2)
      .style("fill-opacity", 1)
      // .style("pointer-events", "none")
      .attrTween("d", (d, i) => {
        let interpolator = flubber.interpolate(
          d3.select(`.${d.properties.Prefecture}`).attr("d"),
          this.city_path(d)
        );
        return interpolator;
      });
  }

  _province_path_change_to_circle() {
    let city_paths = d3.selectAll(".provincePath");
    city_paths
      .transition()
      .duration(3000)
      .delay((d, i) => 10 + i * 2)
      .style("fill-opacity", 0.9)
      .style("pointer-events", "none")
      .attrTween("d", (d, i) => {
        let province = d3.select(`.${d.properties.ProvinceNa}`);
        let path = province.attr("d");

        let interpolator = flubber.toCircle(
          path,
          this.x(d.value),
          this.y(d.Province_Name_en),
          10
        );
        return interpolator;
      });
  }
  _circle_change_to_province_path() {
    let provinces = d3.selectAll(".provincePath");

    provinces
      .transition()
      .duration(1000)
      .delay((d, i) => 10 + i * 2)
      .style("fill-opacity", 1)
      // .style("pointer-events", "none")
      .attrTween("d", (d, i) => {
        let interpolator = flubber.interpolate(
          d3.select(`.${d.properties.ProvinceNa}`).attr("d"),
          this.province_path(d)
        );
        return interpolator;
      });
  }

  _capital_circle_remove() {
    d3.selectAll(".capitalMap")
      .transition()
      .duration(1000)
      .attr("cx", (d) => this.x(d.value))
      .attr("cy", (d) => this.y(d.Province_Name_en));
  }
  _capital_circle_restore() {
    d3.selectAll(".capitalMap")
      .transition()
      .duration(1000)
      .attr("cx", (d) => this.city_path.centroid(d)[0])
      .attr("cy", (d) => this.city_path.centroid(d)[1]);
  }
  _addLegend() {
    this.legendArea = this.svg
      .selectAll(".legend")
      .data(["legend"])
      .join("g")
      .attr("class", "legend")
      .attr("transform", `translate(${this.margin.left},${0})`);

    new Legend({
      color: this.color,
      xScale: this.x,
      legend_type: "continue",
      chartArea: this.legendArea,
      x: 0,
      y: -60,
      width: this.innerW,
      height: 10,
      legend_color_count: 5,
    });
  }
}

//legend
class Legend {
  constructor(config) {
    this.color = config.color;
    this.direction = config.direction;
    this.container = config.chartArea;
    this.x = config.x;
    this.y = config.y;
    this.legend_color_count = config.legend_color_count;
    this.width = config.width;
    this.height = config.height;
    this.xScale = config.xScale;
    this.legend_type = config.legend_type;
    this.config = config;
    this.init();
  }

  init() {
    this.initSvg();

    switch (this.legend_type) {
      case "threshold":
        this.addThresholdLegend();
        break;
      case "continue":
        this.addContinueLegend();
        break;
    }
  }

  initSvg() {
    this.svg = this.container
      .selectAll(".legend")
      .data(["legend"])
      .join("svg")
      .attr("class", (d) => d)
      .attr("transform", `translate(${this.x},${this.y})`)
      .attr("width", this.width);
  }

  addContinueLegend() {
    this.addGradientDef();
    this.addGradientRect();
  }
  addGradientDef() {
    let myGradient = this.svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "myGradient");

    //

    let i = this.legend_color_count;
    myGradient
      .selectAll("stop")
      .data(d3.range(i))
      .join("stop")
      .attr("offset", (d) => `${d * (100 / i)}%`)
      .attr("stop-color", (d) =>
        d3.interpolatePiYG(((i - d) * (100 / i)) / 100)
      );
  }

  addGradientRect() {
    this.svg

      .append("rect")
      .attr("width", this.width)
      .transition()
      .duration(2000)
      .attr("height", this.height)
      .attr("x", 0)

      .attr("y", 0)
      .attr("id", "myRect")
      .attr("fill", "url('#myGradient')");

    //label
    this.xScale.range([this.width - 2, 3]);
    this.svg
      .append("g")
      .transition()
      .delay(2000)
      .attr("transform", `translate(${0},${this.height})`)
      .call(d3.axisBottom(this.xScale));
  }

  addThresholdLegend() {
    let domain = this.color.domain();

    this.svg

      .selectAll("rect")
      .data(domain)
      .join("rect")

      .attr("x", (d, i) => (i * this.width) / domain.length)
      .attr("y", 0)

      .attr("width", this.width / domain.length)
      .attr("height", this.height)
      .attr("fill", (d) => this.color(d));

    this.svg.call(d3.axisBottom(this.xScale));
  }
}

async function initData() {
  let city = await d3.json("./data/China/city_simple.json");

  let province = await d3.json("./data/China/province_simplify.json");

  // let world = await d3.json("./data/world.json");
  let capitalCo2 = await d3.csv("./data/China/capital.csv");

  let cityCo2 = await d3.csv("./data/China/city.csv");

  let provinceCo2 = await d3.csv("./data/China/province.csv");

  unionData();
  function unionData() {
    //city

    city.features.forEach((d) => {
      //city
      {
        let value = cityCo2.find((v) => v.CityName === d.properties.Prefecture);
        if (value) {
          d.value = +value.C2017;
          d.City_Name_en = value.City_Name_en;
        }
      }

      //capital
      {
        let value = capitalCo2.find(
          (v) => v.CityName === d.properties.Prefecture
        );
        if (value) {
          d.iscapital = true;
          d.capitalValue = +value.C2017;
        }
      }

      //provinceName
      {
        let province = provinceCo2.find(
          (v) => v.Province_Name_ch === d.properties.ProvinceNa
        );
        if (province) {
          d.Province_Name_en = province.Province_Name_en.replace("Province", "")
            .replace("City", "")
            .replace("Autonomous Region", "");
        }
      }
    });
    //province
    province.features.forEach((d) => {
      let value = provinceCo2.find(
        (v) => v.Province_Name_ch === d.properties.ProvinceNa
      );
      if (value) {
        d.value = +value.C2017;
        d.Province_Name_en = value.Province_Name_en.replace("Province", "")
          .replace("City", "")
          .replace("Autonomous Region", "");
      }
    });
  }

  // city.features.forEach((d) => {
  //   d.Province_Name_en = d.Province_Name_en.replace("Autonomous Region", "");
  // });
  let scatter_data = d3.rollups(
    city.features,
    (d) => d3.sum(d, (v) => v.value),
    (d) => d.Province_Name_en.replace("Autonomous Region", ""),
    (d) => d.properties.Prefecture
  );
  scatter_data.sort((a, b) => {
    return d3.sum(a[1], (v) => v[1]) > d3.sum(b[1], (v) => v[1]) ? -1 : 1;
  });

  return {
    city,
    province,
    scatter_data,
  };
}

async function main() {
  let data = await initData();
  let map = new Map("map", data, "我是地图");
  map.drawCity();
  map.drawProvince();
  map.drawCapital();
  map._addLegend();

  let scatter = new Scatter("map", data);


  var scrollAction = { x: undefined, y: undefined },
    scrollDirection;

  d3.select("#chartArea").on("mouseenter", (e) => {
    let navtop =
      e.target.getBoundingClientRect().top -
      d3.select(".navbar").node().getBoundingClientRect().height;
    window.scrollBy({ top: navtop, behavior: "smooth" });

    d3.select(".chart")
      .style("position", "sticky")
      .style("top", 0)
      .style("left", 0);
  });

  function handelscroll(e) {
    let height = e.target.scrollHeight;
    let top = e.target.scrollTop;


    let chart = d3.select(".chart");

    scrollFunc();

    //change to city
    if (top >= height / 4 - 50 && top <= height / 4) {
      scrollDirection == "down" && province_to_city();
      scrollDirection == "up" && city_to_province();
    }
    //change to scatter
    if (top >= (height / 4) * 2 - 40 && top <= (height / 4) * 2) {
      scrollDirection == "down" && city_to_scatter();
      scrollDirection == "up" && scatter_to_city();
    }
    function province_to_city() {
      // d3.selectAll(".provincePath")
      //   .attr("opacity", 1)
      //   .transition()
      //   .duration(3000)
      //   .attr("opacity", 0.2);

      d3.selectAll(".cityPath").attr("opacity", 1);
      map.showStatus = "city";
    }
    function city_to_province() {
      d3.selectAll(".cityPath").attr("opacity", 0);
      map.showStatus = "province";
    }
    function city_to_scatter() {
      scatter.cityPath_to_circle();
      scatter.addAxis();
    }
    function scatter_to_city() {
      scatter.removeAxis();
      scatter.circle_to_cityPath();
      scatter.circle_to_provincePath();
    }

    function scrollFunc() {
      if (typeof scrollAction.x == "undefined") {
        scrollAction.x = e.target.scrollLeft;
        scrollAction.y = e.target.scrollTop;
      }
      var diffX = scrollAction.x - e.target.scrollLeft;
      var diffY = scrollAction.y - e.target.scrollTop;
      if (diffX < 0) {
        // Scroll right
        scrollDirection = "right";
      } else if (diffX > 0) {
        // Scroll left
        scrollDirection = "left";
      } else if (diffY < 0) {
        // Scroll down
        scrollDirection = "down";
      } else if (diffY > 0) {
        // Scroll up
        scrollDirection = "up";
      } else {
        // First scroll event
      }
      scrollAction.x = e.target.scrollLeft;
      scrollAction.y = e.target.scrollTop;
      console.log(scrollDirection);
    }
  }

  d3.select("#chartArea").on("scroll", (e) => {
    window.requestAnimationFrame(handelscroll(e));
    //
  });
}
main();
