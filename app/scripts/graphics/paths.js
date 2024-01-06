/* Created: 09.05.2020, Codrin Iftode
Contains the graphics "paths" namespace */

// Creates and returns a new default path object
graphics.paths.createPipePath = function()
{
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Set up default attributes
    path.setAttribute("id", "path" + game.pathCounter.toString());
    path.setAttribute("stroke", "#b0b0b0");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-width", "4");
    path.setAttribute("style", "cursor: pointer; padding: 10px;");

    // Set up the on click listener
    path.setAttribute("onclick", "graphics.paths.pathClicked(this);");

    // Increment path counter
    game.pathCounter++;

    // Return the new path
    return path;
}

// Path click event listener
graphics.paths.pathClicked = function(path, override = false) // TODO: change name of function and display context menu instead of this
{
    // If Ctrl pressed at the same time
    if (event.ctrlKey || override)
    {
        let pathId = path.getAttribute("id");

        // Disconnect all the main air endpoints
        let endpointIDs = game.getEndpointsForPath(pathId);
        for (let i = 0; i < endpointIDs.length; i++)
        {
            let endpoint = document.getElementById(endpointIDs[i]);
            if (endpoint.getAttribute("location") == "main_air")
                endpoint.setAttribute("connected", "false");

            // Update gom
            game.canvas.mainAir.connectEndpoint(endpoint.id, false);
        }

        // Display previously hidden endpoints
        graphics.paths.displayEndpointsForPath(pathId);

        // Delete path from GOM
        game.deletePath(path.id);

        // Delete path from DOM
        path.parentNode.removeChild(path);
    }
}

// Returns a svg path commands object from an array of turning points
graphics.paths.pathCmdsFromTP = function(turningPoints)
{
    let cmdsStr = "";

    // Append the starting point as a move command
    cmdsStr = "M" + turningPoints[0].x.toString() + " " + turningPoints[0].y.toString() + " ";

    // Append the rest of the points as 'draw a line' commands
    for (let i = 1; i < turningPoints.length; i++)
    {
        cmdsStr += "L" +  turningPoints[i].x.toString() + " " + turningPoints[i].y.toString() + " ";
    }

    // Return resulting string
    return cmdsStr;
}

// Returns an array of turning points from an svg path commands object
graphics.paths.tpFromPathCmds = function(pathCmds)
{
    let turningPoints = [];
    let regex = /\d+ \d+/g;

    // Break commands in pairs of numbers
    let pairs = pathCmds.match(regex);

    // Save pairs as turning points
    let pair;
    for (let i = 0; i < pairs.length; i++)
    {
        pair = pairs[i].split(" ");
        turningPoints.push({"x":parseInt(pair[0]), "y":parseInt(pair[1])});
    }
    return turningPoints;
}


// Moves a svg path to follow a pneumatic box moving
graphics.paths.movePath = function(pathId, boxId, pneumaticDeltaX, pneumaticDeltaY)
{
    // Get turning points
    let pathObj = document.getElementById(pathId);
    let commands = pathObj.getAttribute("d");
    let turningPoints = graphics.paths.tpFromPathCmds(commands);

    // Get endpoint ids
    let endpointIDs = game.getEndpointsForPath(pathId);

    // If it is starting endpoint
    if (game.pathStartsAt(pathId, boxId))
    {
        // Get endpoint location relative to the pneumatic box
        let endpointLocation = document.getElementById(endpointIDs[0]).getAttribute("location");
        if (endpointLocation == "x" || endpointLocation == "main_air")
        {
            // Add the vertical movement to the first turning point
            turningPoints[0].y += pneumaticDeltaY;

            // Change the x coordinates of the first two turning points
            turningPoints[0].x += pneumaticDeltaX;
            turningPoints[1].x += pneumaticDeltaX;
        }
        else if (endpointLocation == "y")
        {
            // Add the horizontal movement to the first turning point
            turningPoints[0].x += pneumaticDeltaX;

            // Change the y coordinates of the first two turning points
            turningPoints[0].y += pneumaticDeltaY;
            turningPoints[1].y += pneumaticDeltaY;
        }
    }

    // If it is ending endpoint
    if (game.pathEndsAt(pathId, boxId))
    {
        // Get endpoint location relative to the pneumatic box
        let endpointLocation = document.getElementById(endpointIDs[endpointIDs.length - 1]).getAttribute("location");
        if (endpointLocation == "x" || endpointLocation == "main_air")
        {
            // Add the vertical movement to the last turning point
            turningPoints[turningPoints.length - 1].y += pneumaticDeltaY;

            // Change the x coordinates of both the last and penultimate turning point
            turningPoints[turningPoints.length - 1].x += pneumaticDeltaX;
            turningPoints[turningPoints.length - 2].x += pneumaticDeltaX;
        }
        else if (endpointLocation == "y")
        {
            // Add the horizontal movement to the last turning point
            turningPoints[turningPoints.length - 1].x += pneumaticDeltaX;

            // Change the y coordinates of both the last and penultimate turning point
            turningPoints[turningPoints.length - 1].y += pneumaticDeltaY;
            turningPoints[turningPoints.length - 2].y += pneumaticDeltaY;
        }
    }

    // Change the attributes of the path in the DOM
    pathObj.setAttribute("d", graphics.paths.pathCmdsFromTP(turningPoints));
}

// Animates a path to follow its associated box
graphics.paths.animatePath = function(pathId, boxId, pneumaticDeltaX, pneumaticDeltaY)
{
    // Get turning points
    let pathObj = document.getElementById(pathId);
    let commands = pathObj.getAttribute("d");
    let turningPoints = graphics.paths.tpFromPathCmds(commands);

    // Get endpoint ids
    let endpointIDs = game.getEndpointsForPath(pathId);

    // Arrays to contain x and y indices of turningPoints array
    let xAnimated = [];
    let yAnimated = [];

    // If starting endpoint
    if (game.pathStartsAt(pathId, boxId))
    {
        // Get endpoint location relative to the pneumatic box
        let endpointLocation = document.getElementById(endpointIDs[0]).getAttribute("location");
        if (endpointLocation == "x" || endpointLocation == "main_air")
        {
            yAnimated.push(0); // Add the vertical movement to the first turning point
            xAnimated.push(0, 1); // Change the x coordinates of the first two turning points
        }
        else if (endpointLocation == "y")
        {
            xAnimated.push(0); // Add the horizontal movement to the first turning point
            yAnimated.push(0, 1); // Change the y coordinates of the first two turning points
        }
    }

    // If ending endpoint
    if (game.pathEndsAt(pathId, boxId))
    {
        // Get endpoint location relative to the pneumatic box
        let endpointLocation = document.getElementById(endpointIDs[endpointIDs.length - 1]).getAttribute("location");
        if (endpointLocation == "x" || endpointLocation == "main_air")
        {
            yAnimated.push(turningPoints.length - 1); // Add the vertical movement to the last turning point
            xAnimated.push(turningPoints.length - 1, turningPoints.length - 2); // Change the x coordinates of both the last and penultimate turning point
        }
        else if (endpointLocation == "y")
        {
            xAnimated.push(turningPoints.length - 1); // Add the horizontal movement to the last turning point
            yAnimated.push(turningPoints.length - 1, turningPoints.length - 2); // Change the y coordinates of both the last and penultimate turning point
        }
    }

    // Animate elements
    let pathIntervals = [];
    for (let i = 0; i < xAnimated.length; i++)
    {
        const finalX = turningPoints[xAnimated[i]].x + pneumaticDeltaX;
        const dx = pneumaticDeltaX / Math.abs(pneumaticDeltaX);
        let interval = setInterval(function()
        {
            if (turningPoints[xAnimated[i]].x == finalX) clearInterval(interval);
            else
            {
                turningPoints[xAnimated[i]].x += dx;
                pathObj.setAttribute("d", graphics.paths.pathCmdsFromTP(turningPoints));
            }
        }, DEFAULT_SETTINGS.graphics.actuatorMs);

        // Save reference to interval
        pathIntervals.push(interval);
    }
    return pathIntervals;
}

// Resizes a given path to fit new canvas dimensions
graphics.paths.fitToMainAir = function(pathID, startsAtMainAir, mainAirEndpointID, resizeRatioXY)
{
    let path = document.getElementById(pathID);
    let mainAirEndpoint = document.getElementById(mainAirEndpointID);
    let turningPoints = graphics.paths.tpFromPathCmds(path.getAttribute("d"));

    // Get main air endpoint coordinates
    mainAirEndpoint.style.display = "block";
    let boundingRect = mainAirEndpoint.getBoundingClientRect();
    mainAirEndpoint.style.display = "none";
    let mainAirX = Math.round(boundingRect.x + 5);
    let mainAirY = Math.round(boundingRect.y + 10);

    // Update the last (or the first, based on startsAtMainAir) turning points
    if (startsAtMainAir)
    {
        turningPoints[0].x = mainAirX;
        turningPoints[0].y = mainAirY;

        // Adjust y coordinate of all turning points except the one connected to the box
        for (let i = 1; i < turningPoints.length - 1; i++)
        {
            turningPoints[i].x = resizeCoordinate(turningPoints[i].x, resizeRatioXY.x);
            turningPoints[i].y = resizeCoordinate(turningPoints[i].y, resizeRatioXY.y);
        }

        // Adjust penultimate endpoints on both ends
        turningPoints[1].x = mainAirX;
        turningPoints[turningPoints.length - 2].x = turningPoints[turningPoints.length - 1].x;
    }
    else
    {
        let last = turningPoints.length - 1;
        turningPoints[last].x = mainAirX;
        turningPoints[last].y = mainAirY;
        turningPoints[last - 1].x = turningPoints[last].x;

        // Adjust y coordinate of all turning points except the one connected to the box
        for (let i = last - 1; i >= 1; i--)
        {
            turningPoints[i].x = resizeCoordinate(turningPoints[i].x, resizeRatioXY.x);
            turningPoints[i].y = resizeCoordinate(turningPoints[i].y, resizeRatioXY.y);
        }

        // Adjust penultimate endpoints on both ends
        turningPoints[last - 1].x = mainAirX;
        turningPoints[1].x = turningPoints[0].x;
    }

    // Reconstruct path commands
    path.setAttribute("d", graphics.paths.pathCmdsFromTP(turningPoints));
}

// Resize a path (used when the screen resolution is changed)
graphics.paths.resizePath = function(pathID, resizeRatioX, resizeRatioY)
{
    console.log(resizeRatioX, resizeRatioY);
    let path = document.getElementById(pathID);
    let turningPoints = graphics.paths.tpFromPathCmds(path.getAttribute("d"));

    // Decide if the path ends are horizontal or vertical
    let pathEnd1 = "y";
    let pathEnd2 = "y";
    if (turningPoints[1].x == turningPoints[0].x) pathEnd1 = "x";
    if (turningPoints[turningPoints.length - 2].x == turningPoints[turningPoints.length - 1].x) pathEnd2 = "x";


    for (let i = 1; i < turningPoints.length - 1; i++)
    {
        turningPoints[i].x = resizeCoordinate(turningPoints[i].x, resizeRatioX);
        turningPoints[i].y = resizeCoordinate(turningPoints[i].y, resizeRatioY);
    }

    // Make adjustments on both ends
    if (pathEnd1 == "x") turningPoints[1].x = turningPoints[0].x;
    else if (pathEnd1 == "y")  turningPoints[1].y = turningPoints[0].y;

    if (pathEnd2 == "x") turningPoints[turningPoints.length - 2].x = turningPoints[turningPoints.length - 1].x;
    else if (pathEnd2 == "y") turningPoints[turningPoints.length - 2].y = turningPoints[turningPoints.length - 1].y;

    // Change path on canvas
    path.setAttribute("d", graphics.paths.pathCmdsFromTP(turningPoints));
}

// Wrapper for the GOM function which retrieves all paths for a box
// Note: returns an array reference, not a copy
graphics.paths.getAllPaths = function(pneumaticId)
{
    return game.getPathsForBox(pneumaticId);
}

// Deletes all paths from DOM
graphics.paths.deleteAllPathsDOM = function(pneumaticId)
{
    // Remove associated paths from DOM
	let associatedPaths = graphics.paths.getAllPaths(pneumaticId);
	for (let i = 0; i < associatedPaths.length; i++)
	{
		// Don't try to remove it if it was a duplicate and it was already removed
		if (associatedPaths[i])
		{
			// Make the path's endpoints visible back again
			graphics.paths.displayEndpointsForPath(associatedPaths[i]);

			// Remove path
			let path = document.getElementById(associatedPaths[i]);
            path.parentNode.removeChild(path);
		}
	}

	// Remove associated paths from GOM
	let pathIds = game.getPathsForBox(pneumaticId);
    for (let i = 0; i < pathIds.length; i++)
    {
        game.deletePath(pathIds[i]);
    }
}

// Interface for the GOM createPath method
graphics.paths.appendPath = function(pathId, startingEndpoint, endingEndpoint)
{
    game.createPath(pathId, startingEndpoint, endingEndpoint);
}

// Displays all the endpoints for a path
graphics.paths.displayEndpointsForPath = function(pathId)
{
    let endpoints = game.getEndpointsForPath(pathId);
    for (let i = 0; i < endpoints.length; i++)
    {
        document.getElementById(endpoints[i]).style.display = "block";
    }
}
