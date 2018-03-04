var display = function (d){
    switch (d) {
        case 1:
            defaultMap()
            break;
        case 2:
            changeColor()
            break;
        case 3:
            toggleState();
            break;
        case 4:
            toggleTract()
            break;
    }

    function defaultMap() {
        drawMap();
    }

    function changeColor() {
        if (colorChanged) {
        color = d3.scaleThreshold()
        .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
         .range(d3.schemeOrRd[9]);
        colorChanged = false; 
        }
        else{
        color = d3.scaleThreshold()
        .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
        .range(d3.schemeGnBu[9]);
        colorChanged = true;
        }

        clearMap();
        drawMap();
    }

    function toggleState() {
        if (hideStateBoarder) {
            input_file = "NY-topo.json";
            hideStateBoarder = false;
        }
        else {
            input_file = "NY-merge-topo.json"
            hideStateBoarder = true;
        }
        clearMap();
        drawMap();
    }
    
    function toggleTract() {
        if (hideTractsBoarder) {
            input_file = "NY-topo.json";
            hideTractsBoarder = false;
        }
        else {
            input_file = "NY-quantized-topo.json";
            hideTractsBoarder = true;
        }
        clearMap();
        drawMap();
    }
    
    function clearMap() {
        var map = document.getElementById("map");
        if (map.childNodes[0])
            map.removeChild(map.childNodes[0]);  
    }

    function drawMap() {
        //Define Margin
        var margin = {left: 50, right: 40, top: 50, bottom: 30 },
            width = 1100 - margin.left -margin.right,
            height = 960 - margin.top - margin.bottom;

        //Define SVG
        var svg = d3.select("#map")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var path = d3.geoPath();


        var x = d3.scaleSqrt()
            .domain([0, 4500])
            .rangeRound([440, 950]);

        var g = svg.append("g")
            .attr("class", "key")
            .attr("transform", "translate(0,40)");

        g.selectAll("rect")
          .data(color.range().map(function(d) {
              d = color.invertExtent(d);
              if (d[0] == null) d[0] = x.domain()[0];
              if (d[1] == null) d[1] = x.domain()[1];
              return d;
            }))
          .enter().append("rect")
            .attr("height", 8)
            .attr("x", function(d) { return x(d[0]); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("fill", function(d) { return color(d[0]); });

        g.append("text")
            .attr("class", "caption")
            .attr("x", x.range()[0])
            .attr("y", -6)
            .attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Population per square mile");

        g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickValues(color.domain()))
          .select(".domain")
            .remove();

        //NY-quantized-topo.json is the reduced size of original NY.json
            //should have all boarders
        //NY-merge-topo.json with county and state boarder
        //NY-topo.json with only county boarder
        d3.json(input_file, function(error, topology) {
          if (error) throw error;

          svg.append("g")
            .selectAll("path")
            .data(topojson.feature(topology, topology.objects.tracts).features)
            .enter().append("path")
              .attr("fill", function(d) { return color(d.properties.density); })
              .attr("d", path);

          svg.append("path")
              .datum(topojson.feature(topology, topology.objects.counties))
              .attr("fill", "none")
              .attr("stroke", "#000")
              .attr("stroke-opacity", 0.3)
              .attr("d", path);


        });
    }
}