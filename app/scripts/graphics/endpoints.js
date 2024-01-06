/* Created: 09.05.2020, Codrin Iftode
Contains the graphics "endpoints" namespace */

/* Global variables for this module */
// Endpoints connection start
graphics.endpoints.firstEndpointSelected = false;
graphics.endpoints.startEndpointCoords = {"x":-1, "y":-1};
graphics.endpoints.startEndpointID = "";
graphics.endpoints.startPneumaticID = "";

// Piping
// Current direction of drawing a pipe
graphics.endpoints.pipeDrawingDirection = "";

// The current pipe being drawn
graphics.endpoints.svgPipe;
graphics.endpoints.svgPipeTurningPoints = [];


// Endpoint pressed listener
graphics.endpoints.endpointDown = function(endpoint, mainAir = false)
{
    // Make pressed endpoint invisible
    endpoint.style.display = "none";

    if (graphics.endpoints.firstEndpointSelected)
    {
        // Check for mainAir-mainAir case
        if (game.canvas.mainAir.isMainAirEndpoint(endpoint.id) && game.canvas.mainAir.isMainAirEndpoint(graphics.endpoints.startEndpointID))
        {
            alert("Sorry, connecting main air to main air is not currently allowed.");

            // Cleanup
            graphics.endpoints.cancelCurrentPath();
            endpoint.style.display = "block";
            return;
        }

        // Connect the ending point
        let endpointConnectionEnd = breakTransform(endpoint.style.transform);

        // Get rid of the possible negative y-coordinate
        if (endpointConnectionEnd.y < 0)
            endpointConnectionEnd.y = 0;

        // Center the coordinates
        let endpointLocation = endpoint.getAttribute("location");
        endpointConnectionEnd = graphics.endpoints.centerEndpointCoordinates(endpointLocation, endpointConnectionEnd);

        // Add the parent transform coordinates
        let mainAirEndpoint = endpoint.getAttribute("id").includes("mainAir");
        if (!mainAirEndpoint)
        {
            let endpointsParentTransform = breakTransform(endpoint.parentNode.style.transform);
            endpointConnectionEnd.x += endpointsParentTransform.x;
            endpointConnectionEnd.y += endpointsParentTransform.y;
        }
        else
        {
            let mainAirDiv = endpoint.parentNode.parentNode;
            let rect = mainAirDiv.getBoundingClientRect();
            endpointConnectionEnd.x += Math.round(rect.left);
            endpointConnectionEnd.y += Math.round(rect.top);
        }

        // Add or adjust, if needed, the penultimate point
        let penultimatePoint = {};
        if (endpointLocation == "x" || endpointLocation == "main_air")
        {
            penultimatePoint.y = graphics.endpoints.svgPipeTurningPoints[graphics.endpoints.svgPipeTurningPoints.length - 1].y;
            penultimatePoint.x = endpointConnectionEnd.x;
            if (graphics.endpoints.pipeDrawingDirection == "x")
            {
                // Replace the last point with the actual penultimate point
                graphics.endpoints.svgPipeTurningPoints[graphics.endpoints.svgPipeTurningPoints.length - 1] = penultimatePoint;
            }
            else
            {
                // Only push the penultimate point in the array, keeping the last element
                graphics.endpoints.svgPipeTurningPoints.push(penultimatePoint);
            }
        }
        else if (endpointLocation == "y")
        {
            penultimatePoint.x = graphics.endpoints.svgPipeTurningPoints[graphics.endpoints.svgPipeTurningPoints.length - 1].x;
            penultimatePoint.y = endpointConnectionEnd.y;
            if (graphics.endpoints.pipeDrawingDirection == "y")
            {
                // Replace the last point with the actual penultimate point
                graphics.endpoints.svgPipeTurningPoints[graphics.endpoints.svgPipeTurningPoints.length - 1] = penultimatePoint;
            }
            else
            {
                // Only push the penultimate point in the array, keeping the last element
                graphics.endpoints.svgPipeTurningPoints.push(penultimatePoint);
            }
        }

        // Append the ending point to the path
        graphics.endpoints.svgPipeTurningPoints.push(endpointConnectionEnd);

        // Update the svg path
        graphics.endpoints.svgPipe.setAttribute("d", graphics.paths.pathCmdsFromTP(graphics.endpoints.svgPipeTurningPoints));

        // Append the new path to the record of all paths
        let selector = (mainAir ? "img" : "img.pneumatic");
        let connectionEndPneumaticId = endpoint.parentNode.parentNode.querySelector(selector).getAttribute("id");
        graphics.paths.appendPath(graphics.endpoints.svgPipe.getAttribute("id"), graphics.endpoints.startEndpointID, endpoint.getAttribute("id"));

        // If any of the two endpoints are main air, then set their connected property
        let startEndpoint = document.getElementById(graphics.endpoints.startEndpointID);
        if (startEndpoint.getAttribute("location") == "main_air")
        {
            game.canvas.mainAir.connectEndpoint(startEndpoint.id, true);
        }
        if (endpoint.getAttribute("location") == "main_air")
        {
            game.canvas.mainAir.connectEndpoint(endpoint.id, true);
        }

        // Empty the path points array
        graphics.endpoints.svgPipeTurningPoints = [];

        // Deactivate the 'first endpoint' flag
        graphics.endpoints.firstEndpointSelected = false;

        // Enable mouse events for the current pneumatic
        let pneumatic = document.getElementById(graphics.endpoints.startPneumaticID);
        if (pneumatic.hasAttribute("class") && pneumatic.getAttribute("class").includes("pneumatic")) pneumatic.style.pointerEvents = "all";
    }
    else
    {
        // Disable mouse events for the current pneumatic
        let pneumatic = endpoint.parentNode.parentNode.querySelector("img.pneumatic");
        if (pneumatic != null) pneumatic.style.pointerEvents = "none";

        // Break transfrom and get coordinates of current point = starting point
        graphics.endpoints.startEndpointCoords = breakTransform(endpoint.style.transform);

        // Get rid of the possible negative y-coordinate
        if (graphics.endpoints.startEndpointCoords.y < 0)
            graphics.endpoints.startEndpointCoords.y = 0;

        // Center coordinates
        let endpointLocation = endpoint.getAttribute("location");
        graphics.endpoints.startEndpointCoords = graphics.endpoints.centerEndpointCoordinates(endpointLocation, graphics.endpoints.startEndpointCoords);

        // Set drawing direction to the opposite of the endpoint location
        if (endpointLocation == "x" || endpointLocation == "main_air") graphics.endpoints.pipeDrawingDirection = "y";
        else if (endpointLocation == "y") graphics.endpoints.pipeDrawingDirection = "x";

        // Add the parent transform coordinates
        let mainAirEndpoint = endpoint.getAttribute("id").includes("mainAir");
        if (!mainAirEndpoint)
        {
            let endpointsParentTransform = breakTransform(endpoint.parentNode.style.transform);
            graphics.endpoints.startEndpointCoords.x += endpointsParentTransform.x;
            graphics.endpoints.startEndpointCoords.y += endpointsParentTransform.y;
        }
        else
        {
            let mainAirDiv = endpoint.parentNode.parentNode;
            let rect = mainAirDiv.getBoundingClientRect();
            graphics.endpoints.startEndpointCoords.x += Math.round(rect.left);
            graphics.endpoints.startEndpointCoords.y += Math.round(rect.top);
        }

        // Append the starting point to the array of turning points
        graphics.endpoints.svgPipeTurningPoints.push(graphics.endpoints.startEndpointCoords);

        // Set up the pipe svg path
        let pathCmds = graphics.paths.pathCmdsFromTP(graphics.endpoints.svgPipeTurningPoints);
        graphics.endpoints.svgPipe = graphics.paths.createPipePath();
        graphics.endpoints.svgPipe.setAttribute("d", pathCmds);

        // Append path to canvas
        document.getElementById("svgCanvas").appendChild(graphics.endpoints.svgPipe);

        // Save the starting endpoint id for later use
        graphics.endpoints.startEndpointID = endpoint.getAttribute("id");

        // Save the starting pneumatic box id for later use
        let selector = (mainAir ? "img" : "img.pneumatic");
        graphics.endpoints.startPneumaticID = endpoint.parentNode.parentNode.querySelector(selector).getAttribute("id");

        // Activate the starting point flag
        graphics.endpoints.firstEndpointSelected = true;
    }
}

graphics.endpoints.cancelCurrentPath = function()
{
    // Deactivate drawing mode
    graphics.endpoints.firstEndpointSelected = false;

    // Delete current pipe
    graphics.endpoints.svgPipe.parentNode.removeChild(graphics.endpoints.svgPipe);

    // Reset pipe drawing parameters
    graphics.endpoints.svgPipeTurningPoints = [];
    graphics.endpoints.pipeDrawingDirection = "y";

    // Decrease the pipe counter
    game.pathCounter -= 1;

    // Enable mouse events for the start pneumatic
    let pneumatic = document.getElementById(graphics.endpoints.startPneumaticID);
    if (pneumatic.hasAttribute("class") && pneumatic.getAttribute("class").includes("pneumatic")) pneumatic.style.pointerEvents = "all";

    // Display previously hidden starting endpoint
    document.getElementById(graphics.endpoints.startEndpointID).style.display = "block";
}

// Center the coordinates of an endpoint based on its location and size
graphics.endpoints.centerEndpointCoordinates = function(endpointLocation, currentCoords)
{
    // Get the endpoint's location
    if (endpointLocation == "x" || endpointLocation == "main_air")
    {
        // Endpoint is on the top or the bottom
        currentCoords.x += 5;
    }
    else if (endpointLocation == "y")
    {
        console.log(currentCoords);
        // Endpoint is on the sides
        currentCoords.y += 5;

        // Add endpoint width only to the endpoint on the left
        if (currentCoords.x < 60)
        {
            currentCoords.x += 10;
        }
    }
    return currentCoords;
}

// Called when the svg canvas is pressed while a pipe connection is being drawn
// Changes direction of drawing
graphics.endpoints.svgPressed_WhileDrawingPipe = function()
{
    if (graphics.endpoints.firstEndpointSelected)
    {
        // Change the direction of drawing the pipe
        if (graphics.endpoints.pipeDrawingDirection == "x") graphics.endpoints.pipeDrawingDirection = "y";
        else graphics.endpoints.pipeDrawingDirection = "x";

        // Append the clicked point to the path
        graphics.endpoints.svgPipeTurningPoints.push({"x":event.clientX, "y":event.clientY});
    }
}

// Called when the mouse is moved over the svg canvas while a pipe is being drawn
// Draws a pipe segment in the globally set direction
graphics.endpoints.svgCanvasMouseMove = function()
{
    if (graphics.endpoints.firstEndpointSelected)
    {
        // Don't pop the starting point at the first iteration
        if (graphics.endpoints.svgPipeTurningPoints.length > 1)
        {
            graphics.endpoints.svgPipeTurningPoints.pop();
        }

        // Draw a line segment following the cursor
        if (graphics.endpoints.pipeDrawingDirection == "x")
        {
            // Add the new coordinates at the end of the pipe path
            graphics.endpoints.svgPipeTurningPoints.push({"x":event.clientX, "y":graphics.endpoints.svgPipeTurningPoints[graphics.endpoints.svgPipeTurningPoints.length - 1].y});
        }

        else if (graphics.endpoints.pipeDrawingDirection == "y")
        {
            // Add the new coordinates at the end of the pipe path
            graphics.endpoints.svgPipeTurningPoints.push({"x":graphics.endpoints.svgPipeTurningPoints[graphics.endpoints.svgPipeTurningPoints.length - 1].x, "y":event.clientY});
        }

        // Update the svg path
        graphics.endpoints.svgPipe.setAttribute("d", graphics.paths.pathCmdsFromTP(graphics.endpoints.svgPipeTurningPoints));
    }
}

// Hiding or showing endpoints for a certain target box
graphics.endpoints.showEndpoints = function(targetBox, visible)
{
	targetBox.parentNode.querySelector(".endpoints").style.display = visible ? "block" : "none";
}

// Returns a dict representing the endpoint locations for the specific tool
graphics.endpoints.getEndpointsFor = function(toolId)
{
    return VALVE_ENDPOINTS[toolId];
}

// Returns an endpoint id based on its configuration number
graphics.endpoints.getEndpointFromConf = function(boxID, confNumber)
{
    // Main air endpoint is recorded as -1
    if (confNumber == -1)
        return "mainAir";
    else
    {
        let endpoints = document.getElementById(boxID).parentNode.querySelector(".endpoints").children;
        return endpoints[confNumber].getAttribute("id");
    }
}

// Checks if air is coming into the cylinder through the given endpoint
graphics.endpoints.isAirComingIn = function(cylinderID, endpointID)
{
    let outstroking = !game.getBoxAttrib(cylinderID, "outstroked");
    let conf = VALVE_CONF[game.getBoxAttrib(cylinderID, "type")];
    let outstrokingEndpointID = graphics.endpoints.getEndpointFromConf(cylinderID, conf[game.getBoxAttrib(cylinderID, "state")][0]);
    let isOutstrokingEndpoint = (outstrokingEndpointID == endpointID);

    return isOutstrokingEndpoint == outstroking;
}

graphics.endpoints.change52MainAir = function(box, state)
{
    let endpoints = box.parentNode.querySelector(".endpoints");
    let currentEndpoint = endpoints.querySelector(".endpoint.mainAir");
    let newEndpoint = endpoints.querySelector(".endpoint:not(.actuator):not(.mainAir)");
    currentEndpoint.classList.remove("mainAir");
    newEndpoint.classList.add("mainAir");
}
