/* Created: 11.07.2020, Codrin Iftode
Has functions for rotating and flipping different pneumatic boxes. */

// Global namespace
let transformer = {};

// Flips a box horizontally
transformer.flipX = function()
{
    let boxID = document.getElementById("currentPneumaticId").innerHTML;
    let box = document.getElementById(boxID);
    let boxType = game.getBoxAttrib(boxID, "type");

    if (boxType == "FlowRestrictor")
    {
        let state = game.getBoxAttrib(boxID, "state");
        let direction = getRestrictorDirFromSrc(box.src);
        let newDirection = (direction == "left" ? "right" : "left");

        // Switch flow restrictor parameters
        box.src = setRestrictorDirInSrc(box.src, newDirection);
        game.setBoxAttrib(boxID, "state", -state);
    }
}
