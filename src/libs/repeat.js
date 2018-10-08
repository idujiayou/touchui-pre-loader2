module.exports = function (str, count) {
  if (str) {
  	let rpt = ''
    for (let i = 0; i < count; i++) {
      rpt += str
    }
    return rpt
  }
}