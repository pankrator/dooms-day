"use strict";
const CALCULATE_AFTER_MILLISECONDS = 700;

const fs = require("fs");
const path = require("path");

const Q = require("q");
const express = require("express");
const session = require('express-session');
const bodyParser = require("body-parser");
const restify = require("restify");

function Server() {
    Q.longStackSupport = true;
    this.__setup();
};

Server.prototype.__setup = function () {
    this.app = restify.createServer({ name: "BeaconSpam" });
    this.app.use(bodyParser.json());
    this.app.use(session({
        secret: "beacon&spam",
        resave: false,
        saveUninitialized: true
    }));
    this.__setupRouting();
};

Server.prototype.listen = function() {
    console.log("Server started!");
    this.app.listen(8080);
};

Server.prototype.__setupRouting = function () {

    // Static files are added last as they match every request
    this.app.get(".*", restify.serveStatic({
        directory: "client/",
        default: "index.html"
    }));
};

module.exports = Server;
