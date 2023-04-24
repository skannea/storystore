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
- - reads a set of records from the `story` attribute of a dedicated entity `input_text.doorlog` 
- - adds a new record with time stamp and new state and removes the oldest record
- - writes all records to the `story` attribute of `input_text.doorlog` 
- second action is to publish a retained MQTT message with topic `storystore/doorlog` and a payload that contains the `story` attribute
- a web application subscribing for `storystore/doorlog` topic receives the MQTT message  
- the web application calls function `story.idstateRows` to get the records as an array of objects with `timestamp:`, `id:` and `state:`
- the web application updates a table showing the latest state changes

# Storystore resources

## Blueprints
|Storystore state logger| For logging of entities. When one entity changes, only that entity is logged.|stamp, id, state|storystorestate.yaml|table|
|Storystore periodic logger| For periodic logging of entities. Each time all entities are logged.|stamp, all states|storystoreperiod.yaml|chart|  
|Storystore chart logger| For logging of entities. When one entity changes, all entities are logged.|stamp, all states|storystorechart.yaml|chart|

## Storystore python_script
Python scripts that are to be used as HA services must follow a number of restrictions. https://www.home-assistant.io/integrations/python_script/ 
Python script **storystore.py** is intended for persistant logging and storing of data. It uses an attribute of an entity for storing a list of records with time stamp and a set of strings. A new record is put last in the list. The oldest one may be removed to ensure there are no more than MAX records in the list.
Records are separated with semicolon `;` and parts within a record are separated with vertical bar `|`. These characters must not be used in text.
The service takes the following arguments:
|useentity||entity_id of entity to use for storing records| mandatory
|useattribute||attribute to use for storing records |story
|usestamp ||sets the format to use for records. |full
|        |full|2023-03-26 13:47:55.4545
|        |hms| 13:47:55
|        |hm  | 13:47
|max|    |the maximal number of records to be stored| 10
|restore||used when HA is restarteduse value set complete attribute.  To be .
#   logstring: STRING # STRING is the complete string to put after the timestamp in record. 
#   logidstate: LIST  # LIST is an array of entity ids [ID1,ID2,ID3,...]. The string to put in record is formated as:
                      # ID1|STATE1|ID2|STATE2... Example record: 2023-03-26 13:47:55.4545|light.lamp|ON|sensor.temp|21.4;
#   logstate: LIST    # LIST is an array of entity ids [ID1,ID2,ID3,...]. The string to put in record is formated as:
                      # STATE1|STATE2|STATE3... Example record: 2023-03-26 13:47:55.4545|ON|21.4|4711;
# storystore - HA python_script f
# 
# The records are separated by ';' and put as an attribute (by default named 'story').
# The entity's state is updated with the time stamp.
# The service stores a maximum of MAX records. Latest record is put last and the oldest one is removed when necessary.  

# Split records on ;
# Split record on |

# Service call in yaml:
# service: python_script.storystore
# data:
#   useentity: ENT    # ENT is entity_id of entity to use for storing records, mandatory.
#   useattribute: ATT # ATT is attribute to use for storing records. Default is 'story'.
#   usestamp: STAMP   # STAMP sets the format to use for records. Default is full stamp, like 2023-03-26 13:47:55.4545.
                      # hms --> 13:47:55, hm --> 13:47
#   max: MAX          # MAX is the maximum of records to be stored. Default is 10
#   restore: STRING   # Attribute is set to STRING. To be used when HA is restarted.
#   logstring: STRING # STRING is the complete string to put after the timestamp in record. 
#   logidstate: LIST  # LIST is an array of entity ids [ID1,ID2,ID3,...]. The string to put in record is formated as:
                      # ID1|STATE1|ID2|STATE2... Example record: 2023-03-26 13:47:55.4545|light.lamp|ON|sensor.temp|21.4;
#   logstate: LIST    # LIST is an array of entity ids [ID1,ID2,ID3,...]. The string to put in record is formated as:
                      # STATE1|STATE2|STATE3... Example record: 2023-03-26 13:47:55.4545|ON|21.4|4711;

# One and only one of restore, logstring, logidstate or logstate shall be provided. 

useentity    = data.get('useentity', '')
useattribute = data.get('useattribute', 'story')
usestamp     = data.get('usestamp', 'full')
logidstate   = data.get('logidstate', '' )
logstate     = data.get('logstate', '' )
logstring    = data.get('logstring', '' )
restore      = data.get('restore', '' )
max          = int(data.get('max', '10'))





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

