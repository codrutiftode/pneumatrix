/* Created: 25.05.2020, Codrin Iftode
Contains the core of the simulation software.
Uses the GOM and the Graphics together to simulate
pneumatic behaviour. */

class Simulation
{
    // Constructor
    constructor() {}

    // Initialization method - should be called before any other method
    init(disabledPathColor="#b0b0b0", enabledPathColor="#fcba03")
    {
        this._interval = undefined;
        this._cylinderAnimations = [];
        this._cylinderAnimationStage = false; // Flag to be set when cylinders are to be animated
        this._defaultAirSpeed = 20; // In ms
        this._cylinderLength = 90; // In px
        this._cylinderPosition = 0;
        this.v52Animations = []; // Stores all current 52 valve animations
        this._disabledPathColor = disabledPathColor;
        this._enabledPathColor = enabledPathColor;
        this._airSpeedPercent = 100;
        this._fps = 30; // Default value

        // Constant traversal types enum
        this._traversals =
        {
            "PATH": 0,
            "BOX": 1
        }
        Object.freeze(this._traversals);
    }

    // Renders one frame
    renderFrame(simulationObj)
    {
        if (!this._cylinderAnimationStage)
        {
            // If a refresh is needed
            if (game.simulationRefresh)
            {
                // Reset the colour of all paths
                let paths = document.querySelectorAll("path");
                for (let i = 0; i < paths.length; i++)
                    paths[i].setAttribute("stroke", this._disabledPathColor);

                // Make sure to clear any remnant animations from previous refreshes
                this.v52Animations.splice(0, this.v52Animations.length);

                // Animate 52 valves, considering main air dependencies
                this.mainAir52Traverse([{
                    condition: boxType => boxType == "52valve",
                    callback: params => this.boxCallback52(params)
                }]);

                // Disable refreshing
                game.simulationRefresh = false;

                // Schedule cylinder animations if needed
                this.mainAirTraverse([{
                    condition: boxType => boxType == "CylinderRight" || boxType == "CylinderLeft",
                    callback: params => this.boxCallbackCylinder(params)
                }]);
            }
        }
        else
        {
            this.cylinderAnimate();
        }
    }

    // Starts at an endpoint and keeps going until reaching a dead end
    traversePneumatics(currentEndpointID, boxCallbacks, boxTraversalFunc = undefined, colorPaths = true)
    {
        let traversalType = this._traversals.PATH;
        let deadEnd = false;

        // Until end of path
        while (!deadEnd)
        {
            // If going along path
            if (traversalType == this._traversals.PATH)
            {
                currentEndpointID = this.nextEndpointAlongPath(currentEndpointID, colorPaths);
                if (currentEndpointID == undefined) deadEnd = true;
                else
                    traversalType = this._traversals.BOX;
            }

            // If going through a box
            else
            {
                // If main air, treat it as a dead end
                let box = document.getElementById(currentEndpointID).parentNode.parentNode.querySelector("img.pneumatic");
                if (box == null)
                {
                    deadEnd = true;
                    continue;
                }

                // Get box type
                let boxType = game.getBoxAttrib(box.getAttribute("id"), "type");
                for (let boxCallback of boxCallbacks)
                {
                    if (boxCallback.condition(boxType))
                    {
                        deadEnd = boxCallback.callback({boxType: boxType, boxID: box.id, currentEndpointID: currentEndpointID});
                    }
                }
                if (deadEnd) continue;

                // Move to next endpoint using either default or custom traversal function
                let nextEndpointIDs;
                if (boxTraversalFunc) nextEndpointIDs = boxTraversalFunc(currentEndpointID, box);
                else nextEndpointIDs = this.nextEndpointThroughBox(currentEndpointID, box, game.getBoxAttrib(box.id, "state"));

                // Only one possible next endpoint
                if (nextEndpointIDs && nextEndpointIDs.length == 1)
                {
                    // Set next endpoint
                    currentEndpointID = nextEndpointIDs[0];

                    // Test for dead end, else change traversal type
                    if (currentEndpointID == undefined) deadEnd = true;
                    else traversalType = this._traversals.PATH;
                }
                // More than one possible next endpoint
                else
                {
                    // Finish current traversal
                    deadEnd = true;

                    // Explore all next possible endpoints before ending
                    if (nextEndpointIDs)
                    {
                        for (let nextEndpointID of nextEndpointIDs)
                        {
                            this.traversePneumatics(nextEndpointID, boxCallbacks, boxTraversalFunc, colorPaths);
                        }
                    }
                }
            }
        }
    }

    // Follows all paths starting from main air
    mainAirTraverse(boxCallbacks)
    {
        // Clear any previous traffic valve activations
        game.deactivateTrafficValves();

        // Go through main air endpoints
        let mainAirEndpoints = document.querySelectorAll(".endpoint.mainAir");
        for (let i = 0; i < mainAirEndpoints.length; i++)
        {
            // Traverse starting at the current endpoint
            let currentEndpointID = mainAirEndpoints[i].getAttribute("id");
            this.traversePneumatics(currentEndpointID, boxCallbacks);
        }
    }

    mainAir52Traverse(boxCallbacks)
    {
        // Clear any previous traffic valve activations
        game.deactivateTrafficValves();

        // Create main air graph
        let depGraph = this.createMainAirGraph();
        console.log(depGraph);

        // Inner recursive function for solving sub-dependencies
        function solveDependencies(simulation, endpointID)
        {
            let endpoint = document.getElementById(endpointID);
            if (endpoint.classList.contains("mainAir") && !depGraph[endpointID].resolved)
            {
                // Resolve sub-dependencies
                let dependencies = depGraph[endpointID].dependencies;
                for (let dependecy of dependencies)
                {
                    if (!depGraph[dependecy].resolved)
                    {
                        solveDependencies(simulation, dependency);
                    }
                }

                // If there were sub-dependencies to be resolved
                if (dependencies.length != 0)
                {
                    // Actuate associated box
                    let boxID = endpoint.parentNode.parentNode.querySelector("img.pneumatic").id;
                    for (let anim of simulation.v52Animations)
                    {
                        if (anim.boxID == boxID && simulation.isEffective52Animation(anim))
                        {
                            graphics.actuators.actuatorClick(document.getElementById(anim.endpointID), true);
                        }
                    }
                }

                // Traverse starting at current endpoint
                if (document.getElementById(endpointID).classList.contains("mainAir"))
                {
                    simulation.traversePneumatics(endpointID, boxCallbacks, undefined, false);
                }

                // Set resolved flag
                depGraph[endpointID].resolved = true;
            }
        }

        // Go through all endpoints in graph
        Object.keys(depGraph).forEach(endpointID =>
        {
            solveDependencies(this, endpointID);
        });
    }

    // Creates a main air dependencies graph
    createMainAirGraph()
    {
        // Create main air graph
        let dependenciesGraph = {};
        let mainAirEndpoints = this.getPossibleMainEndpointIDs();
        for (let endpoint of mainAirEndpoints)
        {
            dependenciesGraph[endpoint] = {
                resolved: false,
                dependencies: []
            };
        }

        // Add dependencies
        for (let startEndpoint of mainAirEndpoints)
        {
            let boxTraversalLambda = (endpointID, box) => this.nextEndpointThroughBox_Stateless(endpointID, box);
            this.traversePneumatics(startEndpoint, [{
                condition: (boxType) =>
                {
                    return boxType == "52valve";
                },
                callback: (params) =>
                {
                    // Make sure it is a 52 actuator endpoint, not an output endpoint
                    let currentEndpoint = document.getElementById(params.currentEndpointID);
                    if (currentEndpoint.classList.contains("actuator"))
                    {
                        // Get output endpoints
                        let box = document.getElementById(params.boxID);
                        let outputEndpoints = box.parentNode.querySelectorAll(".endpoint:not(.actuator)");
                        for (let outputEndpoint of outputEndpoints)
                        {
                            // Add dependency to dependencies graph
                            dependenciesGraph[outputEndpoint.id].dependencies.push(startEndpoint);
                        }
                    }
                }
            }],
            boxTraversalLambda,
            false);
        }
        return dependenciesGraph;
    }

    // Box callback for 52 valves
    boxCallback52(params)
    {
        // Test for false actuator endpoint
        let currentEndpoint = document.getElementById(params.currentEndpointID);
        if (!currentEndpoint.classList.contains("actuator"))
            return true;

        // Cancels previous 52 animation if existent (signal on both sides)
        let noPrevAnim = true;
        for (let i = 0; i < this.v52Animations.length; i++)
        {
            if (this.v52Animations[i].boxID == params.boxID)
            {
                this.v52Animations.splice(i, 1);
                noPrevAnim = false;
                break;
            }
        }

        // If no previous animation found
        if (noPrevAnim)
        {
            this.v52Animations.push({boxID: params.boxID, endpointID: params.currentEndpointID});
        }
        return true;
    }

    boxCallbackCylinder(params)
    {
        // Schedule cylinder animation if not already in position
        let outstroked = game.getBoxAttrib(params.boxID, "outstroked");
        let outstrokeEndpointID = game.getBoxAttrib(params.boxID, "outstrokeEndpointID");
        let direction = (params.boxType == "CylinderRight" ? "right" : "left");

        // Test if current cylinder has animation from other side
        let index = -1;
        for (let i = 0; i < this._cylinderAnimations.length; i++)
        {
            if (this._cylinderAnimations[i].boxID == params.boxID)
            {
                index = i;
                break;
            }
        }
        if (index != -1)
        {
            // Update animation for air from both sides
            this._cylinderAnimations[index].outstroke = true;
            this._cylinderAnimations[index].speedCorrection = (outstroked ? 0 : 0.1);
        }
        else
        {
            this._cylinderAnimations.push({"boxID": params.boxID, "outstroke": params.currentEndpointID == outstrokeEndpointID, "direction": direction, "speedCorrection": 1});
        }

        // Schedule cylinder animation stage
        this._cylinderAnimationStage = true;
        game.simulationRefresh = false;
        return false;
    }

    // Sets the stroke color for a certain path
    colorPath(pathID, color)
    {
        let path = document.getElementById(pathID);
        if (path == undefined) console.log("Error.");
        else path.setAttribute("stroke", color);
    }

    // Gets all possible main air enpdoints
    getPossibleMainEndpointIDs()
    {
        let mainAirEndpoints = document.getElementById("mainAir").querySelectorAll(".endpoint.mainAir");
        let mainAirEndpointIDs = Array.from(mainAirEndpoints).map(elem => elem.id);
        let pneumatics = document.querySelectorAll("img.pneumatic");
        for (let pneumatic of pneumatics)
        {
            if (game.getBoxAttrib(pneumatic.id, "type") == "52valve")
            {
                let endpoints = pneumatic.parentNode.querySelectorAll(".endpoint:not(.actuator)");
                mainAirEndpointIDs.push(...Array.from(endpoints).map(elem => elem.id));
            }
        }

        return mainAirEndpointIDs;
    }

    // Animates a cylinder outstroke or instroke - assume full speed for now
    cylinderAnimate()
    {
        // Remove all cancelled animations
        for (let i = this._cylinderAnimations.length - 1; i >= 0; i--)
        {
            if (this._cylinderAnimations[i].cancelled)
            {
                this._cylinderAnimations.splice(i, 1);
            }
        }

        // For all scheduled cylinders
        for (let i = 0; i < this._cylinderAnimations.length; i++)
        {
            let anim = this._cylinderAnimations[i];

            // Check if the box to be animated still exists
            let box = document.getElementById(anim.boxID);
            if (!box) // NEEDS TESTING
            {
                anim.cancelled = true;
                continue;
            }

            // Get piston
            let piston = document.getElementById(anim.boxID).parentNode.querySelector(".extraComponents").children[0];

            // Outrsoke cylinder
            if (anim.outstroke == true)
            {
                // Check for already in position
                let x = breakTransform(piston.style.transform).x;
                let deltaX = Math.abs(x) - this._cylinderLength;
                if (deltaX == 0)
                {
                    // Stop animation
                    anim.cancelled = true;
                    game.setBoxAttrib(anim.boxID, "outstroked", true);
                    continue;
                }
                else
                {
                    let speed = Math.round(this.calculateCylinderSpeed(anim.boxID) * anim.speedCorrection);
                    speed = (-deltaX < speed ? -deltaX : speed);
                    let amount = (anim.direction == "right" ? speed : -speed);
                    piston.style.transform = moveTransform(piston.style.transform, amount, 0);
                }
            }
            // Instroke cylinder
            else
            {
                // Check for already in position
                let x = breakTransform(piston.style.transform).x;
                if (x == 0)
                {
                    // Stop animation
                    anim.cancelled = true;
                    game.setBoxAttrib(anim.boxID, "outstroked", false);
                    continue;
                }
                else
                {
                    let speed = Math.round(this.calculateCylinderSpeed(anim.boxID) * anim.speedCorrection);
                    speed = (Math.abs(x) < speed ? Math.abs(x) : speed);
                    let amount = (anim.direction == "right" ? -speed : speed);
                    piston.style.transform = moveTransform(piston.style.transform, amount, 0);
                }
            }

            // Actuate any roller in the path - just one roller supported for now
            let roller = this.getOverlappingRoller(piston);
            if (roller)
                graphics.actuators.actuatorClick(document.getElementById(roller));
        }

        // Stop cylinder animations when over
        if (this._cylinderAnimations.length == 0)
        {
            this._cylinderAnimationStage = false;
        }
    }

    // TRAVERSAL FUNCTION: Returns the next endpoint following a path
    nextEndpointAlongPath(currentEndpointID, colorPath)
    {
        let results = game.followPath(currentEndpointID);
        if (results == undefined) currentEndpointID = undefined;
        else
        {
            currentEndpointID = results.pairedEndpointID;
            if (colorPath) this.colorPath(results.pathID, this._enabledPathColor);
        }
        return currentEndpointID;
    }

    // TRAVERSAL FUNCTION: Returns the next endpoints going through a box
    nextEndpointThroughBox(currentEndpointID, box, currentState, stateless=false)
    {
        // Read the current box attributes
        let boxID = box.id;
        let type = game.getBoxAttrib(boxID, "type");
        let conf = VALVE_CONF[type];

        // Handle shuttle valve
        if (type == "ShuttleValve")
        {
            // If the shuttle valve has not been activated from another main air source already
            if (game.getBoxAttrib(boxID, "activated") && !stateless)
                return undefined;

            let deadEnd = true;
            Object.keys(conf).forEach(key =>
            {
                let endpointPair = conf[key];
                let endpoint0 = graphics.endpoints.getEndpointFromConf(boxID, endpointPair[0]);
                let endpoint1 = graphics.endpoints.getEndpointFromConf(boxID, endpointPair[1]);

                if (endpoint0 == currentEndpointID)
                {
                    currentEndpointID = endpoint1;
                    deadEnd = false;
                }
            });

            // Handles the case when the shuttle valve is reached from the output endpoint
            if (deadEnd) return undefined;

            // Change the traversed state of the shuttle valve
            if (!stateless)
            {
                game.setBoxAttrib(boxID, "activated", true);
            }
            return [currentEndpointID];
        }
        else if (type == "TPiece")
        {
            // Only traverse the t piece once
            if (game.getBoxAttrib(boxID, "activated"))
                return undefined;

            // Get next endpoints
            let nextEndpointIDs = [];
            for (let endpointNo of conf)
            {
                let endpointID = graphics.endpoints.getEndpointFromConf(boxID, endpointNo);
                if (endpointID != currentEndpointID) nextEndpointIDs.push(endpointID);
            }

            // Activate t piece
            if (!stateless)
            {
                game.setBoxAttrib(boxID, "activated", true);
            }
            return nextEndpointIDs;
        }

        // Get the two paired endpoints
        let endpointPair = conf[currentState];
        let endpoint0 = graphics.endpoints.getEndpointFromConf(boxID, endpointPair[0]);
        let endpoint1 = graphics.endpoints.getEndpointFromConf(boxID, endpointPair[1]);

        // Determine the next endpoint to travel to
        if (endpoint0 == currentEndpointID) currentEndpointID = endpoint1;
        else if (endpoint1 == currentEndpointID) currentEndpointID = endpoint0;
        else
        {
            // It is a dead end
            return undefined;
        }
        return [currentEndpointID];
    }

    // TRAVERSAL FUNCTION: Returns endpoint through box, without taking into consideration box state
    nextEndpointThroughBox_Stateless(currentEndpointID, box)
    {
        let boxID = box.id;
        let boxType = game.getBoxAttrib(boxID, "type");
        let conf = VALVE_CONF[boxType];
        let nextEndpointIDs = [];

        if (boxType == "32valve")
        {
            // Get 32valve endpoints
            let valveEndpoints = [];
            for (let i = 0; i < 3; i++)
                valveEndpoints.push(graphics.endpoints.getEndpointFromConf(boxID, i));

            // Check current endpoint
            if (currentEndpointID == valveEndpoints[0])
                nextEndpointIDs.push(valveEndpoints[1], valveEndpoints[2]);
            else
                nextEndpointIDs.push(valveEndpoints[0]);
        }
        else
        {
            // Get next endpoints
            nextEndpointIDs = this.nextEndpointThroughBox(currentEndpointID, box, game.getBoxAttrib(box.id, "state"), true);
            return nextEndpointIDs;
        }

        // Return next endpoints
        return nextEndpointIDs;
    }

    // Second version of calculate cylinder speed
    calculateCylinderSpeed(cylinderID)
    {
        let endpoints = game.canvas.getEndpointsForBox(cylinderID);
        let currentAirFlow = 1;

        // Go from each endpoint of the cylinder until dead ends
        for (let endpoint of endpoints)
        {
            let currentEndpointID = endpoint.endpointID;
            let isAirComingIn = graphics.endpoints.isAirComingIn(cylinderID, currentEndpointID);

            // Traverse from current endpoint
            this.traversePneumatics(currentEndpointID, [{
                condition: (boxType) => boxType == "FlowRestrictor",
                callback: (params) => {

                    // Get required values
                    let box = document.getElementById(params.boxID);
                    let dialValue = box.parentNode.querySelector(".flowRestrictorDial").value;
                    let state = game.getBoxAttrib(params.boxID, "state");
                    let conf = VALVE_CONF[params.boxType];
                    let isRestrictingEndpoint = (params.currentEndpointID == graphics.endpoints.getEndpointFromConf(params.boxID, conf[state][0]));

                    // Update current air flow
                    if (isRestrictingEndpoint ^ isAirComingIn)
                        currentAirFlow *= Number(dialValue);
                }
            }]);
        }

        // Return the current cylinder speed
        let speed = Math.round(currentAirFlow * this._defaultAirSpeed);
        return speed;
    }

    // Returns the overlapped roller if any
    getOverlappingRoller(piston)
    {
        // Get all rollers from GOM
        let rollers = game.canvas.getAllRollers();
        for (let i = 0; i < rollers.length; i++)
        {
            if (isRectOverlapping(document.getElementById(rollers[i]), piston))
            {
                return rollers[i];
            }
        }
    }

    // Tests if a 52 animation is effective
    isEffective52Animation(anim)
    {
        let oldstate = game.getBoxAttrib(anim.boxID, "state")
        let newstate = document.getElementById(anim.endpointID).getAttribute("newstate");
        return newstate != oldstate;
    }

    // Call to start pumping air on another thread
    start(fps)
    {
        // Set the refresh flag
        game.simulationRefresh = true;

        // Repeat renderFrame at an interval
        this._fps = fps;
        let simulationObj = this;
        this._interval = setInterval(function() {
            simulationObj.renderFrame();
        }, (1000 / fps));
    }

    // Stops the simulation
    stop()
    {
        clearInterval(this._interval);

        // Color all paths with the disabled color
        let paths = document.querySelectorAll("path");
        for (let i = 0; i < paths.length; i++)
            this.colorPath(paths[i].getAttribute("id"), this._disabledPathColor);
    }
}


// Global object for the simulation
let PneumaticSimulation = new Simulation();
