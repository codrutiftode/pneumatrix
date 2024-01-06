// Change the settings GUI
MENUS_HTML["settings"] = `
<div class="guiMenu">
  <h1>Settings</h1>
  <p>We are sorry, but this is a feature only available for school license users... &#x1F622;&#x1F622;&#x1F622;
  <br>But do not be discouraged! There are many more features in this app that are actually available to you.
  <br>
  <br>If you are interested in purchasing a school license, please visit:<br>
  <i style="color: darkcyan; font-family: Arial;">www.pneumatrix.co.uk</i>
  </p>
</div>
`;

for (let toolboxSymbol of TOOLBOX_SYMBOLS) 
{
  if (toolboxSymbol.name == "TPiece" || toolboxSymbol.name == "ShuttleValve") 
  {
    toolboxSymbol.disabled = "DISABLED"; // Special property to make them appear in the toolbox, but without interactions
    toolboxSymbol.desc = toolboxSymbol.desc + "<br>(Only School License)";
  }
}
