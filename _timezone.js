function loadTimeZoneList(){
  // https://techbrij.com/date-time-timezone-javascript-select
  let select = document.getElementById("selecttz");
  select.innerHTML = "";

  let timeZones = moment.tz.names();
  option = document.createElement("option");
  option.textContent = 'Select a timezone...';
  option.value = 'America/Denver';
  option.selected = true;
  select.appendChild(option);
  timeZones.forEach((timeZone) =>{
    option = document.createElement("option");
    option.textContent = `${timeZone} (UTC${moment.tz(timeZone).format('Z')})`;
    option.value = timeZone;
    select.appendChild(option);
  });
}
function createtable(newtz='America/Los_Angeles') {
  let basetz = 'America/Los_Angeles';
  let times=['08:00',
    '08:25',
    '08:50',
    '09:15',
    '09:40',
    '10:05',
    '10:20',
    '10:45',
    '11:10',
    '11:35',
    '12:00',
  ];
  let label=['1',
    '1',
    '1',
    '1',
    'break',
    'break',
    '2',
    '2',
    '2',
    '2',
    'break',
  ];
  let labelcolors=['table-primary',
      'table-primary',
      'table-primary',
      'table-primary',
      'table-warning',
      'table-warning',
      'table-success',
      'table-success',
      'table-success',
      'table-success',
      'table-warning',
  ];
  let dates=['2021-03-29',
    '2021-03-30',
    '2021-03-31',
    '2021-04-01',
    '2021-04-02',
  ];
  let printtutorial=true;
  let tutdates=['2021-03-24',
    '2021-03-25',
    '2021-03-26',
  ];
  let tuttimes=[
    '',
    '',
    '',
    '09:00',
    '|',
    '|',
    '|',
    '|',
    '11:00',
    '',
    '',
  ];
  let ignoreastime = ['', '|'];
  // start over
  $("#schedule thead").remove();
  $("#schedule tbody").remove();

  // set selected
  scheduletitle = document.getElementById("scheduletitle");
  scheduletitle.innerHTML = "";
  scheduletitle.append(document.createTextNode('Selected time zone: ' + newtz));

  let newtime = moment().tz(newtz).format('MMMM Do YYYY, HH:mm:ss Z');
  scheduletitletime = document.getElementById("scheduletitletime");
  scheduletitletime.innerHTML = "";
  scheduletitletime.append(document.createTextNode('Current time: ' + newtime));

  // get the table block
  var table = document.getElementById('schedule');

  // create header
  let thead = table.createTHead();
  thead.setAttribute("class", "thead-light");
  let rowtop = thead.insertRow();
  let row = thead.insertRow();
  let alldates = [""].concat(dates);
  if (printtutorial) {
    alldates = tutdates.concat(alldates);
  }
  for (let d of alldates) {
    let th = document.createElement("th");
    let tutname = "";
    if (d == '2021-03-24') {
      tutname = 'MG tutorial';
    }
    if (d == '2021-03-25') {
      tutname = 'AMG tutorial';
    }
    if (d == '2021-03-26') {
      tutname = 'Parallel MG tutorial';
    }
    if (dates.includes(d)) {
      if (d == '2021-03-29') {
        tutname = 'Program';
      }
    }
    th.appendChild(document.createTextNode(tutname));
    rowtop.appendChild(th);
    th = document.createElement("th");
    th.appendChild(document.createTextNode(d));
    row.appendChild(th);
  }
  let row2 = thead.insertRow();
  days = ["Session", "M", "Tu", "W", "Th", "F"];
  if (printtutorial) {
    days = ["W", "Th", "F"].concat(days)
  }
  for (let d of days) {
    let th = document.createElement("th");
    th.appendChild(document.createTextNode(d));
    row2.appendChild(th);
  }

  // create body
  for (i in times) {
    let session = label[i];

    let row = table.insertRow();
    for (let d of alldates) {
      let cell = row.insertCell();
      let text = document.createTextNode("");
      let textz = document.createTextNode("");
      if (dates.includes(d) || tutdates.includes(d)) {
        let istime=true;
        let thistime="";
        let formatastime=true;
        let formattedtime="";
        let formattedtimezone="";
        if (dates.includes(d)) {
          thistime=times[i];
        }
        if (tutdates.includes(d)) {
          thistime=tuttimes[i];
          if (ignoreastime.includes(thistime)) {
            formatastime = false;
            formattedtime = thistime;
            console.log(thistime);
          }
        }
        if (formatastime) {
          var time = moment.tz(d + " " + thistime, basetz);
          time = time.tz(newtz);
          formattedtime = time.format('HH:mm  ');
          formattedtimezone = time.format('Z');
          textz = document.createElement("span");
          textz.appendChild(document.createTextNode('(' + formattedtimezone + ')'));
          textz.setAttribute("style", "font-size: 50%;");
        }
        text = document.createTextNode(formattedtime);
      } else {
        text = document.createTextNode(session);
        textz = document.createTextNode("");
      }
      cell.appendChild(text);
      cell.appendChild(textz);
      let color = "";
      if (dates.includes(d) || d=="") {
        color = labelcolors[i];
      }
      if (tutdates.includes(d)) {
        if (i>=3) {
          color = 'table-danger';
        }
        if (i<3 || i>=9) {
          color = '';
        }
      }
      if (d == '2021-03-31') {
        if (times[i] == '09:40') {
          color = 'table-primary';
        }
        if (times[i] == '10:20') {
          color = 'table-warning';
        }
      }
      if (d == '2021-04-01') {
        if (times[i] == '09:40') {
          color = 'table-danger';
        }
      }
      cell.setAttribute("class", color + " py-0");
    }
  }
}
function init(){
  loadTimeZoneList();
  createtable(moment.tz.guess());
}
init();
