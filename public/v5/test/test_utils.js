var assert = require('assert');

var utilsApp = require('../utils.js')

describe("utils.js",function(){

// test makeid
    describe("#makeid()",function(){
        it("test makeid method, return unique string every calls",function(){
            var uStr = utilsApp.makeid()
            var uStr2 = utilsApp.makeid()
            assert.notEqual(uStr,uStr2)
        })
    })
})