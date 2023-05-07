# storystore - HA python_script for persistant logging and storing.
# This service uses an entity (ENT) for storing records with time stamp and a set of strings.
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


# Detected problems: "data" is not defined  - but "data" is built in

useentity = data.get('useentity', '')
useattribute = data.get('useattribute', 'story')
usestamp = data.get('usestamp', 'full')
logidstate = data.get('logidstate', '')
logstate = data.get('logstate', '')
logstring = data.get('logstring', '')
restore = data.get('restore', '')
max = int(data.get('max', '10'))

# save all attributes but story
attrs = hass.states.get(useentity).attributes
result = {}
for key in attrs:
    if key != useattribute:
        result[key] = attrs[key]


stamp = f'{datetime.datetime.now()}'
if usestamp == 'hm':
    stamp = stamp[11:16]
elif usestamp == 'hms':
    stamp = stamp[11:19]
elif usestamp == 'raw':
    stamp = str(time.time()*1000)  # ms since 1970

if (restore != ''):  # recreate complete story attribute
    result[useattribute] = restore
else:
    if (logstring != ''):     # create new record from log
        story = f'{stamp}|{logstring}'
    elif (logidstate != ''):  # create new record with id|state from list
        story = stamp
        ix = 0
        while (ix < len(logidstate)):
            story = story + '|' + \
                logidstate[ix] + '|' + hass.states.get(logidstate[ix]).state
            ix = ix + 1
    elif (logstate != ''):  # create new record with state|state from list
        story = stamp
        ix = 0
        while (ix < len(logstate)):
            story = story + '|' + hass.states.get(logstate[ix]).state
            ix = ix + 1

    records = attrs.get(useattribute, '').split(';')
    n = 1  # count of records, 1 is the new one
    j = len(records)-1  # index of newest existing
    while (j >= 0) and (n < max):
        if (records[j] != ''):
            story = records[j] + ';' + story
        j = j-1
        n = n+1
    result[useattribute] = story

hass.states.set(useentity, stamp, result, True)
