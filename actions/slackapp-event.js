/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var async = require("async");
var request = require("request");
var googleApiKey = "Enter your API key here";
var googleApiGeocode = "https://maps.googleapis.com/maps/api/geocode/json";
var googleApiTimezone = "https://maps.googleapis.com/maps/api/timezone/json";

/* @param token - authorization token
* @param channel - the channel to post to
* @param callback - function(err, responsebody)
callDecision is called in main function*/

function callDecision(address, token, channel, callback) {
    request({
      //
      url: googleApiGeocode + "?address=" + address + "&key=" + googleApiKey,
      method: "GET",
      json: true

    }, function (err, response, body) {
        if (err) {
          return "broke";

          // If response cannot find any locations from input then print error message
        } else if (body.status === "ZERO_RESULTS") {
          postMessage(token, channel,
            "Location not found. Try again.",
            function (err, result) {
              callback(err);
            }
          );
          // If response finds location from input, use the 1st result and get the lat lng coordinates
        } else if (body && body.status === "OK") {
            var formattedAddress = body.results[0].formatted_address;
            var lat = body.results[0].geometry.location.lat;
            var lng = body.results[0].geometry.location.lng;
            // Now make requests to check the time and send a message if it is an appropriate time to call
            request({
                method: "GET",
                url: googleApiTimezone + "?location=" + lat + "," + lng + "&timestamp=1331161200" + "&key=" + googleApiKey,
                json: true
            }, function(err, response, body) {
                if (err) {
                    return "error";
                //
                } else if (body && body.status === "OK") {
                    var timeZoneId =  body.timeZoneId;
                    var now = new Date();
                    var locationTime = now.toLocaleTimeString('en-US', { timeZone: timeZoneId, hour12: false });
                    var splitLocationTime = locationTime.split(':');
                    var hours = Number(splitLocationTime[0]);
                    if (hours <= 7 || hours >= 21) {
                        var message = "The time in " + formattedAddress + " is " + locationTime + ", it is not an appropriate time to call!";
                    } else {
                        var message = "The time in " + formattedAddress + " is " + locationTime + ", it is a good time to call.";
                    }
                    postMessage(token, channel,
                      message,
                      function (err, result) {
                        callback(err);
                      });
                } else if (body && !body.status !== "OK") {
                    return 'Some sort of error :s';
                }
            });
        } else if (body && !body.status !== "OK") {
          // callback(body.status);
          return "response but not ok";
        } else {
          // callback("unknown response");
          return "wow broken response";
        }
    });
}
/**
 * Gets the details of a given user through the Slack Web API
 *
 * @param accessToken - authorization token
 * @param userId - the id of the user to retrieve info from
 * @param callback - function(err, user)
 */
function usersInfo(accessToken, userId, callback) {
  request({
    url: "https://slack.com/api/users.info",
    method: "POST",
    form: {
      token: accessToken,
      user: userId
    },
    json: true
  }, function (err, response, body) {
    if (err) {
      callback(err);
    } else if (body && body.ok) {
      callback(null, body.user);
    } else if (body && !body.ok) {
      callback(body.error);
    } else {
      callback("unknown response");
    }
  });
}

/**
 * Posts a message to a channel with Slack Web API
 *
 * @param accessToken - authorization token
 * @param channel - the channel to post to
 * @param text - the text to post
 * @param callback - function(err, responsebody)
 */
function postMessage(accessToken, channel, text, callback) {
  request({
    url: "https://slack.com/api/chat.postMessage",
    method: "POST",
    form: {
      token: accessToken,
      channel: channel,
      text: text
    }
  }, function (error, response, body) {
    callback(error, body);
  });
}

function main(args) {
  console.log("Processing new bot event from Slack", args);

  // connect to the Cloudant database
  var nano = require("nano")(args.cloudantUrl);
  var botsDb = nano.use(args.cloudantDb);

  // get the event to process
  var event = args.event;

  async.waterfall([
    // find the token for this bot
    function (callback) {
        console.log("Looking up bot info for team", event.team_id);
        botsDb.view("bots", "by_team_id", {
          keys: [event.team_id],
          limit: 1,
          include_docs: true
        }, function (err, body) {
          if (err) {
            callback(err);
          } else if (body.rows && body.rows.length > 0) {
            callback(null, body.rows[0].doc.registration)
          } else {
            callback("team not found");
          }
        });
    },
    // grab info about the user
    function (registration, callback) {
        console.log("Looking up user info for user", event.event.user);
        usersInfo(registration.bot.bot_access_token, event.event.user, function (err, user) {
          callback(err, registration, user);
        });
    },
    // reply to the message
    function (registration, user, callback) {
        console.log("Processing message from", user.name);
        if (event.event.type === "message") {
          callDecision(
            event.event.text,
            registration.bot.bot_access_token,
            event.event.channel,
            callback
          );
        } else {
          callback(null);
        }
      }
    ],
    function (err, result) {
      if (err) {
        console.log("Error", err);
        whisk.error(err);
      } else {
        whisk.done({
          status: "Registered"
        }, null);
      }
    });

  return whisk.async();
}
