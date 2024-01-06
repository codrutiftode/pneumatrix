/*
Created: 08.05.2020, Codrin Iftode
Contains a namespace called "contextmenu" and in it,
functions to handle the context menu which opens
when a pneumatic box is right clicked.
*/

// Global namespace
let contextmenu = {};

// Updates itself, adding and removing buttons based on box type
contextmenu.updateSelf = function (boxType) {
  // Clear previous extra buttons
  let extra = document.getElementById("rightClickExtra");
  while (extra.children.length != 0) {
    extra.removeChild(extra.children[0]);
  }

  // Add buttons based on box type
  if (boxType == "FlowRestrictor") {
    contextmenu.addButton(extra, "Flip X", transformer.flipX);
  }
};

// Creates a new button for the context menu
contextmenu.addButton = function (extraSection, label, callback) {
  let btn = document.createElement("h4");
  extraSection.appendChild(btn);

  // Set button attributes
  btn.innerHTML = label;
  btn.onmousedown = callback;
};

// Remove button click listener
contextmenu.removeClicked = function () {
  // Get pneumatic box using a hidden DOM paragraph with the current id
  let pneumaticId = document.getElementById("currentPneumaticId").innerHTML;
  let pneumatic = document.getElementById(pneumaticId);

  // Remove associated paths from DOM
  graphics.paths.deleteAllPathsDOM(pneumaticId);

  // Remove pneumatic from DOM
  pneumatic.parentNode.parentNode.removeChild(pneumatic.parentNode);

  // Remove pneumatic from GOM
  game.deleteBox(pneumatic.getAttribute("id"));
};

// Rotate CW button click listener
contextmenu.rotateCWClicked = function () {
  // Get pneumatic box using a hidden DOM paragraph with the current id
  let pneumaticId = document.getElementById("currentPneumaticId").innerHTML;
  let pneumatic = document.getElementById(pneumaticId);

  // Remove all paths
  let pathIDs = game.getPathsForBox(pneumaticId);
  for (let pathID of pathIDs) {
    // Remove path
    let path = document.getElementById(pathID);
    graphics.paths.pathClicked(path, true);
  }

  // Change pneumatic box image source (requires creating resources for each rotation angle)
  let rotationAngle = getRotationAngleFromSRC(pneumatic.src);
  rotationAngle = (rotationAngle + 90) % 360;
  pneumatic.src = getRotatedSRC(pneumatic.src, rotationAngle);

  // Swap pneumatic box width and height
  let pWidth = pneumatic.style.width;
  let pHeight = pneumatic.style.height;
  pneumatic.style.width = pHeight;
  pneumatic.style.height = pWidth;

  // Swap actuators div width and height
  let actuatorsDiv = pneumatic.parentNode.querySelector(".actuators");
  actuatorsDiv.style.width = pHeight;
  actuatorsDiv.style.height = pWidth;

  // Change left actuator transform: swap translate coords, add rotateZ(90deg)
  let actuators = actuatorsDiv.children;
  for (let i = 0; i < actuators.length; i++) {
    let actuatorTransform = breakTransform(actuators[i].style.transform);
    let actuatorX = actuatorTransform.y;
    let actuatorY = actuatorTransform.x;
    actuators[i].style.transform =
      "translate(" +
      actuatorX +
      "px, " +
      actuatorY +
      "px) rotate(" +
      (i == 0 ? 90 : -90) +
      "deg)";
  }

  // Change right actuator transform: swap translate coords, add rotateZ(-90deg)

  // Change transform of endpoints as follows:
  // - for x endpoints
  // 		- if y is 60px turn it to -10px, and if it is -10 turn it to 60
  // 		- swap x and y
  let mat90 = [
    [0, -1],
    [1, 0],
  ];
  let endpoints = pneumatic.parentNode.querySelectorAll(".endpoint");
  for (let endpoint of endpoints) {
    let transform = breakTransform(endpoint.style.transform);
    let x = mat90[0][0] * transform.x + mat90[0][1] * transform.y;
    let y = mat90[1][0] * transform.x + mat90[1][1] * transform.y;
    x = x - 10 + 60;
    endpoint.style.transform = "translate(" + x + "px, " + y + "px)";

    // Change location of endpoints from x to y and viceversa
    endpoint.setAttribute(
      "location",
      endpoint.getAttribute("location") == "x" ? "y" : "x"
    );
  }
};

// Rotate ACW button click listener
contextmenu.rotateACWClicked = function () {};

// Shortcut to hide the right click menu
contextmenu.hideRightClickMenu = function () {
  let rightClickMenu = document.getElementById("rightClickMenu");
  rightClickMenu.style.opacity = "0";
  rightClickMenu.style.pointerEvents = "none";
};
