/* Created: 09.05.2020, Codrin Iftode
Contains the graphics "actuators" namespace */

// Actuator template - only horizontal for now...
graphics.actuators.actuatorTemplate = `
<img class="actuator" id="{actuatorID}" src="{actuatorSrc}" newState="{actuatorNewState}"
style="transform: {actuatorTransform}; position: static;" draggable="false" onclick="graphics.actuators.actuatorClick(this);">
</img>
`;

graphics.actuators.leftTransform = "translate(-60px, 0px)";
graphics.actuators.rightTransform = "translate(120px, 0px) scale(-1, 1)";
graphics.actuators.rightTransformToolbox ="scale(-1, 1)";
graphics.actuators.leftTransformToolbox = "translate(0px, 0px)";

// Returns the actuators for a specific box
graphics.actuators.getActuatorsFrom = function(actuatorStr, isToolboxSymbol = false)
{
    let actuators = {};

    // Get src
    let actuatorInitials = actuatorStr.split(":");
    let leftSrc = ACTUATORS_INFO[actuatorInitials[0]].src;
    let rightSrc = ACTUATORS_INFO[actuatorInitials[1]].src;

    // Inflate the two actuators
    actuators.left = graphics.actuators.inflateActuator(leftSrc, true, isToolboxSymbol);
    actuators.right = graphics.actuators.inflateActuator(rightSrc, false, isToolboxSymbol);

    return actuators;
}

// Returns the html for an actuator with the required data in it
graphics.actuators.inflateActuator = function(actuatorSrc, onLeft, isToolboxSymbol = false)
{
    // Replace src
    let html = graphics.actuators.actuatorTemplate.replace(/{actuatorSrc}/g, actuatorSrc);

    // Replace id and transform
    let transform;
    if (isToolboxSymbol)
    {
        html = html.replace(/{actuatorID}/g, "");
        transform = onLeft ? graphics.actuators.leftTransformToolbox : graphics.actuators.rightTransformToolbox;
    }
    else
    {
        // Replace id
        html = html.replace(/{actuatorID}/g, "actuator" + game.actuatorCounter.toString());
        game.actuatorCounter++;
        transform = onLeft ? graphics.actuators.leftTransform : graphics.actuators.rightTransform;

        // Set position: absolute
        html = html.replace(/static/g, "absolute");
    }
    html = html.replace(/{actuatorTransform}/g, transform);

    // Replace new state
    if (!isToolboxSymbol)
        html = html.replace(/{actuatorNewState}/g, (onLeft ? game.stateLeft : game.stateRight));
    else
        html = html.replace(/{actuatorNewState}/g, "");

    return html;
}


// Actuator click event listener with no animations - kept for legacy purposes
graphics.actuators.actuatorClickNonAnim = function(actuator, valve52 = false)
{
    let newState = actuator.getAttribute("newstate");
    let box = actuator.parentNode.parentNode.querySelector("img.pneumatic");

    // Quit if the box is already positioned according to this actuator
    if (game.getBoxAttrib(box.getAttribute("id"), "state") != newState)
    {
        // Change box state in GOM
        game.changeBoxState(box.id, newState);

        // Move box and actuators graphically
        let actuators = actuator.parentNode;
        let deltaX = - parseInt(newState) * parseInt(graphics.box.pneumaticWidth) / 2;
        box.style.transform = moveTransform(box.style.transform, deltaX, 0);
        actuators.style.transform = moveTransform(actuators.style.transform, deltaX, 0);

        // Handle 52 valve
        if (valve52)
        {
            // Move connecting paths, if connected to an actuator endpoint
            let actuatorEndpoints = box.parentNode.querySelectorAll(".endpoint.actuator");
            for (let actuatorEndpoint of actuatorEndpoints)
            {
                let pathID = game.getPathForEndpoint(actuatorEndpoint.id);
                if (pathID != undefined)
                {
                    graphics.paths.movePath(pathID, box.id, parseInt(deltaX), 0);
                }
            }

            // Move extra components
            let extraComponents = box.parentNode.querySelector(".extraComponents");
            let extraComponent = extraComponents.children[0];
            extraComponents.style.transform = moveTransform(extraComponents.style.transform, deltaX, 0);
            extraComponent.style.transform =  moveTransform(extraComponent.style.transform, -deltaX, 0);

            // Move horizontal actuator endpoints
            for (actuatorEndpoint of actuatorEndpoints)
            {
                actuatorEndpoint.style.transform = moveTransform(actuatorEndpoint.style.transform, deltaX, 0);
            }

            // Simulate box release to update endpoint positions
            graphics.box.boxReleased(box);
        }
    }

    // Determine next endpoint only if 52 valve
    if (valve52)
    {
        let conf = game.getBoxAttrib(box.id, "conf");
        let confEndpoints = conf[game.getBoxAttrib(box.id, "state")];
        let boxEndpoints = box.parentNode.querySelector(".endpoints").children;
        for (let confEndpoint of confEndpoints)
        {
            // Skip if main air, return otherwise
            if (confEndpoint != -1)
            {
                return boxEndpoints[parseInt(confEndpoint)].id;
            }
        }
    }
}

// Actuator click event listener - with animations
graphics.actuators.actuatorClick_old = function(actuator, valve52 = false)
{
    let newState = actuator.getAttribute("newstate");
    let box = actuator.parentNode.parentNode.querySelector("img.pneumatic");
    let originalState = game.getBoxAttrib(box.id, "state");

    // Quit if the box is already positioned according to this actuator
    if (game.getBoxAttrib(box.getAttribute("id"), "state") != newState)
    {
        // Change box state in GOM
        game.changeBoxState(box.id, newState);

        // Delete 52 animation if this is controller
        if (PneumaticSimulation.is52Controller(box.id))
        {
            PneumaticSimulation.deleteAnimationForController(box.id);
        }

        // Move box and actuators graphically
        let actuators = actuator.parentNode;
        let deltaX = - parseInt(newState) * parseInt(graphics.box.pneumaticWidth) / 2;

        // Handle 52 valve
        let extraComponentsInterval, extraComponentInterval;
        let actuatorEndpointsIntervals = [];
        let pathIntervals = [];
        if (valve52)
        {
            // Change the main air endpoint of the 52
            graphics.endpoints.change52MainAir(box, newState);

            // Move connecting paths, if connected to an actuator endpoint
            pathIntervals = graphics.actuators.move52ActuatorPaths(box, deltaX, true);

            // Move extra components
            let extraComponents = box.parentNode.querySelector(".extraComponents");
            let extraComponent = extraComponents.children[0];
            extraComponentsInterval = animateTransform(extraComponents, deltaX, 0);
            extraComponentInterval = animateTransform(extraComponent, -deltaX, 0);

            // Move horizontal actuator endpoints
            let actuatorEndpoints = box.parentNode.querySelectorAll(".endpoint.actuator");
            for (actuatorEndpoint of actuatorEndpoints)
            {
                actuatorEndpointsIntervals.push(animateTransform(actuatorEndpoint, deltaX, 0));
            }
        }
        else
        {
            // Animate actuators parent if not 52 valve
            animateTransform(actuators, deltaX, 0);
        }

        // Animate box
        let boxInterval = animateTransform(box, deltaX, 0, () =>
        {
            // Will execute after this animation is over
            if (valve52)
            {
                actuators.style.transform = moveTransform(actuators.style.transform, deltaX, 0);

                // Simulate box release to update endpoint positions
                graphics.box.boxReleased(box);

                // Remove animation from simulation record
                delete PneumaticSimulation.v52Animations[box.id];
            }
        });

        // Save current intervals in 52 animations to make later cancelling available
        if (valve52)
        {
            PneumaticSimulation.v52Animations[box.id] =
            {
                "boxID": box.id,
                "actuatorID": actuator.id,
                "originalState": originalState,
                "deltaX": deltaX,
                "boxInterval": boxInterval,
                "extraComponentsInterval": extraComponentsInterval,
                "extraComponentInterval": extraComponentInterval,
                "actuatorEndpointsIntervals": actuatorEndpointsIntervals,
                "pathIntervals": pathIntervals,
                "reset": function()
                {
                    // Clear animation intervals
                    clearInterval(boxInterval);
                    clearInterval(extraComponentsInterval);
                    clearInterval(extraComponentInterval);
                    for (let interval of actuatorEndpointsIntervals) clearInterval(interval);
                    for (let interval of pathIntervals) clearInterval(interval);

                    // Revert to original state
                    game.changeBoxState(this.boxID, this.originalState);

                    // Change main air endpoint
                    graphics.endpoints.change52MainAir(document.getElementById(this.boxID, this.originalState));
                }
            };

            // Store the animation controllers
            PneumaticSimulation.store52Controllers(box.id, graphics.actuators.determine52Controllers(actuator));
        }
    }
    else if (valve52)
    {
        // Store an empty animation stud
        PneumaticSimulation.v52Animations[box.id] =
        {
            "actuatorID": actuator.id,
            "reset": function() {}
        }

        // Store the animation controllers
        PneumaticSimulation.store52Controllers(box.id, graphics.actuators.determine52Controllers(actuator));
    }
}

// Improved version of actuator click handler
graphics.actuators.actuatorClick = function(actuator, valve52 = false)
{
    let newState = actuator.getAttribute("newstate");
    let box = actuator.parentNode.parentNode.querySelector("img.pneumatic");
    let originalState = game.getBoxAttrib(box.id, "state");

    // Quit if the box is already positioned according to this actuator
    if (game.getBoxAttrib(box.getAttribute("id"), "state") != newState)
    {
        // Change box state in GOM
        game.changeBoxState(box.id, newState);

        // Move box and actuators graphically
        let actuators = actuator.parentNode;
        let deltaX = - parseInt(newState) * parseInt(graphics.box.pneumaticWidth) / 2;

        // Handle 52 valve
        let extraComponentsInterval, extraComponentInterval;
        let actuatorEndpointsIntervals = [];
        let pathIntervals = [];
        if (valve52)
        {
            // Change the main air endpoint of the 52
            graphics.endpoints.change52MainAir(box, newState);

            // Move connecting paths, if connected to an actuator endpoint
            pathIntervals = graphics.actuators.move52ActuatorPaths(box, deltaX, true);

            // Move extra components
            let extraComponents = box.parentNode.querySelector(".extraComponents");
            let extraComponent = extraComponents.children[0];
            extraComponentsInterval = animateTransform(extraComponents, deltaX, 0);
            extraComponentInterval = animateTransform(extraComponent, -deltaX, 0);

            // Move horizontal actuator endpoints
            let actuatorEndpoints = box.parentNode.querySelectorAll(".endpoint.actuator");
            for (actuatorEndpoint of actuatorEndpoints)
            {
                actuatorEndpointsIntervals.push(animateTransform(actuatorEndpoint, deltaX, 0));
            }
        }
        else
        {
            // Animate actuators parent if not 52 valve
            animateTransform(actuators, deltaX, 0);
        }

        // Animate box
        let boxInterval = animateTransform(box, deltaX, 0, () =>
        {
            // Will execute after this animation is over
            if (valve52)
            {
                actuators.style.transform = moveTransform(actuators.style.transform, deltaX, 0);

                // Simulate box release to update endpoint positions
                graphics.box.boxReleased(box);
            }
        });

        // Schedule spring return for all spring returns except 'roller-spring'
        let springReturn = game.getBoxAttrib(box.id, "springReturn");
        let actuatorType = getActuatorTypeFromSRC(actuator.getAttribute("src"));
        let otherActuator = graphics.actuators.getOtherActuator(box, actuator);

        if (springReturn && actuatorType != "roller" && actuatorType != "spring")
        {
            // Schedule spring return
            setTimeout(() => {
                graphics.actuators.actuatorClick(otherActuator);
            },
            DEFAULT_SETTINGS.simulation.spring_timeout);
        }
    }
}

// Get the other actuator attached to a box
graphics.actuators.getOtherActuator = function(box, firstActuator)
{
    let actuators = box.parentNode.querySelectorAll(".actuator");
    for (let actuator of actuators)
    {
        if (actuator.id != firstActuator.id) return actuator;
    }
}

// Move paths connected to 52 valve actuator endpoints
graphics.actuators.move52ActuatorPaths = function(box, deltaX, animate = false)
{
    let actuatorEndpoints = box.parentNode.querySelectorAll(".endpoint.actuator");
    let allPathIntervals = [];
    for (let actuatorEndpoint of actuatorEndpoints)
    {
        let pathID = game.getPathForEndpoint(actuatorEndpoint.id);
        if (pathID != undefined)
        {
            if (!animate)
                graphics.paths.movePath(pathID, box.id, parseInt(deltaX), 0);
            else
            {
                pathIntervals = graphics.paths.animatePath(pathID, box.id, parseInt(deltaX), 0);
                allPathIntervals.push(...pathIntervals);
            }
        }
    }
    return allPathIntervals;
}
