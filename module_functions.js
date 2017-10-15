function generateRandomString() {
  const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~!$*+,;=".split("");
  let output = [];
  for (let i = 0; i < 6; i++) {
    x = Math.floor(Math.random() * _keyStr.length);
    output.push(_keyStr[x]);
  }
  return output.join("");
}

function urlsForUser(cookieUserID, DB_URLS) {
  let outputDatabase = {};
  for (url in DB_URLS) {
    if (DB_URLS[url].userID === cookieUserID) {
      outputDatabase[url] = DB_URLS[url];
    }
  }
  return outputDatabase;
}

function getDate() {
  let now = new Date();
  let DD = now.getDate();
  let MM = now.getMonth() + 1; // January is 0!
  let YYYY = now.getFullYear();
  let hh = now.getHours();
  let mm = now.getMinutes();
  let ss = now.getSeconds();
  if(DD < 0) {
      DD = "0" + DD;
  } 
  if(MM < 10) {
      MM = "0" + MM;
  } 
  if(hh < 10) {
      hh = "0" + hh;
  } 
  if(mm < 10) {
      mm = "0" + mm;
  } 
  if(ss < 10) {
      ss = "0" + ss;
  } 
  let output = `${YYYY}/${MM}/${DD} ${hh}:${mm}:${ss}`;
  return output;
}


module.exports = {
  generateRandomString,
  urlsForUser,
  getDate
};