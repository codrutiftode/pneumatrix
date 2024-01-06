// Returns the x and y coords of a transform string
function breakTransform(tranformString)
{
    let regex = /-?\d+/g;
	let matches = tranformString.match(regex);
	let results = {"x":parseInt(matches[0]), "y":parseInt(matches[1])};
    return results;
}

// Move an object by changing its transform
function moveTransform(transformString, deltaX, deltaY)
{
    let transform = breakTransform(transformString);
    transform.x += deltaX;
    transform.y += deltaY;
    return "translate(" + transform.x + "px, " + transform.y + "px)";
}

function animateTransform(obj, deltaX, deltaY, finalCallback = undefined)
{
    let t = breakTransform(obj.style.transform);
    const finalY = t.y + deltaY;
    const finalX = t.x + deltaX;
    const dx = deltaX == 0 ? 0 : deltaX / Math.abs(deltaX);
    const dy = deltaY == 0 ? 0 : deltaY / Math.abs(deltaY);

    let interval = setInterval(function()
    {
        if (t.x != finalX || t.y != finalY)
        {
            t.x += dx;
            t.y += dy;
            obj.style.transform = "translate(" + (t.x != finalX ? t.x : finalX) + "px, " + (t.y != finalY ? t.y : finalY) + "px)";
        }
        else
        {
            clearInterval(interval);
            if (finalCallback) finalCallback();
        }
    }, DEFAULT_SETTINGS.graphics.actuatorMs);

    // Returns interval in case it needs to be externally cancelled
    return interval;
}

// Resizes a transform to new screen dimensions and returns a delta transform
function resizeTransform(transform, width1, height1, width2, height2)
{
    let newX = Math.round(transform.x * width2 / width1);
    let newY = Math.round(transform.y * height2 / height1);
    return {"dx": newX - transform.x, "dy": newY - transform.y};
}

// Resizes only one coordinate to the new screen dimensions (resizeRatio = dim2 / dim1)
function resizeCoordinate(coord, resizeRatio)
{
    return Math.round(coord * resizeRatio);
}

// Breaks the src of an actuator and returns its type - using regex
function getActuatorTypeFromSRC(src)
{
    let type;
    let regex = /(?:created\/)(.+)(?:-actuator.svg)/g;
    let matches = regex.exec(src);

    // 52valve actuator endpoint
    if (matches == null) return "endpoint";
    else return matches[1];
}

// Get src of rotated pneumatic file (angle is 0, 90, 180 or 270)
function getRotatedSRC(src, angle)
{
    let regex = /(.+)_(?:.+.svg)/;
    let matches = regex.exec(src);
    if (matches == null) console.log("Error when calculating rotated src.");
    else
    {
        return matches[1] + "_" + angle + ".svg";
    }
}

// Get the rotation angle of a pneumatic based on a src
function getRotationAngleFromSRC(src)
{
    let regex = /(?:_)(.+)(?:\.svg)/;
    let matches = src.match(regex);
    if (matches == null)
    {
        console.log("Error when calculation rotation angle from src.");
        return 0;
    }
    else return Number(matches[1]);
}

// Breaks the src of a flow restrictor and returns its direction - using regex
function getRestrictorDirFromSrc(src)
{
    let regex = /left/;
    let matches = src.match(regex);
    return (matches != null ? "left" : "right");
}

// Replaces a direction in the src of a flow restrictor
function setRestrictorDirInSrc(src, dir)
{
    let regex = /left|right/;
    return src.replace(regex, dir);
}

// Checks if two rects are overlapping each other - in the format returned by getRect()
function isRectOverlapping(elem1, elem2)
{
    let rect1 = elem1.getBoundingClientRect();
    let rect2 = elem2.getBoundingClientRect();

    let xf = rect1.x + rect1.width;
    let yf = rect1.y + rect1.height;
    let points2 =
    [
        {"x": rect2.x, "y": rect2.y},
        {"x": rect2.x + rect2.width, "y": rect2.y},
        {"x": rect2.x, "y": rect2.y + rect2.height},
        {"x": rect2.x + rect2.width, "y": rect2.y + rect2.height}
    ];

    // Test if any of the 4 points of rect2 inside rect1
    for (let i = 0; i < points2.length; i++)
    {
        if (rect1.x <= points2[i].x && points2[i].x <= xf)
        {
            if (rect1.y <= points2[i].y && points2[i].y <= yf)
            {
                return true;
            }
        }
    }
    return false;
}

// Replaces character at index - meddles with the JS Core Library, might be a bit problematic
String.prototype.replaceChar = function(index, replacement)
{
    return this.substr(0, index) + replacement + this.substr(index + 1, this.length);
}

// Makes the pneumatic type presentable
function beautifyPneumaticType(type)
{
    let uppercase_regex = /(?:[a-z])([A-Z])/g;
    let digitletter_regex = /(?:\d)([a-z])/g;

    // Put spaces before uppercase characters
    let match;
    let beautified = type;
    let shift = 0;
    while ((match = uppercase_regex.exec(type)) != null)
    {
        beautified = beautified.replaceChar(match.index + match[0].length - 1 + shift, " " + match[1]);
        shift++;
    }

    // Turn lowercase characters after digits into uppercase and put a space before them
    match = digitletter_regex.exec(beautified);
    if (match != null)
    {
        beautified = beautified.replaceChar(match.index + 1, " " + match[1].toUpperCase());
    }
    return beautified;
}

// Initiates the download of a file
function downloadFile(filename, text)
{
    let link = document.createElement('a');
    link.style.display = "none";
    link.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Loads settings from local storage
function loadSettings()
{
    // Read local storage
    let fps = localStorage.settings_simulation_fps || DEFAULT_SETTINGS.simulation.fps;
    let maEndpoints = localStorage.settings_simulation_ma_endpoints || DEFAULT_SETTINGS.simulation.ma_endpoints;

    // Setup the settings menu
    let containerSettingsFPS = document.getElementById("settings_FPS");
    let containerMAEndpoints = document.getElementById("settings_MAEndpoints");
    containerSettingsFPS.value = fps;
    containerMAEndpoints.value = maEndpoints;
}

// Saves settings to local storage
function saveSettings()
{
    let containerFPS = document.getElementById("settings_FPS");
    localStorage.settings_simulation_fps = containerFPS.value;

    let containerMAEndpoints = document.getElementById("settings_MAEndpoints");
    let maEndpoints = Number(containerMAEndpoints.value);
    if (maEndpoints != graphics.structure.noVerticalSegments)
    {
        localStorage.settings_simulation_ma_endpoints = containerMAEndpoints.value;

        // Resize main air line
        graphics.structure.setMainAirLength(Number(containerMAEndpoints.value), true);
    }
}

// Delete all settings from local storage
function resetSettings()
{
    for (let attr in localStorage)
    {
        if (attr.startsWith("settings_"))
        {
            delete localStorage[attr];
        }
    }
}
