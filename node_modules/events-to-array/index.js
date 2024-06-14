'use strict'

const { EventEmitter } = require('events')

module.exports = eventsToArray

function eventsToArray (ee, ignore = [], map = x => x) {
  const array = []

  const orig = ee.emit
  ee.emit = function (...args) {
    if (!ignore.includes(args[0])) {
      args = args.map((arg, i, arr) => {
        if (arg instanceof EventEmitter) {
          return eventsToArray(arg, ignore, map)
        }

        return map(arg, i, arr)
      })

      array.push(args)
    }

    return orig.apply(this, args)
  }

  return array
}
