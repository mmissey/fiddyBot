
var config = {
	channels: [CHANNELS TO JOIN],
	server: SERVER_ADDRESS,
	botName: BOT_NICK,
	masterNick: MASTER_NICK,
	password: SERVER_PASSWORD,
	allowAll: false
};
var pageTitleRegEx =  /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/g;

// Get the lib
var irc = require("irc");

//for the youtube
var request = require("request");

var nicksArr = [];

var battles = [];
var playResistance = true;

// Create the bot name
var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels,
	port: 14355,
	secure:true,
	selfSigned: true,
	password: "l3tm3.1n",
	debug: true
});

bot.addListener("message", function(nick, to, text, message) {
	if((nick == config.masterNick)|| config.allowAll){
		parseMessage(text, nick);
	}else if(text.substr(0,5) == "pass "){
		if(text.substr(5) == config.password){
			config.masterNick = nick;
			tellMaster("WELCOME MASTER");
		}else{
			tellMaster("wrong password from " + nick);
		}
	}
	if(text.substr(0,5).toUpperCase() == ".ROLL"){
		rollDice(text.substr(6));
	}else if(text.substr(0,4) == "http"){
			var end = text.indexOf(' ');
			var url = text.substr(0);
			getPageTitle(url);
	}else if(text.substr(0,3).toUpperCase() == "RES"){
		parseResistance(text.substr(4), nick)

	}
});
function parseResistance(text, nick){
		console.log(text);
		var words = text.split(' ');
		console.log(JSON.stringify(words));
		if(resistance.gameOn){
			switch(words[0].toUpperCase()){
					case "IN":
					if(resistance.gameOn){
						addPlayer(nick);
					}
					break;
					case "TEAM":
						if(resistance.gameOn){
							if(nick == resistance.players[resistance.leader]){
								chooseTeam(text.substr(words[0].length+1), nick);
							}else{
								resSay("--- YOU AREN'T THE LEADER, " + nick);
							}
						}
					break;
					case "YES":
						addVote(nick, true);
					break;
					case "START":
					if(playResistance){
						beginResistance();
					}
					break;
					case "NO":
						addVote(nick, false);
					break;
					case "SUCCEED":
						addMissionVote(nick, true)
						break;
					case "FAIL":
						addMissionVote(nick, false);
						break;
					case "PLAYERS":
						resSay(resistance.players.length + " Players: " + JSON.stringify(resistance.players));
					break;
					case "END":
						resSay("--- RESETTING GAME ---");
						resetGame();
					break;
				}
		}else if(words[0].toUpperCase() == "START")
		{
			if((resistance.gameOn == false)&&(playResistance)){
				startResistance();
			}
		}
}
bot.addListener("join", function(channel, nick, message) {
	console.log("JOIN from: "+nick+ " - on " + channel);
	if(nick == config.masterNick){
		nicksArr.push(nick);
		opUser(config.masterNick, true);
		tellMaster("WELCOME MASTER");
	}else if(nick == config.botName){
		tellMaster("BOT READY!")
		//bot.say(config.channels[0], "MARCBOT ONLINE");
	}else{
		bot.say(config.channels[0], "Welcome " + nick);
	}
});

//bot.addListener("nick", function(oldnick, newnick, channels, message){
//	
//}

bot.addListener("error", function(message) {
	console.log(message);
	bot.say(config.masterNick,JSON.stringify(message));
});

bot.addListener("names", function(channel, nicks) {
	nicksArr = nicksArr.concat(nicks);
});

function tellMaster(msg){
	if(nicksArr.indexOf(config.masterNick) !== -1){
		bot.say(config.masterNick, msg);
	}
}

function parseMessage(text, nick){
	var words = text.split(' ');
	var rest = text.substr(text.indexOf(' ')+1);
	switch(words[0].toUpperCase()){
		case "REPEAT":
			bot.say(nick, rest);
			console.log("REPEAT: "+rest)
		break;
		case "SAY":
			bot.say(config.channels[0], rest);
			console.log("SAYING: "+ rest)
		break;
		case "KICK":
			bot.send("KICK", config.channels[0], rest);
			console.log("KICKING: "+ rest)
		break;
		case "SAY":
			bot.say(config.channels[0], rest);
			console.log("SAYING: "+ rest)
		break;
		case "CHANMODE":
			bot.send("MODE", config.channels[0], rest);
		break;
		case "+VOICE":
			voiceUser(words[1], true);
		break;
		case "+OP":
			opUser(words[1], true);
		break;
		break;
		case "-VOICE":
			voiceUser(words[1], false);
		break;
		case "-OP":
			opUser(words[1], false);
		break;
		case "MSG":
			console.log(words);
			if(words[1]){
				bot.say(words[1], rest.substr(words[1].length+1));
			}
		break;
		case "NOTICE":
			if(words[1]){
				bot.notice(words[1], rest.substr(words[1].length+1));
			}
		break;
		case "ACT":
			bot.action(config.channels[0], rest);
		break;
		case "+ALLOW":
			config.allowAll = true;
			bot.notice(config.channels[0], "PUBLIC COMMANDS ON");
		break;
		case "-ALLOW":
			config.allowAll = false;
			bot.notice(config.channels[0], "PUBLIC COMMANDS OFF");
		break;
		case "HELP":
			showHelp();
		break;
		case "WHOIS":
			bot.whois(words[1], function(data){
				bot.say(nick, JSON.stringify(data));
			});
		break;
		case "NICK":
			bot.send("NICK", rest);
			config.botName = rest;
		break;
		case "PART":
			bot.part(rest, function(){
				tellMaster("Left channel: " + rest);
			});
		break;
		case "JOIN":
			bot.join(rest, function(){
				tellMaster("joined channel: " + rest);
			});
		break;
		case "RAW":
			eval(rest);
		break;
		case "+RES":
			resSay("--- Now accepting [res start] commands ---");
			playResistance = true;
		break;
		case "-RES":
			resSay("--- Now ignoring [res start] commands ---");
			playResistance = false;
		break;
		case "+TELLSPIES":
			resSay("--- The spies will be told who the other spies are ---");
			resistance.spiesKnow = true;
		break;
		case "-TELLSPIES":
			resSay("--- The spies will NOT be told who the other spies are ---");
			resistance.spiesKnow = false;
		break;

	}
}
function showHelp(){
	bot.say(config.channels[0], "-- BOT COMMANDS: SAY <msg>, MSG <user> <msg>, NOTICE <user/chan> <msg>, .ROLL <#d#+#d#+...>, REPEAT <msg>,  +VOICE <user>, -VOICE <user>, +OP <user>, -OP <user>, ACT <msg>, +ALLOW, -ALLOW, CHANMODE <mode>, KICK <user>, WHOIS <user>, HELP --");
}
function voiceUser(user, on){
	var flag = on ? '+v' : '-v';
	bot.send("MODE", config.channels[0], flag, user);
}

function opUser(user, on){
	var flag = on ? '+o' : '-o';
	bot.send("MODE", config.channels[0], flag, user);
}


function rollDice(diceStr){
	console.log(diceStr);
	var dice = diceStr.split("+");
	for(die in dice){
		bot.say(config.channels[0], "Rolling " + dice[die] +": " + roll(dice[die]));
	}
}

function roll(die){
	console.log(die);
	if(die.indexOf('d') !== -1){
		die = die.split("d");
	}else{
		return "Bad input. Must be #d#"
	}
	var num = die[0];
	var type = die[1];
	if(num >256){
		return "Why can't I hold all these dice!?";
	}
	var outcome = 0;
	for(var i =0; i < num; i+=1){
		outcome += Math.ceil(Math.random()*type);
	}
	return outcome;
}

function getPageTitle(url){
	console.log("Getting title");
	request(url, function(error, response, body) {
		console.log(error);
		var match = pageTitleRegEx.exec(body);
		if (match && match[2]) {
			console.log(match[2]);
	        if(match[2] == null){
				bot.say(config.channels[0], "null title :(");
			}else{
	       		bot.say(config.channels[0],"(" + match[2] +")");
	       	}
	    }else{
	    	bot.say(config.channels[0],"(null title :( )");
	    }
   	});
}


/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
//////////////////////                           ////////////////////
/////////////////////    IRC Resistance BOT     /////////////////////
////////////////////                           //////////////////////
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////



var resistance = {
	players: [],
	gameTimer: '',
	mission: 0,
	leader: 0,
	votes: {
		yes: [],
		no: []
	},
	state: 'nothing',
	spies: [],
	resPoints: 0,
	spyPoints: 0,
	missionSuccess: {
		yes: [],
		no: []
	},
	gameOn: false,
	numOnMission: 0,
	playersInMission: [],
	numSpies : 0,
	spiesKnow: true
};

var playerTable = {
	'1': [1,1],
	'5': [2,2,3,2,3,3],
	'6': [2,2,3,4,3,4],
	'7': [3,2,3,3,-4,4],
	'8': [3,3,4,4,-5,5],
	'9': [3,3,4,4,-5,5],
	'10':[4,3,4,4,-5,5]
}

function startResistance(){
	resSay("--- Game of Resistance starting in 1 min (Say 'res in') ---");
	resistance.state = "join";
	resistance.gameOn = true;
}

function beginResistance(){
	if(resistance.players.length < 5){
		resSay("--- NOT ENOUGH PLAYERS. GAME CANCELLED ---");
		resetGame();
		return;
	}else if(resistance.players.length > 10){
		resSay("TOO MANY PLAYERS! MAX 10")
		resetGame();
		return;

	}
	resistance.numSpies = playerTable[resistance.players.length][0];
	resSay("There are " + resistance.numSpies + " spies playing");
	chooseSpies();

	startRound();
}
function startRound(){
	resistance.mission += 1;
	resistance.numOnMission = playerTable[resistance.players.length][resistance.mission];
	if(resistance.numOnMission < 0){
		resSay("THIS ROUND REQUIRES 2 SABOTAGES TO FAIL");
		resistance.numOnMission = resistance.numOnMission*-1;
	}
	resistance.state= "chooseteam";
	resSay("Mission #"+ resistance.mission + " starting. " + resistance.players[resistance.leader] + " chooses a team of " + resistance.numOnMission + ". (say 'res team <nick> <nick> ... )'");
}
function resetGame(){
	for(p in resistance.players){
		voiceUser(resistance.players[p], false);
	}
	resistance.gameOn = false;
	resistance.players.length = 0;
	resistance.spies.length = 0;
	resistance.resPoints = 0;
	resistance.spyPoints = 0;
	resetMission();
}
function resetMission(){
	resistance.playersInMission = [];
	resistance.votes.yes.length = 0;
	resistance.votes.no.length = 0;
	resistance.missionSuccess.yes.length = 0;
	resistance.missionSuccess.no.length = 0;
	resistance.state = "chooseteam";
}
function addPlayer(nick){
	if((resistance.state == 'join') &&(resistance.gameOn)&&(resistance.players.indexOf(nick) == -1)){
		resistance.players.push(nick);
		resSay(nick +" is playing. " + JSON.stringify(resistance.players));
		voiceUser(nick, true);
	}
}
function resSay(msg){
	bot.notice(config.channels[0],"--- " + msg + " ---");
}
function countVotes(){
	var votes ="";
	for(vote in resistance.votes.yes){ votes = votes.concat(" :  O")}
	for(vote in resistance.votes.no){ votes = votes.concat(" :  X")}
	resSay("VOTE OUTCOME"+ votes);
		

	if(resistance.votes.yes.length > resistance.votes.no.length){
		resSay("MISSION APPROVED!");
		messageTeam();
		resistance.state = "votemission";
		incrementLeader();
	}else{
		incrementLeader();
		resSay("MISSION DENIED. " + resistance.players[resistance.leader] + " chooses a new team.");
		resetMission();
	}
}
function incrementLeader(){
	resistance.leader += 1;
	if(resistance.leader >= resistance.players.length){
		resistance.leader = 0;
	}
}

function tellSpies(){
	if(resistance.spiesKnow){
		var spies = "";
		for(s in resistance.spies){
			spies += resistance.players[resistance.spies[s]] + ", ";
		}
		for(s in resistance.spies){
			bot.say(resistance.players[resistance.spies[s]], "The spies are: " + spies);
		}
	}
}
function missionSucceeds(){
	var votes ="";
	for(vote in resistance.missionSuccess.yes){ votes = votes.concat(" :  O")}
	for(vote in resistance.missionSuccess.no){ votes = votes.concat(" :  X")}
	resSay("VOTE OUTCOME"+ votes);
		

	if(resistance.missionSuccess.no.length > 0){
		resSay("MISSION FAILED!");
		resistance.spyPoints += 1;
		if(resistance.spyPoints == 3){
			gameOver(false);
			return;
		}

	}else{
		resSay("MISSION SUCCEEDS!");
		resistance.resPoints +=1;
		resSay("The score is Resistance: " + resistance.resPoints +  "  Spies: " + resistance.spyPoints)
		if(resistance.resPoints == 3){
			gameOver(true);
			return;
		}
	}
		resetMission();
		startRound();
}
function gameOver(win){
	var winner = win ? "RESISTANCE" : "SPIES";
	resSay("GAME OVER! THE " + winner + " WINS!");
	resetGame();
}

function addMissionVote(nick, succeed){
	if(resistance.state !== "votemission"){ return;}
	var opposite = succeed ? resistance.missionSuccess.no : resistance.missionSuccess.yes;
	var choice = succeed ? resistance.missionSuccess.yes : resistance.missionSuccess.no;
	if(choice.indexOf(nick) !== -1){
		bot.say(nick, "-- You already voted ---");
		return false;
	}
	var voteChange = opposite.indexOf(nick);
	var numVotes = 0;
	if(resistance.playersInMission.indexOf(nick) !== -1){
		if(voteChange != -1){ opposite.splice(voteChange) }
		if(succeed){
			resistance.missionSuccess.yes.push(nick);
		}else{
			resistance.missionSuccess.no.push(nick);
		}
		numVotes = resistance.missionSuccess.yes.length + resistance.missionSuccess.no.length;
		if(voteChange == -1){
			resSay(nick + " voted. " +  numVotes + "/"+ resistance.numOnMission + " votes received.");
		}else{
			bot.say(nick, "--- You've changed your vote. ---");
		}
		if(numVotes == resistance.numOnMission){
			missionSucceeds();
		}
	}else{
		resSay("You're not in this mission, " + nick + "! You can't vote!");
	}
}

function messageTeam(){
	for(p in resistance.playersInMission){
		bot.say(resistance.playersInMission[p], "--- Please vote on the success of this mission. (res succeed/fail) ---");
	}
}
function addVote(nick, yes){
	if((resistance.state == "voteteam")&&(resistance.players.indexOf(nick) !== -1)){
		var opposite = yes ? resistance.votes.no : resistance.votes.yes;
		var choice = yes ? resistance.votes.yes : resistance.votes.no;
		if(choice.indexOf(nick) !== -1){
			bot.say(nick, "-- You already voted");
			return false;
		}
		var voteChange = opposite.indexOf(nick);
		var numVotes = 0;
		if(voteChange != -1){ 
			opposite.splice(voteChange);
		}
		if(yes){
			resistance.votes.yes.push(nick);
		}else{
			resistance.votes.no.push(nick);
		}
		numVotes = resistance.votes.yes.length + resistance.votes.no.length;
		if(voteChange == -1){
			resSay(nick + " voted. " +  numVotes + "/"+ resistance.players.length + " votes received.");
		}else{
			bot.say(nick, "--- You've changed your vote. ---");
		}
		if(resistance.votes.yes.length + resistance.votes.no.length == resistance.players.length){
			countVotes();
		}
	}else{
		resSay("You're not in this game, " + nick + "! You can't vote!");
	}
}

function chooseSpies(){
	var index;
	for(var i = 0; i< resistance.numSpies; i++){
		index = Math.floor(Math.random()*resistance.players.length);
		while(resistance.spies.indexOf(index) != -1){
			index = Math.floor(Math.random()*resistance.players.length);
		}
		resistance.spies.push(index);
		bot.say(resistance.players[index], "--- YOU ARE A SPY ---");
	}
}

function chooseTeam(text, nick){
	if(resistance.state == "chooseteam"){
		var words = text.split(' ');
		if(words.length < resistance.numOnMission){
			resSay("Not enough players on the team. Choose " + resistance.numOnMission + " players");
			return;
		}
		resistance.playersInMission.length = 0;
		for(var i=0; i<resistance.numOnMission;i+=1){
			resistance.playersInMission.push(words[i]);
		}

		resSay("The chosen team is: " + JSON.stringify(resistance.playersInMission));
		resSay("Vote by saying 'res yes/no'");
		resistance.state = "voteteam";
	}else{
		resSay("It's not time for that yet," + nick);
	}
}

