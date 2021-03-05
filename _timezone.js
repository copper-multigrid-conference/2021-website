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
let dates=['2021-03-29',
       '2021-03-30',
       '2021-03-31',
       '2021-04-01',
       '2021-04-02',
      ];
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
let row = thead.insertRow();
for (let d of [""].concat(dates)) {
let th = document.createElement("th");
th.appendChild(document.createTextNode(d));
row.appendChild(th);
}
let row2 = thead.insertRow();
for (let d of ["Session", "M", "Tu", "W", "Th", "F"]) {
let th = document.createElement("th");
th.appendChild(document.createTextNode(d));
row2.appendChild(th);
}

// create body
for (i in times) {
let color = "";
let session = "";
if (i <= 3){
color = 'table-primary';
session = '1';
} else if (i <=5) {
color = 'table-warning';
session = 'break';
} else if (i <=9) {
color = 'table-success';
session = '2';
} else {
color = 'table-warning';
session = 'break';
}

let row = table.insertRow();
for (let d of [""].concat(dates)) {
let cell = row.insertCell();
let text = document.createTextNode(session);
let textz = document.createTextNode("");
if (d != "") {
  let time = moment.tz(d + " " + times[i], basetz);
  time = time.tz(newtz);
  let formattedtime = time.format('HH:mm  ');
  let formattedtimezone = time.format('Z');
  text = document.createTextNode(formattedtime);
  textz = document.createElement("span");
  textz.appendChild(document.createTextNode('(' + formattedtimezone + ')'));
  textz.setAttribute("style", "font-size: 50%;");
}
cell.appendChild(text);
cell.appendChild(textz);
let oldcolor = color;
if (d == '2021-03-31') {
  if (times[i] == '09:40') {
    color = 'table-primary';
  }
  if (times[i] == '10:20') {
    color = 'table-warning';
  }
}
cell.setAttribute("class", color + " py-0");
color = oldcolor;
}
}
}
function init(){
loadTimeZoneList();
createtable(moment.tz.guess());
}
init();
