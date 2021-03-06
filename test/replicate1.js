var pull = require('pull-stream')
var pl   = require('pull-level')

var level   = require('level-test')()
var sublevel = require('level-sublevel')
var merkle   = require('../')

var hashes = require('./hashes.json')

var db = sublevel(level('test-merkle-rep2.1'))
var merkleDb = merkle(db, 'merkle')

var db2 = sublevel(level('test-merkle-rep2.2'))
var merkleDb2 = merkle(db2, 'merkle')

var tape = require('tape')
var util = require('./util')


function all(db, cb) {
  pull(pl.read(db), pull.collect(cb))
}

function equalDbs (t) {
  var timer
  return function () {
    clearTimeout(timer)
    timer = setTimeout(function () {
      all(db, function (err, ary1) {
        if(err) throw err
        all(db2, function (err, ary2) {
          if(err) throw err
          t.deepEqual(ary1, ary2)
          t.end()
        })
      })
    }, 500)
  }
}

tape('replicate', function (t) {

  //populate two databases with mostly the same data,
  //and a small amount of different data

  util.populate(db, 50, 'a', 7, function () {
    util.populate(db2, 5, 'g', 13)    
  })
  util.populate(db2, 50, 'a', 7, function () {
    util.populate(db2, 5, 'k', 11)
  })

//  var n = 2
//
//  merkleDb.on('drain', next)
//  merkleDb2.on('drain', next)
//
//  function next () {
//    if(--n) return

    //lets say that I am db2
    //assume we've already checked top hashes, and they differ.
    //then we get all keys with the next layer of prefixes.

    var s1 = merkleDb.createStream(1)
    var s2 = merkleDb2.createStream(2)
    var timer
    s1.pipe(s2).pipe(s1)
    util.consistent(s1, s2, equalDbs(t))
//  }

})

tape('more updates', function (t) {
  util.populate(db, 10, 'k', 113)
  util.populate(db2, 10, 'x', 99)
    var s1 = merkleDb.createStream(1)
    var s2 = merkleDb2.createStream(2)
    var timer
    s1.pipe(s2).pipe(s1)
    util.consistent(s1, s2, equalDbs(t))
})
