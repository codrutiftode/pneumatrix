/* Created by Codrin Iftode on 22/07/2020.
Creates a gloabal dictionary with the html for
each of the menus */

let MENUS_HTML = {
  // Info html
  info: `
    <div class="guiMenu">
        <h1>
            <img src="public/favicon.svg" style="display: block; float: none; position: relative; left: 0; right: 0; margin: auto; width: 12%;">
            <div>Pneumatrix</div>
            <i style=" font-size: 12px; color: gray;">A Pneumatics Simulator</i>
        </h1>
        <p>This is (hopefully) one of the best software apps out there for simulating pneumatic circuits. If you ever feel like you need help with how it works (after all, I am also sometimes puzzled by software, even my own), this page will be here for you.</p>

        <h3>Video Tutorial</h3>
        <p>
            <iframe id="videoTutorial" width="560" height="315" src="https://www.youtube.com/embed/VDOoBf81BwM" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </p>

        <h3>The Toolbox</h3>
        <p>
            <img src="app/res/tutorial/toolbox.png"><br><br>The toolbox contains everything you might be looking for in this app.
            <br><br>
            You can click on a pneumatic symbol and drag it into the empty rest of the screen. When you drop it, it will remain there,
            and then you can drag it again to change its position.
            <br><br>
            You can also scroll up and down in the toolbox. And if you click on the "search" box at the top, you might even be able to filter the symbols and find what you need more quickly.
        </p>

        <h3>The Main Menu</h3>
        <p>
            <img src="app/res/tutorial/mainmenu.jpg"><br><br>
            This is the place to go if you need to change the settings of the app, save or open your projects, or even visit this great page you are reading right now.
        </p>
        <ul>
            <li><b>Settings</b> - allows you to change the global parameters of the software.</li>
            <li><b>Info</b> - Displays this tutorial.</li>
            <li><b>Open</b> - Opens a pneumatics project and loads all components on screen.</li>
            <li><b>Save</b> - Saves a pneumatics project on your computer with all components. Whenever you need it, you can open it using the 'Open' button in the menu.</li>
        </ul>

        <h3>Open & Save</h3>
        <p>
            In order to preserve your work when refreshing or closing the page, you will need to save your work. In order to do this, click on the <b>'Save'</b>
            button in the Main Menu (this menu is described above) and follow the instructions. Afterwards, you can close the program and when you return,
            just click on <b>'Open'</b>, navigate to where you saved the file and open it to have your pneumatic circuit back on the screen and ready to go.
        </p>

        <br>
        <h3>The Main Air Line</h3>
        <p>
            <img src="app/res/tutorial/mainair.jpg" style="width: 100%;">
            The main air line is the main source of air for your pipes. It pumps air through its connectors (the white circles).
            <br><br>
            It also has an ON/OFF button to activate/deactivate the flow of air (<b>very useful</b> in real life, trying to change your piping
            with the air on can lead to injuries and nightmares).
        </p>

        <h3>Box Operations</h3>
        <p>
            <img src="app/res/tutorial/contextmenu.jpg">
            Right click on any pneumatic component to show this menu. Here you can find many useful operations, such as 'remove' or 'flip x' (flip horizontally).
            <br><br>
            <u>Pro tip</u>: Another way to remove a component is to drag it over the toolbox - it will simply disappear, along with any pipe connected to it.
        </p>

        <h3>Connecting Boxes</h3>
        <p style="text-align: left;">
            <img src="app/res/tutorial/connected_boxes_annotated.jpg">
            <u>Steps:</u><br><br>
            1. Click on the starting endpoint;<br>
            2. Move your mouse vertically, click to change direction;<br>
            3. Click on the chosen final endpoint.<br><br>

            <u>Pro Tips:</u><br>
            - To cancel drawing a pipe, press Escape (Esc).<br>
            - To <b>remove</b> a pipe, hold Control (Ctrl) and click on the pipe.
        </p>

        <h3>Actuators</h3>
        <p>To change the state of a valve (in pneumatic terms, to actuate it), simply click on the actuator on the right or the left of the pneumatic box.
        <br><br>Types of actuators currently supported: Push-button, roller, spring, solenoid.
        <br><i>Note:</i> The roller can be actuated by a cylinder, the spring needs to be clicked to work (for now, at least).
        </p>

        <h3>Components - Explained</h3>
        <table id="componentsExplainedTable">
            <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Description</th>
            </tr>
            <tr>
                <td><img src="app/res/tutorial/32valve.jpg"></td>
                <td><b>3/2 Valve</b><br><br></td>
                <td><div class="desc">The left and right actuators (in this case, button and spring) change the way the valve transmits air. The arrows inside the valve describe how air flows.</div></td>
            </tr>
            <tr>
                <td><img src="app/res/tutorial/52valve.jpg"></td>
                <td><b>5/2 Valve</b><br><br></td>
                <td><div class="desc">The connectors on the left and right act as actuators. This means that if you send air on the left, the top left connector will release air, but if you send air on the
                right, the top right connector will release air.</div></td>
            </tr>
            <tr>
                <td><img src="app/res/tutorial/cylinder.jpg"></td>
                <td><b>Cylinder</b><br><br></td>
                <td><div class="desc">Moves when you send air through it. In the real world, it is used to move anything mechanically, from boxes along a supply line to automatic doors.</div></td>
            </tr>
            <tr>
                <td><img src="app/res/tutorial/flow_restrictor.jpg"></td>
                <td><b>Flow Restrictor</b><br><br></td>
                <td><div class="desc">Limits the flow of air through the pipes. It has a dial attached under it that allows you to change the percentage of how much air is let through.
                (i.e. 1 means full throughput, 0 means all air blocked).</div></td>
            </tr>
            <tr>
                <td><img src="app/res/tutorial/shuttle_valve.jpg"></td>
                <td><b>Shuttle Valve</b><br><br></td>
                <td><div class="desc">The top connector allows air to pass if either of the left or right inputs has air. You can imagine the little ball inside moving, pushed by air.</div></td>
            </tr>
            <tr>
                <td><img src="app/res/tutorial/t_piece.jpg"></td>
                <td><b>T-Piece</b><br><br></td>
                <td><div class="desc">Divides one source of air in two, sending air both ways.</div></td>
            </tr>
        </table>

        <br><br>
        <h3>That's it. Build your circuit, switch on the main air and have fun! 😊</h3>
        <br>

        <p class="menuFooter">
            Developer: Codrin Iftode - dreamer, passionate programmer and, sometimes, university student.<br>
            Copyright &copy; 2020-2022 Codrin Iftode. All rights reserved.<br>
        </p>
    </div>
    `,

  settings: `
    <div class="guiMenu">
        <h1>Settings</h1>

        <div id="settingsContainer">
            <h3>Simulation</h3>
            <table>
                <tr>
                    <td>FPS (frames/second)</td>
                    <td><input id="settings_FPS" type="number"></td>
                </tr>
                <tr>
                    <td>No. Main-Air Endpoints</td>
                    <td>
                        <select id="settings_MAEndpoints">
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                        </select>
                    </td>
                </tr>
            </table>
        </div>

        <div class="settingsButtons">
            <input id="saveSettingsButton" type="button" value="Save" onclick="saveSettings();">
            <input id="resetSettingsButton" type="button" value="Reset" onclick="resetSettings(); loadSettings();">
        </div>
    </div>
    `,
};
