/*
 * expects a folder 'dumps' that contains all the dumps
 * attaches each load to a file
 */

'use strict'

var fs = require('fs')
var couchPass = require('./couchPass.json')
var url = 'http://' + couchPass.user + ':' + couchPass.pass + '@127.0.0.1:5984'
var nano = require('nano')(url)
var adb = nano.db.use('ae')

var fileList = fs.readdirSync('./dumps')

function insertAttachment (file, rev, docName, fileName) {
  adb.attachment.insert(docName, fileName, file, 'text/plain; charset=utf8', { rev: rev }, function (error, result) {
    if (error) return console.log('error inserting attachment:', error)
    console.log('result from inserting ' + fileName + ':', result)
  })
}

function removeAttachmentThenInsert (file, rev, docName, fileName) {
  adb.attachment.destroy(docName, fileName, { rev: rev }, function (error, body) {
    if (error) return console.log('error removing attachment:', error)
    console.log('body:', body)
    insertAttachment(file, body.rev, docName, fileName)
  })
}

function processFile (fileName) {
  console.log('prosessing file', fileName)
  var fileUrl = './dumps/' + fileName
  fs.readFile(fileUrl, function (error, file) {
    if (error) return console.log('error getting file:', error)
    var docName = fileName.substr(0, fileName.indexOf('_'))
    adb.get(docName, function (error, doc) {
      if (error) {
        adb.insert({
          '_id': docName,
          'Typ': 'GruppeDb'
        }, function (error, result) {
          if (error) console.log('error inserting fileName', fileName)
          insertAttachment(file, result.rev, docName, fileName)
        })
      } else {
        if (doc._attachments && doc._attachments[docName]) {
          removeAttachmentThenInsert(file, doc._rev, docName, fileName)
        } else {
          insertAttachment(file, doc._rev, docName, fileName)
        }
      }
    })
  })
}

// how to get loop to tic every x milliseconds: http://brackets.clementng.me/post/24150213014/example-of-a-javascript-closure-settimeout-inside
for (var i = 1; i <= fileList.length; i++) {
  var fileName = fileList[i - 1]
  setTimeout(function (fileName) { return function () { processFile(fileName) } }(fileName), 1000 * i)
}
