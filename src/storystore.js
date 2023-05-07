// skannea
// ============================================= Storystore
const storystore = {
  // ---------------------------------------------
  // 11:33:55|abra|kadabra;12:34:56|hocus|pocus;12:35:12|the end
  // [['11:33:55','abra','kadabra'],['11:34:15','hocus','pocus'],['11:38:57','the end']]
  // make one array per record
  textRows: function (data) {
    var inrecords = data.log.split(";");
    var outrecords = [];
    var i = 0; // starting with earliest record
    while (i < inrecords.length) {
      var ar = inrecords[i].split("|");
      outrecords.push(ar);
      i++;
    }
    return outrecords;
  },
  // ---------------------------------------------
  // 11:33:55|sensor.a|47.0;12:34:56|sensor.b|27.4;12:35:12|sensor.b|27.8
  // [{ stamp:'11:33:55',id:'sensor.a',state:'47.0' },{ stamp:'12:34:56',id:'sensor.b',state:'27.4' },{ stamp:'12:35:12',id:'sensor.b',state:'27.8' }]
  // assume stamp|id|state, make one object per record
  idstateRows: function (data) {
    var inrecords = data.log.split(";");
    var outrecords = [];
    var i = 0; // starting with earliest record
    while (i < inrecords.length) {
      var ar = inrecords[i].split("|");
      outrecords.push({ stamp: ar[0], id: ar[1], state: ar[2] });
      i++;
    }
    return outrecords;
  },
  // ---------------------------------------------
  // 11:33:55|sensor.a|47.0|sensor.b|27.5|sensor.c|0.5;12:34:56|sensor.a|47.1|sensor.b|27.4|sensor.c|0.5
  // { stamps:['11:33:55','12:34:56'], ids:[ 'sensor.a', 'sensor.b', 'sensor.c' ],  states:[['47.0','47.1'],['27.5','27.4'],['0.5','0.5']] }
  // assume stamp|id|state, sort records and make { stamps:[], ids:[], states:[] } where states[n][t]-->stamps[t], ids[n]
  idstateCols: function (data) {
    var records = data.log.split(";");
    var axes = { stamps: [], ids: [], states: [] };
    var i = 0; // starting with earliest record
    while (i < records.length) {
      var ar = records[i].split("|");
      axes.stamps.push(ar[0]);
      var j = 1; // index for parts of a record (ar)
      while (j < ar.length) {
        if (i == 0) axes.ids.push(ar[j]);
        j++;
        if (i == 0) axes.states[j / 2 - 1] = [];
        axes.states[j / 2 - 1].push(ar[j]);
        j++;
      }
      i++;
    }
    return axes;
  },
  // -----------------
  // 11:33:55|47.0|27.5|0.5;12:34:56|47.1|27.4|0.5
  // { stamps:['11:33:55','12:34:56'],  states:[['47.0','47.1'],['27.5','27.4'],['0.5','0.5']] }
  // assume stamp|state, sort records and make { stamps:[], states:[] } where states[n][t]-->stamps[t] (n-->id is known)
  stateCols: function (data) {
    var records = data.log.split(";");
    var axes = { stamps: [], states: [] };
    var i = 0; // starting with earliest record
    while (i < records.length) {
      var ar = records[i].split("|");
      axes.stamps.push(ar[0]);
      var j = 1; // index for parts of a record (ar)
      while (j < ar.length) {
        if (i == 0) axes.states[j - 1] = [];
        axes.states[j - 1].push(ar[j]);
        j++;
      }
      i++;
    }
    return axes;
  },
  // 2023-04-18 13:14:15.123456
  // 01234567890123456789012345
  // ---------------------------------------------
  to_hms: function (dates) {
    for (var i = 0; i < dates.length; i++)
      if (dates[i].length > 17)
        // assume long datetime
        dates[i] = dates[i].slice(11, 19);
    return dates;
  },
  // ---------------------------------------------
  to_hm: function (dates) {
    for (var i = 0; i < dates.length; i++)
      if (dates[i].length > 17) dates[i] = dates[i].slice(11, 16);
    return dates;
  },
  // ---------------------------------------------
  to_ymd: function (dates) {
    for (var i = 0; i < dates.length; i++)
      if (dates[i].length > 17) dates[i] = dates[i].slice(0, 10);
    return dates;
  },
  // ---------------------------------------------
  to_md: function (dates) {
    for (var i = 0; i < dates.length; i++)
      if (dates[i].length > 17) dates[i] = dates[i].slice(5, 10);
    return dates;
  },
};
