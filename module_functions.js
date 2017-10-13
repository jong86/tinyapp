function generateRandomString() {
  // For base-77 conversion:
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
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  if(dd<10){
      dd='0'+dd;
  } 
  if(mm<10){
      mm='0'+mm;
  } 
  var today = dd+'/'+mm+'/'+yyyy;
  return today;
}

module.exports = {
  generateRandomString,
  urlsForUser,
  getDate
};