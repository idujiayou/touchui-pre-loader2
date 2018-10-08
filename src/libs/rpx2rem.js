'use strict'

const rpxReg = /(\d*?(?:\.\d+)?)rpx/ig
const cssReg = /(\b.*?\b\u0020*:)(.*?)(;|"|(?:\r\n)|\})/g

const config = {
  ratio: 1 / 75
}

function accMul (num1, num2) {
  var m = 0,
    s1 = num1.toString(),
    s2 = num2.toString();
  try {
    m += s1.split('.')[1].length
  } catch (e) {

  };
  try {
    m += s2.split('.')[1].length
  } catch (e) {

  }
  return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m)
}

module.exports = function (source) {
  return source.replace(cssReg, function (m, n1, n2, n3) {
    return n1 + n2.replace(rpxReg, function (pxm, pxn1) {
      return accMul(pxn1, config.ratio) + 'rem'
    }) + n3
  })
}