from flask import Flask, render_template, redirect, jsonify
from flask_pymongo import PyMongo
from datetime import datetime
import json
import pandas as pd 
import os
import numpy as np
import datetime 
import csv

import pymongo

import request


# function to save dataframe to collection_name in MongoDB 'wines'    
def saveMongo(df, collection_name, replace=False):
    mng_client = pymongo.MongoClient('localhost', 27017)
    mng_db = mng_client['guns'] 
    if replace:
        mng_db[collection_name].drop() 
    db_cm = mng_db[collection_name]
    data = df
    data_json = json.loads(data.to_json(orient='records', date_unit='ns'))
    #db_cm.delete_many()
    db_cm.insert_many(data_json)
    


# In[2]:


# Load CSV file
csv_path = os.path.join('..',"rawdata", "gun-violence-data_01-2013_12-2015.csv")

# Read the first half of the gun violence file and store into Pandas data frame
gun_violence_df_2015 = pd.read_csv(csv_path, encoding = "ISO-8859-1")
gun_violence_df_2015.head()


# In[3]:


# Load CSV file
csv_path = os.path.join('..',"rawdata", "gun-violence-data_01-2016_03-2018.csv")

# Read the second half of the gun violence file and store into Pandas data frame
gun_violence_df_2018 = pd.read_csv(csv_path, encoding = "ISO-8859-1")
gun_violence_df_2018.head()


# In[4]:


# Recomine the two files
gun_violence_df= pd.concat([gun_violence_df_2015, gun_violence_df_2018])
gun_violence_df.head()


# In[5]:


# Convert the date field to date/time and removed unnecessary columns
gun_violence_df['date']= pd.to_datetime(gun_violence_df['date']) 
gun_violence_df=gun_violence_df.loc[(gun_violence_df['date'] <'2018-01-01') & (gun_violence_df['date']>'2013-12-31') ]
gun_violence_df.drop(columns=['address', 'incident_url', 'incident_url_fields_missing', 'source_url', 'participant_name','sources', 'location_description','notes'], inplace=True, axis=1)
gun_violence_df.head()


# In[6]:


# Search the incident_characteristics for specific incident types and set that incident type to True
gun_violence_df["mass"]=np.where(gun_violence_df['incident_characteristics'].str.contains("Mass Shooting", case=False, na=False), True, False)
gun_violence_df["gang"]=np.where(gun_violence_df['incident_characteristics'].str.contains("Gang", case=False, na=False), True, False)
gun_violence_df["domestic"]=np.where(gun_violence_df['incident_characteristics'].str.contains("Domestic Violence", case=False, na=False), True, False)
gun_violence_df["non-shooting"]=np.where(gun_violence_df['incident_characteristics'].str.contains("Non-Shooting", case=False, na=False), True, False)
gun_violence_df["accidental"]=np.where(gun_violence_df['incident_characteristics'].str.contains("Accidental", case=False, na=False), True, False)
gun_violence_df["prohibited"]=np.where(gun_violence_df['incident_characteristics'].str.contains("prohibited", case=False, na=False), True, False)
gun_violence_df['officer'] = np.where(gun_violence_df['incident_characteristics'].str.contains("Officer|TSA", case=False, na=False), True, False)
gun_violence_df.head()


# ## Load csv files into pandas dataframes, clean, save to mongo db

# In[7]:


# read in cities data
cities_path = os.path.join("..","Data","Cities.csv")

df_cities = pd.read_csv(cities_path, encoding="UTF-8")
df_cities.head()

# # save to/replace collection "cities" in "guns" mongo db
saveMongo(df_cities, "cities", replace=True)


# In[8]:


# read in state data
states_path = os.path.join("..","Data","States.csv")

df_states = pd.read_csv(states_path, encoding="UTF-8")
df_states = df_states[["state","census_2010","pop_estimate_2015","2015_median_income", "age18longgunpossess","age21longgunpossess","assault","mentalhealth","universal"]]

df_states.head()


# # save to/replace collection "states" in "guns" mongo db
saveMongo(df_states, "states", replace=True)


# In[12]:


# Loading gun violence
df_guns = gun_violence_df

df_guns = df_guns[["incident_id","date","state","city_or_county","n_killed","n_injured","incident_characteristics","latitude","longitude","mass","gang","domestic","non-shooting","accidental","prohibited","officer"]]
df_guns["n_involved"] = df_guns["n_killed"]+df_guns["n_injured"]
df_guns["year"]= pd.DatetimeIndex(df_guns['date']).year

# Create a column to record type of shooting
conditions = [
    (df_guns["mass"]==1),
    (df_guns["n_involved"] == 0),
    (df_guns["n_killed"]==0)]
choices = ["mass shooting", "no injuries","injuries only"]
df_guns["shoot_type"] = np.select(conditions, choices, default="some dead")

df_guns.head()

# Add in state level data for filtering purposes
df_guns_complete = pd.merge(df_guns, df_states, on="state", how="left")
df_guns_complete["count"] = 1
df_guns_complete.head()

# save to/replace collection "guns" in "guns" mongo db
saveMongo(df_guns_complete, "guns", replace=True)


# In[10]:


summary_guns_df = df_guns_complete.groupby("shoot_type",as_index=False).sum()[["pop_estimate_2015"]]
summary_guns_df["shoot_type"] = df_guns_complete.groupby("shoot_type",as_index=False).first()["shoot_type"]
summary_guns_df["Count"] = df_guns_complete.groupby("shoot_type",as_index=False).sum()[["count"]]
summary_guns_df["n_killed"]= df_guns_complete.groupby("shoot_type",as_index=False).sum()[["n_killed"]]
summary_guns_df["Incidents_per_100M"] = summary_guns_df ["Count"]/summary_guns_df["pop_estimate_2015"]*100000000 
summary_guns_df["Killed_per_100M"] = summary_guns_df ["n_killed"]/summary_guns_df["pop_estimate_2015"]*100000000 
summary_guns_df.reset_index()
summary_guns_df.head()

# save to/replace collection "guns_summary" in "guns" mongo db
saveMongo(summary_guns_df, "guns_summary", replace=True)


# In[17]:


summary_states_df = df_guns_complete.groupby(["shoot_type","state"], as_index=False).sum()[["pop_estimate_2015"]]
summary_states_df["state"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["state"]
summary_states_df["shoot_type"] = df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["shoot_type"]
summary_states_df["Count"] = df_guns_complete.groupby(["shoot_type", "state"],as_index=False).sum()[["count"]]
summary_states_df["n_killed"]= df_guns_complete.groupby(["shoot_type","state"],as_index=False).sum()[["n_killed"]]
summary_states_df["Incidents_per_100M"] = summary_states_df ["Count"]/summary_states_df["pop_estimate_2015"]*100000000 
summary_states_df["Killed_per_100M"] = summary_states_df ["n_killed"]/summary_states_df["pop_estimate_2015"]*100000000 
summary_states_df["2015_median_income"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["2015_median_income"]
summary_states_df["age18longgunpossess"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["age18longgunpossess"]
summary_states_df["age21longgunpossess"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["age21longgunpossess"]
summary_states_df["assault"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["assault"]
summary_states_df["mentalhealth"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["mentalhealth"]
summary_states_df["universal"]= df_guns_complete.groupby(["shoot_type", "state"],as_index=False).first()["universal"]

summary_states_df.reset_index()
summary_states_df.head()

# save to/replace collection "state_summary" in "guns" mongo db
saveMongo(summary_states_df, "state_summary", replace=True)




s
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
