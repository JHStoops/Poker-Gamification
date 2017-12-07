//REST end points
//https://docs.google.com/spreadsheets/d/1yYnCEHuoyaNDZCWdk_A3a77O3WQX_UHZ_8PfVN0xh9k/edit?usp=sharing

console.log('Loading Server...');

//Define constants
const PORT = 3000;
const WEB = __dirname.replace('pokerServer', 'Poker');
const SITES = {
    'Provo': 'PRV',
    'Memphis': 'MEM',
    'Sunrise': 'SUN',
    'Plantation': 'SAW',
    'San Antonio': 'SAT',
    'Salt Lake City': 'SLC'
}
const SITES_ABBR= {
    'PRV': 'Provo',
    'MEM': 'Memphis',
    'SUN': 'Sunrise',
    'SAW': 'Plantation',
    'SAT': 'San Antonio',
    'SLC': 'Salt Lake City',
    'CSSLC': 'Salt Lake City'
}

//Load main modules
var express = require('express');
var app = express();
var mysql = require('mysql');
var nodemailer = require('nodemailer');   //Allows server to send emails
var favicon = require('serve-favicon');
var MD5 = require("crypto-md5");            //Allows MD5 encryption for passwords

//Load express middleware
var logger = require('morgan');             //Logs calls to all files and End Points
var bodyParser = require('body-parser');

//Insert middleware
app.use(logger(':date[clf] - :remote-addr :status :method :response-time[2] ms :url', {
    skip: function(req, res) {return res.statusCode < 400;}
}))
app.use(favicon(WEB + '/logo.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

//EMail vars
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'poker@***.com',
        pass: '************'
    }
});

//REST End Points
//Verify Credentials
app.patch('/api/v1/password/verify/:user', function(req, res) {//200 or 401
    var user = req.params.user;
    if (user.match(/[\[\]\'\"\\\!\@\#\$\%\^\&\*\(\)\-\_\+\=\s]/g)) res.sendStatus(401);
    else {
        con.query(`
            SELECT u.*, CONCAT(fname, ' ', lname) AS fullname, IFNULL(ec.extraCards, 0) as extraCards
            FROM poker.users u LEFT JOIN (
                SELECT own, COUNT(*) AS extraCards 
                FROM poker.extra_cards 
                GROUP BY own) AS ec
            ON u.cc_userid = ec.own
            WHERE u.cc_username='${user}'`, function(err, agent){
            if (err) throw err;
            if (agent.length === 0) res.sendStatus(401);
            else if (agent[0].adp_id == req.body.pass.trim()){
                agent[0].sessionID = MD5(String(agent[0].adp_id));
                if (agent[0].site === "Plantation") agent[0].site = "Sawgrass";
                delete agent[0].adp_id;
                delete agent[0].supervisor;
                delete agent[0].fname;
                delete agent[0].lname;
                res.status(200).send(agent[0]);
            }
            else res.sendStatus(401);
        });
    } //End of else
});
//Verify Session
app.patch('/api/v1/session/:username', function(req, res) {//200 or 401
    con.query(`SELECT u.*, CONCAT(fname, ' ', lname) AS fullname, IFNULL(ec.extraCards, 0) as extraCards
        FROM poker.users u LEFT JOIN (
            SELECT own, COUNT(*) AS extraCards 
            FROM poker.extra_cards 
            GROUP BY own) AS ec
        ON u.cc_userid = ec.own 
        WHERE u.cc_username='${req.params.username}'`, function(err, agent){
        if (err) throw err;
		if (req.body.sessionID == MD5(String(agent[0].adp_id))) {
            if (agent[0].site === "Plantation") agent[0].site = "Sawgrass";
            delete agent[0].adp_id;
            delete agent[0].cc_username;
            delete agent[0].supervisor;
            delete agent[0].fname;
            delete agent[0].lname;
            res.status(200).send(agent[0]);
        }
		else res.sendStatus(401);
    });
});
//Exchange poker chips
app.patch('/api/v1/chips/:supervisor', function(req, res) {//200 or 400
    if (SITES_ABBR[req.params.supervisor] != 'undefined'){
        var d = new Date();
        console.log(`${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}, ${req.body.client}: ${req.params.supervisor}, ${req.body.agentID}: ${req.body.change}`);
        con.query(`SELECT chips FROM poker.users WHERE cc_username="${req.body.agentID}"`, function(err, chipCount){
            if (err) throw err;
            if ((chipCount[0].chips + Number(req.body.change)) < 0) res.sendStatus(400); //Trying to remove more cards than the agent currently has
            else {
                var query = `UPDATE poker.users SET chips = chips + ${req.body.change}`;
                if (req.body.change > 0) query += `, YTD_chips = YTD_chips + ${req.body.change}`;
                query += ` WHERE users.cc_username='${req.body.agentID}'`;
                con.query(query, function(err){
                    if (err) throw err;
                    //keep track of all transactions.
                    con.query(`INSERT INTO poker.chips_exchange_log SET date=CURDATE(), time=CURTIME(), client='${req.body.client}', id='${req.body.agentID}', dealer='${req.params.supervisor}', amount=${req.body.change}`, function(err){
                        if (err) throw err;
                    });
                    res.sendStatus(200);
                });
            }//End of else
        });
    }
    else res.sendStatus(401);
});
//Switch Card
app.patch('/api/v1/cards/switch/:username', function(req, res) {//200 or 304
    var user = req.params.username;
    var cardToUpdate = req.body;
    con.query(`SELECT * FROM poker.extra_cards WHERE own='${user}'`, function(err, extra){
        if (err) throw err;
        if (extra.length <= 0) res.sendStatus(304);
        else {
            //Ensure card.num is a number, not a letter
            if (cardToUpdate.num == 'J') cardToUpdate.num = 11;
            else if (cardToUpdate.num == 'Q') cardToUpdate.num = 12;
            else if (cardToUpdate.num == 'K') cardToUpdate.num = 13;
            else if (cardToUpdate.num == 'A') cardToUpdate.num = 14;
            
            //Replace the old card with a new one.
            var newCard = randomizeCard(user);
            var query = `
                UPDATE poker.cards SET lead='${extra[0].lead}', suit='${newCard.suit}', num=${newCard.num}
                WHERE suit='${cardToUpdate.suit}' 
                    AND num=${cardToUpdate.num}
                    AND own='${user}' 
                ORDER BY own 
                LIMIT 1;`;
            con.query(query, function(err){
                if (err) throw err;
                //remove oldest extraCard from poker.extra_cards
                con.query(`DELETE FROM poker.extra_cards WHERE own='${user}' LIMIT 1;`, function(err){
                    if (err) throw err;
                });
                newCard.lead = extra[0].lead;
                res.status(200).json(newCard);
            });
        }//End of else
    });
});
//List of yesterday's cards
app.get('/api/v1/yesterday/cards', function(req, res) {//200
    con.query(`SELECT * FROM poker.yesterdays_cards;`, function(err, cards){
		if (err) throw err;
		res.status(200).send(cards);
	});
});
//List of Cards
app.get('/api/v1/cards', function(req, res) {//200
    con.query(`SELECT * FROM poker.cards;`, function(err, cards){
		if (err) throw err;
		res.status(200).send(cards);
	});
});
//Read Cards
app.get('/api/v1/cards/:username', function(req, res) {//200
    con.query(`SELECT * FROM poker.cards WHERE own='${req.params.username}' LIMIT 5;`, function(err, cards){
		if (err) throw err;
		res.status(200).send(cards);
	});
});
//List of Users
app.patch('/api/v1/users/:supervisor', function(req, res){//200
    var sup = req.params.supervisor;
    var client = req.body.client;
    var query = `SELECT u.*, IFNULL(ec.extraCards, 0) as extraCards
                FROM poker.users u
                LEFT JOIN (SELECT own, COUNT(*) AS extraCards FROM poker.extra_cards GROUP BY own) AS ec
                    ON u.cc_userid = ec.own 
                WHERE client="${client}" 
                    AND role="agent" `;
    if (SITES[sup] !== undefined)                                                       //User's view of the Top Agents
        query += `AND site='${(client === "Aetna") ? "Provo" : "Salt Lake City"}' ORDER BY mane + (pdpne/2) + (mapc/4) + (pdppc/4) + (xfrEnr/4) + (hv/2) + (lacb/2) + (kits/3) + (rsvp/8) DESC LIMIT 10;`;
    else if (sup === "Admin") query += `;`;                                              //Admin's "All Agents" option in table
    else if (SITES_ABBR[sup] !== undefined) query += `AND site='${SITES_ABBR[sup]}';`;   //Site option in table
    else query += `AND supervisor='${sup}'`;                                             //specific supervisor option in table
    con.query(query, function(err, employees){
        if (err) throw err;
        res.status(200).send(employees);
    });
});
//List of supervisors
app.patch('/api/v1/supervisors', function(req, res){//200
    con.query(`SELECT DISTINCT supervisor AS name, site FROM poker.users WHERE supervisor != "-" AND client="${req.body.client}"`, function(err, supervisors){
		if (err) throw err;
		res.status(200).send(supervisors);
    });
});

//traditional webserver stuff
app.use(express.static(WEB));
app.get('*', function(req, res) {
   res.status(404).sendFile(WEB + '/404.html');
});

//Connect to MySQL Database
var con, db_config = {
  host      : 'db.companyWAN.com',
  user      : 'jstoops',
  password  : '********'
};

function handleDisconnect(){
	con = mysql.createConnection(db_config);
	con.connect(function(err) {
		if (err) {
			console.error('error connecting to MySQL: ' + err.stack);
			return;
		}
		console.log('connected to MySQL as id ' + con.threadId);
	});
    con.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('Reconnecting to server...');
            handleDisconnect();
        } 
        else throw err;
    });
}
handleDisconnect();

//Start Node Server
var server = app.listen(PORT, function(err) {
    if (err) console.log(err);
    console.log(`\nNode server started.\nListening on port ${PORT}...`);
});

process.on('SIGTERM', gracefulShutdown);//kill (terminate)
process.on('SIGINT', gracefulShutdown); //Ctrl+C (interrupt)
//SIGKILL (kill -9) can't be caught by any process, including node
//SIGSTP/SIGCONT (stop/continue) can't be caught by node

//Functions
function gracefulShutdown() {
   console.log('\nStarting Shutdown');
   con.end(function(err) {
        if (err) throw err;
        server.close(function() {
            console.log('\nShutdown Complete');
        });
    });
}

function syncAetnaEnrollmentsFromDB(){
    //Get count of today's enrollments, HV, and LACB Every 5 minutes
    var query = `
        SELECT 
            employee_id, 
            SUM(Case When enrollment = 1 AND product = "MA" AND type = "P"
                Then 1 Else 0 End) AS mane, 
            SUM(Case When enrollment = 1 AND product = "PDP" AND type = "P"
                Then 1 Else 0 End) AS pdpne, 
            SUM(Case When enrollment = 1 AND product = "MA" AND (type = "M" OR type = "R")
                Then 1 Else 0 End) AS mapc, 
            SUM(Case When enrollment = 1 AND product = "PDP" AND (type = "M" OR type = "R")
                Then 1 Else 0 End) AS pdppc, 
            0 AS xfrEnr,
            SUM(home_appt) AS hv, 
            SUM(lacb) AS lacb,
            SUM(kits_cb) AS kits,
            SUM(rsvp) AS rsvp
        FROM calls.conversion_summary 
        WHERE date(calls.conversion_summary.date) = CURDATE()
            AND (calls.conversion_summary.enrollment = 1 OR calls.conversion_summary.home_appt = 1 OR calls.conversion_summary.lacb = 1 OR calls.conversion_summary.kits_cb = 1 OR calls.conversion_summary.rsvp = 1)
        GROUP BY employee_id;`;
    con.query(query, function(err, newNums){
        if (err) throw err;
        
        //Retrieve old numbers to compare
        con.query('SELECT cc_userid, mane, pdpne, mapc, pdppc, xfrEnr, hv, lacb, kits, rsvp, tier FROM poker.users WHERE role="agent" and client="Aetna"', function(err, oldNums){
            if (err) throw err;

            //If enrollments have increased, deal new card, or assign another extraCard
            for (let i of newNums){
                for (let j of oldNums){
                    if (i.employee_id != j.cc_userid) continue;   //Don't match? start over!
                    query = `SELECT COUNT(*) AS cardCount FROM poker.cards WHERE own='${i.employee_id}'`;
                    con.query(query, function(err, cards){
                        var args = {new: i, old: j, cardsCount: cards[0].cardCount, rewardChips: 0};
                        
                        //Reward a poker chip and a card
                        checkEnrollment(args, "mane", 1);
                        checkEnrollment(args, "pdpne", 2);
                        if (j.tier === "T1") checkEnrollment(args, "hv", 3);
                        if (j.tier === "T1") checkEnrollment(args, "lacb", 3);
                        //if(j.tier === "T1") checkEnrollment(args, "kits", 3);
                        checkEnrollment(args, "mapc", 4);
                        checkEnrollment(args, "pdppc", 4);
                        if (j.tier === "T1") checkEnrollment(args, "xfrEnr", 1);
                        //if(j.tier === "T1") checkEnrollment(args, "rsvp", 3);

                        //Update poker.user to reflect new enrollments, hv, lacb counts
                        query = `
                            UPDATE poker.users 
                            SET YTD_chips=YTD_chips+${args.rewardChips}, chips=chips+${args.rewardChips}, 
                                YTD_mane=YTD_mane+${i.mane-j.mane}, mane=${i.mane}, 
                                YTD_pdpne=YTD_pdpne+${i.pdpne-j.pdpne}, pdpne=${i.pdpne}, 
                                YTD_mapc=YTD_mapc+${i.mapc-j.mapc}, mapc=${i.mapc}, 
                                YTD_pdppc=YTD_pdppc+${i.pdppc-j.pdppc}, pdppc=${i.pdppc},
                                YTD_hv=YTD_hv+${i.hv-j.hv}, hv=${i.hv}, 
                                YTD_lacb=YTD_lacb+${i.lacb-j.lacb}, lacb=${i.lacb}, 
                                YTD_kits=YTD_kits+${i.kits-j.kits}, kits=${i.kits}, 
                                YTD_rsvp=YTD_rsvp+${i.rsvp-j.rsvp}, rsvp=${i.rsvp}
                            WHERE cc_userid='${j.cc_userid}';`;

                        con.query(query, function(err){
                            if (err) throw err;
                            query = `
                            UPDATE poker.users u LEFT OUTER JOIN 
                                (SELECT 
                                    employee_id, 
                                    SUM(Case When enrollment = 1 AND product = "MA" AND type = "P" Then 1 Else 0 End) AS mane, 
                                    SUM(Case When enrollment = 1 AND product = "PDP" AND type = "P" Then 1 Else 0 End) AS pdpne, 
                                    SUM(Case When enrollment = 1 AND product = "MA" AND (type = "M" OR type = "R") Then 1 Else 0 End) AS mapc, 
                                    SUM(Case When enrollment = 1 AND product = "PDP" AND (type = "M" OR type = "R") Then 1 Else 0 End) AS pdppc, 
                                    0 AS xfrEnr,
                                    SUM(home_appt) AS hv, 
                                    SUM(lacb) AS lacb,
                                    SUM(kits_cb) AS kits,
                                    SUM(rsvp) AS rsvp
                                FROM calls.conversion_summary 
                                WHERE date(calls.conversion_summary.date) >= "2017-10-01"
                                    AND date(calls.conversion_summary.date) < "2017-11-15"
                                    AND (calls.conversion_summary.enrollment = 1 OR calls.conversion_summary.home_appt = 1 OR calls.conversion_summary.lacb = 1 OR calls.conversion_summary.kits_cb = 1 OR calls.conversion_summary.rsvp = 1)
                                    AND employee_id = "${j.cc_userid}"
                                GROUP BY employee_id) cutOff
                            ON u.cc_userid = cutOff.employee_id
                            SET u.potential_bonus = (u.YTD_mane * 30) + (u.YTD_pdpne * 4) + IF(tier="T2", (IFNULL(cutOff.hv + cutOff.lacb, 0) * 7), (IFNULL(u.YTD_hv + u.YTD_lacb, 0) * 7) )
                            WHERE u.cc_userid = "${j.cc_userid}";`;
                            con.query(query, function(err){
                                if (err) throw err;
                            });
                        });
                    });

                    break;
                }//end of for j
            }//End of for i
        });//End of con.query
    });//End of con.query
}
syncAetnaEnrollmentsFromDB();
setInterval(syncAetnaEnrollmentsFromDB, 300000);

function syncCareSourceEnrollmentsFromDB(){
    //Get count of today's enrollments, HV, and LACB Every 5 minutes
    var query = `
        SELECT employee_id,
            SUM(enrollment) AS mane, 
            SUM(ready_to_enroll) AS pdpne,
            SUM(home_appt) AS hv, 
            SUM(lacb) AS lacb,
            SUM(kits_cb) AS kits,
            SUM(rsvp) AS rsvp
        FROM calls.caresource_conversion_summary 
        WHERE date(calls.caresource_conversion_summary.interaction_date) = CURDATE()
            AND (calls.caresource_conversion_summary.enrollment = 1 OR 
                calls.caresource_conversion_summary.ready_to_enroll = 1 OR 
                calls.caresource_conversion_summary.home_appt = 1 OR 
                calls.caresource_conversion_summary.lacb = 1 OR 
                calls.caresource_conversion_summary.kits_cb = 1 OR 
                calls.caresource_conversion_summary.rsvp = 1)
        GROUP BY employee_id;`;
    con.query(query, function(err, newNums){
        if (err) throw err;
        
        //Retrieve old numbers to compare
        con.query('SELECT cc_userid, mane, pdpne, hv, lacb, kits, rsvp FROM poker.users WHERE role="agent"', function(err, oldNums){
            if (err) throw err;

            //If enrollments have increased, deal new card, or assign another extraCard
            for (let i of newNums){
                for (let j of oldNums){
                    if (i.employee_id != j.cc_userid) continue;   //Don't match? start over!
                    query = `SELECT COUNT(*) AS cardCount FROM poker.cards WHERE own='${j.cc_userid}'`;
                    con.query(query, function(err, cards){
                        var args = {new: i, old: j, cardsCount: cards[0].cardCount, rewardChips: 0};
                        
                        //Reward a poker chip and a card (multiplied by three! weird... sorry, just making code work)
                        checkCSEnrollment(args, "mane", 1);
                        checkCSEnrollment(args, "pdpne", 1);
                        checkCSEnrollment(args, "hv", 1);
                        checkCSEnrollment(args, "lacb", 1);
                        checkCSEnrollment(args, "kits", 3);
                        checkCSEnrollment(args, "rsvp", 2);

                        //Update poker.user to reflect new enrollments, hv, lacb counts
                        query = `
                            UPDATE poker.users
                            SET YTD_chips=YTD_chips+${args.rewardChips}, chips=chips+${args.rewardChips}, 
                                YTD_mane=YTD_mane+${i.mane-j.mane}, mane=${i.mane}, 
                                YTD_pdpne=YTD_pdpne+${i.pdpne-j.pdpne}, pdpne=${i.pdpne},
                                YTD_hv=YTD_hv+${i.hv-j.hv}, hv=${i.hv}, 
                                YTD_lacb=YTD_lacb+${i.lacb-j.lacb}, lacb=${i.lacb}, 
                                YTD_kits=YTD_kits+${i.kits-j.kits}, kits=${i.kits}, 
                                YTD_rsvp=YTD_rsvp+${i.rsvp-j.rsvp}, rsvp=${i.rsvp} 
                            WHERE cc_userid='${j.cc_userid}';`;
                        con.query(query, function(err){
                            if (err) throw err;
                        });
                    });

                    break;
                }//end of for j
            }//End of for i
        });//End of con.query
    });//End of con.query
}
syncCareSourceEnrollmentsFromDB();
setInterval(syncCareSourceEnrollmentsFromDB, 300000);

function checkCSEnrollment(args, type, divBy){
    if (args.new[type] > args.old[type]) {
        for (let k = 1; k <= args.new[type] - args.old[type]; k++) {
            if (type === "mane") args.rewardChips += 3;
            else if (type === "pdpne") args.rewardChips += 2;
            else args.rewardChips += (1/divBy);
            if ((args.old[type] + k) % divBy === 0) {               //Reward card if quota is meat of specific type
                let cardsToReward = 1;
                if (type === "mane") cardsToReward = 3;
                else if (type === "pdpne") cardsToReward = 2;
                while(cardsToReward-- > 0){            
                    args.cardsCount++;
                    if (args.cardsCount > 5){   //Deal an extra Card
                        query=`INSERT INTO poker.extra_cards SET own='${args.old.cc_userid}', lead='${type}';`;
                    }
                    else {                      //Deal new card
                        var card = randomizeCard(args.old.cc_userid);
                        query = `INSERT INTO poker.cards SET own='${card.own}', suit='${card.suit}', num=${card.num}, lead='${type}';`;
                    }
                    con.query(query, function(err){
                        if (err) throw err;
                    });
                }
            }
        }
    }
}

function checkEnrollment(args, type, divBy){
    if (args.new[type] > args.old[type]) {
        for (let k = 1; k <= args.new[type] - args.old[type]; k++) {
            args.rewardChips += (1/divBy);
            if ((args.old[type] + k) % divBy === 0) {
                args.cardsCount++;
                if (args.cardsCount > 5){   //Deal an extra Card
                    query=`INSERT INTO poker.extra_cards SET own='${args.old.cc_userid}', lead='${type}';`;
                }
                else {                      //Deal new card
                    var card = randomizeCard(args.old.cc_userid);
                    query = `INSERT INTO poker.cards SET own='${card.own}', suit='${card.suit}', num=${card.num}, lead='${type}';`;
                }
                con.query(query, function(err){
                    if (err) throw err;
                });
            }
        }
    }
}

function randomizeCard(user){
    var card = Math.floor((Math.random() * 52) + 1);
    var suit, number;
    if (card % 4 === 0) suit = "Hearts";
    else if (card % 4 === 1) suit = "Diamonds";
    else if (card % 4 === 2) suit = "Clubs";
    else if (card % 4 === 3) suit = "Spades";
    number = (card % 13) + 2;
    return {"own":user, "suit": suit, "num": number};
}

function sendReports(){
    let today = new Date();
    if (today.getHours() === 0) {
        today = new Date(new Date - 86400000)
        con.query('SELECT * FROM poker.reports', function(err, reportees){
            if (err) throw err;
            let delay = 0;
            //Get array of cards for individual agents and store them in the respective agents' array elements.
            con.query('SELECT * FROM poker.cards', function(err, cards){
                if (err) throw err;
                if (cards.length === 0) return false;   //If there are no agents to report on, then don't send report email!
                var query = `
                    SELECT cc_username, cc_userid, supervisor, site, RTRIM(client) AS client, fname, lname
                    FROM poker.users, poker.cards 
                    WHERE role="agent" AND users.cc_userid = cards.own 
                    GROUP BY cards.own`;
                con.query(query, function(err, agents){
                    if (err) throw err;
                    if (agents.length === 0) return false;   //If there are no agents to report on, then don't send report email!
                    //Pair together cards to the correct users.
                    for (let agent of agents) agent.cards = [];
                    for (let card of cards){
                        for (let agent of agents){
                            if (agent.cc_userid === card.own) {
                                agent.cards.push(card);
                                break;
                            }
                        }
                    }

                    //Sort agents by hand value and reward them by what type of hand they have
                    agents.sort(sortHands);
                    for (let agent of agents) rewardHands(agent);

                    //loop through array to send emails based on the info found
                    for (let reportee of reportees){
                        setTimeout(function(){
                            let generatedHTML = [];
                            //generate HTML based on reportee's role
                            var mailOptions = {
                                from: 'Poker@connexionpoint.com',
                                to: reportee.email,
                                subject: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} Poker Report for ${reportee.name}${(reportee.role === "Admin") ? "" : (reportee.role === "Manager") ? "'s site" : "'s team"}`,
                                html: '',
                                attachments: []
                            };
                            let pics = new Set(), counter = 0;
                            if (reportee.role === "Admin") {                                
                                //Best Hands Company Wide
                                generatedHTML.push(`<h1>Top 10 Hands Company Wide</h1>`);
                                for (let i = 0; counter < 10 && i < agents.length; i++) {
                                    if (agents[i].client != reportee.client) continue;
                                    counter++;
                                    generatedHTML.push(`<div style="display: inline-block; width: 400px">${counter}. ${agents[i].fname} ${agents[i].lname}: `);
                                    for (let card of agents[i].cards){
                                        generatedHTML.push(`<img title="${card.lead}" width=40px style="padding:5px" src="cid:${card.suit}-${card.num}">`);
                                        pics.add(`${card.suit}-${card.num}`);
                                    }
                                    generatedHTML.push('</div>');
                                }

                                //Best Hands per Site
                                for (let site in SITES) {
                                    generatedHTML.push(`<h2 style="margin-top: 50px;">Top 5 Hands in ${site}</h2>`);
                                    counter = 0;
                                    for (let agent of agents) {
                                        if (counter >= 5) break;
                                        if (agent.client != reportee.client || agent.site != site) continue;
                                        counter++;
                                        generatedHTML.push(`<div style="display: inline-block; width: 400px;"><span style="padding-top: 10px; width:60px;">${counter}. ${agent.fname} ${agent.lname}: </span>`);
                                        for (let card of agent.cards) {
                                            generatedHTML.push(`<img title="${card.lead}" height=40px style="padding:5px" src="cid:${card.suit}-${card.num}">`);
                                            pics.add(`${card.suit}-${card.num}`);
                                        }
                                        generatedHTML.push('</div>');
                                    }
                                    if (counter === 0) generatedHTML.push(`<p>No agents with cards today.</p>`);
                                }

                                //Best Hands per Team
                                for (let site in SITES) {
                                    for (let sup of reportees) {
                                        if (sup.client != reportee.client || sup.role != "Supervisor" || sup.site != site) continue;
                                        counter = 0;
                                        for (let agent of agents) {
                                            if (counter >= 3) break;
                                            if (agent.client != reportee.client || agent.supervisor != sup.name) continue;
                                            if (counter === 0) generatedHTML.push(`<h3 style="margin-top: 50px;">Top 3 Hands in (${SITES[sup.site]}) ${sup.name}'s Team</h3>`);
                                            counter++;
                                            generatedHTML.push(`<div style="display: inline-block; width: 400px;"><span style="padding-top: 10px; width:60px;">${counter}. ${agent.fname} ${agent.lname}: </span>`);
                                            for (let card of agent.cards){
                                                generatedHTML.push(`<img title="${card.lead}" height=40px style="padding:5px" src="cid:${card.suit}-${card.num}">`);
                                                pics.add(`${card.suit}-${card.num}`);
                                            }
                                            generatedHTML.push('</div>');
                                        }
                                    }
                                }
                            }
                            else if (reportee.role === "Manager") {
                                //Best Hands at Site Manager's Site
                                generatedHTML.push(`<h1>Top 10 Hands in ${reportee.site}</h1>`);
                                if (agents.length === 0) generatedHTML.push(`<p>No agents with cards today.</p>`);
                                counter = 0;
                                for (let agent of agents){
                                    if (agent.client != reportee.client || agent.site != reportee.site) continue;
                                    counter++;
                                    //Reward top 3 hands on site
                                    if (counter <= 3){
                                        let rewardChips = 5;
                                        if (counter === 2) rewardChips = 3;
                                        else if (counter === 3) rewardChips = 1;
                                        con.query(`UPDATE poker.users SET YTD_chips=YTD_chips+${rewardChips}, chips=chips+${rewardChips} WHERE cc_userid='${agent.cc_userid}'`, function(err){
                                            if (err) throw err;
                                            con.query(`INSERT INTO poker.chips_exchange_log SET date=CURDATE(), time=CURTIME(), client='${agent.client}', id='${agent.cc_username}', dealer='TopHands', amount=${rewardChips}`, function(err){
                                                if (err) throw err;
                                            });
                                        });
                                    }
                                    generatedHTML.push(`<div style="display: inline-block; width: 400px;"><span style="padding-top: 10px; width:60px;">${counter}. ${agent.fname} ${agent.lname}: </span>`);
                                    for (let card of agent.cards){
                                        generatedHTML.push(`<img title="${card.lead}" height=40px style="padding:5px" src="cid:${card.suit}-${card.num}">`);
                                        pics.add(`${card.suit}-${card.num}`);
                                    }
                                    generatedHTML.push('</div>');
                                }

                                //Best Hands per Team
                                for (let sup of reportees) {
                                    if (sup.client != reportee.client || sup.role != "Supervisor" || sup.site != reportee.site) continue;
                                    counter = 0;
                                    for (let agent of agents) {
                                        if (counter >= 5) break;
                                        if (agent.client != reportee.client || agent.supervisor != sup.name) continue;
                                        if (counter === 0) generatedHTML.push(`<h2 style="margin-top: 50px;">Top 5 Hands in ${sup.name}'s Team</h2>`);
                                        counter++;
                                        generatedHTML.push(`<div style="display: inline-block; width: 400px"><span style="padding-top: 10px; width:60px;">${counter}. ${agent.fname} ${agent.lname}: </span>`);
                                        for (let card of agent.cards){
                                            generatedHTML.push(`<img title="${card.lead}" height=40px style="padding:5px" src="cid:${card.suit}-${card.num}">`);
                                            pics.add(`${card.suit}-${card.num}`);
                                        }
                                        generatedHTML.push('</div>');
                                    }
                                }
                            }
                            else if (reportee.role === "Supervisor") {
                                //Best Hands in Supervisor's Team
                                generatedHTML.push(`<h1>Top 10 Hands in ${reportee.name}'s Team</h1>`);
                                if (agents.length === 0) generatedHTML.push(`<p>No agents with cards today.</p>`);
                                counter = 0;
                                for (let agent of agents){
                                    if (agents.client != reportee.client || agent.supervisor != reportee.name) continue;
                                    counter++;
                                    generatedHTML.push(`<div style="display: inline-block; width: 400px;"><span style="padding-top: 10px; width:60px;">${counter}. ${agent.fname} ${agent.lname}: </span>`);
                                    for (let card of agent.cards){
                                        generatedHTML.push(`<img title="${card.lead}" height=40px style="padding:5px" src="cid:${card.suit}-${card.num}">`);
                                        pics.add(`${card.suit}-${card.num}`);
                                    }
                                    generatedHTML.push('</div>');
                                }
                                if (counter === 0) return false;
                            }
                            mailOptions.html = generatedHTML.join('');                            
                            //Add the unique cards as attachments - prevents attaching multiples of the same file.
                            for (let pic of pics) mailOptions.attachments.push({filename: `${pic}.png`, path: `${WEB}/img/${pic}.png`, cid: `${pic}`});
                            transporter.sendMail(mailOptions, function(err, info){
                                if (err) throw err;
                                else console.log('Email sent: ' + info.response);
                            });
                        }, delay);
                        delay += 1000;
                    }//End of for i
                });
            });
        });
    }//End of if today.getHours() === 0
}
sendReports();
setInterval(sendReports, 3600000);

function rewardHands(agent){
    let rewardChips = 0, temp = handValue(agent.cards);
    switch(temp.handCode){
        case 2:     //Pair
            rewardChips = 1;    break;
        case 3:     //Two Pairs
            rewardChips = 2;    break;
        case 4:     //Three of a kind
            rewardChips = 3;    break;
        case 5:     //Straight
            rewardChips = 5;    break;
        case 6:     //Flush
            rewardChips = 7;    break;
        case 7:     //Full house
            rewardChips = 10;    break;
        case 8:     //Four of a Kind
            rewardChips = 13;    break;
        case 9:     //Straight Flush
            rewardChips = 16;    break;
        case 10:     //Five of a Kind
            rewardChips = 20;    break;
        case 11:     //Royal Flush
            rewardChips = 25;    break;
    }//End of switch

    //If rewardChips is > 0, add chips to user's row in DB.
    if (rewardChips > 0) {
        con.query(`UPDATE poker.users SET YTD_chips=YTD_chips+${rewardChips}, chips=chips+${rewardChips} WHERE cc_userid='${agent.cc_userid}'`, function(err){
            if (err) throw err;
            con.query(`INSERT INTO poker.chips_exchange_log SET date=CURDATE(), time=CURTIME(), client='${agent.client}', id='${agent.cc_username}', dealer='HandType', amount=${rewardChips}`, function(err){
                if (err) throw err;
            });
        });
    }
}

function cardCounter(cards){
    //Count number of cards of each number
    hand = {};
    for (var card of cards) (hand[`${card.num}`] === undefined) ? hand[`${card.num}`] = 1 : hand[`${card.num}`] += 1;
    return hand;
}

function highCard(hand) {
    var best = {handCode: 1, sum:0};
    for (let attr in hand){
        if (Number(attr) > best.sum) best.sum = Number(attr);
    }
    if (best.sum === 0) return {handCode: 0, sum:0}; //Fail code
    return best;
}

function handValue(cards){
    //Map out contents of cards in hand
    if (cards.length === 0) return {handCode: 0, sum:0}; //Fail code
    var hand = cardCounter(cards), temp = {}, flushBool = false;

    //Check for flush
    for (var i = 0; i < cards.length - 1; i++){
        if (cards[i].suit !== cards[i + 1].suit) break;
        if (i === cards.length - 2) flushBool = true;
    }

    //Check for hand value - 1: high card, 2: pair, 3: two pairs, etc...
    var best = {};  //hand code, sum
    if (cards.length >= 1) {
        best = highCard(hand);
        
        if (cards.length >= 2) {
            temp = pair(hand);                          if (temp.handCode === 2 && temp.handCode > best.handCode) best = temp;
            
            if (cards.length >= 3) {
                temp = threeAlike(hand);                if (temp.handCode === 4 && temp.handCode > best.handCode) best = temp;

                if (cards.length >= 4) {
                    temp = twoPairs(hand);              if (temp.handCode === 3 && temp.handCode > best.handCode) best = temp;
                    temp = fourAlike(hand);             if (temp.handCode === 8 && temp.handCode > best.handCode) best = temp;
                    
                    if (cards.length === 5) {
                        temp = straight(hand);          if (temp.handCode === 5 && temp.handCode > best.handCode) best = temp;
                        temp = fiveAlike(hand);         if (temp.handCode === 10 && temp.handCode > best.handCode) best = temp;
                        temp = fullHouse(hand);         if (temp.handCode === 7 && temp.handCode > best.handCode) best = temp;
                        
                        if (flushBool){
                            temp = flush(hand);         if (temp.handCode === 6 && temp.handCode > best.handCode) best = temp;
                            temp = straightFlush(hand); if (temp.handCode === 9 && temp.handCode > best.handCode) best = temp;
                            temp = royalFlush(hand);    if (temp.handCode === 11 && temp.handCode > best.handCode) best = temp;
                        }
                    }//End of cards.length === 5
                }//End of cards.length >= 4
            }//End of cards.length >=3
        }//End of cards.length >=2
    }//End of cards.length >=1
    return best;

    function pair(hand) {
        var best = {handCode: 2, sum:0};
        for (let attr in hand){
            if (hand[attr] === 2) best.sum = Number(attr) * 2;
        }
        if (best.sum === 0) return {handCode: 0, sum:0}; //Fail code
        return best;
    }

    function twoPairs(hand){
        var best = {handCode: 3, sum:0};
        var firstPair = false;
        for (let attr in hand){
            if (hand[attr] === 2 && firstPair === false) {
                best.sum = Number(attr) * 2;
                firstPair = true;
            }
            else if (hand[attr] === 2 && firstPair === true) {
                best.sum += Number(attr) * 2;
                return best;
            }
        }
        return {handCode: 0, sum:0}; //Fail code
    }

    function threeAlike(hand){
        var best = {handCode: 4, sum:0};
        for (let attr in hand){
            if (hand[attr] === 3) {
                best.sum += Number(attr) * 3;
                return best;
            }
        }
        return {handCode: 0, sum:0}; //Fail code
    }

    function straight(hand) {
        var best = {handCode: 5, sum:0};
        var prevCard = 0;
        for (let attr in hand){
            if (hand[attr] > 1) return {handCode: 0, sum:0}; //Fail code
            if (prevCard === 0) prevCard = Number(attr);
            else if (Number(attr) != prevCard + 1) return {handCode: 0, sum:0}; //Fail code
            else if (hand[attr] === 1) prevCard = Number(attr);
            best.sum += Number(attr);
        }
        return best;
    }

    function flush(hand){
        var best = {handCode: 6, sum:0};
        for (let attr in hand)
            best.sum += Number(attr) * hand[attr];
        return best;
    }

    function fullHouse(hand){
        var best = {handCode: 7, sum:0};
        var two = pair(hand);
        var three = threeAlike(hand);
        if (two.sum === 0 || three.sum === 0) return {handCode: 0, sum:0}; //Fail code
        best.sum = two.sum + three.sum;
        return best;
    }

    function fourAlike(hand){
        var best = {handCode: 8, sum:0};
        for (let attr in hand){
            if (hand[attr] === 4) {
                best.sum += Number(attr) * 4;
                return best;
            }
        }
        return {handCode: 0, sum:0}; //Fail code
    }

    function straightFlush(hand){
        var best = {handCode: 9, sum:0};
        var str = straight(hand);
        if (str.sum === 0) return {handCode: 0, sum:0}; //Fail code
        best.sum = str.sum;
        return best;
    }

    function fiveAlike(hand){
        var best = {handCode: 10, sum:0};
        for (let attr in hand){
            if (hand[attr] === 5) {
                best.sum += Number(attr) * 5;
                return best;
            }
        }
        return {handCode: 0, sum:0}; //Fail code
    }

    function royalFlush(hand){
        var best = {handCode: 11, sum:0};
        var str = straight(hand);
        if (str.sum != 60) return {handCode: 0, sum:0}; //Fail code
        best.sum = str.sum;
        return best;
    }
}

function sortHands(user1, user2){
    //Determine value of users' hands
    var cards1 = JSON.parse(JSON.stringify(user1.cards));
    var cards2 = JSON.parse(JSON.stringify(user2.cards));

    var hand1 = handValue(cards1);
    var hand2 = handValue(cards2);

    if (hand1.handCode === 0 && hand2.handCode === 0) return 0;
    else if (hand1.handCode === 0) return 1;
    else if (hand2.handCode === 0) return -1;
    else if (hand1.handCode < hand2.handCode) return 1;
    else if (hand1.handCode > hand2.handCode) return -1;
    else if (hand1.sum < hand2.sum) return 1;
    else if (hand1.sum > hand2.sum) return -1;
    //These hand codes are for 5-card combos. If the sum and handcode are the same, then there's no tie breaker.
    else if (hand1.handCode === 5 || hand1.handCode === 6 || hand1.handCode === 7 || 
        hand1.handCode === 9 || hand1.handCode === 10 || hand1.handCode === 11) return 0;

    //if handcode, sum, and enrollment count are all the same! Go by the next highest card value
    //tieBreaker() removes the cards that have already been compared to compare the next-best cards, until no cards remain.
    for (let i = 0; i < 4; i++){
        tieBreaker();
        if (hand1.handCode === 0 && hand2.handCode === 0) return 0;
        else if (hand1.handCode === 0) return 1;
        else if (hand2.handCode === 0) return -1;
        else if (hand1.sum < hand2.sum) return 1;
        else if (hand1.sum > hand2.sum) return -1;
    }

    return 0;

    function tieBreaker(){
        if (hand1.handCode === 1) {
            cards1 = removeAccountedCards(cards1, 1);
            cards2 = removeAccountedCards(cards2, 1);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
        else if (hand1.handCode === 2) {
            cards1 = removeAccountedCards(cards1, 2);  
            cards2 = removeAccountedCards(cards2, 2);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
        else if (hand1.handCode === 4) {
            cards1 = removeAccountedCards(cards1, 3);  
            cards2 = removeAccountedCards(cards2, 3);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
        else if (hand1.handCode === 8) {
            cards1 = removeAccountedCards(cards1, 4);  
            cards2 = removeAccountedCards(cards2, 4);
            hand1 = highCard(cardCounter(cards1));
            hand2 = highCard(cardCounter(cards2));
        }
    }

    function removeAccountedCards(cards, divideBy){
        let temp = [];
        for (let card of cards) if (card.num != (hand2.sum / divideBy )) temp.push(card);
        return temp;
    }
}
