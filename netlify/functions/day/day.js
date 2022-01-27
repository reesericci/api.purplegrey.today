exports.handler = async event => {
  const querystring = event.queryStringParameters;
  let responseBody;
  let responseCode;
  let is_friday;
  let is_holiday;
  let is_summer;
  let dateError;
  let fridays_json = require('./fridays.json');
  let holidays_json = require('./holidays.json');
  let startend_json = require('./startend.json');
  let fridays = []
  let holidays = []
  let startend = []
  for(let i in fridays_json)
    fridays.push([i,fridays_json[i]]);
  for(let i in holidays_json)
    holidays.push([i,holidays_json[i]]);
  for(let i in startend_json)
    startend.push([i,startend_json[i]]);
  let start_date = new Date(startend[0])
  let end_date = new Date(startend[1])
  let dateObj = new Date(querystring.month + '/' + querystring.day + '/' + querystring.year);
  let month = dateObj.getMonth() + 1; //months from 1-12
  let day = dateObj.getDate();
  let weekday = dateObj.getDay();
  let year = dateObj.getFullYear();
  let mdy = month + '/' + day + '/' + year;
  for(let i = 0; i < fridays.length; i++) {
    if(fridays[i][0] == mdy) {
      is_friday = true;
      responseBody = fridays[i][1];
      break;
    } else {
      is_friday = false;
    }
  }
  for(let i = 0; i < holidays.length; i++) {
    if(holidays[i][0] == mdy) {
      is_holiday = true;
      responseBody = "H"
      break;
    } else {
      is_holiday = false;
    }
  }
  if(!(dateObj.getTime() > start_date.getTime() && dateObj.getTime() < end_date.getTime())) {
    is_summer = true;
    responseBody = "S";
  }
  if(is_friday != true && is_holiday != true && is_summer != true) {
    if(weekday == 0 || weekday == 6) {
      responseBody = "W";
    } else {
      if(weekday == 1 || weekday == 3) {
        responseBody = "A"
      } else if (weekday == 2 || weekday == 4) {
        responseBody = "B"
      }
    }
  }
  switch(responseBody) {
    case "A": {
      responseCode = 240;
      break;
    }
    case "B": {
      responseCode = 241;
      break;
    }
    case "H": {
      responseCode = 242;
      break;
    }
    case "W": {
      responseCode = 243;
    }
    case "S": {
      responseCode = 244;
    }
  }
  return {
    statusCode: Number(responseCode),
    body: JSON.stringify({daytype: responseBody}),
     headers: {
      "access-control-allow-origin": "*"
    }
  }
}
  
