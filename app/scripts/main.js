// Whole document mouse move event listener
function documentMouseMove()
{
	if (graphics.box.mousePressed && graphics.box.currentlyDraggedBox != null)
	{
		graphics.box.boxDragged(graphics.box.currentlyDraggedBox);
	}
}

// Main Air Supply button click listener
function mainSupplySwitchClick(button)
{
	// Toggle button state
	button.innerHTML = (button.innerHTML == "ON" ? "OFF" : "ON");
	button.style.color = (button.innerHTML == "ON" ? "white" : "black");
	button.style.borderColor = (button.innerHTML == "ON" ? "darkred" : "black");
	button.style.backgroundColor = (button.innerHTML == "ON" ? "darkred" : "white");

	// Start/stop the simulation
	const storedFPS = localStorage.settings_simulation_fps;
	let fps = storedFPS | DEFAULT_SETTINGS.simulation.fps;
	if (button.innerHTML == "ON") PneumaticSimulation.start(fps);
	else PneumaticSimulation.stop();
}

// Whole document click listener
document.addEventListener("keyup", function(e)
{
	// Escape key handler
	if (e.key == 'Escape')
	{
		// If currently drawing a pipe
		if (graphics.endpoints.firstEndpointSelected)
		{
			graphics.endpoints.cancelCurrentPath();
		}

		// If currently showing a gui menu
		graphics.structure.hideCurrentMenu();
	}
});

// When the page loads
window.addEventListener("load", function()
{
	// Resize main air supply line
	graphics.structure.setMainAirLength(graphics.structure.noVerticalSegments);

	// Calculate and set height of toolbox body automatically
	graphics.structure.setupToolboxDimensions(graphics.structure.TOOLBOX_PADDING);

	// Create toolbox symbols and put them in toolbox
	for (let symbol of TOOLBOX_SYMBOLS)
	{
		graphics.structure.createToolboxSymbol(symbol.name, symbol.desc, symbol.img, symbol.actuators, symbol.disabled);
	}

	// Make the svg canvas fit the whole screen
	windowWidth = document.querySelector("body").offsetWidth;
	windowHeight = document.querySelector("body").offsetHeight;
	svgCanvas = document.getElementById("svgCanvas");
	svgCanvas.setAttribute("width", windowWidth + "px");
	svgCanvas.setAttribute("height", windowHeight + "px");
	svgCanvas.setAttribute("viewBox", "0 0 " + windowWidth + " " + windowHeight);

	// Add the mouse move event listener to the whole document
	document.addEventListener("mousemove", documentMouseMove);

	// Save the canvas dimensions
	graphics.structure.saveCanvasDimensions();

	// Initialize the GOM
	game.init();

	// Initialize the simulation software
	PneumaticSimulation.init();
});

// When the page is resized
window.addEventListener("resize", function()
{
	/* Yet to be implemented (or removed) */
	// Resize main air supply line
	graphics.structure.resizeMainAirLine();
	graphics.structure.setupToolboxDimensions(graphics.structure.TOOLBOX_PADDING);
	graphics.structure.resizeCanvas();
	graphics.structure.saveCanvasDimensions();
});
