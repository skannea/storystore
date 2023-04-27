# What is Storystore?
Storystore is a way to store time stamped HA data and transfer that data to web applications.
Typically, data are state changes that the web application may show as logs or charts.  

Storystore uses
- HA helper entity attributes and python_script based service for storage of data
- HA automations for storage updating and publishing 
- MQTT publish and subscribe for transferring data to web applications
- MQTT retained messages for non-volatile storage of data

Example storystore sequence

- an automation based on blueprint `storystorestate.yaml` triggers on state change of `switch.door`
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

Python scripts that can be used as HA services must follow a number of [restrictions](https://www.home-assistant.io/integrations/python_script/).

A service `python_script.storystore` is based on `storystore.py`. The service may be used for persistant logging and storing of data. The python script uses an attribute of a dedicated entity for storing a list of records with time stamp and a set of strings. A new record is put last in the list. The oldest one may be removed to ensure there is a limited number of records in the list.  

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

One and only one of arguments *restore*, *logstring*, *logidstate* or *logstate* must be provided. 

## JavaScript functions

A web application have to set up MQTT and, when connection is established, subscribe for the MQTT topic. See skannea/mqtt project.   

On reception of an MQTT message, the application must be aware of the format of the payload and use the proper function for decoding. The `story` object in file `story.js` contains functions for decoding.

### textRows

Function `story.textRows(data)` converts data and returns an array with one element for each record. First element is the oldest record. Each element is an array with time stamp as first element followed by all texts separated by vertical bar. 

Example data: 

`11:33:55|abra|kadabra;12:34:56|hocus|pocus;12:35:12|the end`

Example result: 

`[['11:33:55','abra','kadabra'],['11:34:15','hocus','pocus'],['11:38:57','the end']]`

Example code:

~~~
function myLog( data ) {
   var v = story.textRows( data );
   var html = '<b>History</b>';
   for ( var n=0; n<v.length; n++ ) 
      html += `<br>At ${v[n][0]} ${v[n][1]} took place.`
   document.getElementById( 'mylog' ).innerHTML = html;
}
~~~

### idstateRows

Function `story.idstateRows(data)` works with automations based on blueprint *Storystore state logger*. It converts data and returns an array with one element for each record. First element is the oldest record. Each element is an object with properties named `stamp`, `id` and `state`.  

Example data: 

`11:33:55|sensor.a|47.0;12:34:56|sensor.b|27.4;12:35:12|sensor.b|27.8`

Example result: 

`[{ stamp:'11:33:55',id:'sensor.a',state:'47.0' },{ stamp:'12:34:56',id:'sensor.b',state:'27.4' },{ stamp:'12:35:12',id:'sensor.b',state:'27.8' }]`

Example code:

~~~
function myTable( data ) {
   var v = story.idstateRows( data );
    
   var html = '<table>';
   for ( var n=0; n<v.length; n++ ) {  
             html += `<tr>
                       <td>${v[n].stamp}</td>
                       <td>${v[n].id}</td>
                       <td>${v[n].state}</td>
                      </tr>`; 
          }
   html += '</table>';
   document.getElementById( 'mytable' ).innerHTML = html;
}
~~~

### idstateCols

Function `story.idstateCols(data)` works with automations based on blueprint *Storystore chart logger* and *Storystore periodic logger*. It converts data and returns an object with three properties:

- `stamps` which is an array of time stamps (oldest first)
- `ids` which is an array of the entity ids 
- `states` which is an array of arrays, where first index addresses time stamp and the second index addresses entity id.  

Return data is useful when making charts based on *charts.js*.

Example data: 

`11:33:55|sensor.a|47.0|sensor.b|27.5|sensor.c|0.5;12:34:56|sensor.a|47.1|sensor.b|27.4|sensor.c|0.5`

Example result: 

`{ stamps:['11:33:55','12:34:56'], ids:[ 'sensor.a', 'sensor.b', 'sensor.c' ],  states:[['47.0','47.1'],['27.5','27.4'],['0.5','0.5']] }`

Example code:

~~~
tempChart = new Chart(document.getElementById("tempgraph"), tempChartConfig );
// tempChartConfig is not shown here
function tempDiagram( data ) { 
   var ax = story.idstateCols( data );
   tempChart.data.labels = story.to_hm(ax.stamps);
   tempChart.data.datasets[0].data = ax.states[0];
   tempChart.data.datasets[1].data = ax.states[1];
   tempChart.update();
}     
~~~


### stateCols

Function `story.stateCols(data)` works with automations based on blueprint *Storystore chart logger* and *Storystore periodic logger*. It converts data and returns an object with two properties:

- `stamps` which is an array of time stamps (oldest first)
- `states` which is an array of arrays, where first index addresses time stamp and the second index addresses entity.  

Return data is useful when making charts based on *charts.js*.

The difference from `story.idstateCols` is that no information on entity ids is present. The list of entities must be known.

Example data: 

`11:33:55|47.0|27.5|0.5;12:34:56|47.1|27.4|0.5`

Example result: 

`{ stamps:['11:33:55','12:34:56'], states:[['47.0','47.1'],['27.5','27.4'],['0.5','0.5']] }`

Example code:

~~~
tempChart = new Chart(document.getElementById("tempgraph"), tempChartConfig );
// tempChartConfig is not shown here
function tempDiagram( data ) { 
   var ax = story.stateCols( data );
   tempChart.data.labels = story.to_hm(ax.stamps);
   tempChart.data.datasets[0].data = ax.states[0];
   tempChart.data.datasets[1].data = ax.states[1];
   tempChart.update();
}     
~~~

# Data preservation

Storystore uses a dedicated custom entity attribute for storing data records. An entity state has a size limit of 255 bytes. A custom attribute has no such limit.
However, after a Home Assistant restart, all custom attributes are lost. In order to make the records survive a restart, the MQTT retain mechanism is used. 

When a new record is added, the attribute is updated and a MQTT message is sent with the same content as the attribute. This message has the retined flag set. When an application is staretd, it starts subscribing for a topic. If there is a retained message with that topic, it is sent to the client. That means that whenever the client is started, it gets the proper records. 

The retained message will also be used when Home Assistant is started. The automation will 
- trig on the Home Assistant start event
- subscribe for the topic using a `wait_for_trigger` that waits for a MQTT message of that topic
- get all records from the payload 
- restore the entity attribute using the Storystore service 

