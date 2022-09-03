/***********************************************/
/*                  FILE INFO
************************************************
filename: main.js
authors: James Sanders | Riley Parsons
created: 13/03/2022
last modified: 05/06/2022
description: Refers to energy/index.html
************************************************/

// Start JS-Script
window.onload = init();


/***********************************************/
/*                  MAIN DRIVER
************************************************/
function init() {

  choropleth_ratio();
  
  d3.select('#selection').on("change", function() {
    selection = document.getElementById("selection");
    switch(selection.value){
      case "Line":
        remove();
        build_line();
      break;
      case "Sankey":
        remove();
        build_sankey();
      break;
      case "Choropleth":
        remove();
        choropleth_ratio();
      break;
    }
  });

}//END INIT

/***********************************************/
/*             BUILD VIZ FUNCTIONS
************************************************/

/* FUNCTION BUILD SANKEY
************************/
function build_sankey() {

  //Australian Energy Flows 2019-20 (Petajoules)

  // Check users window size, before setting w & h
  w = window.innerWidth / 2, 
  h = window.innerHeight / 2;

  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom;  

  // format variables
  var formatNumber = d3.format(",.0f"), // zero decimal places
                      format = function(d) { return formatNumber(d); };
    
  // append the svg object to the body of the page
  var svg = d3.select("#viz").append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", 
                    "translate(" + margin.left + "," + margin.top + ")");

  // Set the sankey diagram properties
  var sankey = d3.sankey()
                .nodeWidth(36)
                .nodePadding(40)
                .size([width, height]);

  //var path = sankey.links();

  // load the data
  d3.csv("assets/data/sankey/au-energy-flows").then(function(data) {

    //set up graph in same style as original example but empty
    sankeydata = {"nodes" : [], "links" : []};

    data.forEach(function (d) {
      sankeydata.nodes.push({ "name": d.source });
      sankeydata.nodes.push({ "name": d.target });
      sankeydata.links.push({ "source": d.source, "target": d.target, "value": +d.value });
    });

    // return only the distinct / unique nodes
    sankeydata.nodes = Array.from(
      d3.group(sankeydata.nodes, d => d.name),([value]) => (value)
    );

    // loop through each link replacing the text with its index from node
    sankeydata.links.forEach(function (d, i) {
      sankeydata.links[i].source = sankeydata.nodes.indexOf(sankeydata.links[i].source);
      sankeydata.links[i].target = sankeydata.nodes.indexOf(sankeydata.links[i].target);
    });

    // now loop through each nodes to make nodes an array of objects
    // rather than an array of strings
    sankeydata.nodes.forEach(function (d, i) {
      sankeydata.nodes[i] = { "name": d };
    });

    graph = sankey(sankeydata);

    // add in the links
    var link = svg.append("g").selectAll(".link")
                  .data(graph.links)
                  .enter().append("path")
                  .attr("class", "link")
                  .attr("d", d3.sankeyLinkHorizontal())
                  .attr("stroke-width", function(d) { return d.width; })
                  .attr("source", function(d){ return d.source.name; })
                  .attr("target", function(d){ return d.target.name; })
                  .attr("value", function(d){ return format(d.value); });  

    // add the link titles or some text
    link.append("title")
        .text("Click me for more information...");

    // add in the nodes
    var node = svg.append("g").selectAll(".node")
                  .data(graph.nodes)
                  .enter().append("g")
                  .attr("class", "node");

    // add the rectangles for the nodes
    node.append("rect")
        .attr("x", function(d) { return d.x0; })
        .attr("y", function(d) { return d.y0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .attr("width", sankey.nodeWidth())
        .style("fill", "var(--teal-blue)")
        .style("stroke", "var(--space-cadet)")
        .attr("name", function(d){ return d.name; })
        .attr("value", function(d){ return format(d.value); });

    // add in the title for the nodes
    node.append("text")
          .attr("x", function(d) { return d.x0 - 6; })
          .attr("y", function(d) { return (d.y1 + d.y0) / 2; })
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(function(d) { return d.name; })
          .filter(function(d) { return d.x0 < width / 2; })
          .attr("x", function(d) { return d.x1 + 6; })
          .attr("text-anchor", "start");
    node.append("text")
          .attr("x", function(d) { return d.x0 - 6; })
          .attr("y", function(d) { return ((d.y1 + d.y0) / 2)+20; })
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(function(d) { return format(d.value); })
          .filter(function(d) { return d.x0 < width / 2; })
          .attr("x", function(d) { return d.x1 + 6; })
          .attr("text-anchor", "start");
   
    highlight_renewables_sankey();

    document.getElementById("infoHeader").innerHTML = "Australian Energy Flows 2019 - 2020 (Petajoules)";
    document.getElementById("infoPara1").innerHTML = "This visualisation shows Australia's primary energy supply is made up from very little rewewable energy sources.";
    document.getElementById("infoPara2").innerHTML = "Data is based on one year, spanning from 2019 to 2020, and comes from the <span><a href='https://bit.ly/3POJH7f' target='_blank'>Australian Government</a></span>";
    tool_tip();

    //Tooltip
    function tool_tip() {

      //Paths = links
      d3.selectAll("path").on("click", function(event, d){

        //get general information
        path_source = d3.select(this).attr("source");
        path_target = d3.select(this).attr("target");
        path_value = d3.select(this).attr("value");

        d3.select('#tooltip')
          .style('left', event.clientX-268  + 'px')
          .style('top', event.clientY-31 + 'px')
          .select('#values')
          .text(`${path_value} petajoules of ${path_source} goes to the ${path_target}.`);
        d3.select("#tooltip").classed('hidden', false);

      }).on("mouseout", function(){

        d3.select(this)
          .transition()
          .duration(250)
          .attr('r', 3);
        
        d3.select('#tooltip')
          .select('#values')
          .text("");
            
        d3.select("#tooltip").classed('hidden', true);

      });

      // Rects = Nodes
      d3.selectAll("rect").on("mouseover", function(event, d){


        d3.csv("assets/data/sankey/au-energy-flows-percent").then(function(data){
          percent_map = new Map();
          data.forEach(function(d){
            percent_map.set(d.source,d.percent);
          });
        });

        // Get general information
        rect_name = d3.select(this).attr("name");
        percent = percent_map.get(rect_name);
        // Set Percentage
        d3.select(this).attr("percentage", percent);

        d3.select('#tooltip')
          .style('left', event.clientX-268  + 'px')
          .style('top', event.clientY-31 + 'px')
          .select('#values')
          .text(function(){
            switch(rect_name){
              case "Renewable Energy Production":
                return `${rect_name} contributed only ${(percent*100).toFixed(3)}% to Total Energy Production.`;
              case "Fossil Fuels Energy Production":
                return `${rect_name} contributed ${(percent*100).toFixed(3)}% to Total Energy Production.`;
              case "Fossil Fuel Imports":
                return `${rect_name} added ${(percent*100).toFixed(3)}% to Total Fossil Fuels.`;
              case "Primary Energy Supply":
                return `${rect_name} was ${(percent*100).toFixed(3)}% of Total Energy Production.`;
              case "Total Exports":
                return `${rect_name} was ${(percent*100).toFixed(3)}% of Total Energy Production, less Fossil Fuel Imports.`;
              case "Energy Consumption":
                return `${rect_name} was ${(percent*100).toFixed(3)}% of Primary Energy Supply.`;
              case "Uses & Losses":
                return `${rect_name} was ${(percent*100).toFixed(3)}% of Primary Energy Supply.`;   
              case "Total Fossil Fuels":
                return `${rect_name} contributed ${(percent*100).toFixed(3)}% to Total Energy Production.`;                                         
            }
          });
        d3.select("#tooltip").classed('hidden', false);

      }).on("mouseout", function(){

        d3.select(this)
          .transition()
          .duration(250)
          .attr('r', 3);
        
        d3.select('#tooltip')
          .select('#values')
          .text("");
            
        d3.select("#tooltip").classed('hidden', true);

      });

    }
  });
}//END BUILD SANKEY FUNCTION

/* FUNCTION BUILD CHOROPLETH RATIO
**********************************/
function choropleth_ratio() {

  // Add Selector DOM's for different data presentation.
  if(!document.getElementById("selection_two"))
    addSelector();

  // Display Map Key
  d3.select("#map-key").classed('hidden', false);

  // Check users window size, before setting w & h
  w = window.innerWidth / 2, 
  h = window.innerHeight / 2;

  // Get Screen Size
   m = get_screen_size();

  // generate map projection
  var projection = d3.geoMercator()
      .center([m.get(1)[0], m.get(1)[1]])
      .translate([250,180])
      .scale(m.get(2));

    // Static projection settings
    /*.center([120, -20])
      .translate([250,180])
      .scale(1150);*/

  //project the paths
  var path = d3.geoPath().projection(projection);

  // Generate the SVG.
  var svg = d3.select("#viz").append("svg")
      .attr("width", w)
      .attr("height", h);

  var states = svg.append("g").attr("id", "states");
  var states_names = svg.append("g").attr("id", "states-names");
  var cities = svg.append("g").attr("id", "cities");

  // load csv
  d3.csv("assets/data/choropleth/energy_mix_states").then(function(data){

    // Array of Colors
    color_shceme = [
      "#00441b",
      "#3c602e",
      "#006d2c",
      "#41ab5d",
      "#a1d99b",
      "#c7e9c0"
    ];

    // set color range values. HEX color.
    var color = d3.scaleLinear().domain([0,6,10,15,50,110]).range(color_shceme);

    // Set Key Header, color, & values
    d3.select("#key-header").text("Magnitude of Fossil Fuel use.");
    d3.selectAll(".key-color-block").each(
      function(d,i){
        d3.select(this).style("background-color", function(){return color_shceme[i];});
      }
    );
    key_values = ["~1x", "6", "10", "15", "50", "110"];
    d3.selectAll(".key-value").each(
      function(d,i){
        d3.select(this).text(function(){return key_values[i];});
      }
    );


    d3.json("assets/data/choropleth/au-states.geojson").then(function(json) {

    //Merge the unemployment data and GeoJSON
    //Loop through once for each ag. data value
    for (var i = 0; i < data.length; i++) {

      //Grab state name
      var dataState = data[i].state;

      //Grab data value, and convert from string to float
      var lfossil_ratio = parseFloat(data[i].fossil_ratio);

      //Find the corresponding state inside the GeoJSON
      for (var j = 0; j < json.features.length; j++) {
        var jsonState = json.features[j].properties.STATE_NAME;
        if (dataState == jsonState) {

          //Copy the data value into the JSON
          json.features[j].properties.value = lfossil_ratio;

          //Stop looking through the JSON
          break;
        }
      }
    }

    
    //load path DOM's
    states.selectAll("path")
      .data(json.features).enter()
      .append("path")
      .attr("name", function(data) { return data.properties.STATE_NAME; })
      .attr("ratio", function(data) { return data.properties.value; })
      .attr("fill", function(data) {

        //Get data value
        var value = data.properties.value;
        if (value) {
          //If value exists…
          return color(value);
        } else {
          //If value is undefined…
          return "#ccc";
        }

      })
      .attr("d", path);

      document.getElementById("infoHeader").innerHTML = "Ratio of Consumption, Fossil Fuels vs. Renewables Consumption.";
      document.getElementById("infoPara1").innerHTML = "This visualisation shows Australia's primary energy consumption, by state and territory, as a ratio of Fossil Fuels to Renewables.";
      document.getElementById("infoPara2").innerHTML = "Data comes from the <span><a href='https://bit.ly/3aoJasw' target='_blank'>Australian Government</a></span>, and is based on data from table C, spanning from 2019 to 2020.";
      tool_tip();
  
      //Tooltip
      function tool_tip() {
  
        //Paths = links
        d3.selectAll("path").on("mouseover", function(event, d){
  
          //get general information
          path_state_name = d3.select(this).attr("name");
          path_ratio_fossils = d3.select(this).attr("ratio");
  
          d3.select('#tooltip')
            .style('left', event.clientX-268  + 'px')
            .style('top', event.clientY-31 + 'px')
            .select('#values')
            .text(function(){
              if(path_state_name != "Australian Capital Territory")
                return `${path_state_name} consumed ${path_ratio_fossils} times more fossil fuel energy than renewable energy.`;
              else
                return "There is no data for the " + path_state_name + ".";    
            });
          d3.select("#tooltip").classed('hidden', false);
  
        }).on("mouseout", function(){
          
          //remove tool-tip
          d3.select('#tooltip')
            .select('#values')
            .text("");
              
          d3.select("#tooltip").classed('hidden', true);
  
        });
      }

      // Add state names
      d3.csv("assets/data/choropleth/state-centroid").then(function(data) {
        states_names.selectAll("text")
          .data(data).enter()
          .append("text")        
          .attr("x",function(d) {
            return projection([d.lon, d.lat])[0]-10;// X location of circle DOM
          })
          .attr("y", function(d) {
            return projection([d.lon, d.lat])[1];// Y location of circle DOM
          })
          .text(function(d) {
            return d.state;// Name of State
          })
          .append("title")
          .text(function(d) {
            switch(d.state){
              case "SA":
                return "South Australia";
              case "WA":
                return "Western Australia";
              case "NT":
                return "Northen Territory";
              case "QLD":
                return "Queensland";
              case "NSW":
                return "New South Wales";
              case "VIC":
                return "Victoria";
              case "TAS":
                return "Tasmania";
            }
          });
      });

      //load city names data
      d3.csv("assets/data/choropleth/au-city-coords").then(function(data) {
        cities.selectAll("circle") //add circles for citys
          .data(data)
          .enter()
          .append("circle") //add circle DOM
          .attr("cx", function(d) {
            return projection([d.lon, d.lat])[0];// X location of circle DOM
          })
          .attr("cy", function(d) {
            return projection([d.lon, d.lat])[1];// Y location of circle DOM
          })
          .attr("r", function(d) {
            if(d.city == "Sydney" || 
              d.city == "Melbourne" || 
              d.city == "Brisbane" || 
              d.city == "Perth" || 
              d.city == "Adelaide" || 
              d.city == "Canberra" || 
              d.city == "Darwin" || 
              d.city == "Hobart") {
                return 4;
              }else{
                return 3;
              }
            }) //radius size
          .style("fill", function(d) {
            if(d.city == "Sydney" || 
              d.city == "Melbourne" || 
              d.city == "Brisbane" || 
              d.city == "Perth" || 
              d.city == "Adelaide" || 
              d.city == "Canberra" || 
              d.city == "Darwin" || 
              d.city == "Hobart") {
                return "var(--teal-blue)";
              }else{
                return "var(--ivory)";
              }
            })
          .append("title") //Simple tooltip
          .text(function(d) {
            return d.city; //add tool here.
          });

        //city mouseover 
        cities.selectAll("circle").on("mouseover", function(event, d){

            //increase circle
            d3.select(this)
            //.transition()
            .attr('r', 6);

          }).on("mouseout", function(){

            //normilise cirlce
            d3.select(this)
              .transition()
              .duration(250)
              .attr('r', function(d) {
                if(d.city == "Sydney" || 
                  d.city == "Melbourne" || 
                  d.city == "Brisbane" || 
                  d.city == "Perth" || 
                  d.city == "Adelaide" || 
                  d.city == "Canberra" || 
                  d.city == "Darwin" || 
                  d.city == "Hobart") {
                    return 4;
                  }else{
                    return 3;
                  }
                }
              );
        });//end city mouseover
      });
    });
  });
}//END BUILD CHOROPLETH RATIO FUNCTION

/* FUNCTION BUILD CHOROPLETH PERCENTAGE
***************************************/
function choropleth_percentage() {

  // Add Selector DOM's for different data presentation.
  if(!document.getElementById("selection_two"))
    addSelector();

  // Check users window size, before setting w & h
  w = window.innerWidth / 2, 
  h = window.innerHeight / 2;

  // Get Screen Size
  m = get_screen_size();

  // generate map projection
  var projection = d3.geoMercator()
      .center([m.get(1)[0], m.get(1)[1]])
      .translate([250,180])
      .scale(m.get(2));

  //project the paths
  var path = d3.geoPath().projection(projection);

  // Generate the SVG.
  var svg = d3.select("#viz").append("svg")
      .attr("width", w)
      .attr("height", h);

  var states = svg.append("g").attr("id", "states");
  var states_names = svg.append("g").attr("id", "states-names");
  var cities = svg.append("g").attr("id", "cities");

  // load csv
  d3.csv("assets/data/choropleth/energy_mix_states").then(function(data){

    // Array of Colors
    color_shceme = [
      "#e5f5e0",
      "#a1d99b",
      "#41ab5d",
      "#006d2c",
      "#3c602e",
      "#00441b"
    ];

    // set color range values. HEX color.
    var color = d3.scaleLinear().domain([0,3,7,9,15,50]).range(color_shceme);

    // Set Key
    d3.select("#key-header").text("Percentage of Consumption, Renewables");
    d3.selectAll(".key-color-block").each(
      function(d,i){
        d3.select(this).style("background-color", function(){return color_shceme[i];});
      }
    );
    key_values = ["~1%", "3", "7", "9", "15", "50"];
    d3.selectAll(".key-value").each(
      function(d,i){
        d3.select(this).text(function(){return key_values[i];});
      }
    );

    d3.json("assets/data/choropleth/au-states.geojson").then(function(json) {

    //Merge the unemployment data and GeoJSON
    //Loop through once for each ag. data value
    for (var i = 0; i < data.length; i++) {

      //Grab state name
      var dataState = data[i].state;

      //Grab data value, and convert from string to float
      var lrenewables_percentage = parseFloat(data[i].renewables_percent);

      //Find the corresponding state inside the GeoJSON
      for (var j = 0; j < json.features.length; j++) {
        var jsonState = json.features[j].properties.STATE_NAME;
        if (dataState == jsonState) {

          //Copy the data value into the JSON
          json.features[j].properties.value = lrenewables_percentage;

          //Stop looking through the JSON
          break;
        }
      }
    }

    
    //load path DOM's
    states.selectAll("path")
      .data(json.features).enter()
      .append("path")
      .attr("name", function(data) { return data.properties.STATE_NAME; })
      .attr("percentage", function(data) { return data.properties.value; })
      .attr("fill", function(data) {

        //Get data value
        var value = data.properties.value;
        if (value) {
          //If value exists…
          return color(value);
        } else {
          //If value is undefined…
          return "#ccc";
        }

      })
      .attr("d", path);

      document.getElementById("infoHeader").innerHTML = "Percentage of Consumption, Renewables vs. Fossil Fuels.";
      document.getElementById("infoPara1").innerHTML = "This visualisation shows Australia's primary energy consumption, by state and territory, as a percentage of Renewables consumed.";
      document.getElementById("infoPara2").innerHTML = "Data comes from the <span><a href='https://bit.ly/3aoJasw' target='_blank'>Australian Government</a></span>, and is based on data from table C, spanning from 2019 to 2020.";
      tool_tip();
  
      //Tooltip
      function tool_tip() {
  
        //Paths = links
        d3.selectAll("path").on("mouseover", function(event, d){
  
          //get general information
          path_state_name = d3.select(this).attr("name");
          path_renewables_percentage = d3.select(this).attr("percentage");
  
          d3.select('#tooltip')
            .style('left', event.clientX-268  + 'px')
            .style('top', event.clientY-31 + 'px')
            .select('#values')
            .text(function(){
              if(path_state_name != "Australian Capital Territory")
                return `Renewables made up ${path_renewables_percentage}% of total energy consumed in ${path_state_name}.`;
              else
                return "There is no data for the " + path_state_name + ".";    
            });
          d3.select("#tooltip").classed('hidden', false);
  
        }).on("mouseout", function(){
          
          //remove tool-tip
          d3.select('#tooltip')
            .select('#values')
            .text("");
              
          d3.select("#tooltip").classed('hidden', true);
  
        });
      }

      // Add state names
      d3.csv("assets/data/choropleth/state-centroid").then(function(data) {
        states_names.selectAll("text")
          .data(data).enter()
          .append("text")        
          .attr("x",function(d) {
            return projection([d.lon, d.lat])[0]-10;// X location of circle DOM
          })
          .attr("y", function(d) {
            return projection([d.lon, d.lat])[1];// Y location of circle DOM
          })
          .text(function(d) {
            return d.state;// Name of State
          })
          .append("title")
          .text(function(d) {
            switch(d.state){
              case "SA":
                return "South Australia";
              case "WA":
                return "Western Australia";
              case "NT":
                return "Northen Territory";
              case "QLD":
                return "Queensland";
              case "NSW":
                return "New South Wales";
              case "VIC":
                return "Victoria";
              case "TAS":
                return "Tasmania";
            }
          });
      });

      //load city names data
      d3.csv("assets/data/choropleth/au-city-coords").then(function(data) {
        cities.selectAll("circle") //add circles for citys
          .data(data)
          .enter()
          .append("circle") //add circle DOM
          .attr("cx", function(d) {
            return projection([d.lon, d.lat])[0];// X location of circle DOM
          })
          .attr("cy", function(d) {
            return projection([d.lon, d.lat])[1];// Y location of circle DOM
          })
          .attr("r", function(d) {
            if(d.city == "Sydney" || 
              d.city == "Melbourne" || 
              d.city == "Brisbane" || 
              d.city == "Perth" || 
              d.city == "Adelaide" || 
              d.city == "Canberra" || 
              d.city == "Darwin" || 
              d.city == "Hobart") {
                return 4;
              }else{
                return 3;
              }
            }) //radius size
          .style("fill", function(d) {
            if(d.city == "Sydney" || 
              d.city == "Melbourne" || 
              d.city == "Brisbane" || 
              d.city == "Perth" || 
              d.city == "Adelaide" || 
              d.city == "Canberra" || 
              d.city == "Darwin" || 
              d.city == "Hobart") {
                return "var(--teal-blue)";
              }else{
                return "var(--ivory)";
              }
            })
          .append("title") //Simple tooltip
          .text(function(d) {
            return d.city; //add tool here.
          });

        //city mouseover 
        cities.selectAll("circle").on("mouseover", function(event, d){

            //increase circle
            d3.select(this)
            //.transition()
            .attr('r', 6);

          }).on("mouseout", function(){

            //normilise cirlce
            d3.select(this)
              .transition()
              .duration(250)
              .attr('r', function(d) {
                if(d.city == "Sydney" || 
                  d.city == "Melbourne" || 
                  d.city == "Brisbane" || 
                  d.city == "Perth" || 
                  d.city == "Adelaide" || 
                  d.city == "Canberra" || 
                  d.city == "Darwin" || 
                  d.city == "Hobart") {
                    return 4;
                  }else{
                    return 3;
                  }
                }
              );
        });//end city mouseover
      });
    });
  });
}//END BUILD CHOROPLETH PERCENTAGE FUNCTION

/* FUNCTION BUILD LINE
**********************/
function build_line() {

  // Australian Total Energy Consumption

  var w = 900;
  var h = 600;
  var xPadding = 0;
  var yPadding = 0;
  var chartPadding = 0;
  var dataset, xScale, yScale, coal_line, gas_line, oil_line, renewable_line, total_line;
  
  var svg = d3
    .select("#viz")     // set to appear in the "chart id p tag"
    .append("svg")
    .attr("width", w)
    .attr("height", h);
  
    // load in csv file
  d3.csv("assets/data/line/energy_consumption_all_pj", function (d) {
      return {
        // put year adn month together here as part of date which is a new object called Date. the -1 is due to js month starts at 0 e.g jaunary but date starts at 1 because there i sno 0th of march
        year: +d.Year,
        coal: +d.Coal,
        //like above we assign the number column to number
        gas: +d.Gas,
        oil: +d.Oil,
        renewable: +d.Renewable,
        total: +d.Total
      };
      //loading data into dataset
    }).then(function (data) {
      dataset = data;
      //to check if the data has been loaded in and added properly
      //console.table(dataset, ["year", "coal", "gas", "oil", "renewable", "total"]);
  
      lineChart(dataset);
    });    
  
  function lineChart(dataset) {
  
      // set up x on the chart
      xScale = d3.scaleLinear() // scale time due to not being a singular value
        .domain([
            d3.min(dataset, function(d) {return d.year-1; }),
            d3.max(dataset, function(d) {return d.year+1; })
        ])
        .range([chartPadding, w  - chartPadding]);  // total range of x from begining of chart data to end
        
      yScale = d3.scaleLinear()
        .domain([
          0, d3.max(dataset, function(d) {return d.total})
        ])
        .range([h-chartPadding, chartPadding]);
   
        
      //creation of the line acording to its designated value
  
      coal_line = d3.line()
        .x(function(d){ return xScale(d.year);})
        .y(function(d){ return yScale(d.coal); });
      
  
      gas_line = d3.line()
        .x(function(d){ return xScale(d.year);})
        .y(function(d){ return yScale(d.gas); });
  
      oil_line = d3.line()
        .x(function(d){ return xScale(d.year);})
        .y(function(d){ return yScale(d.oil); });
      
      renewable_line = d3.line()
        .x(function(d){ return xScale(d.year);})
        .y(function(d){ return yScale(d.renewable); });
        
      total_line = d3.line()
        .x(function(d){ return xScale(d.year);})
        .y(function(d){ return yScale(d.total); });      
  
  
       // draw each line and background colour
       draw_background(); 
        draw_coal();
        draw_gas();
        draw_oil();
        draw_renewable();
        draw_total();   
    
       // creation of the axis
       var yAxis = d3.axisLeft().scale(yScale);
       // note that ticks can appear in different positions
      var xAxis = d3.axisBottom().ticks(20).scale(xScale).tickFormat(d3.format("d")); // note this needs to appear after the x--Scale and yScale variables
       // ticks here can be used to specify the amount of data points on the axis that are visible
      // axis labels

      function draw_background(){
        svg.append("rect")
          .attr("width", "100%")
          .attr("height", "100%")
          .attr("fill", "var(--space-cadet)")
      }

      svg.append("text")
          .attr("class", "axis_label")
          .attr("text-anchor", "middle")
          .attr("x", w/2)
          .attr("y", h+50)
          .text("Year")
  
      svg.append("text")
          .attr("class", "axis_label")
          .attr("text-anchor", "middle")
          .attr("x", -100)
          .attr("y", h/2)
          .text("Petajoules")    
  
      svg
       .append("g")
       .attr("transform", "translate(0, " + (h - xPadding) + ")")// moves the x axis plot to th bottom of the page. note translate() is for our x and y position h - padding is for height od the image minus the padding for our y axis with 0 as the x
       .attr("class", "axis")
       .call(xAxis);
   
      svg
       .append("g")
       .attr("transform", "translate(" + yPadding + ",0)")
       .attr("class", "axis")
       .call(yAxis);        
  }
  
  // BUTTONS
  viz_btns = document.getElementById("viz-btns");
  viz_btns.innerHTML =
    '<button type="button" id="Coal" class="line-btns">Coal</button>' + 
    '<button type="button" id="Gas" class="line-btns">Gas</button>' +
    '<button type="button" id="Oil" class="line-btns">Oil</button>' +
    '<button type="button" id="Renewable" class="line-btns">Renewables</button>' +
    '<button type="button" id="Total" class="line-btns">Total</button>';

  coal_on = gas_on = oil_on = renewable_on = total_on = true;  
  
  d3.select("#Coal").on("click", function() {
    if (!coal_on) {
      draw_coal();
      coal_on = true
    } else if (coal_on) {
      d3.select("path.coal_line").remove();
      d3.selectAll("circle.coal_point").remove();
      coal_on = false
    }
  });  
  
  d3.select("#Gas").on("click", function() {
    if (!gas_on) {
      draw_gas();
      gas_on = true
    } else if (gas_on) {
      d3.select("path.gas_line").remove();
      d3.selectAll("circle.gas_point").remove();
      gas_on = false
    }
  });  
  
  d3.select("#Oil").on("click", function() {
    if (!oil_on) {
      draw_oil();
      oil_on = true
    } else if (oil_on) {
      d3.select("path.oil_line").remove();
      d3.selectAll("circle.oil_point").remove();
      oil_on = false
    }
  });
  
  d3.select("#Renewable").on("click", function() {
    if (!renewable_on) {
      draw_renewable();
      renewable_on = true
    } else if (renewable_on) {
      d3.select("path.renewable_line").remove();
      d3.selectAll("circle.renewable_point").remove();
      renewable_on = false
    }
  });
  
  d3.select("#Total").on("click", function() {
    if (!total_on) {
      draw_total();
      total_on = true
    } else if (total_on) {
      d3.select("path.total_line").remove();
      d3.selectAll("circle.total_point").remove();
      total_on = false
    }
  });
  
  function draw_coal(){

    svg.append("path")
      .datum(dataset)
      .attr("class", "coal_line")
      .attr("d", coal_line);

    svg.append("g")
      .selectAll("dots")
      .data(dataset)
      .join("circle")
      .attr("class", "coal_point")
      .attr("cx", function(d){return xScale(d.year)})
      .attr("cy", function(d){return yScale(d.coal)})
      .attr("r", 4)
      .attr("fill", "#d7191c")
      .attr("name", "Coal")
      .attr("value", function(d){return d.coal});
        
    //Tooltip
    tool_tip();
  }
  
  function draw_gas() {

    svg.append("path")
      .datum(dataset)
      .attr("class", "gas_line")
      .attr("d", gas_line);

    svg.append("g")
      .selectAll("dots")
      .data(dataset)
      .join("circle")
      .attr("class", "gas_point")
      .attr("cx", function(d){return xScale(d.year)})
      .attr("cy", function(d){return yScale(d.gas)})
      .attr("r", 4)
      .attr("fill", "#fdae61")
      .attr("name", "Gas")
      .attr("value", function(d){return d.gas});
    
    //Tooltip
    tool_tip();
  }
  
  function draw_oil() {

    svg.append("path")
        .datum(dataset)
        .attr("class", "oil_line")
        .attr("d", oil_line);

    svg.append("g")
        .selectAll("dots")
        .data(dataset)
        .join("circle")
        .attr("class", "oil_point")
        .attr("cx", function(d){return xScale(d.year)})
        .attr("cy", function(d){return yScale(d.oil)})
        .attr("r", 4)
        .attr("fill", "#ffffbf")
        .attr("name", "Oil")
        .attr("value", function(d){return d.oil});
        
    //Tooltip
    tool_tip();
  }
  
  function draw_renewable() {
    svg.append("path")
      .datum(dataset)
      .attr("class", "renewable_line")
      .attr("d", renewable_line);

    svg.append("g")
      .selectAll("dots")
      .data(dataset)
      .join("circle")
      .attr("class", "renewable_point")
      .attr("cx", function(d){return xScale(d.year)})
      .attr("cy", function(d){return yScale(d.renewable)})
      .attr("r", 4)
      .attr("fill", "#abd9e9")
      .attr("name", "Renewables")
      .attr("value", function(d){return d.renewable});

    //Tooltip
    tool_tip();
  }
  
  function draw_total() {

    svg.append("path")
      .datum(dataset)
      .attr("class", "total_line")
      .attr("d", total_line);
    
    svg.append("g")
      .selectAll("dots")
      .data(dataset)
      .join("circle")
      .attr("class", "total_point")
      .attr("cx", function(d){return xScale(d.year)})
      .attr("cy", function(d){return yScale(d.total)})
      .attr("r", 4)
      .attr("fill", "#2c7bb6")
      .attr("name", "Total")
      .attr("value", function(d){return d.total});

    //Tooltip
    tool_tip();
  }

  //Tooltip
  function tool_tip() {
    d3.selectAll("circle").on("mouseover", function(event, d){

      d3.select(this)
        .transition()
        .attr('r', 10);

      //get general information
      line_name = d3.select(this).attr("name");
      line_value = d3.select(this).attr("value");

      //get positional information
      var xPosition = parseFloat(d3.select(this).attr("cx"));
      var yPosition = parseFloat(d3.select(this).attr("cy"));

      d3.select('#tooltip')
      .style('left', event.clientX-268  + 'px')
      .style('top', event.clientY-31 + 'px')
      .select('#values')
      .text(line_name+" in " + d.year + " was "+ line_value + " petajoules.");
      d3.select("#tooltip").classed('hidden', false);

    }).on("mouseout", function(){

      d3.select(this)
        .transition()
        .duration(250)
        .attr('r', 4);
      
      d3.select('#tooltip')
        .select('#values')
        .text("");
          
      d3.select("#tooltip").classed('hidden', true);

    });
  }
  document.getElementById("infoHeader").innerHTML = "Australian Total Energy Consumption 1973-2019";
  document.getElementById("infoPara1").innerHTML = "This visualsiation shows the total energy consumption of Australia for Coal, Gas, Oil, Renewables and the Total culmination of all energy usage from the years 1973-2019.";
  document.getElementById("infoPara2").innerHTML = "Data based on Australian Energy Statistics 2021 Table C_0 <span><a href='https://www.energy.gov.au/publications/australian-energy-update-2021'>Australian Government</a></span>";
  document.getElementById("supporting-text-1").innerHTML = "By percentage increase from 1973-2019.<br>Australia's total energy consumption has increased by 229.9% starting at 2615.2 PJ and ending at 6013.8 PJ.<br/>Coal usage has had 153.2% growth starting at 920.2 PJ and ending at 1706.6 PJ.<br/>Gas usage has had 954.9% growth starting at 172.5 PJ and ending at 1647.2 PJ.<br/>Oil usage has had 168.1% growth starting at 1333.2 PJ and ending at 2241.2 PJ.<br/>Renewable usage has had 212.2% in growth starting at 197.4 PJ and ending at 418.8 PJ.<br/><br/>Renewable energy has only ever had more usage than one other major energy source being gas in the years 1973 and 1974. After this it has made up the lowest portion of major energy sources in Australia. Despite statistically having the second largest growth at 212.2%, numerically it only equates to an increase of 221.4 petajoules. Comparatively the 168.1% increase in oil consumption equates to 908 petajoules and the 153.2% increase in coal consumption equates to 786.4 petajoules. Each of these dwarfs the renewable energy growth that has occurred between the years of 1973 to 2019.";
  document.getElementById("supporting-text-2").innerHTML = "The 2019 statistics show that renewable energy makes up approximately 6.9% of the total energy consumption, whereas the 1973 statistics show that it made up 7.5% of Australia's energy consumption.<br/><br/>Overall, despite energy consumption in Australia increasing, renewable energy usage has decreased its total weight by 0.6%. The usage of non-renewable energy sources has maintained a consistently greater energy consumption and usage having a 1228.4 petajoule difference by the year 2019 with the closest value coming from gas consumption. This demonstrates that most of Australia's energy is not clean, nor is it being taken in a sustainable and renewable direction. Australia's 2019 lower renewable energy footprint compared to 1973 and the total growth in renewable energy consumption is minor compared to its non-renewable counterparts. Australia's clean energy usage can be considered lacking without a significant drive for improvement long term. More work needs to be done for future sustainability.";
}//END BUILD LINE FUNCTION



/***********************************************/
/*            auxiliary FUNCTIONS 
************************************************/

// element selectors used to highlight renewable energy.
function highlight_renewables_sankey(){
  const nodeList = document.querySelectorAll(".node");
  for (let i = 0; i < nodeList.length; i++) {
    for (let j = 0; j < nodeList[i].firstChild.attributes.length; j++) {
      if(nodeList[i].firstChild.attributes[j].value.match("Renewable Energy Production")){

        nodeList[i].firstChild.setAttribute("class", "highlight-node");
        nodeList[i].lastChild.previousSibling.setAttribute("class", "highlight-font");
        nodeList[i].lastChild.setAttribute("class", "highlight-font");
        
        //move text to make clear view of path.
        yPosition = parseFloat(nodeList[i].lastChild.previousSibling.attributes[1].value);
        nodeList[i].lastChild.previousSibling.attributes[1].value = yPosition + 15;
        yPosition = parseFloat(nodeList[i].lastChild.attributes[1].value);
        nodeList[i].lastChild.attributes[1].value = yPosition + 15;

      }
    }
  }
  const pathList = document.querySelectorAll("path");
  for (let i = 0; i < pathList.length; i++) {
    for (let j = 0; j < pathList[i].attributes.length; j++) {
      if(pathList[i].attributes[j].value.match("Renewable Energy Production")){
        pathList[i].setAttribute("class", "highlight-link");
      }
    }
  }
}

// remove unwanted DOM's
function remove() {
  // Refresh svg
  if(d3.select("svg") != null) {
    d3.select("svg").remove();
  }
  // Remove Buttons
  if(d3.selectAll(".line-btns") != null) {
    d3.selectAll(".line-btns").remove();
  }
  // Remove Map key
  if(d3.select("#map-key") != null) {
    d3.select("#map-key").classed('hidden', true);
  }

  // Remove supporting info from line viz.
  document.getElementById("supporting-text-1").innerHTML = "";
  document.getElementById("supporting-text-2").innerHTML = "";
  document.getElementById("supporting-text-2").innerHTML = "";
  // Remove second select menu from choropleth
  if(document.getElementById("selection_two") != null)
    document.getElementById("selector").removeChild(document.getElementById("selection_two"));
}

// Add Wanted DOM's
function addSelector() {

  // Create a "option" node:
  const option_node_1 = document.createElement("option");
  // Set value attribute & selected = ""
  option_node_1.setAttribute("value", "Ratio");
  option_node_1.setAttribute("selected", "");
  // Create a text node:
  const text_node_1 = document.createTextNode("Ratio of Consumption, Fossil Fuels vs. Renewables Consumption");
  // Append the text node to the "option" node:
  option_node_1.appendChild(text_node_1);
  

  // Create a "option" node:
  const option_node_2 = document.createElement("option");
  // Set value attribute
  option_node_2.setAttribute("value", "Percentage");
  // Create a text node:
  const text_node_2 = document.createTextNode("Percentage of Consumption, Renewables vs. Fossil Fuels");
  // Append the text node to the "option" node:
  option_node_2.appendChild(text_node_2);

  // Create a "select" node:
  const select_node = document.createElement("select");
  // Set id attribute
  select_node.setAttribute("id", "selection_two");
  // Append the option nodes to the select node:
  select_node.appendChild(option_node_1);
  select_node.appendChild(option_node_2);

  // Get Parent node
  parent_node = document.getElementById("selector");
  // Append the select node to the parent node:
  parent_node.appendChild(select_node);

  d3.select('#selection_two').on("change", function() {
      switch(selection_two.value){
        case "Ratio":
          d3.select("svg").remove();
          choropleth_ratio();
          break;
        case "Percentage":
          d3.select("svg").remove();
          choropleth_percentage();
          break;
      }
  });
    
}

// Find Screen Size
function get_screen_size() {
  var w = window.innerWidth, h = window.innerHeight;
  var m = new Map(), center = scale = 0;
  
  
  // iPhone Screen
  if(w <= 380 && h <= 815){
    center = [155, -30];
    scale = 450;
    m.set(1, center);
    m.set(2, scale);
    return m;
  // 11" Screen
  }else if(w <= 1540 && h <= 740){
    center = [120, -23];
    scale = 850;
    m.set(1, center);
    m.set(2, scale);
    return m;

  // 15" Screen
  }else if(w <= 1940 && h <= 940){
    center = [120, -20];
    scale = 1150;
    m.set(1, center);
    m.set(2, scale);
    return m;
  }
  // Default
  center = [120, -20];
  scale = 1150;
  m.set(1, center);
  m.set(2, scale);
  return m;

}