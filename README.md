# What is Storystore?
Storystore is a way to store time stamped HA data and transfer that data to web applications.
Data is primarilly state changes that the web application may show as logs or charts. - 

Storystore uses
HA helper entity attributes and python_script for storage of data
HA automations for storage updating and publishing 
MQTT publish and subscribe for transferring data to web applications
MQTT retained messages for non-volatile storage of data

Example storystore sequence
- an automation based on blueprint `storystore.yaml` triggers on state change of `switch.door`
- first action is to call a python_script `storystore.py` which
    - reads a set of records from the `story` attribute of a dedicated entity `input_text.doorlog` 
    - adds a new record with time stamp and new state and removes the oldest record
    - writes all records to the `story` attribute of `input_text.doorlog` 
- second action is to publish a retained MQTT message with topic `storystore/doorlog` and a payload that contains the `story` attribute
- a web application subscribing for `storystore/doorlog` topic receives the MQTT message  
- the web application calls function `story.idstateRows` to get the records as an array of objects with `timestamp:`, `id:` and `state:`
- the web application updates a table showing the latest state changes

# Storystore resources

## Blueprints
| blueprint |description|yaml|typical use|
| --------  | -----     |----|----- |
|Storystore state logger| For logging of entities. When one entity changes, only that entity is logged.|storystorestate.yaml|table|
|Storystore periodic logger| For periodic logging of entities. Each time all entities are logged.|storystoreperiod.yaml|chart|  
|Storystore chart logger| For logging of entities. When one entity changes, all entities are logged.|storystorechart.yaml|chart|
All blueprints have inputs for 
- the list of entities to log
- the entity to use for storage
- the number of records to store 
- the MQTT topic to use 

## Service
Python scripts that can be used as HA services must follow a number of [restrictions](https://www.home-assistant.io/integrations/python_script/) 
A service `python_script.storystore` is based on `storystore.py`. The service may be used for persistant logging and storing of data. The python script uses an attribute of a dedicated entity for storing a list of records with time stamp and a set of strings. A new record is put last in the list. The oldest one may be removed to ensure there are no more than MAX records in the list.  
Records are separated with semicolon `;` and parts within a record are separated with vertical bar `|`. These characters must not be used in text.
The service takes the following arguments:
| argument | code |description|default
| -------- | -----|---------- |-----
|useentity |      |entity id of entity to use for storing records| mandatory
|useattribute|    |attribute to use for storing records |story
|usestamp  |      |sets the format to use for records. |full
|          |full  |like 2023-03-26 13:47:55.4545 |
|          |hms   |like 13:47:55 |
|          |hm    |like 13:47 |
|max       |      |the maximal number of records to be stored| 10
|restore   |      |value to completly set the attribute when HA is restarted |see below
|logstring |      |value (that may contain vertical bars) to put after time stamp in record |see below
|logidstate|      |array of entities whose ids and states are put in a record like: 2023-03-26 13:47:55.4545\|light.lamp\|ON\|sensor.temp\|21.4; |see below
|logstate  |      |array of entities whose states are put in a record like: 2023-03-26 13:47:55.4545\|ON\|21.4; |see below

One and only one of arguments restore, logstring, logidstate or logstate shall be provided. 

## JavaScript functions
A web application have to set up MQTT and, when connection is established, subscribe for the MQTT topic.
On reception of an MQTT message, the application must be aware of the format of the payload and use the proper function for decoding. 
| function |result|supports blueprint|
| --------  | ----|------ |
|`textRows`| One array for all records, each with one array for each record with time stamp as first element followed by all texts separated by vertical bar.|Storystore state logger
|`idstateRows`| One array for all records, each with one object with properties named `stamp`, `id` and `state`.array for each record with time stamp as first element followed by all texts separated by vertical bar.|Storystore state logger
|`idstateCols`| One object with properties named `stamps`, `ids` and `states`, where `stamps` %%%, `ids` and `states`.array for each record with time stamp as first element followed by all texts separated by vertical bar.|Storystore state logger

// make one array per record
textRows: function ( data ) {
assume stamp|id|state, sort records and make { stamps:[], ids:[], states:[] } where states[n][t]-->stamps[t], ids[n]  

# Storysave HTML page

JavaScript functions

story.loglines( DATA, LOGENTITY )
datetime(N) 
 --> 2023-03-25 15:04:07.396834     
hms( n )  
//2023-03-25 15:04:07.396834 --> 15:04:07    
hmsf( n ) {
//2023-03-25 15:04:07.396834 --> 15:04:07.39    
 text( n ) {
array( n ) 


blueprint:
  name: Storysave logger  
  description: |-
     Automation for logging state changes of entities as records in a dedicated Storysave entity's *story* attribute. 
     Requires *python_script.storysave*. 
     Stored as <Timestamp>#<Log type>#<Logged state>#<Logged entity_id>;<next record... 
     for example # 2023-03-26 13:47:55.4545#INFO#Event happened#sensor.msg;2023-03-26 13:44:53#INFO#Event...
      

# storysave - HA python_script for persistant logging and storing 
# This service uses an entity (ENT) for storing records with time stamp and a string (STRING).
# The entity should be an input_text helper entity (others may work).
# The records are put as an attribute named 'story'.
# The service stores a maximum (MAX) of records: the oldest is removed when necessary.  
# The entity's state is updated with the new string.
# Restore mode (restore: long string) means that story attribute is to be set to that long string. 
# Restore is used when HA is restarted.

# Service call in yaml:

# service: python_script.storysave
# data:
#   entity_id: ENT  # default is input_text.history
#   log: STRING     # default is an empty string, STRING must not contain ';' or '#'
#   max: MAX        # default is 10
#   restore: R      # default is '' which means normal operation, do not restore 

entity_id = data.get("entity_id", 'input_text.history')
log = data.get("log", "" )
restore = data.get("restore", "" )
max = int(data.get("max", "10"))
# record format is  2023-03-26 13:47:55.4545#<STRING>Event happened again;2023-03-26 13:44:53#Event happened first time
# latest is first, split records on ;, split time/log on #

