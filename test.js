function generateRandomString() {
  var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~!$&'()*+,;=".split("");
  let output = [];
  for (let i = 0; i < 6; i++) {
    x = Math.floor(Math.random() * 77);
    output.push(_keyStr[x]);
  }
  return output.join("");
}

console.log(generateRandomString());