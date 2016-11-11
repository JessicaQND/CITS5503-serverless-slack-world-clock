# CITS5503-serverless-slack-world-timer

A serverless Slack app built with IBM Bluemix OpenWhisk, API Connect and Slack Events API

When a user installs the app in a Slack team, or interacts with a bot user, or uses a custom command, Slack calls the app implementation. Slack will talk to an API deployed with API Connect. In turn this API will invoke OpenWhisk actions.
From the perspective of the developer of the Slack app, there is no server involved: only OpenWhisk actions and an API in API Connect. 
Furthermore the code is not running if no user interacts with the app

## Overview

Built using IBM Bluemix, the app uses:

* OpenWhisk - to implement the app bot and commands
* Cloudant - to keep track of app installations
* API Connect - to expose the OpenWhisk actions to Slack
* Slack Events API
* Google Geocoding API
* Google Timezone API

## Funcional Requirements

## Non-functional Requirements

## Getting started

To 

1.Get in touch with a Team Admin - If you haven’t received an invitation yet, contact an Administrator on the team and ask them to 
send (or resend) your invite.

2.Accept invitation - Once you’ve been invited to join a Slack team, the first step is setting up your account. Just click the link
 in your email invitation to get started:

* Check your inbox for an invitation to join a Slack team.
* Click the Join button.
* On the signup page, enter your first and last name and choose a username.
* When you’re ready, click Next.
* Choose a password, then click Join team

3. If the "myserverlessapp" is not visible, click the direct messages tab on the left to reveal it

