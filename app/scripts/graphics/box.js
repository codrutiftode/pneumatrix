/* Created: 09.05.2020, Codrin Iftode
Contains the graphics "box" namespace */

/* Global letiables for this module */
// Dragging a box with the mouse
graphics.box.mousePressed = false;
graphics.box.mousePosition = {"x":-1, "y":-1};
graphics.box.currentlyDraggedBox = null;

// Pneumatic dimensions
graphics.box.pneumaticWidth = "120";
graphics.box.pneumaticHeight = "60";


// Global template for a pneumatic tool object
graphics.box.pneumaticObjectTemplate = `
<div class="endpoints">
{toolEndpoints}
</div>
<div class="actuators">
{toolActuatorLeft}
{toolActuatorRight}
</div>
<img class="pneumatic" draggable="false" ondragstart="event.preventDefault();" src="{toolImage}" style="width: {pneumaticWidth}px; height: {pneumaticHeight}px;"
onmousedown="graphics.box.boxMouseDown(this);" onmouseup="graphics.box.boxMouseUp(this); graphics.box.boxReleased(this);"
oncontextmenu="graphics.box.pneumaticRightClick(this); graphics.box.boxReleased(this); graphics.box.boxMouseUp(this); return false;">
`;

// Global template for a pneumatic tool endpoint
graphics.box.pneumaticEndpointTemplate = `
<div id="{endpointID}" class="endpoint {extraClass}" style="transform: translate({endpointX}px, {endpointY}px)"
location="{endpointLocation}" onmousedown="graphics.endpoints.endpointDown(this);" {actuatorEndpointNewState}></div>
`;

// Mouse click listeners for each box
graphics.box.boxMouseDown = function(box)
{
	graphics.box.mousePressed = true;
	graphics.box.mousePosition = {'x': event.clientX, 'y': event.clientY};
	graphics.box.currentlyDraggedBox = box;

	// Hide possible endpoints
	graphics.endpoints.showEndpoints(box, false);
}
graphics.box.boxMouseUp = function(box)
{
	graphics.box.mousePressed = false;
	graphics.box.currentlyDraggedBox = null;

	// Show possible endpoints
	graphics.endpoints.showEndpoints(box, true);
}

// Drags a box around if the mouse is dragging it
graphics.box.boxDragged = function(box)
{
	// Release box if mouse is not out of canvas bounds
	if (!graphics.structure.mouseInsideCanvas(event.clientX, event.clientY))
	{
		graphics.box.boxMouseUp(box);
		graphics.box.boxReleased(box);
	}

	// Calculate the change in the mouse position
	let deltaX = event.clientX - graphics.box.mousePosition.x;
	let deltaY = event.clientY - graphics.box.mousePosition.y;
	graphics.box.mousePosition.x = event.clientX;
	graphics.box.mousePosition.y = event.clientY;

	// Update the box transform
	// debugger;
	let oldTransform = breakTransform(box.style.transform);
	let x = oldTransform.x + deltaX;
	let y = oldTransform.y + deltaY;

	// Test for box being out of bounds
	if (!graphics.structure.insideCanvas(x, y, parseInt(graphics.box.pneumaticWidth), parseInt(graphics.box.pneumaticHeight)))
		return;

	// Update the transform
	let newTranform = "translate(" + x + "px," + y + "px)";
	box.style.transform = newTranform;

	// Get all associated paths
	let associatedPaths = graphics.paths.getAllPaths(box.getAttribute("id"));

	// Move all the associated paths connected to the box
	for (let i = 0; i < associatedPaths.length; i++)
	{
		graphics.paths.movePath(associatedPaths[i], box.getAttribute("id"), deltaX, deltaY);
	}

	// Move actuators
	let actuators = box.parentNode.querySelector(".actuators");
	if (actuators != undefined)
		actuators.style.transform = box.style.transform;

	// Move extra components
	let components = box.parentNode.querySelector(".extraComponents");
	if (components != undefined)
		components.style.transform = box.style.transform;
}


// Called when a pneumatic box is released
graphics.box.boxReleased = function(box)
{
	// Get current position using a regular expression
	let tranformCoords = breakTransform(box.style.transform);
	let transformX = tranformCoords.x;

	// Move endpoints to the new position
	// Get endpoints
	let endpointsContainer = box.parentNode.querySelector(".endpoints");
	if (game.getBoxAttrib(box.id, "state") == game.stateLeft && game.getBoxAttrib(box.id, "actuable"))
	{
		endpointsContainer.style.transform = moveTransform(box.style.transform, - (parseInt(graphics.box.pneumaticWidth) / 2), 0);
	}
	else
	{
		endpointsContainer.style.transform = box.style.transform;
	}

	// If the current position is over the toolbox, erase current container and connections
	let toolboxWidth = parseInt(document.getElementById("toolbox").offsetWidth);
	if (transformX <= toolboxWidth)
	{
		// Remove associated paths from DOM
		graphics.paths.deleteAllPathsDOM(box.getAttribute('id'));

		// Erase current container for the box
		document.getElementById("canvas").removeChild(box.parentNode);

		// Remove pneumatic from GOM
		game.deleteBox(box.getAttribute("id"));
	}
}

// Pneumatic image on right click listener
graphics.box.pneumaticRightClick = function(currentImage)
{
	// Add extra buttons for different boxes
	let boxType = game.getBoxAttrib(currentImage.id, "type");
	contextmenu.updateSelf(boxType);

	// Show right click menu
	let rightClickMenu = document.getElementById("rightClickMenu");
	rightClickMenu.style.opacity = "1";
	rightClickMenu.style.pointerEvents = "all";

	// Position the menu
	rightClickMenu.style.transform = "translate(" + event.clientX + "px, " + event.clientY + "px)";

	// Emplace the current pneumatic type
	document.getElementById("currentPneumaticType").innerHTML = beautifyPneumaticType(boxType);

	// Save the current pneumatic id
	rightClickMenu.querySelector("p").innerHTML = currentImage.id;
}

// Moves a box programmatically (NOTE: does not check for out of bounds)
graphics.box.moveBox = function(box, dx, dy)
{
	box.style.transform = moveTransform(box.style.transform, dx, dy);

	// Move paths
	let associatedPaths = graphics.paths.getAllPaths(box.getAttribute("id"));
	for (let i = 0; i < associatedPaths.length; i++)
	{
		graphics.paths.movePath(associatedPaths[i], box.getAttribute("id"), dx, dy);
	}

	// Move actuators
	let actuators = box.parentNode.querySelector(".actuators");
	if (actuators != undefined)
		actuators.style.transform = box.style.transform;

	// Move extra components
	let components = box.parentNode.querySelector(".extraComponents");
	if (components != undefined)
		components.style.transform = box.style.transform;

	// Move endpoints
	let endpointsContainer = box.parentNode.querySelector(".endpoints");
	if (game.getBoxAttrib(box.id, "state") == game.stateLeft && game.getBoxAttrib(box.id, "actuable"))
	{
		endpointsContainer.style.transform = moveTransform(box.style.transform, - (parseInt(graphics.box.pneumaticWidth) / 2), 0);
	}
	else
	{
		endpointsContainer.style.transform = box.style.transform;
	}
}

// Adds the json endpoints to the required spots in the toolbox symbol html string
graphics.box.addEndpointsToHTML = function(endpointsJSON, htmlString)
{
	// Go through each endpoint in json
	let endpoint;
	let endpointsString = "";
	let currentHtml = "";
	for (let i = 0; i < endpointsJSON.length; i++)
	{
		// Subtract endpoint dimensions
		endpoint = endpointsJSON[i];

		// New endpoint
		currentHtml = graphics.box.pneumaticEndpointTemplate.replace(/{endpointID}/g, "endpoint" + game.endpointCounter);
		currentHtml = currentHtml.replace(/{endpointX}/g, endpoint.x);
		currentHtml = currentHtml.replace(/{endpointY}/g, endpoint.y);
		currentHtml = currentHtml.replace(/{endpointLocation}/g, endpoint.location);

		// Handle 52valve actuator endpoints
		if (endpoint.extraClass != undefined)
		{
			currentHtml = currentHtml.replace(/{extraClass}/, endpoint.extraClass);
			currentHtml = currentHtml.replace(/{actuatorEndpointNewState}/, 'newstate="' + endpoint.newState + '"');
		}
		else
		{
			currentHtml = currentHtml.replace(/{extraClass}/, "");
			currentHtml = currentHtml.replace(/{actuatorEndpointNewState}/, "");
		}
		endpointsString += currentHtml + "\n";

		// Increment the global endpoint counter
		game.endpointCounter++;
	}

	// Place the endpoints html into the box html and return the whole thing
	return htmlString.replace(/{toolEndpoints}/g, endpointsString);
}

// Adds the html actuators to the pneumatic box html
graphics.box.addActuatorsToHTML = function(actuatorsDict, htmlString)
{
	// Calculate replacements for left and right side
	let left;
	let right;
	if (actuatorsDict == undefined)
	{
		left = "";
		right = "";
	}
	else
	{
		left = actuatorsDict.left;
		right = actuatorsDict.right;
	}

	// Replace the two placeholders
	htmlString = htmlString.replace(/{toolActuatorLeft}/g, left);
	htmlString = htmlString.replace(/{toolActuatorRight}/g, right);
	return htmlString;
}

// Add extra components to the pneumatic box html
graphics.box.addExtraToHTML = function(toolName, tool)
{
	if (toolName == "52valve" || toolName == "CylinderRight" || toolName == "CylinderLeft" || toolName == "FlowRestrictor")
	{
		// Add extra components class
		let extraClass = document.createElement("div");
		extraClass.setAttribute("class", "extraComponents");

		// Add extra components
		for (let extraComponentConf of VALVE_EXTRA[toolName])
		{
			let type = extraComponentConf.type;
			let extraComponent = document.createElement(type);
			if (type == "img")
			{
				extraComponent.setAttribute("src", extraComponentConf.src);
				extraComponent.setAttribute("draggable", false);
			}
			else if (type == "input") {}

			// Add transform
			extraComponent.style.transform = extraComponentConf.transform;

			// Add extra attributes if any
			let extraAttributes = extraComponentConf.extraAttributes;
			if (extraAttributes != undefined)
			{
				for (let i = 0; i < extraAttributes.length; i++)
				{
					extraComponent.setAttribute(extraAttributes[i].attribute, extraAttributes[i].value);
				}
			}

			// Append components container to tool
			extraClass.appendChild(extraComponent);
			tool.appendChild(extraClass);
		}

		// Position the extra class
		tool.querySelector(".extraComponents").style.transform = tool.querySelector("img.pneumatic").style.transform;
	}
}

// Event handler for flow restrictor dial change
graphics.box.restrictorDialChange = function(dialInput)
{
	let box = dialInput.parentNode.parentNode.querySelector("img.pneumatic");
	game.setBoxAttrib(box.id, "dialValue", parseFloat(dialInput.value));
}

// Creates a tool from a toolbox symbol and starts moving it
graphics.box.createTool = function(toolName, toolImage, toolActuatorsStr)
{
	// Get data
	let valveEndpoints = graphics.endpoints.getEndpointsFor(toolName);
	let valveActuators;
	if (toolActuatorsStr != 'undefined')
		valveActuators = graphics.actuators.getActuatorsFrom(toolActuatorsStr);

	// Create custom tool
	let tool = document.createElement("div");

	// Calculate starting coordinates for the pneumatic box
	let width = parseInt(graphics.box.pneumaticWidth, 10);
	let height = parseInt(graphics.box.pneumaticHeight, 10);
	let startX = event.clientX - width / 2;
	let startY = event.clientY - height / 2;

	// Create custom inner html
	let customHtml = graphics.box.pneumaticObjectTemplate.replace("{toolImage}", toolImage);
	customHtml = customHtml.replace("{pneumaticWidth}", graphics.box.pneumaticWidth);
	customHtml = customHtml.replace("{pneumaticHeight}",graphics.box.pneumaticHeight);

	// Create and add all the pneumatic endpoints, using x = imageX and y = imageY
	customHtml = graphics.box.addEndpointsToHTML(valveEndpoints, customHtml);
	if (toolActuatorsStr != 'undefined')
		customHtml = graphics.box.addActuatorsToHTML(valveActuators, customHtml);

	// Put the customHTML into the DOM
	tool.innerHTML = customHtml;

	// Move the pneumatic box to its desired starting coordinates
	tool.querySelector("img.pneumatic").style.transform = "translate(" + startX + "px," + startY + "px)";

	// Set the ID of the pneumatic box image
	tool.querySelector("img.pneumatic").setAttribute("id", "pneumatic" + game.pneumaticBoxesCounter.toString());
	game.pneumaticBoxesCounter++;

	// Append tool to the canvas
	document.getElementById("canvas").appendChild(tool);

	// Add extra components if any
	graphics.box.addExtraToHTML(toolName, tool);

	// Move actuators container or remove if no actuators
	let actuators = tool.querySelector("img.pneumatic").parentNode.querySelector(".actuators");
	if (toolActuatorsStr != 'undefined')
		actuators.style.transform = tool.querySelector("img.pneumatic").style.transform;
	else
		actuators.parentNode.removeChild(actuators);

	// Create tool in the GOM
	game.createBox(tool.querySelector("img.pneumatic").getAttribute("id"), toolName);

	// Start dragging the new pneumatic box
	graphics.box.boxMouseDown(tool.querySelector("img.pneumatic"));
}
