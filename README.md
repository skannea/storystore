# What is Storystore?
Storystore is a simple approach to storing time stamped HA data and transfer of that data to web applications.
Data is primarilly state changes that the web application may show as logs or charts. 

Storystore uses
HA helper entity attributes and python_script for storage of data
HA automations for storage updating and publishing 
MQTT publish and subscribe for transferring data to web applications
MQTT retained messages for non-volatile storage of data

Typical storystore sequence
an automation based on blueprint `storystore.yaml` triggers state change of `switch.door`
firts action is to call python_script `storystore.py` which
reads a set of records from the `story` attribute of a dedicated storage entity `input_text.doorlog` 
adds a new record about the state change and removes the oldest record
writes all records to the `story` attribute of `input_text.doorlog` 
second action is to publish a retained MQTT message with topic `storystore/doorlog` and a payload that contains the `story` attribute
a web application subscribing for `storystore/doorlog` topic receives the message  
the web application calls `story.idstateRows` to get the records as an array of objects



# Storysave blueprint

# Storysave python_script

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
