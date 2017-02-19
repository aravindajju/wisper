var Alexa = require('alexa-sdk');
var http = require('http');

var states = {
    SEARCHMODE: '_SEARCHMODE'
};

var welcomeMessage = "Wisper, a Wipro assistant. You can ask me for a meeting room location, or say help. What will it be?";
var welcomeRepromt = "You can ask me for a meeting room location, or say help. What will it be?";

var wisperOverview = "I can find meeting rooms for Wipro locations in Bangalore.  I am still learning about Wipro.  I can help with more things in future.";
var HelpMessage = "Here is how you can ask for a room: Find me Nagarhole.";

var tryAgainMessage = "please try again.";

var learningMessage = "I don't know that yet.   I am still learning about Wipro. "+ tryAgainMessage;
var moreInformation = "See your Alexa app for more information.";
var noRoomErrorMessage = "There was an error finding this room, " + tryAgainMessage;
var noRoomFoundMessage = "I can't find this room.  Try another.";


var goodbyeMessage = "OK, you have a productive meeting";
var newline = "\n";

var output = "";
var assistantName = 'Wisper';

var alexa;

var newSessionHandlers = {
    'LaunchRequest': function () {
        this.handler.state = states.SEARCHMODE;
        output = welcomeMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
    'getRoomLocationIntent': function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState('getRoomLocationIntent');
    },
    'getRoomDirectionIntent': function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState('getRoomDirectionIntent');
    },
    'getRoomInfoIntent': function () {
        this.handler.state = states.SEARCHMODE;
        this.emitWithState('getRoomInfoIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    },
};


var startSearchHandlers = Alexa.CreateStateHandler(states.SEARCHMODE, {
    'getOverview': function () {
        output = wisperOverview;
        this.emit(':askWithCard', output, assistantName, wisperOverview);
    },
    'getRoomLocationIntent': function () {
        var cardTitle = wisperOverview;
        var cardContent = "";

        var slotValue = this.event.request.intent.slots.roomname.value;
        var roomName = slotValue;

        var client = require('./connection.js');  
        console.log("connection estabished: ");
        client.search({  
            index: 'rooms',
            type: 'room',
            body: {
            query: {
                "fuzzy": { "room": roomName }
            },
            }
        },function (error, response,status) {
            if (error){
                console.log("search error: "+error);
                alexa.emit(':ask', roomName +", "+ noRoomErrorMessage, tryAgainMessage);
            }
            else {
                console.log("--- Response ---");
                console.log(response);
                var hits = response.hits.hits;
                if (hits){
                    if (hits.length >=1){
                        var roomLocation = hits[0]._source;
                        console.log("Location --" + roomLocation.location);
                        output = roomName + " is in " + roomLocation.location + ", tower " + roomLocation.tower; 
                        cardTitle = roomName;
                        cardContent = roomLocation.city + newline + roomLocation.location + newline + roomLocation.tower;
                        if (roomLocation.floor){
                            output = output + ", floor " + roomLocation.floor;
                            cardContent = cardContent + newline + roomLocation.floor ;
                        }
                        alexa.emit(':tellWithCard', output, cardTitle, cardContent);
                    }else{
                        alexa.emit(':ask', roomName +", "+ noRoomFoundMessage, tryAgainMessage);
                    }                    
                }
            }
        });
    },
    'getRoomDirectionIntent': function () {
        output = learningMessage;
        var cardTitle = learningMessage;
        this.emit(':tellWithCard', output, cardTitle, output);
    },
    'getRoomInfoIntent': function () {
        output = learningMessage;
        var cardTitle = learningMessage;
        this.emit(':tellWithCard', output, cardTitle, output);
    },
    'AMAZON.YesIntent': function () {
        output = HelpMessage;
        this.emit(':ask', output, HelpMessage);
    },
    'AMAZON.NoIntent': function () {
        output = HelpMessage;
        this.emit(':ask', HelpMessage, HelpMessage);
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', goodbyeMessage);
    },
    'AMAZON.HelpIntent': function () {
        output = HelpMessage;
        this.emit(':ask', output, HelpMessage);
    },
    
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', output, HelpMessage);
    },
    'AMAZON.CancelIntent': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit(":tell", goodbyeMessage);
    },
    'SessionEndedRequest': function () {
        // Use this function to clear up and save any data needed between sessions
        this.emit('AMAZON.StopIntent');
    },
    'Unhandled': function () {
        output = HelpMessage;
        this.emit(':ask', output, welcomeRepromt);
    }
});

/*
function findRoomLocation(roomName){

  console.log("find room location: "+roomName);
  var client = require('./connection.js');  
  console.log("connection estabished: ");

  client.search({  
    index: 'rooms',
    type: 'room',
    body: {
      query: {
        "fuzzy": { "room": roomName }
      },
    }
  },function (error, response,status) {
      if (error){
        console.log("search error: "+error);
      }
      else {
        console.log("--- Response ---");
        console.log(response);
        console.log("--- Hits ---");

        var hits = response.hits.hits;
        if (hits){
            if (hits.length >=1){
                var roomLocation = hits[0]._source;
                console.log("Location --" + roomLocation.location);
                output = roomName + " is in " + roomLocation.location + ", tower " + roomLocation.tower; 
                cardTitle = roomName;
                cardContent = roomLocation.city + newline + roomLocation.location + newline + roomLocation.tower;
                if (roomLocation.floor){
                    output = output + ", floor " + roomLocation.floor;
                    cardContent = cardContent + newline + roomLocation.floor ;
                }
                console.log("card contnet:\n" + cardContent);
            }else{
                console.log("no results");
            }                    
        }


        //response.hits.hits.forEach(function(hit){
        //  console.log("Location --" + hit._source.location);
        //  console.log("Tower --" + hit._source.tower);
        //  console.log("Floor --" + hit._source.floor);
        //  console.log("Wing --" + hit._source.wing);
       //   return hit._source;       
       // })
      }
  });
  console.log("returned.");

}
*/

exports.handler = function (event, context, callback) {
    alexa = Alexa.handler(event, context);
    alexa.registerHandlers(newSessionHandlers, startSearchHandlers);
    alexa.execute();
};

String.prototype.trunc =
      function (n) {
          return this.substr(0, n - 1) + (this.length > n ? '&hellip;' : '');
};


//findRoomLocation("Nagarhole");