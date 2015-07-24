/*
 * expects a folder 'dumps' that contains all the dumps
 * attaches each load to a file
 */

'use strict'

var fs = require('fs')
var couchPass = require('./couchPass.json')
var url = 'http://' + couchPass.user + ':' + couchPass.pass + '@127.0.0.1:5984'
var nano = require('nano')(url)
var adb = nano.db.use('artendb')

var fileList = fs.readdirSync('./dumps')

fileList.forEach(function (fileName) {
  var docName = fileName.substr(0, fileName.indexOf('.'))
  var fileUrl = './dumps/' + fileName
  fs.readFile(fileUrl, function (error, file) {
    if (error) return console.log('error getting file:', error)
    adb.get(docName, function (error, doc) {
      if (error) return console.log('error fetching ae_objekte:', error)
      adb.attachment.insert(docName, fileName, file, 'text/plain', { rev: doc._rev }, function (error, result) {
        if (error) return console.log('error inserting attachment:', error)
        console.log('result from inserting ' + fileName + ':', result)
      })
    })
  })
})
