/*
Name: GOM - Game Object Model (same concept as the DOM)
Description: Implements individual OOP structures for keeping track of objects on a canvas
*/

// Stores details about a single endpoint
class Endpoint
{
    constructor(endpointID, boxID)
    {
        this._endpointID = endpointID;
        this._boxID = boxID;
    }

    get endpointID() { return this._endpointID; }
    set endpointID(id) { this._endpointID = id; }
    get boxID() { return this._boxID; }
    set boxID(id) { this._boxID = id; }

    /* Custom methods */
}

// Stores the id and the state that an actuator object changes
// a pneumatic box to.
class Actuator
{
    constructor(actuatorID, actuatorType, newState)
    {
        this._actuatorID = actuatorID;
        this._actuatorType = actuatorType;
        this._newState = newState;
    }

    get actuatorID() { return this._actuatorID; }
    set actuatorID(id) { this._actuatorID = id; }
    get actuatorType() { return this._actuatorType; }
    set actuatorType(type) {this._actuatorType = type; }
    get newState() { return this._newState; }
    set newState(state) { this._newState = state; }

    /* Custom methods */
}

// Path between two endpoints
class Path
{
    constructor(pathID, endpointStart, endpointEnd)
    {
        this._pathID = pathID;
        this._endpointStart = endpointStart;
        this._endpointEnd = endpointEnd;
    }

    get pathID() { return this._pathID; }
    get endpointStart() { return this._endpointStart; }
    get endpointEnd() { return this._endpointEnd; }

    /* Custom methods */

    // Returns the paired endpoint if there is one; else returns undefined
    getPairedEndpoint(endpointID)
    {
        if (this._endpointStart == endpointID) return this._endpointEnd;
        else if (this._endpointEnd == endpointID) return this._endpointStart;
        else return undefined;
    }
}

// Pneumatic box
class Box
{
    // @params:
    // endpoints - Endpoint[], actuators - Actuator[]
    constructor(boxID, boxType, endpoints, actuators, state, springReturn)
    {
        this.__init__(boxID, boxType, endpoints, actuators, state, springReturn);
    }

    // Init function
    __init__(boxID, boxType, endpoints, actuators, state, springReturn)
    {
        this._endpoints = endpoints;
        this._boxID = boxID;
        this._boxType = boxType;
        this._actuators = actuators;
        this._state = state;
        this._springReturn = springReturn;
    }

    get boxID() { return this._boxID; }
    get state() { return this._state; }
    set state(s) { this._state = s; }
    get conf() { return VALVE_CONF[this._boxType]; }
    get type() { return this._boxType; }
    get endpoints() { return this._endpoints; }
    get springReturn() { return this._springReturn; }
    get actuable() {return this._actuators.length != 0 || this._boxType == "52valve"}

    /* Custom methods */

    // Returns all the actuators which are of roller type
    getRollerActuatorIDs()
    {
        let ids = [];
        for (let i = 0; i < this._actuators.length; i++)
        {
            if (this._actuators[i].actuatorType == "roller")
            {
                ids.push(this._actuators[i].actuatorID);
            }
        }
        return ids;
    }
}

// Cylinder
class Cylinder extends Box
{
    constructor(boxID, boxType, endpoints, actuators, state)
    {
        super(boxID, boxType, endpoints, actuators, state);
        this.outstroked = false;

        if (boxType == "CylinderRight") this.outstrokeEndpointID = endpoints[0].endpointID;
        else if (boxType == "CylinderLeft") this.outstrokeEndpointID = endpoints[1].endpointID;
    }

    /* Custom methods */
}

// Flow Restrictor
class FlowRestrictor extends Box
{
    constructor(boxID, boxType, endpoints, actuators, state)
    {
        super(boxID, boxType, endpoints, actuators, state);
        this._dialValue = 1.0;
    }

    set dialValue(val) {this._dialValue = val;}
    get dialValue() {return this._dialValue;}
}

// Traffic valve - either shuttle valve or t piece
class TrafficValve extends Box
{
    constructor(boxID, boxType, endpoints, actuators, state)
    {
        super(boxID, boxType, endpoints, actuators, state);
        this._activated = false;
    }

    set activated(val) {this._activated = val;}
    get activated() {return this._activated;}
}

// Main Air line and endpoints
class MainAir
{
    // @params:
    // endpoints - Endpoint[]
    constructor()
    {
        this._endpoints = [];
        this._connections = [];
    }

    // Getter
    get endpoints() {return this._endpoints; }

    /* Custom methods */
    isMainAirEndpoint(endpointID) // - using linear search
    {
        for (let endpoint of this._endpoints)
        {
            if (endpoint.endpointID == endpointID)
                return true;
        }
        return false;
    }

    addEndpoint(endpointID, boxID)
    {
        this._endpoints.push(new Endpoint(endpointID, boxID));
        this._connections.push(false);
    }

    // Sets the connected attribute of a main air endpoint - using linear search
    connectEndpoint(endpointID, connected)
    {
        for (let i = 0; i < this._endpoints.length; i++)
        {
            if (this._endpoints[i].endpointID == endpointID)
            {
                this._connections[i] = connected;
            }
        }
    }

    // Get current connection state of a main air endpoint - using linear search
    isEndpointConnected(endpointID)
    {
        for (let i = 0; i < this._endpoints.length; i++)
        {
            if (this._endpoints[i].endpointID == endpointID)
            {
                return this._connections[i];
            }
        }

        // Only reached when endpoint not on main air
        return false;
    }
}

class Canvas
{
    // @params:
    // boxes - Box[]
    // mainAir - MainAir
    constructor()
    {
        this._boxes = [];
        this.mainAir = new MainAir();
    }

    // Getters
    get boxes() {return this._boxes;}

    /* Custom methods */
    addBox(boxID, boxType, endpoints, actuators, state, springReturn)
    {
        let newBox = null;
        if (boxType == "CylinderRight" || boxType == "CylinderLeft")
            newBox = new Cylinder(boxID, boxType, endpoints, actuators, state);
        else if (boxType == "FlowRestrictor")
            newBox = new FlowRestrictor(boxID, boxType, endpoints, actuators, state);
        else if (boxType == "ShuttleValve" || boxType == "TPiece")
            newBox = new TrafficValve(boxID, boxType, endpoints, actuators, state);
        else
            newBox = new Box(boxID, boxType, endpoints, actuators, state, springReturn);

        // Append new box
        this._boxes.push(newBox);
    }

    // Deletes a pneumatic box from GOM
    deleteBox(boxID)
    {
        for (let i = 0; i < this._boxes.length; i++)
        {
            if (this._boxes[i].boxID == boxID)
            {
                this._boxes.splice(i, 1);
                break;
            }
        }
    }

    // Change a box's state
    changeBoxState(boxID, newState)
    {
        for (let i = 0; i < this._boxes.length; i++)
        {
            if (this._boxes[i].boxID == boxID)
            {
                this._boxes[i].state = newState;
                break;
            }
        }
    }

    // Returns all endpoints for a box - using linear search
    getEndpointsForBox(boxID)
    {
        for (let i = 0; i < this._boxes.length; i++)
        {
            if (this._boxes[i].boxID == boxID)
            {
                return this._boxes[i].endpoints;
            }
        }
    }

    // Returns the box attribute - using linear search
    getBoxAttrib(boxID, attrib)
    {
        for (let i = 0; i < this._boxes.length; i++)
        {
            if (this._boxes[i].boxID == boxID)
            {
                return this._boxes[i][attrib];
            }
        }
    }

    // Sets the box attribute - using linear search
    setBoxAttrib(boxID, attrib, value)
    {
        for (let i = 0; i < this._boxes.length; i++)
        {
            if (this._boxes[i].boxID == boxID)
            {
                this._boxes[i][attrib] = value;
                return;
            }
        }
    }

    // Get all rollers on the canvas
    getAllRollers()
    {
        let rollers = [];
        for (let i = 0; i < this._boxes.length; i++)
        {
            let rollerActuators = this._boxes[i].getRollerActuatorIDs();
            rollers.push(...rollerActuators);
        }
        return rollers;
    }

    // Deactivate shuttle valves
    deactivateTrafficValves()
    {
        for (let i = 0; i < this._boxes.length; i++)
        {
            if (this._boxes[i].type == "ShuttleValve" || this._boxes[i].type == "TPiece")
            {
                this._boxes[i].activated = false;
            }
        }
    }
}

// Integrates everything in one construct
class Game
{
    constructor()
    {
        this._canvas = new Canvas();
        this._paths = []; // Array of Path objects
        this.pneumaticBoxesCounter = 0;
        this.endpointCounter = 0;
        this.pathCounter = 0;
        this.actuatorCounter = 0;

        // Used by Simulation
        this.simulationRefresh = false;

        // Constants
        this.stateLeft = -1;
        this.stateRight = 1;
    }

    // Initialization function
    init()
    {
        // Get main air endpoints
        let endpoints = document.getElementById("mainAir").querySelector(".endpoints").querySelectorAll(".endpoint");
        for (let i = 0; i < endpoints.length; i++)
        {
            this._canvas.mainAir.addEndpoint(endpoints[i].getAttribute("id"), "mainAir");
        }
    }

    // Getters
    get canvas() { return this._canvas; }
    get paths() { return this._paths; }

    // Create pneumatic box in GOM
    createBox(boxID, boxType)
    {
        let endpoints = [];
        let actuators = [];

        // Get dom elements
        let box = document.getElementById(boxID);
        let domEndpointsContainer = box.parentNode.querySelector(".endpoints");

        // Create endpoints
        if (domEndpointsContainer != undefined)
        {
            let domEndpoints = domEndpointsContainer.querySelectorAll(".endpoint");
            for (let i = 0; i < domEndpoints.length; i++)
            {
                endpoints.push(new Endpoint(domEndpoints[i].getAttribute("id"), boxID));
            }
        }

        // Create actuators
        let springReturn = false;
        let domActuators = box.parentNode.querySelectorAll(".actuator");
        for (let i = 0; i < domActuators.length; i++)
        {
            let type = getActuatorTypeFromSRC(domActuators[i].getAttribute("src"));
            actuators.push(new Actuator(domActuators[i].getAttribute("id"), type, domActuators[i].getAttribute("newState")));

            // Set the spring return flag if needed
            if (type == "spring") springReturn = true;
        }

        // Construct box onto the canvas
        this._canvas.addBox(boxID, boxType, endpoints, actuators, this.stateRight, springReturn);
    }

    // Wrapper for the delete box method in Canvas
    deleteBox(boxID)
    {
        this._canvas.deleteBox(boxID);
        this.simulationRefresh = true;
    }

    // Wrapper for the Canvas method of the same name
    changeBoxState(boxID, newState)
    {
        this._canvas.changeBoxState(boxID, newState);
        this.simulationRefresh = true;
    }

    // Retrieves the specified box attribute
    getBoxAttrib(boxID, attrib)
    {
        return this._canvas.getBoxAttrib(boxID, attrib);
    }

    // Sets a specific box attribute
    setBoxAttrib(boxID, attrib, value)
    {
        this._canvas.setBoxAttrib(boxID, attrib, value);
    }

    // Creates a path object and appends it to the internal array
    createPath(pathID, endpointStartID, endpointEndID)
    {
        this._paths.push(new Path(pathID, endpointStartID, endpointEndID));
        this.simulationRefresh = true;
    }

    // Deletes a path using linear search
    deletePath(pathID)
    {
        for (let i = 0; i < this._paths.length; i++)
        {
            if (this._paths[i].pathID == pathID)
            {
                this._paths.splice(i, 1);
                break;
            }
        }
        this.simulationRefresh = true;
    }

    // Returns the endpoints for a path
    getEndpointsForPath(pathID)
    {
        // Find path using linear search
        for (let i = 0; i < this._paths.length; i++)
        {
            if (this._paths[i].pathID == pathID)
            {
                let path = this._paths[i];
                return [path.endpointStart, path.endpointEnd];
            }
        }
    }

    // Returns the associated paths of a pneumatic box
    getPathsForBox(boxID)
    {
         let endpoints = this._canvas.getEndpointsForBox(boxID);
         let paths = [];

         for (let i = 0; i < this._paths.length; i++)
         {
             // Strip last character from endpoints
             let endpointStartID = this._paths[i].endpointStart;
             let endpointEndID = this._paths[i].endpointEnd;

             // Check for first endpoint
             let isAssociated = false;
             for (let j = 0; j < endpoints.length; j++)
             {
                 isAssociated = isAssociated || endpoints[j].endpointID == endpointStartID || endpoints[j].endpointID == endpointEndID;
                 isAssociated = isAssociated || endpoints[j].endpointID == endpointEndID || endpoints[j].endpointID == endpointEndID;
                 if (isAssociated)
                 {
                     paths.push(this._paths[i].pathID);
                     break;
                 }
             }
         }

         return paths;
    }

    // Checks if the path is starting at the given box
    pathStartsAt(pathID, boxID)
    {
        let boxEndpoints = this._canvas.getEndpointsForBox(boxID);
        let startsAt = false;

        // Find path using linear search
        for (let i = 0; i < this._paths.length; i++)
        {
            if (this._paths[i].pathID == pathID)
            {
                // Test the start endpoint against all the boxes endpoints
                let endpointStartID = this._paths[i].endpointStart;
                for (let j = 0; j < boxEndpoints.length; j++)
                {
                    if (endpointStartID == boxEndpoints[j].endpointID)
                    {
                        startsAt = true;
                        break;
                    }
                }
                break;
            }
        }
        return startsAt;
    }

    // Checks if the path is ending at the given box
    pathEndsAt(pathID, boxID)
    {
        let boxEndpoints = this._canvas.getEndpointsForBox(boxID);
        let endsAt = false;

        // Find path using linear search
        for (let i = 0; i < this._paths.length; i++)
        {
            if (this._paths[i].pathID == pathID)
            {
                // Test the start endpoint against all the boxes endpoints
                let endpointEndID = this._paths[i].endpointEnd;
                for (let j = 0; j < boxEndpoints.length; j++)
                {
                    if (endpointEndID == boxEndpoints[j].endpointID)
                    {
                        endsAt = true;
                        break;
                    }
                }
                break;
            }
        }
        return endsAt;
    }

    // Returns a dict with the path id and other endpoint
    followPath(endpointID)
    {
        let results = {};
        for (let i = 0; i < this._paths.length; i++)
        {
            let pairedEndpoint = this._paths[i].getPairedEndpoint(endpointID);
            if (pairedEndpoint != undefined)
            {
                results.pairedEndpointID = pairedEndpoint;
                results.pathID = this._paths[i].pathID;
                return results;
            }
        }
    }

    // Returns the path containing an endpoint (might return undefined) - using linear search
    getPathForEndpoint(endpointID, returnStart = false)
    {
        for (let path of this._paths)
        {
            if (path.endpointStart == endpointID || path.endpointEnd == endpointID)
            {
                if (returnStart)
                    return {"pathID": path.pathID, "startsAt": path.endpointStart == endpointID};
                else
                    return path.pathID;
            }
        }
    }

    // Shortcute to canvas method
    deactivateTrafficValves()
    {
        this._canvas.deactivateTrafficValves();
    }

    // Reads data from a dictionary and sets its own parameters
    readFromData(dataDict, thisObject = this)
    {
        for (let attr in dataDict)
        {
            if (typeof dataDict[attr] == "object")
            {
                // Instantiate empty objects first if in an array
                if (Array.isArray(dataDict[attr]))
                {
                    for (let i = 0; i < dataDict[attr].length; i++)
                    {
                        switch(attr)
                        {
                            case "_paths":
                                thisObject[attr][i] = new Path(null, null, null);
                                break;
                            case "_endpoints":
                                thisObject[attr][i] = new Endpoint(null, null);
                                break;
                            case "_actuators":
                                thisObject[attr][i] = new Actuator(null, null, null);
                                break;
                            case "_boxes":
                                // Determine prototype
                                let proto = null;
                                if (dataDict[attr][i].outstroked != undefined) proto = Cylinder.prototype;
                                else if (dataDict[attr][i]._dialValue != undefined) proto = FlowRestrictor.prototype;
                                else if (dataDict[attr][i]._activated != undefined) proto = TrafficValve.prototype;
                                else proto = Box.prototype;

                                // Create new object
                                thisObject[attr][i] = Object.create(proto);
                                thisObject[attr][i].__init__(null, null, [], [], null, null);
                                break;
                            default:
                                break;
                        }
                    }
                }

                // Go through copying children without removing proto
                this.readFromData(dataDict[attr], thisObject[attr]);
            }
            else
            {
                // Copy each attribute
                thisObject[attr] = dataDict[attr];
            }
        }
    }
}

// Global Game object
let game = new Game();
