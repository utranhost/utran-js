'use strict'

if (process.env.NODE_ENV === 'development') {
  module.exports = require('./lib/utran.js')  
} else {
  module.exports = require('./lib/utran.min.js')
}