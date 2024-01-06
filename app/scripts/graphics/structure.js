/* Created: 09.05.2020, Codrin Iftode
Contains the graphics "structure" namespace */

/* Global letiables for this module */
// No. vertical segments on the main air line
graphics.structure.noVerticalSegments = Number(localStorage.settings_simulation_ma_endpoints || DEFAULT_SETTINGS.simulation.ma_endpoints);
graphics.structure.canvasCorners = {};

// Structure constants
graphics.structure.PNEUM_VERSION = "1.1";
graphics.structure.TOOLBOX_PADDING = 4;

// Global template for a pneumatic toolbox symbol
graphics.structure.toolboxSymbolTemplate = `
<div id="{toolName}-container" class="tool {toolDisabled}">
	<div id="{toolName}-imageContainer" class="toolContainer">
		{toolActuatorLeft}
		<img draggable="false" src="{toolImage}" class="toolSymbol" ondragstart="event.preventDefault();"
		onmousedown="{onMouseDown}">
		{toolActuatorRight}
	</div>
	<p id="{toolName}-description">
		{toolDescription}
	</p>
</div>`;

// Creates a new DOM element using the tool data provided and a template
// NOTE: if toolDescription == "DISABLED", then the symbol appears in the box, but is not interactible
graphics.structure.createToolboxSymbol = function(toolName, toolDescription, toolImage, toolActuators, toolDisabled)
{
	let newSymbol = document.createElement("div");
	graphics.structure.toolboxSymbolTemplate = graphics.structure.toolboxSymbolTemplate.trim(); // Remove any leading or ending whitespaces

	// Create custom html
	let customHtml = graphics.structure.toolboxSymbolTemplate;

	// Replace onMouseDown/toolDisabled FIRST, because it may contain further regexes
	let onMouseDown;
	let toolDisabledClass;
	if (toolDisabled) 
	{
		onMouseDown = "";
		toolDisabledClass = "tool-disabled";
	}
	else
	{ 
		onMouseDown = "graphics.box.createTool('{toolName}', '{toolImage}', '{toolActuators}')";
		toolDisabledClass = "";
	}
	customHtml = customHtml.replace(/{onMouseDown}/g, onMouseDown);
	customHtml = customHtml.replace(/{toolDisabled}/g, toolDisabledClass);
	
	// Replace other parameters
	customHtml = customHtml.replace(/{toolName}/g, toolName);
	customHtml = customHtml.replace(/{toolDescription}/g, toolDescription);
	customHtml = customHtml.replace(/{toolImage}/g, toolImage);
	customHtml = customHtml.replace(/{toolActuators}/g, toolActuators);


	// Append actuators
	let actuators = undefined;
	if (toolActuators != undefined)
		actuators = graphics.actuators.getActuatorsFrom(toolActuators, true);

	customHtml = graphics.box.addActuatorsToHTML(actuators, customHtml);

	// Emplace custom html
	newSymbol.innerHTML = customHtml;

	// Make the newSymbol a child of the toolbox
	document.querySelector("#toolbox-body .toolbox-symbols").appendChild(newSymbol);
}

// Resizes the main air supply line to fit the width of the container
graphics.structure.resizeMainAirLine = function()
{
	// Calculate new width
	let mainAirSupplyLine = document.getElementById("mainAirSupplyLine");
	let mainAirSymbolWidth = document.getElementById("mainAirSupply").offsetWidth;
	let newWidth = document.getElementById("mainAir").offsetWidth - mainAirSymbolWidth;

	// Set the new width of the air line container and the air line itself
	mainAirSupplyLine.setAttribute("width", newWidth);
	mainAirSupplyLine.querySelector("#canvas_background").setAttribute("width", newWidth);

	// Change the x-coordinates of the array of segments composing the main air line
	let segments = document.getElementById("mainAirSupplyLine").children[1];
	for (let i = 1; i <= graphics.structure.noVerticalSegments; i++)
	{
		// Change the x1 and x2 attributes
		let currentSegment = segments.querySelector("#svg_" + i.toString());
		let newPos = (newWidth / (graphics.structure.noVerticalSegments + 1)) * i;
		currentSegment.setAttribute("x1", newPos.toString());
		currentSegment.setAttribute("x2", newPos.toString());

		// Change the transform of the corresponding endpoint
		let currentEndpoint = document.getElementById("mainAirEndpoint" + i.toString());
		let segmentRect = currentSegment.getBoundingClientRect();
		currentEndpoint.style.transform = "translate(" + Math.round(mainAirSymbolWidth + newPos - 5) + "px, -10px)";
	}

	// Change the length of the horizontal segment of the line
	segments.querySelector("#svg_0").setAttribute("x2", newWidth);
}

// Change the number of main air endpoints
graphics.structure.setMainAirLength = function(noEndpoints, warning = false)
{
	// Display warning
	let mainAirEndpoints = document.querySelector("#mainAir .endpoints");
	if (warning)
	{
		let shouldWarn = false;
		for (let endpoint of mainAirEndpoints.children)
		{
			if (game.canvas.mainAir.isEndpointConnected(endpoint.id))
			{
				shouldWarn = true;
				break;
			}
		}

		// If any main air endpoints are connected
		if (shouldWarn)
		{
			let res = confirm("The current pipes connected to main air will be removed. Continue?");
			if (!res) return;
			else
			{
				let path;
				for (let endpoint of mainAirEndpoints.children)
				{
					path = document.getElementById(game.getPathForEndpoint(endpoint.id));
					if (path != null)
					{
						graphics.paths.pathClicked(path, true);
					}
				}
			}
		}
	}

	// Delete all previous svg lines
	let mainAirSvg = document.getElementById("mainAirSupplyLine").children[1];
	let svgLines = mainAirSvg.getElementsByTagName("line");
	for (let i = svgLines.length - 1; i >= 0; i--)
	{
		svgLines[i].parentNode.removeChild(svgLines[i]);
	}

	// Generate new lines
	for (let i = 0; i <= noEndpoints; i++)
	{
		let svgLineHTML = '<line id="svg_' + i + '"  stroke-linecap="null" stroke-linejoin="null" y2="' + (i == 0 ? 30 : 0) + '" x2="0" y1="30" x1="0" fill-opacity="null" stroke-opacity="null" stroke-width="2" stroke="#000" fill="none"/>'
		mainAirSvg.innerHTML += svgLineHTML;
	}

	// Remove all previous main air endpoints
	while (mainAirEndpoints.lastChild)
	{
		mainAirEndpoints.removeChild(mainAirEndpoints.lastChild);
	}

	// Create new main air enpoints
	for (let i = 1; i <= noEndpoints; i++)
	{
		let mainAirEndpoint = document.createElement("div");
		mainAirEndpoint.setAttribute("class", "endpoint mainAir");
		mainAirEndpoint.setAttribute("onmousedown", "graphics.endpoints.endpointDown(this, true);");
		mainAirEndpoint.setAttribute("location", "main_air");
		mainAirEndpoint.setAttribute("id", "mainAirEndpoint" + i);

		mainAirEndpoints.appendChild(mainAirEndpoint);
	}

	// Reset the internal number of main air endpoints
	graphics.structure.noVerticalSegments = noEndpoints;

	// Resize main air line
	graphics.structure.resizeMainAirLine();
}

// Calculates and sets the toolbox children heights automatically
graphics.structure.setupToolboxDimensions = function(padding)
{
	let toolbox = document.getElementById("toolbox");
	let toolboxBodyHeader = document.querySelector("#toolbox-body .toolbox-header");
	let toolboxBodyContent = document.querySelector("#toolbox-body .toolbox-content");
	let toolboxExtraHeader = document.querySelector("#toolbox-extra .toolbox-header");
	let toolboxExtraContent = document.querySelector("#toolbox-extra .toolbox-content");
	let mainAir = document.getElementById("mainAir");
	let mainAirSwitch = document.getElementById("mainSupplySwitch");

	// Set height of toolbox body
	let toolboxBodyHeight = toolbox.offsetHeight - toolboxBodyHeader.offsetHeight - mainAir.offsetHeight - mainAirSwitch.offsetHeight;
	toolboxBodyHeight = toolboxBodyHeight - toolboxExtraHeader.offsetHeight - padding;
	toolboxBodyContent.style.height = toolboxBodyHeight + "px";

	// Set height of toolbox extra
	let toolboxExtraHeight = mainAir.offsetHeight + mainAirSwitch.offsetHeight - padding;
	toolboxExtraContent.style.height = toolboxExtraHeight + "px";

	// Set toolbox padding
	toolbox.style.padding = padding + "px";
}

// Search the toolbox
graphics.structure.searchBarTextChange = function(searchBar)
{
	if (event.which == '27')
	{
		searchBar.blur();
	}

	// Get toolbox symbols
	let toolboxSymbolsParent = document.querySelector(".toolbox-symbols");
	for (let symbol of toolboxSymbolsParent.children)
	{
		let desc = symbol.querySelector("p").innerHTML;
		symbol.style.display = (desc.toLowerCase().includes(searchBar.value.toLowerCase()) ? "initial" : "none");
	}

	// Set padding left only if scrolling mode, so that the symbols are centered
	toolboxSymbolsParent.style.paddingLeft = (toolboxSymbolsParent.offsetHeight < toolboxSymbolsParent.scrollHeight ? "16px" : "0px");
}

// Calculates and stores canvas dimensions
// NOTE: needs to be called before insideCanvas()
graphics.structure.saveCanvasDimensions = function()
{
    // Calculate canvas corners
    toolbox = document.getElementById("toolbox");
    body = document.querySelector("body");
    canvasHeight = body.offsetHeight - document.getElementById("mainAir").offsetHeight
                                       - document.getElementById("mainSupplySwitch").offsetHeight;
    graphics.structure.canvasCorners = {};
    graphics.structure.canvasCorners["top-left"] = [toolbox.offsetWidth, 0];
    graphics.structure.canvasCorners["top-right"] = [body.offsetWidth, 0];
    graphics.structure.canvasCorners["bottom-left"] = [toolbox.offsetWidth, canvasHeight];
    graphics.structure.canvasCorners["bottom-right"] = [body.offsetWidth, canvasHeight];
}

// Checks that a target box is inside the canvas area
// NOTE: left canvas margin (the toolbox) is ignored in the following calculation
graphics.structure.insideCanvas = function(x, y, width, height, isMouse=false)
{
    inside = true;
    mouseAdditionalSpace = (isMouse ? 5 : 0);

    // Top margin
    if (y < 0) inside = false;
    // Bottom margin
    else if (y + height + mouseAdditionalSpace > graphics.structure.canvasCorners["bottom-left"][1]) inside = false;
    // Right margin
    else if (x + width + mouseAdditionalSpace > graphics.structure.canvasCorners["top-right"][0]) inside = false;

    return inside;
}
graphics.structure.mouseInsideCanvas = function(x, y)
{
    return graphics.structure.insideCanvas(x, y, 0, 0, true);
}

// Resizes the svg and the normal canvas
graphics.structure.resizeCanvas = function()
{
	let svgCanvas = document.getElementById("svgCanvas");
	let canvas = document.getElementById("canvas");
	let mainAir = game.canvas.mainAir;
	let paths = [];

	// Save svg canvas dimensions for moving boxes later on
	let svgCanvasWidth = svgCanvas.width.baseVal.value;
	let svgCanvasHeight = svgCanvas.height.baseVal.value;

	// Resize svg canvas
	svgCanvas.setAttribute("width", canvas.offsetWidth);
	svgCanvas.setAttribute("height", canvas.offsetHeight);
	svgCanvas.setAttribute("viewBox", "0 0 " + canvas.offsetWidth + " " + canvas.offsetHeight);

	// Move boxes
	for (let boxObj of game.canvas.boxes)
	{
		let box = document.getElementById(boxObj.boxID);
		let transform = breakTransform(box.style.transform);
		let deltaTransform = resizeTransform(transform, svgCanvasWidth, svgCanvasHeight, canvas.offsetWidth, canvas.offsetHeight);
		graphics.box.moveBox(box, deltaTransform.dx, deltaTransform.dy);
	}

	// Calculate resize ratio
	let resizeRatioX = canvas.offsetWidth / svgCanvasWidth;
	let resizeRatioY = canvas.offsetHeight / svgCanvasHeight;

	// Move paths connected to main air
	let mainAirPaths = [];
	for (let endpoint of mainAir.endpoints)
	{
		if (mainAir.isEndpointConnected(endpoint.endpointID))
		{
			let pathInfo = game.getPathForEndpoint(endpoint.endpointID, true);

			// Move path to remain connected to main air
			graphics.paths.fitToMainAir(pathInfo.pathID, pathInfo.startsAt, endpoint.endpointID, {x: resizeRatioX, y: resizeRatioY});

			// Store path to not resize it later
			mainAirPaths.push(pathInfo.pathID);
		}
	}

	// Move the other paths
	let allPaths = game.paths;
	for (let path of allPaths)
	{
		// Check if path is main air (has already been resized)
		let isMainAir = false;
		for (let mainAirPath of mainAirPaths)
		{
			if (mainAirPath == path.pathID)
			{
				isMainAir = true;
				break;
			}
		}

		// Resize path
		if (!isMainAir) graphics.paths.resizePath(path.pathID, resizeRatioX, resizeRatioY);
	}
}

// Display a menu frame
graphics.structure.displayMenu = function(menuType)
{
	// Check if the type is allowed
	let allowedMenus = ["info", "settings", "open", "save"];
	if (allowedMenus.includes(menuType))
	{
		// Stop simulation if not already stopped
		let mainAirSwitch = document.getElementById("mainSupplySwitch");
		if (mainAirSwitch.innerHTML == "ON") mainAirSwitch.click();

		// Check for direct menus
		if (menuType == "open")
		{
			// Create temporary file picker element
			const filePicker = document.createElement("input");
			filePicker.style.display = "none";
			filePicker.setAttribute("type", "file");
			filePicker.setAttribute("accept", ".pneum"); // Change to your desired extension 
			filePicker.onchange = function()
			{
				// Read data from selected file
				const fileReader = new FileReader();
				fileReader.onload = function()
				{
					// Check version
					let mainJSON = JSON.parse(fileReader.result);
					if (mainJSON.version != graphics.structure.PNEUM_VERSION)
					{
						let msg = "Imported PNEUM file has an older version (" + mainJSON.version + ")";
						msg += " than the current one (" + graphics.structure.PNEUM_VERSION + ").";
						msg += " Some functionalities might have unexpected behaviour. Consider yourself warned.";
						console.warn(msg);
					}

					// Setup the DOM and the GOM
					let canvasHTML = mainJSON.canvas;
					let svgCanvasHTML = mainJSON.svgCanvas;

					game.readFromData(JSON.parse(mainJSON.game));
					document.getElementById("canvas").innerHTML = canvasHTML;
					document.getElementById("svgCanvas").innerHTML = svgCanvasHTML;

					// Setup flow restrictor dials
					let dials = document.querySelectorAll("input.flowRestrictorDial");
					for (let dial of dials)
					{
						let box = dial.parentNode.parentNode.querySelector("img.pneumatic");
						dial.value = game.getBoxAttrib(box.id, "dialValue");
					}

					// Setup important settings
					let importantSettings = mainJSON.importantSettings;
					localStorage.settings_simulation_ma_endpoints = importantSettings.settings_simulation_ma_endpoints;
					graphics.structure.setMainAirLength(importantSettings.settings_simulation_ma_endpoints);

					// Setup main air endpoints displays
					let mainAirDisplays = mainJSON.mainAirDisplays;
					let mainAirEndpoints = Array.from(document.querySelectorAll(".endpoint.mainAir"));
					for (let i = 0; i < mainAirEndpoints.length; i++)
					{
						if (mainAirDisplays[i] != "")
						{
							mainAirEndpoints[i].style.display = mainAirDisplays[i];
						}
					}
				}
				fileReader.readAsText(this.files[0], "utf-8");
			}

			// Simulate click
			document.body.appendChild(filePicker);
			filePicker.click();
			document.body.removeChild(filePicker);
		}
		else if (menuType == "save")
		{
			// Serialize gom object as json
			let gomJSON = JSON.stringify(game);

			// Save important settings
			let importantSettings = {"settings_simulation_ma_endpoints": graphics.structure.noVerticalSegments};

			// Get canvases
			let canvasHTML = document.getElementById("canvas").innerHTML;
			let svgCanvasHTML = document.getElementById("svgCanvas").innerHTML;

			// Get main air attributes
			let mainAirDisplays = Array.from(document.querySelectorAll(".endpoint.mainAir")).map(elem => elem.style.display);
			let mainAirJSON = JSON.stringify(mainAirDisplays);

			// Embed all in one json and donwload it
			let mainJSON = JSON.stringify({"version": graphics.structure.PNEUM_VERSION,
										   "game": gomJSON,
										   "canvas": canvasHTML,
										   "svgCanvas": svgCanvasHTML,
										   "mainAirDisplays": mainAirDisplays,
									   	   "importantSettings": importantSettings});
			downloadFile("untitled.pneum", mainJSON);
		}
		else
		{
			// Display menu container with requested content
			let container = document.getElementById("menuContentContainer");
			container.children[0].children[1].innerHTML = MENUS_HTML[menuType];
			container.style.display = "flex";

			// Load settings if settings menu
			if (menuType == "settings")
			{
				loadSettings();
			}
		}
	}
}

// Hides the currently displayed menu
graphics.structure.hideCurrentMenu = function()
{
	let currentMenu = document.getElementById("menuContentContainer");
	currentMenu.style.display = "none";

	// Make sure the video tutorial stops
	let videoTutorial = document.getElementById("videoTutorial");
	if (videoTutorial)
		videoTutorial.parentNode.removeChild(videoTutorial);
}
