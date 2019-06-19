from flask import Flask, render_template, redirect, jsonify
from flask_pymongo import PyMongo
from datetime import datetime
import json
# from bson.json_util import loads

# Create an instance of Flask
app = Flask(__name__)

# Use PyMongo to establish Mongo connection
mongo = PyMongo(app, uri="mongodb://localhost:27017/guns")

# Define shooting list
ShootList = ["mass shooting", "no injuries", "injuries only", "some dead"]
# ShootList = ["mass shooting"]

@app.route("/")
def home():
    return  render_template("index.html", ShootList = ShootList)

@app.route("/maps")
def charts():
   return  render_template("maps.html", ShootList = ShootList)

@app.route("/benchmark")
def bench():
   return  render_template("benchmark.html", ShootList = ShootList)


@app.route("/interactive_chart")
def intercharts():
   return  render_template("interactive_chart.html", ShootList = ShootList)

 

@app.route("/jsonifiedcities")
def jsonifiedcities():
    citylist = []
    cityinfo =  mongo.db.cities.find()
    for city in cityinfo:
        del city["_id"]
        citylist.append(city)
    return jsonify(citylist)

@app.route("/jsonifiedguns")
def jsonifiedguns():
    gunlist = []
    guninfo =  mongo.db.guns.find()
    for gun in guninfo:
        del gun["_id"]
        if gun["shoot_type"] in ShootList:
            gunlist.append(gun) 
    return jsonify(gunlist)

@app.route("/jsonifiedguns/<yr>")
def jsonifiedgunsy(yr):
    gunlist = []
    guninfo =  mongo.db.guns.find({ "year": int(yr) })
    #guninfo =  mongo.db.guns.find()
    for gun in guninfo:
        del gun["_id"]
        if gun["shoot_type"] in ShootList:
            gunlist.append(gun) 
        print(len(gunlist))
    return jsonify(gunlist)


@app.route("/jsonifiedstates")
def jsonifiedstates():
    statelist = []
    stateinfo =  mongo.db.states.find()
    for state in stateinfo:
        del state["_id"]
        statelist.append(state)
    return jsonify(statelist)

@app.route("/jsonifiedsummary")
def jsonifiedsummary():
    summarylist = []
    summaryinfo =  mongo.db.guns_summary.find()
    for shoot_type in summaryinfo:
        del shoot_type["_id"]
        summarylist.append(shoot_type)
    return jsonify(summarylist)

@app.route("/jsonifiedstatesummary")
def jsonifiedstatesummary():
    statesummarylist = []
    statesummaryinfo =  mongo.db.state_summary.find()
    for shoot_type in statesummaryinfo:
        del shoot_type["_id"]
        statesummarylist.append(shoot_type)
    return jsonify(statesummarylist)

if __name__ == "__main__":
    app.run(debug=True)
