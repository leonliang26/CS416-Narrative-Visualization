// ============================================================
// CS 416 Narrative Visualization
// What Affects Electric Vehicle Driving Range?
// Narrative Structure: Martini Glass
// ============================================================


// ------------------------------------------------------------
// Parameters / State
// ------------------------------------------------------------

const state = {
  scene: 1,
  totalScenes: 3,
  explorationEnabled: false
};


// ------------------------------------------------------------
// Chart Setup
// ------------------------------------------------------------

const svg = d3.select("#chart");

const width = 900;
const height = 470;

const margin = {
  top: 25,
  right: 35,
  bottom: 60,
  left: 70
};

const innerWidth =
  width - margin.left - margin.right;

const innerHeight =
  height - margin.top - margin.bottom;


// Variables that will be created after loading the CSV
let data;
let xScale;
let yScale;

let trendLayer;
let pointsLayer;
let annotationLayer;

const tooltip =
  d3.select("#tooltip");


// ------------------------------------------------------------
// Load Data
// ------------------------------------------------------------

d3.csv("cars_clean.csv")
  .then(rawData => {

    // Remove rows without a model name and make sure
    // the three main variables are valid numbers.
    data = rawData
      .filter(d =>
        d.model &&
        d.model.trim() !== "" &&
        Number.isFinite(+d.battery_capacity_kWh) &&
        Number.isFinite(+d.efficiency_wh_per_km) &&
        Number.isFinite(+d.range_km)
      )
      .map(d => ({
        brand: d.brand,
        model: d.model,

        top_speed_kmh:
          +d.top_speed_kmh,

        battery_capacity_kWh:
          +d.battery_capacity_kWh,

        efficiency_wh_per_km:
          +d.efficiency_wh_per_km,

        range_km:
          +d.range_km,

        acceleration_0_100_s:
          +d.acceleration_0_100_s,

        fast_charging_power_kw_dc:
          d.fast_charging_power_kw_dc === ""
            ? null
            : +d.fast_charging_power_kw_dc,

        fast_charge_port:
          d.fast_charge_port || "N/A",

        drivetrain:
          d.drivetrain,

        segment:
          d.segment,

        car_body_type:
          d.car_body_type
      }));

    console.log(
      `Loaded ${data.length} vehicles successfully.`
    );

    initializeChart();
    renderScene();
  })
  .catch(error => {

    console.error(
      "Error loading cars_clean.csv:",
      error
    );

    d3.select("#scene-description")
      .text(
        "The vehicle dataset could not be loaded."
      );
  });


// ============================================================
// STEP 9 — BASE SCATTERPLOT
// ============================================================

function initializeChart() {

  svg.selectAll("*").remove();


  // ----------------------------------------------------------
  // Scales
  // ----------------------------------------------------------

  xScale = d3.scaleLinear()
    .domain(
      d3.extent(
        data,
        d => d.battery_capacity_kWh
      )
    )
    .nice()
    .range([
      margin.left,
      width - margin.right
    ]);


  yScale = d3.scaleLinear()
    .domain(
      d3.extent(
        data,
        d => d.range_km
      )
    )
    .nice()
    .range([
      height - margin.bottom,
      margin.top
    ]);


  // ----------------------------------------------------------
  // X Axis
  // ----------------------------------------------------------

  svg.append("g")
    .attr("class", "axis")
    .attr(
      "transform",
      `translate(0,${height - margin.bottom})`
    )
    .call(
      d3.axisBottom(xScale)
        .ticks(8)
    );


  // ----------------------------------------------------------
  // Y Axis
  // ----------------------------------------------------------

  svg.append("g")
    .attr("class", "axis")
    .attr(
      "transform",
      `translate(${margin.left},0)`
    )
    .call(
      d3.axisLeft(yScale)
        .ticks(7)
    );


  // ----------------------------------------------------------
  // Axis Labels
  // ----------------------------------------------------------

  svg.append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", height - 12)
    .attr("text-anchor", "middle")
    .text("Battery Capacity (kWh)");


  svg.append("text")
    .attr("class", "axis-label")
    .attr(
      "transform",
      "rotate(-90)"
    )
    .attr("x", -height / 2)
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .text("Driving Range (km)");


  // Layers are separated so annotations always stay above data.
  trendLayer =
    svg.append("g")
      .attr("class", "trend-layer");

  pointsLayer =
    svg.append("g")
      .attr("class", "points-layer");

  annotationLayer =
    svg.append("g")
      .attr("class", "annotation-layer");


  // ----------------------------------------------------------
  // Data Points
  // ----------------------------------------------------------

  pointsLayer
    .selectAll("circle")
    .data(
      data,
      d =>
        `${d.brand}-${d.model}-${d.battery_capacity_kWh}-${d.range_km}`
    )
    .join("circle")
    .attr("class", "data-point")
    .attr(
      "cx",
      d => xScale(d.battery_capacity_kWh)
    )
    .attr(
      "cy",
      d => yScale(d.range_km)
    )
    .attr("r", 4)

    // Tooltip triggers exist now,
    // but only work after Explore is enabled.
    .on("mouseover", showTooltip)
    .on("mousemove", moveTooltip)
    .on("mouseout", hideTooltip);
}


// ============================================================
// SCENE CONTROLLER
// ============================================================

function renderScene() {

  tooltip.style("display", "none");

  trendLayer
    .selectAll("*")
    .remove();

  annotationLayer
    .selectAll("*")
    .remove();


  if (state.scene === 1) {

    renderScene1();

  } else if (state.scene === 2) {

    renderScene2();

  } else if (state.scene === 3) {

    renderScene3();
  }


  updateNavigation();
}


// ============================================================
// STEP 10 — SCENE 1
// EV Driving Range Varies Widely
// ============================================================

function renderScene1() {

  setSceneText(
    "EV Driving Range Varies Widely",

    "Electric vehicles differ substantially in both battery capacity and driving range.",

    "Click Next to see one of the strongest factors associated with driving range."
  );


  // Display every EV normally.
  pointsLayer
    .selectAll("circle")
    .transition()
    .duration(600)
    .attr("r", 4)
    .attr("opacity", 0.55)
    .attr("fill", "#4c78a8")
    .attr("stroke", "white")
    .attr("stroke-width", 0.7);


  const maxRangeVehicle =
    d3.greatest(
      data,
      d => d.range_km
    );

  const minRange =
    d3.min(
      data,
      d => d.range_km
    );

  const maxRange =
    d3.max(
      data,
      d => d.range_km
    );


  addCallout({
    boxX: 85,
    boxY: 45,
    boxWidth: 290,

    targetX:
      xScale(
        maxRangeVehicle.battery_capacity_kWh
      ),

    targetY:
      yScale(
        maxRangeVehicle.range_km
      ),

    title:
      "EV ranges vary widely",

    lines: [
      `Driving range spans from ${minRange} km`,
      `to ${maxRange} km in this dataset.`
    ]
  });
}


// ============================================================
// STEP 11 — SCENE 2
// Bigger Batteries Generally Mean Longer Range
// ============================================================

function renderScene2() {

  setSceneText(
    "Larger Batteries Generally Mean Longer Range",

    "Battery capacity is strongly associated with how far an electric vehicle can travel on a full charge.",

    "Notice the upward pattern from smaller batteries toward longer-range EVs."
  );


  pointsLayer
    .selectAll("circle")
    .transition()
    .duration(600)
    .attr("r", 4)
    .attr("opacity", 0.42)
    .attr("fill", "#4c78a8")
    .attr("stroke", "white")
    .attr("stroke-width", 0.7);


  // ----------------------------------------------------------
  // Simple Linear Trend Line
  // ----------------------------------------------------------

  const regression =
    calculateRegression(data);

  const xDomain =
    xScale.domain();

  const x1 =
    xDomain[0];

  const x2 =
    xDomain[1];


  trendLayer
    .append("line")
    .attr("class", "trend-line")
    .attr("x1", xScale(x1))
    .attr(
      "y1",
      yScale(
        regression(x1)
      )
    )
    .attr("x2", xScale(x1))
    .attr(
      "y2",
      yScale(
        regression(x1)
      )
    )
    .transition()
    .duration(800)
    .attr("x2", xScale(x2))
    .attr(
      "y2",
      yScale(
        regression(x2)
      )
    );


  const targetBattery =
    105;

  const targetRange =
    regression(targetBattery);


  addCallout({
    boxX: 80,
    boxY: 45,
    boxWidth: 325,

    targetX:
      xScale(targetBattery),

    targetY:
      yScale(targetRange),

    title:
      "Larger batteries support longer range",

    lines: [
      "The overall scatterplot shows a clear",
      "positive relationship between battery size and range."
    ]
  });
}


// ============================================================
// STEP 12 — SCENE 3
// Battery Size Is Not the Whole Story
// ============================================================

function renderScene3() {

  setSceneText(
    "Battery Size Is Not the Whole Story",

    "EVs with the same battery capacity can still have very different driving ranges.",

    state.explorationEnabled
      ? "Hover over any vehicle to view its specifications."
      : "Compare the highlighted vehicles, then click Explore the Data."
  );


  const buzz =
    data.find(d =>
      d.brand === "Volkswagen" &&
      d.model === "ID. Buzz LWB Pro"
    );


  const id7 =
    data.find(d =>
      d.brand === "Volkswagen" &&
      d.model === "ID.7 Pro S"
    );


  // Highlight the two comparison vehicles and fade all others.
  pointsLayer
    .selectAll("circle")
    .interrupt()
    .transition()
    .duration(600)
  
    .attr(
      "r",
      d => (d === buzz || d === id7) ? 7 : 3.5
    )
  
    .style(
      "opacity",
      d => {
        if (d === buzz || d === id7) {
          return 1;
        }
  
        return state.explorationEnabled
          ? 0.50
          : 0.10;
      }
    )
  
    .style(
      "fill",
      d => {
        // ID. Buzz = orange
        if (d === buzz) {
          return "#e67e22";
        }
  
        // ID.7 = teal
        if (d === id7) {
          return "#00897b";
        }
  
        return "#4c78a8";
      }
    )
  
    .style(
      "stroke",
      d => (d === buzz || d === id7)
        ? "#333"
        : "white"
    )
  
    .style(
      "stroke-width",
      d => (d === buzz || d === id7)
        ? "1.5px"
        : "0.7px"
    );
  
  
  if (buzz && id7) {
    addComparisonAnnotation(
      buzz,
      id7
    );
  }
}

// ============================================================
// STEP 13 — FREE EXPLORATION
// ============================================================

function enableExploration() {

  state.explorationEnabled = true;

  renderScene();
}


// ============================================================
// STEP 14 — PARAMETERS + TRIGGERS
// ============================================================


// Next button
d3.select("#next")
  .on("click", () => {

    if (
      state.scene <
      state.totalScenes
    ) {

      state.scene += 1;

      state.explorationEnabled =
        false;

      renderScene();
    }
  });


// Previous button
d3.select("#previous")
  .on("click", () => {

    if (state.scene > 1) {

      state.scene -= 1;

      state.explorationEnabled =
        false;

      renderScene();
    }
  });


// Explore button
d3.select("#explore-button")
  .on(
    "click",
    enableExploration
  );


// ============================================================
// Navigation / Affordances
// ============================================================

function updateNavigation() {

  d3.select("#scene-number")
    .text(
      `Scene ${state.scene} of ${state.totalScenes}`
    );

  d3.select("#progress")
    .text(
      `Scene ${state.scene} of ${state.totalScenes}`
    );


  d3.select("#previous")
    .property(
      "disabled",
      state.scene === 1
    );


  d3.select("#next")
    .property(
      "disabled",
      state.scene ===
        state.totalScenes
    );


  // Explore button only appears in Scene 3.
  d3.select("#explore-section")
    .classed(
      "hidden",
      state.scene !== 3
    );


  d3.select("#explore-button")
    .property(
      "disabled",
      state.explorationEnabled
    )
    .text(
      state.explorationEnabled
        ? "Exploration Enabled"
        : "Explore the Data"
    );


  pointsLayer
    .selectAll("circle")
    .style(
      "cursor",
      state.explorationEnabled
        ? "pointer"
        : "default"
    );
}


// ============================================================
// Scene Text
// ============================================================

function setSceneText(
  title,
  description,
  hint
) {

  d3.select("#scene-title")
    .text(title);

  d3.select("#scene-description")
    .text(description);

  d3.select("#interaction-hint")
    .text(hint);
}


// ============================================================
// Annotation Helper
// ============================================================

function addCallout({
  boxX,
  boxY,
  boxWidth,
  targetX,
  targetY,
  title,
  lines
}) {

  const boxHeight =
    48 + lines.length * 18;


  annotationLayer
    .append("line")
    .attr(
      "class",
      "annotation-line"
    )
    .attr("x1", boxX + boxWidth)
    .attr(
      "y1",
      boxY + boxHeight / 2
    )
    .attr("x2", targetX)
    .attr("y2", targetY);


  annotationLayer
    .append("circle")
    .attr(
      "class",
      "annotation-target"
    )
    .attr("cx", targetX)
    .attr("cy", targetY)
    .attr("r", 4);


  const annotation =
    annotationLayer
      .append("g")
      .attr(
        "class",
        "annotation-panel"
      )
      .attr(
        "transform",
        `translate(${boxX},${boxY})`
      );


  annotation
    .append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 5)
    .style("fill", "white")
    .style("stroke", "#aaa")
    .style("stroke-width", "1px");


  annotation
    .append("text")
    .attr(
      "class",
      "annotation-title"
    )
    .attr("x", 12)
    .attr("y", 22)
    .text(title);


  lines.forEach(
    (line, index) => {

      annotation
        .append("text")
        .attr(
          "class",
          "annotation-text"
        )
        .attr("x", 12)
        .attr(
          "y",
          44 + index * 18
        )
        .text(line);
    }
  );
}


// ============================================================
// Scene 3 Comparison Annotation
// ============================================================

function addComparisonAnnotation(
  buzz,
  id7
) {

  const boxX =
    80;

  const boxY =
    35;

  const boxWidth =
    355;

  const boxHeight =
    100;


  const buzzX =
    xScale(
      buzz.battery_capacity_kWh
    );

  const buzzY =
    yScale(
      buzz.range_km
    );

  const id7X =
    xScale(
      id7.battery_capacity_kWh
    );

  const id7Y =
    yScale(
      id7.range_km
    );


  // Leader line to ID. Buzz
  annotationLayer
    .append("line")
    .attr("class", "annotation-line")
    .attr("x1", boxX + boxWidth)
    .attr("y1", boxY + 60)
    .attr("x2", buzzX)
    .attr("y2", buzzY)
    .attr("stroke", "#e67e22")
    .attr("stroke-width", 2);


  // Leader line to ID.7
  annotationLayer
    .append("line")
    .attr("class", "annotation-line")
    .attr("x1", boxX + boxWidth)
    .attr("y1", boxY + 35)
    .attr("x2", id7X)
    .attr("y2", id7Y)
    .attr("stroke", "#00897b")
    .attr("stroke-width", 2);


  const annotation =
    annotationLayer
      .append("g")
      .attr(
        "class",
        "annotation-panel"
      )
      .attr(
        "transform",
        `translate(${boxX},${boxY})`
      );


  annotation
    .append("rect")
    .attr("width", boxWidth)
    .attr("height", boxHeight)
    .attr("rx", 5)
    .style("fill", "white")
    .style("stroke", "#aaa")
    .style("stroke-width", "1px");


  annotation
    .append("text")
    .attr(
      "class",
      "annotation-title"
    )
    .attr("x", 12)
    .attr("y", 22)
    .text(
      "Same 86 kWh battery, very different range"
    );


  annotation
    .append("text")
    .attr(
      "class",
      "annotation-text"
    )
    .attr("x", 12)
    .attr("y", 45)
    .text(
      "ID. Buzz LWB Pro: 190 Wh/km → 370 km"
    );


  annotation
    .append("text")
    .attr(
      "class",
      "annotation-text"
    )
    .attr("x", 12)
    .attr("y", 64)
    .text(
      "ID.7 Pro S: 133 Wh/km → 525 km"
    );


  annotation
    .append("text")
    .attr(
      "class",
      "annotation-text"
    )
    .attr("x", 12)
    .attr("y", 83)
    .text(
      "Lower Wh/km means better energy efficiency."
    );
}


// ============================================================
// Linear Regression
// ============================================================

function calculateRegression(values) {

  const meanX =
    d3.mean(
      values,
      d => d.battery_capacity_kWh
    );

  const meanY =
    d3.mean(
      values,
      d => d.range_km
    );


  const numerator =
    d3.sum(
      values,
      d =>
        (d.battery_capacity_kWh - meanX) *
        (d.range_km - meanY)
    );


  const denominator =
    d3.sum(
      values,
      d =>
        Math.pow(
          d.battery_capacity_kWh - meanX,
          2
        )
    );


  const slope =
    numerator / denominator;

  const intercept =
    meanY - slope * meanX;


  return x =>
    slope * x + intercept;
}


// ============================================================
// Tooltip
// ============================================================

function showTooltip(
  event,
  d
) {

  if (
    !state.explorationEnabled
  ) {
    return;
  }


  const fastCharging =
    d.fast_charging_power_kw_dc === null
      ? "N/A"
      : `${d.fast_charging_power_kw_dc} kW`;


  tooltip
    .style("display", "block")
    .html(`
      <strong>${d.brand} ${d.model}</strong><br><br>

      Battery Capacity:
      ${d.battery_capacity_kWh} kWh<br>

      Driving Range:
      ${d.range_km} km<br>

      Efficiency:
      ${d.efficiency_wh_per_km} Wh/km<br>

      Drivetrain:
      ${d.drivetrain}<br>

      Body Type:
      ${d.car_body_type}<br>

      Top Speed:
      ${d.top_speed_kmh} km/h<br>

      0–100 km/h:
      ${d.acceleration_0_100_s} s<br>

      Fast Charging:
      ${fastCharging}
    `);

  moveTooltip(
    event,
    d
  );
}


function moveTooltip(event) {

  if (
    !state.explorationEnabled
  ) {
    return;
  }

  tooltip
    .style(
      "left",
      `${event.pageX + 14}px`
    )
    .style(
      "top",
      `${event.pageY + 14}px`
    );
}


function hideTooltip() {

  tooltip
    .style("display", "none");
}
