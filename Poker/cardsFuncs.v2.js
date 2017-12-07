//global variables
const URL = "http://www.companyWAN.com";
const PORT = 3000;
let agentOverviewToday = true;
let users = [];
let yesterdayUsers = [];
const GLYPHICONS = {
    name_ascending: 'ascDesc glyphicon glyphicon-sort-by-alphabet',
    cc_username_ascending: 'ascDesc glyphicon glyphicon-sort-by-alphabet',
    tier_ascending: 'ascDesc glyphicon glyphicon-sort-by-alphabet',
    potential_bonus_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    YTD_chips_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    chips_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    mane_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    pdpne_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    mapc_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    pdppc_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    xfrEnr_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    hv_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    lacb_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    kits_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    rsvp_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    cardCount_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    extraCards_ascending: 'ascDesc glyphicon glyphicon-chevron-up',
    site_ascending: 'ascDesc glyphicon glyphicon-sort-by-alphabet',
    supervisor_ascending: 'ascDesc glyphicon glyphicon-sort-by-alphabet',
    name_descending: 'ascDesc glyphicon glyphicon-sort-by-alphabet-alt',
    cc_username_descending: 'ascDesc glyphicon glyphicon-sort-by-alphabet-alt',
    tier_descending: 'ascDesc glyphicon glyphicon-sort-by-alphabet-alt',
    potential_bonus_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    YTD_chips_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    chips_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    mane_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    pdpne_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    mapc_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    pdppc_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    xfrEnr_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    hv_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    lacb_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    kits_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    rsvp_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    cardCount_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    extraCards_descending: 'ascDesc glyphicon glyphicon-chevron-down',
    site_descending: 'ascDesc glyphicon glyphicon-sort-by-alphabet-alt',
    supervisor_descending: 'ascDesc glyphicon glyphicon-sort-by-alphabet-alt'
};
const SITES = {
    'Provo': 'PRV',
    'Memphis': 'MEM',
    'Sunrise': 'SUN',
    'Plantation': 'SAW',
    'San Antonio': 'SAT',
    'Salt Lake City': 'SLC',
    'PRV': 'Provo',
    'MEM': 'Memphis',
    'SUN': 'Sunrise',
    'SAW': 'Plantation',
    'SAT': 'San Antonio',
    'SLC': 'Salt Lake City'
}

$(document).ready(verifySession); //End of document ready

/////////////
// Session //
/////////////
function logout(){
    users = [];
    sessionStorage.removeItem("sessionID");
    sessionStorage.removeItem("site");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("activeUser");
    sessionStorage.removeItem("client");
    $("#editAddFormSupervisor").html("<option value='none'></option>");
    $("#supervisorsAgentList").html("");
    $('#agentOverview').html("");
    $("#bToggleAgentOverview").css("visibility", "hidden");
    $('#generalTutorialModalBody').html('');
    setUpGUI(false);
}

function verifySession(){
    //If an active session is in place, there will be sessionStorage items to check.
    //This tests if those sessionStorage items are valid or if they've been tampered with.
    if (sessionStorage.getItem("activeUser") !== null && sessionStorage.getItem("sessionID") !== null && sessionStorage.getItem("role") !== null){
        $.ajax({
            url: `${URL}:${PORT}/api/v1/session/${sessionStorage.getItem("activeUser")}`, 
            method: 'PATCH',
            data: {sessionID: sessionStorage.getItem("sessionID")},
            success: function(doc) {
                setUpGUI(doc);
            },
            error: function(){
                setUpGUI(false);
                displayMessage("Bad Session", false);
            }
        }); //End of ajax call
    }
    else {
        setUpGUI(false);
        displayMessage('No active Session', false);
    }
}

function verifyCredentials(){
    $.ajax({
        url: `${URL}:${PORT}/api/v1/password/verify/${$("#formUsername").val()}`, 
        method: 'PATCH',
        data: {pass: $("#formPassword").val()},
        statusCode: {
            200: function(doc) {
                sessionStorage.setItem("sessionID",doc.sessionID);
                delete doc.sessionID;
                sessionStorage.setItem("name",doc.fullname);
                delete doc.fullname;
                sessionStorage.setItem("site", doc.site);
                delete doc.site;
                sessionStorage.setItem("role", doc.role);
                delete doc.role;
                sessionStorage.setItem("activeUser", doc.cc_username);
                delete doc.cc_username;
                sessionStorage.setItem("CCID", doc.cc_userid);
                delete doc.cc_userid;
                sessionStorage.setItem("client", doc.client);
                delete doc.client;
                setUpGUI(doc);
            },
            401: function(){
                displayMessage("Credentials do not match.", false);
            }
        }
    }); //End of ajax call
}

//////////////////////
// Generate HTML    //
//////////////////////
function setUpGUI(doc){
    //This function uses a set of modular functions to set up all the HTML at the start of a session.
    //Requires doc to have: mane, pdpne, mapc, pdppc, xfrEnr, hv, lacb, rsvp 
    let order = localStorage.getItem('order');
    let sortedType =  localStorage.getItem('sortedType');
    let role = sessionStorage.getItem('role');
    renderNavHTML();
    if (doc === false) $('#wrapper').html(
        `<span id="addEditMessage" class="alert"></span>

        <h3>cXp Poker Credentials</h3>
        <p>Your username is now the same as you use for Callpro, and your password is your ADP ID, which you can find in ADP under<br>
        "Myself" > "Personal Information" > "Personal Profile", it's the number titled "Position ID." Usually it starts with X1R.</p>`);
    else {
        if (role.match(/^agent$/i)) {
            createTiles(doc);
            updateUsersArray(SITES[sessionStorage.getItem('site')]);
        }
        else if (role.match(/^admin$/i) || role.match(/^manager$/i)) {
            if (order && sortedType) 
                $(`#${sortedType}AscDesc span`).attr('class', `${GLYPHICONS[sortedType + '_' + order]}`).css('visibility', 'visible');
            createTable();
            hideAscDesc();
            $(`#${sortedType}AscDesc span`).attr('class', `${GLYPHICONS[sortedType + '_' + order]}`).css('visibility', 'visible');
            updateUsersArray((role != "Admin") ? sessionStorage.getItem("activeUser") : (sessionStorage.getItem("client") === "Aetna") ? "PRV" : "Admin");
            sortAndFillUserTable();
            activateRecordListeners();
        }
        updateAgentOverview();
        activateGeneralListeners();
    }
}

function renderNavHTML(){
    //Generates the HTML for the Nav bar. Differs between active session and no session.
    if (sessionStorage.getItem("sessionID") === null) {
        $('#navSessionInfo').html(`
        <form class="navbar-form navbar-right">
            <div class="input-group" id="navbarLogin">
              <span class="input-group-addon">Username:</span>
              <input type="text" class="form-control" id="formUsername" placeholder="Username"/>
              <span class="input-group-addon">Password:</span>
              <input type="password" class="form-control" id="formPassword" placeholder="Password" />
              <div class="input-group-btn">
                <button class="btn btn-info" type="button" onclick="verifyCredentials();">
                  <i class="glyphicon glyphicon-log-in"></i> Login
                </button>
              </div>
            </div>
          </form>`);

        $("#navbarLogin input").keypress(function (e) {
            if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
                verifyCredentials();
                return false;
            } else {
                return true;
            }
        });
    }
    else {
        $('#navSessionInfo').html(`
            <ul class="nav collapse navbar-collapse navbar-nav navbar-right" id="bs-example-navbar-collapse-1">
                <li title="cXp Poker Basics" id="bGeneralTutorial"><a href="#">cXp Poker Basics</a></li>
                <li title="Scoring Hands" id="bScoringHandsChart"><a href="#">Scoring Hands Chart</a></li>
                <li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">${(sessionStorage.getItem("role") === "Manager" || sessionStorage.getItem("role") === "Admin") ? sessionStorage.getItem("activeUser") : sessionStorage.getItem("name")}<span class="caret"></span></a>
                    <ul class="dropdown-menu" role="menu">
                        <li title="Bug Report"><a target="bugReport" href="https://goo.gl/forms/1234abcd">Report a Bug</a></li>
                        <li title="Logout" class="li-icon" id="bLogout"><a href="#"><i class="glyphicon glyphicon-log-out"></i> Logout</a></li>
                    </ul>
                </li>
            </ul>
        `);
    }

    //Populate correct tutorial matierial into general tutorial modal
    var htmlBody = "";
    if (sessionStorage.getItem('role') === "agent"){
        htmlBody = `
        <div class="well well-sm">
            <h4>Your view consists of three parts:</h4>
            <ol>
                <li>Your daily and Year-to-Date stats - your stats from today are on top, which includes any extra cards you have, while your Year-to-Date stats are on the bottom.</li>
                <li>You poker hand - You can click on the card you wish to switch out as long as you have extra cards available.</li>
                <li>Top 10 at site - Shows how many cards the top 10 players at your site have, as well as their YTD poker chips.</li>
            </ol>
        </div>

        <div class="well well-sm">
            <h4>Poker Chips</h4>
            <p>Your poker chips will replace cXp bucks and can be used through a supervisor to purchase swag or prizes.</p>
        </div>

        <div class="well well-sm">
            <h4>Each type of enrollment/lead rewards differently</h4>
            <ul>`;
        if (sessionStorage.getItem('client') === "Aetna") htmlBody += `
                <li>MANE - (T2) 1 poker chip and 1 card per 1</li>
                <li>PDPNE - T2) 1/2 poker chip and 1 card per 2</li>
                <li>MAPC - (T2) 1/4 poker chip and 1 card per 4</li>
                <li>PDPPC - (T2) 1/4 poker chip and 1 card per 4</li>
                <li>Transfer Enrollment - (T1) 1 poker chip and 1 card per 1</li>
                <li>HV - (T1) 1/2 poker chip and 1 card per 2</li>
                <li>LACB - (T1) 1/2 poker chip and 1 card per 2</li>
                <li>Kits w/ Callback - 0 poker chips and 0 cards</li>
                <li>RSVP - 0 poker chips and 0 cards</li>`;
        else if (sessionStorage.getItem('client') === "CareSource") htmlBody += `
                <li>Enrollment - 3 poker chip and 3 card per 1</li>
                <li>RTE - 2 poker chip and 2 card per 1</li>
                <li>HV - 1 poker chip and 1 card per 1</li>
                <li>LACB - 1 poker chip and 1 card per 1</li>
                <li>Kits w/ Callback - 1 poker chip and 1 card per 3</li>
                <li>RSVP - 1 poker chip and 1 card per 2</li>`;
        htmlBody += `
            </ul>
            <p>Once you have 5 cards in your hand, any new cards rewarded will be in the form of extra cards. You can use these to switch out cards from your hand with a new random card.</p>
        </div>

        <div class="well well-sm">
            <h4>Poker Hand Values</h4>
            <p>Your poker hand value will determine your ranking at your site. Prizes are dealt to the top 3 hands at every site: </p>
            <ol>
                <li>Rewarded 5 poker chips</li>
                <li>Rewarded 3 poker chips</li>
                <li>Rewarded 1 poker chips</li>
            </ol>
            <p>On top of this, you are also rewarded daily just for the type of hand you have. See the Scoring Hands Chart for examples. </p>
            <ul>
                <li>High Card - Rewards 0 poker chips</li>
                <li>Pair - Rewards 1 poker chip</li>
                <li>Two Pairs - Rewards 2 poker chips</li>
                <li>Three of a Kind - Rewards 3 poker chips</li>
                <li>Straight - Rewards 5 poker chips</li>
                <li>Flush - Rewards 7 poker chips</li>
                <li>Full House - Rewards 10 poker chips</li>
                <li>Four of a Kind - Rewards 13 poker chips</li>
                <li>Straight Flush - Rewards 16 poker chips</li>
                <li>Five of a Kind - Rewards 20 poker chips</li>
                <li>Royal Flush - Rewards 25 poker chips</li>
            </ul>
        </div>
        `;
        $('#generalTutorialModalBody').html(htmlBody);
    }
    else {
        htmlBody = `
            <div class="well well-sm">
                <h4>Your view consists of two parts:</h4>
                <ol>
                    <li>A list of agents and their stats.</li>
                    <li>Top 10 Agents list - changes depending on the group that is chosen for the table.</li>
                </ol>
            </div>

            <div class="well well-sm">
                <h4>Agent stats table</h4>
                <p>This table has a lot of functionality:</p>
                <ul>
                    <li>All columns are sortable. Click on any column to sort in ascending order, click again to sort in descending order.</li>
                    <li>Use the "Sort By Best Hands" button to have the agents with teh best hands appear at the top of the table.</li>
                    <li>Change the group of agents by using the dropdown menu on the right side. Agents are grouped by site or team.</li>
                    <li>You can display any agent's poker hand by clicking on the triple dots on the left side.</li>
                    <li>When agents come to you to buy swag or prizes, use the text field in the agent's row under 'chips' with a negative number to charge them.</li>
                    <li>When agents do something special that rewards poker chips,use the text field in the agent's row under 'chips' with a positive number to reward them.</li> 
                    <li>Every enrollment/lead type has two numbers: the one on the left is today's number, the one on the right is the Year-to-Date number.</li>                   
                </ul>
            </div>

            <div class="well well-sm">
                <h4>Poker Chips</h4>
                <p>Agents' poker chips will replace cXp bucks and can be used through supervisors to purchase swag or prizes.</p>
            </div>

            <div class="well well-sm">
                <h4>Top 10 Agents List</h4>
                <p>By default, it will populate today's top 10 agents based on their enrollments. 
                    Click the "Toggle Yesterday's / Today's Top 10" button to view yesterday's best hands cards faced up.
                    Both of these lists are broadcasted on your site's dashboard.</p>
            </div>

            <div class="well well-sm">
                <h4>Poker Hand Values</h4>
                <p>Agents' poker hand values will determine their ranking at their site. Prizes are dealt to the top 3 hands at every site: </p>
                <ol>
                    <li>Rewarded 5 poker chips</li>
                    <li>Rewarded 3 poker chips</li>
                    <li>Rewarded 1 poker chips</li>
                </ol>
                <p>On top of this, they are also rewarded daily just for the type of hand they have. See the Scoring Hands Chart for examples. </p>
                <ul>
                    <li>High Card - Rewards 0 poker chips</li>
                    <li>Pair - Rewards 1 poker chip</li>
                    <li>Two Pairs - Rewards 2 poker chips</li>
                    <li>Three of a Kind - Rewards 3 poker chips</li>
                    <li>Straight - Rewards 5 poker chips</li>
                    <li>Flush - Rewards 7 poker chips</li>
                    <li>Full House - Rewards 10 poker chips</li>
                    <li>Four of a Kind - Rewards 13 poker chips</li>
                    <li>Straight Flush - Rewards 16 poker chips</li>
                    <li>Five of a Kind - Rewards 20 poker chips</li>
                    <li>Royal Flush - Rewards 25 poker chips</li>
                </ul>
            </div>

            <div class="well well-sm">
                <h4>Each type of enrollment/lead rewards differently</h4>
                <ul>`;
        if (sessionStorage.getItem('client') === "Aetna") htmlBody += `
                <li>MANE - (T2) 1 poker chip and 1 card per 1</li>
                <li>PDPNE - (T2) 1/2 poker chip and 1 card per 2</li>
                <li>MAPC - (T2) 1/4 poker chip and 1 card per 4</li>
                <li>PDPPC - (T2) 1/4 poker chip and 1 card per 4</li>
                <li>Transfer Enrollment - (T1) 1/4 poker chip and 1 card per 4 (TBA)</li>
                <li>HV - (T1) 1/2 poker chip and 1 card per 2</li>
                <li>LACB - (T1)1/2 poker chip and 1 card per 2</li>
                <li>Kits w/ Callback - 0 poker chips and 0 cards</li>
                <li>RSVP - 0 poker chips and 0 cards</li>`;
        else if (sessionStorage.getItem('client') === "CareSource") htmlBody += `
                <li>Enrollment - 3 poker chip and 3 card per 1</li>
                <li>RTE - 2 poker chip and 2 card per 1</li>
                <li>HV - 1 poker chip and 1 card per 1</li>
                <li>LACB - 1 poker chip and 1 card per 1</li>
                <li>Kits w/ Callback - 1 poker chip and 1 card per 3</li>
                <li>RSVP - 1 poker chip and 1 card per 2</li>`;
        htmlBody += `
                </ul>
                <p>Once an agent has 5 cards in their hand, any new cards rewarded will be in the form of extra cards. They can use these to switch out cards from their hand with a new random card.</p>
            </div>
        `;
        $('#generalTutorialModalBody').html(htmlBody);
    }
}

function createTiles(doc) {
    //Generates HTML for the five card slots in the agent view.
    $.ajax({
        url: `${URL}:${PORT}/api/v1/cards/${sessionStorage.getItem("CCID")}`, 
        method: 'GET',
        success: function(cards) {
            var wrapper = [];

            // Push Important update!
            wrapper.push(`${(sessionStorage.getItem("client") === "Aetna") ? `
                <h3>Nov. 16, 2017 Aetna Updates</h3>
                Connexion Point is focused on increasing enrollment counts at this point of AEP:
                <ul><li>T1 Agents, we need you to transfer enrollment calls to T2 agents. These calls will be trackable by Monday<br>
                and will automatically reward you a poker chip and card if they ended in an enrollment.</li>
                <li>T1 Agents will no longer receive poker chips, card, or potential bonus from rsvp and kit calls.</li>
                <li>T2 Agents, we need you to schedule enrollments instead of leads if the caller is willing.</li>
                <li>T2 Agents will no longer receive poker chips, cards, or potential bonus from lead calls.</li></ul>` : ""}`);

            wrapper.push(`<h3>${sessionStorage.getItem("name")}'s Stats Today and Year-To-Date</h3><span id="addEditMessage" class="alert"></span>`);
            //Load in Agents stats no matter the amount of cards
            var statsTopics = [{title:'Chips', elem:'chips', greyedFor: "none"}, {title:'MANE', elem:'mane', greyedFor: "T1"}, {title:'PDPNE', elem:'pdpne', greyedFor: "T1"}, 
                                {title:'MAPC', elem:'mapc', greyedFor: "T1"}, {title:'PDPPC', elem:'pdppc', greyedFor: "T1"}, {title:'HV', elem:'hv', greyedFor: "T2"}, {title:'LACB', elem:'lacb', greyedFor: "T2"},
                                {title:'Kits', elem:'kits', greyedFor: "all"}, {title:'RSVP', elem:'rsvp', greyedFor: "all"}, {title:'Extra Cards', elem:'extraCards', greyedFor: "none"}];
            
            wrapper.push('<div class="container-fluid" style="margin: 0 0 20px 0;"><div class="row">');
            for (let stat of statsTopics){
                wrapper.push(`
                    <div class="btn-group-vertical btn-group-sm" style="margin: 0 10px 10px 0; width: 90px;" role="group" aria-label="...">
                        <button type="button" class="btn btn-info${(doc.tier === stat.greyedFor || stat.greyedFor === "all") ? " disabled" : ""}">${stat.title}</button>
                        <button type="button" ${(stat.elem === "extraCards") ? "id='agentDispExtraCards'" : ""} class="btn btn-default${(doc.tier === stat.greyedFor || stat.greyedFor === "all") ? " disabled" : ""}">${(stat.elem === "chips") ? Number(doc[stat.elem]).toFixed(2) : doc[stat.elem]}</button>
                    </div>
                `);
            }
            wrapper.push("</div>");

            //Load in Agents stats no matter the amount of cards
            var statsTopics = [{title:'YTD<br>Chips', elem:'YTD_chips', greyedFor: "none"}, {title:'YTD<br>MANE', elem:'YTD_mane', greyedFor: "T1"}, {title:'YTD<br>PDPNE', elem:'YTD_pdpne', greyedFor: "T1"},
                                {title:'YTD<br>MAPC', elem:'YTD_mapc', greyedFor: "T1"}, {title:'YTD<br>PDPPC', elem:'YTD_pdppc', greyedFor: "T1"}, {title:'YTD<br>HV', elem:'YTD_hv', greyedFor: "T2"}, 
                                {title:'YTD<br>LACB', elem:'YTD_lacb', greyedFor: "T2"}, {title:'YTD<br>Kits', elem:'YTD_kits', greyedFor: "all"}, {title:'YTD<br>RSVP', elem:'YTD_rsvp', greyedFor: "all"}, 
                                {title:'AEP Payout<br>Potential', elem:'potential_bonus', greyedFor: "none"}];
            wrapper.push('<div class="row">');
            for (let stat of statsTopics){
                if (stat.elem === "potential_bonus" && sessionStorage.getItem("client") === "CareSource") continue;
                wrapper.push(`
                    <div class="btn-group-vertical btn-group-sm" style="margin: 0 10px 0 0; width: 90px;" role="group" aria-label="..." ${(stat.elem === "potential_bonus") ? 'title="*AEP payout potential based upon enrollment accuracy and lead quality"' : ''}>
                        <button type="button" class="btn btn-info${(doc.tier === stat.greyedFor || stat.greyedFor === "all") ? " disabled" : ""}">${stat.title}${(stat.elem === "potential_bonus") ? '<span class="required"> *</span>' : ''}</button>
                        <button type="button" class="btn btn-default${(doc.tier === stat.greyedFor || stat.greyedFor === "all") ? " disabled" : ""}">${(stat.elem === "potential_bonus") ? '$' : ''}${(stat.elem === "YTD_chips") ? Number(doc[stat.elem]).toFixed(2) : doc[stat.elem]}</button>
                    </div>
                `);
            }
            wrapper.push("</div></div>");

            if (cards.length === 0) {
                wrapper.push(`
                        <p id="noCardsMessage">Get an enrollment to get your first card!</p>
                    </div>
                `);
                $("#wrapper").html(wrapper.join(''));
            }
            else if (cards.length > 0) {
                //Sort cards by number
                cards.sort(sortCards);
                wrapper.push(`
                    </div>
                    <div id="pokerTable">
                        <div class="col-xs-12 col-sm-6 col-md-3 col-lg-2">
                            <div class="cardSlot"><div class="slot"></div></div>
                        </div>
                        <div class="col-xs-12 col-sm-6 col-md-3 col-lg-2">
                            <div class="cardSlot"><div class="slot"></div></div>
                        </div>
                        <div class="col-xs-12 col-sm-6 col-md-3 col-lg-2">
                            <div class="cardSlot"><div class="slot"></div></div>
                        </div>
                        <div class="col-xs-12 col-sm-6 col-md-3 col-lg-2">
                            <div class="cardSlot"><div class="slot"></div></div>
                        </div>
                        <div class="col-xs-12 col-sm-6 col-md-3 col-lg-2">
                            <div class="cardSlot"><div class="slot"></div></div>
                        </div>
                    </div>
                `);

                $("#wrapper").html(wrapper.join(''));
                let cardSlot = 0;
                for (let card of cards) $($($('#pokerTable').children()[cardSlot++]).children()).append(`<div title="${card.lead}" class="card"><p>${cardNumberToLetter(card.num)}</p><p class="suit-${card.suit}"></p></div>`);
                activateTileListeners();
            }
        }
    }); //End of ajax call
}

function updateAgentOverview(){
    //Reorder the sortedUsers array to prepare for agent Overview
    let sortedUsers = [];
    if (agentOverviewToday) {
        sortedUsers = users;
        //let tempType = localStorage.getItem('sortedType');
        //localStorage.setItem('sortedType', 'cardCount');
        sortedUsers.sort(sortHands);
        //localStorage.setItem('sortedType', tempType);
    }
    else {
        getYesterdaysHands();
        sortedUsers = JSON.parse(JSON.stringify(yesterdayUsers));
        sortedUsers.sort(sortHands);
    }
    sortedUsers = sortedUsers.slice(0, 10);

    //Now generate HTML for Agent overview
    let pokerHands = [];
    let counter = 0;
    if( ! sessionStorage.getItem("role").match(/^agent$/i)) $("#bToggleAgentOverview").css("visibility", "visible");
    pokerHands.push(`<div class="panel-heading text-center"><h1>${(agentOverviewToday) ? "Today's" : "Yesterday's"} Top 10 Hands</h1></div><div class="panel-body">`);
    for (let user of sortedUsers){
        if (counter++ === 10) break;
        if (user.role === "agent" && user.cards.length > 0){
            pokerHands.push(`<span class="col-xs-12 col-sm-6"><div class="row"><h4>${counter}. ${user.fname} ${user.lname}, YTD Chips: ${user.YTD_chips.toFixed(2)} </h4></div><div class="row">`);
            if (agentOverviewToday) 
                for (let card of user.cards) pokerHands.push(`<img title="${card.lead}" class="col-xs-2" src="img/backOfCard.png">`);
            else
                 for (let card of user.cards) pokerHands.push(`<span title="${card.lead}" class="card col-xs-2"><p>${cardNumberToLetter(card.num)}</p><p class="suit-${card.suit}" style="font-size: 50px;"></p></span>`);
            pokerHands.push('</div></span>');
        }
    }
    
    //If this is run for agent view, delete users array immediately after
    if (sessionStorage.getItem("role").match(/^agent$/i)) users = [], yesterdayUsers = [];
    
    pokerHands.push('</div>');
    $('#agentOverview').html(pokerHands.join(''));
}

function createTable(){
    //Generates HTML for the user profiles table in supervisor/admin view.
    let code = [], client = sessionStorage.getItem("client");
    code.push(`
        <button type="button" id="bSortByBestHands" class="btn btn-primary">Sort By Best Hands</button>
        <select id="supervisorsAgentList" name="agentLists" class="col-xs-3"></select>
        <div id="addEditMessage" class="alert"></div>
        <table id="usersTable" class="table table-condensed table-striped">
            <thead>
                <tr>
                    <th class="glyphicon glyphicon-eye-open"></th>
                    <th id="nameAscDesc" class='sortable'>Name <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="cc_usernameAscDesc" class='sortable'>Username <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="YTD_chipsAscDesc" class='sortable'>YTD Chips <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="chipsAscDesc" class='sortable'>Poker Chips <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    ${(client === "Aetna") ? '<th id="potential_bonusAscDesc" class="sortable" title="*AEP payout potential based upon enrollment accuracy and lead quality">Potential Bonus *<span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>' : ''}
                    <th id="cardCountAscDesc" class='sortable'>Cards <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="extraCardsAscDesc" class='sortable'>Available Cards <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="maneAscDesc" class='sortable'>${(client === "Aetna") ? "MANE" : "Enrollment"} <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="pdpneAscDesc" class='sortable'>${(client === "Aetna") ? "PDPNE" : "TLA"} <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    ${(client === "Aetna") ? '<th id="mapcAscDesc" class="sortable">MAPC <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>' : ''}
                    ${(client === "Aetna") ? '<th id="pdppcAscDesc" class="sortable">PDPPC <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>' : ''}
                    ${(client === "Aetna") ? '<th id="xfrEnrAscDesc" class="sortable">XFR-Enr <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>' : ''}
                    <th id="hvAscDesc" class='sortable'>Home Visits <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="lacbAscDesc" class='sortable'>LACB <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="kitsAscDesc" class='sortable'>Kits <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="rsvpAscDesc" class='sortable'>RSVP <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    <th id="siteAscDesc" class='sortable'>Site <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                    ${(client === "Aetna") ? '<th id="tierAscDesc" class="sortable">Tier <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>' : ''}
                    <th id="supervisorAscDesc" class='sortable'>Supervisor <span class="ascDesc glyphicon glyphicon-chevron-up" title="Ascending order"></span></th>
                </tr>
            </thead>
            <tbody class="container-fluid" id="usersTableData"></tbody>
        </table>`);
    $('#wrapper').html(code.join(''));
        
    //Gets list of all supervisors, then makes them as options in drop-down lists.
    $.ajax({
        url: `${URL}:${PORT}/api/v1/supervisors`, 
        method: 'PATCH',
        data: {client: sessionStorage.getItem("client")},
        success: function(sups) {
            let tempType = localStorage.getItem('sortedType');
            localStorage.setItem('sortedType', 'site');
            sups.sort(sortPrimary);
            localStorage.setItem('sortedType', tempType);

            //Generate the supervisor/manager fields
            let user = sessionStorage.getItem('activeUser');
            if (user === "Admin") $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value="Admin">All Agents</option>`);
            if (user === "MEM" || user === "Admin") $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='MEM' ${(user === "MEM") ? 'selected' : ''}>Memphis</option>`);
            if (user === "PRV" || user === "Admin") $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='PRV' selected>Provo</option>`);
            if (user === "SLC" || user.match(/admin$/i)) $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='SLC' ${(user === "SLC") ? 'selected' : ''}>Salt Lake City</option>`);
            if (user === "SAT" || user === "Admin") $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='SAT' ${(user === "SAT") ? 'selected' : ''}>San Antonio</option>`);
            if (user === "SAW" || user === "Admin") $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='SAW' ${(user === "SAW") ? 'selected' : ''}>Sawgrass</option>`);
            if (user === "SUN" || user === "Admin") $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='SUN' ${(user === "SUN") ? 'selected' : ''}>Sunrise</option>`);
            for (let sup of sups){
                if (user === SITES[sup.site] || user.match(/admin$/i)) $("#supervisorsAgentList").html($("#supervisorsAgentList").html() + `<option value='${sup.name}'>(${SITES[sup.site]}) ${sup.name}</option>`);
            }
        }// End of for loop
    }); //End of ajax call
}

function fillTable(sortedUsers) {
    //Fills in the table with a row for each user profile that was retrieved from the database.
    let userRows = [], client = sessionStorage.getItem("client");
    
    for (let user of sortedUsers) {
        if (!user) {
            console.log(`Error loading: ${user}`);
            continue;
        }

        userRows.push(`
            <tr id="${user.cc_username}">
                <td data-toggle="collapse" data-target="#dropdownCards${user.cc_username}" onclick="setTimeout(function(){$('[id*=dropdownCards]').removeClass('in')}, 10);" class="glyphicon glyphicon-option-vertical"></td>
                <td>${user.lname}, ${user.fname}</td>
                <td>${user.cc_username}</td>
                <td>${Number(user.YTD_chips).toFixed(2)}</td>
                <td>
                    <span>${user.chips.toFixed(2)}</span>
                    <input type="text" style="margin: 0 0 0 10px; width: 40px;" maxlength="3">
                    <input class="bChipsExchange" type="button" value="Apply">
                </td>
                ${(client === "Aetna") ? '<td>$' + user.potential_bonus + '</td>' : ''}
                <td>${user.cards.length}</td>
                <td>${user.extraCards}</td>
                <td>${user.mane} / ${user.YTD_mane}</td>
                <td>${user.pdpne} / ${user.YTD_pdpne}</td>
                ${(client === "Aetna") ? '<td>' + user.mapc + ' / ' + user.YTD_mapc + '</td>' : ''}
                ${(client === "Aetna") ? '<td>' + user.pdppc + ' / ' + user.YTD_pdppc + '</td>' : ''}
                ${(client === "Aetna") ? '<td>' + user.xfrEnr + ' / ' + user.xfrEnr + '</td>' : ''}
                <td>${user.hv} / ${user.YTD_hv}</td>
                <td>${user.lacb} / ${user.YTD_lacb}</td>
                <td>${user.kits} / ${user.YTD_kits}</td>
                <td>${user.rsvp} / ${user.YTD_rsvp}</td>
                <td>${SITES[user.site]}</td>
                ${(client === "Aetna") ? '<td>' + user.tier + '</td>' : ''}
                <td>${user.supervisor}</td>
            </tr>
            <tr class="collapse" id="dropdownCards${user.cc_username}">
                <td colspan="8"><table class="table table-condensed">
                    <tr>`);
        for (let card of user.cards) userRows.push(`<div title="${card.lead}" class="card col-xs-2" style="width: 80px; margin-right: 20px;"><p style="font: 30px Georgia, Times New Roman, serif;">${cardNumberToLetter(card.num)}</p><p class="suit-${card.suit}" style="font-size: 35px;"></p></div>`);
        
        userRows.push(`        
                    </tr>
                </table></td>
            </tr>
        `);
    } //End of for loop
    $('#usersTableData').html(userRows.join(''));
    activateRecordListeners()
}

//////////////////
// Listeners    //
//////////////////
function activateGeneralListeners(){
    $('#bSortByBestHands').off('click');
    $('#bSortByBestHands').click(function() {
        fillTable(users.sort(sortHands));
    });

    $('#bScoringHandsChart').off('click');
    $('#bScoringHandsChart').click(function() {
        $('#scoringHandsModal').modal('show');
    });

    $('#bScoringHandsClose').off('click');
    $('#bScoringHandsClose').click(function(){
        $('#scoringHandsModal').modal('hide');
    });

    $('#bGeneralTutorial').off('click');
    $('#bGeneralTutorial').click(function() {
        $('#generalTutorialModal').modal('show');
    });

    $('#bgeneralTutorialClose').off('click');
    $('#bgeneralTutorialClose').click(function(){
        $('#generalTutorialModal').modal('hide');
    });

    $('#bSwitchCard').off('click');
    $('#bSwitchCard').click(function() {
        //Switch out card
        var oldCard = {
                "own": localStorage.getItem('activeUser'), 
                "suit": $($(cardToBeSwitched).find('p')[1]).attr('class').substring(5), 
                "num": cardNumberToLetter($($(cardToBeSwitched).find('p')[0]).text())
            };
        $.ajax({
            url: `${URL}:${PORT}/api/v1/cards/switch/${sessionStorage.getItem("CCID")}`,
            method: 'PATCH',
            data: oldCard,
            statusCode: {
                304: function() { //add card to hand
                    $('#switchCardModal').modal('hide');
                    cardToBeSwitched = null;
                    displayMessage("You need more enrollments to switch cards.", false);
                },
                200: function(card){
                    //Switch out card with new card
                    $('#switchCardModal').modal('hide');
                    $($(cardToBeSwitched).find('p')[0]).text(cardNumberToLetter(card.num));
                    $($(cardToBeSwitched).find('p')[1]).attr('class', 'suit-' + card.suit);
                    cardToBeSwitched = null;
                    activateTileListeners();
                    $("#agentDispExtraCards").text( Number($("#agentDispExtraCards").text()) - 1 );
                    displayMessage("Successfully switched out card.", true);
                }
            }
        });
    });
    
    $('#bSwitchCardCancel').off('click');
    $('#bSwitchCardCancel').click(function(){
        $('#switchCardModal').modal('hide');
    });
    
    $('#bLogout').off('click');
    $('#bLogout').click(function(){
        logout();
    });
    
    $('#supervisorsAgentList').off('change');
    $("#supervisorsAgentList").change(function() {
        var sup = $("#supervisorsAgentList option:selected").attr("value");
        updateUsersArray(sup);
        sortAndFillUserTable();
        updateAgentOverview();
        activateRecordListeners();
    });

    $('#bToggleAgentOverview').off('click');
    $('#bToggleAgentOverview').click(function(){
        agentOverviewToday = agentOverviewToday != true;
        updateAgentOverview();
    });
}

let cardToBeSwitched;
function activateTileListeners(){
    $('.cardSlot').off('click');
    $('.cardSlot').click(function(){
        cardToBeSwitched = $(this)[0];
        $('#switchCardModal').modal('show');
    });
}

function activateRecordListeners() {
    $('.sortable').off('click');
    $('.sortable').click(function() {
        // Get id, remove AscDesc from end to get JSON object's keyname then set a cookie for access.
        var sortedType = $(this).attr('id').slice(0, -7);
        localStorage.setItem('sortedType', sortedType);
        toggleSortUI();
    }); //End of the listener

    $('.bChipsExchange').off('click');
    $('.bChipsExchange').click(function() {
        var change = $($(this).prev()[0]);
        var id = $($($($(this).parent()[0]).prev()[0]).prev()[0]).text();
        var name = $($($($($(this).parent()[0]).prev()[0]).prev()[0]).prev()[0]).text();
        var count = $($($(this).parent()).children()[0]);
        var YTD = $($($(this).parent()[0]).prev()[0]);
        var index = searchUsersByID(id);

        if (Number(change.val())) {
            $.ajax({
                url: `${URL}:${PORT}/api/v1/chips/${sessionStorage.getItem("activeUser")}`,
                method: 'PATCH',
                data: {sessionID: sessionStorage.getItem("sessionID"), change: Number(change.val()), agentID: id, client: sessionStorage.getItem("client")},
                statusCode: {
                    200: function(){
                        if (change.val() > 0) {
                            users[index].YTD_chips += Number(change.val());
                            YTD.text(users[index].YTD_chips.toFixed(2));
                        }
                        users[index].chips += Number(change.val());
                        change.val('');
                        count.text(users[index].chips.toFixed(2));
                        displayMessage(`Exchanged ${change.val()} chips with ${name}`, true);
                    },
                    400: function(){
                        change.val('');
                        displayMessage(`${name} doesn't have enough chips.`, false);
                    }
                }
            });
        }
        else displayMessage("Please only use numbers.", false);
    });
}

/////////////
// Sorting //
/////////////
function toggleSortUI() {
    //Toggles localStorage items for sorting, sorts the table, and toggles the sort directional icons.
    let order = localStorage.getItem('order');
    let sortedType = localStorage.getItem('sortedType');

    //Sort according to localStorage 'order'
    //If already in descending order or in no order
    if (order === null || order === 'descending') {
        localStorage.setItem('order', 'ascending');
        order = 'ascending';
    }
    //If already in ascending order
    else if (order === 'ascending') {
        if ($(`#${sortedType}AscDesc span`).css('visibility') === 'visible') {
            localStorage.setItem('order', 'descending');
            order = 'descending';
        }
        else {
            localStorage.setItem('order', 'ascending');
            order = 'ascending';
        }
    } //End of else if

    sortAndFillUserTable();
    activateRecordListeners();
    hideAscDesc();
    $(`#${sortedType}AscDesc span`).attr('class', `${GLYPHICONS[sortedType + '_' + order]}`).css('visibility', 'visible');
}

function hideAscDesc() {
    //hide the ascDesc glyphicons
    $('.ascDesc').css('visibility', 'hidden');
}

function sortAndFillUserTable() {
    //Prepares user array to be filled into the table by sorting the elements
    let sortedUsers = JSON.parse(JSON.stringify(users));
    sortedUsers.sort(sortPrimary);
    let order = localStorage.getItem('order');

    //Sort according to localStorage 'order'
    if (order === null)                 fillTable(users);
    else if (order === 'descending')    fillTable(sortedUsers.reverse());
    else if (order === 'ascending')     fillTable(sortedUsers);
}

///////////
// Utils //
///////////
function cardNumberToLetter(num){
    if (num == 'J') return 11;
    if (num == 'Q') return 12;
    if (num == 'K') return 13;
    if (num == 'A') return 14;
    if (num == 11) return 'J';
    if (num == 12) return 'Q';
    if (num == 13) return 'K';
    if (num == 14) return 'A';
    if (num < 11) return num;
}

function searchUsersByID(_id) {
    //Returns the index of the user in the users array
    for(let index = 0; index < users.length; index++){
        if (users[index].cc_username === _id) return index;
    }
    return 'User not Found';
}

function displayMessage(message, isGood){
    //bool isGood: true - success, false - danger
    $('#addEditMessage').text(message);
    if (isGood) $('#addEditMessage').removeClass("alert-danger").addClass("alert-success");
    else        $('#addEditMessage').removeClass("alert-success").addClass("alert-danger");
    $('#addEditMessage').show();
    $('#addEditMessage').fadeOut(3500);
}

//////////////////////
//  Ready API Calls //
//////////////////////
function updateUsersArray(sup) {
    $.ajax({
        url: `${URL}:${PORT}/api/v1/users/${sup}`, 
        method: 'PATCH',
        data: {client: sessionStorage.getItem("client")},
        async: false,
        success: function(userList) {
            updateUserCards(userList);
        }// End of for loop
    }); //End of ajax call
}

function updateUserCards(agents){
    let hand = [];
    $.ajax({
        url: `${URL}:${PORT}/api/v1/cards`, 
        method: 'GET',
        async: false,
        success: function(_cards) {
            for(let agent of agents) agent.cards = [];
            for (let card of _cards) {
                for (let agent of agents) {
                    if (agent.cc_userid != card.own) continue;
                    agent.cards.push(card);
                    break;
                }
            }
            users = agents;
        }// End of for loop
    }); //End of ajax call
}

function getYesterdaysHands(){
    $.ajax({
        url: `${URL}:${PORT}/api/v1/yesterday/cards`, 
        method: 'GET',
        async: false,
        success: function(_cards) {
            yesterdayUsers = JSON.parse(JSON.stringify(users));
            for(let agent of yesterdayUsers) agent.cards = [];
            for (let card of _cards) {
                for (let agent of yesterdayUsers) {
                    if (agent.cc_userid != card.own) continue;
                    agent.cards.push(card);
                    break;
                }
            }
        }
    }); //End of ajax call
}