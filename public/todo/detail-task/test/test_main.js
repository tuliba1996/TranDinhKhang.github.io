var assert = require('assert');

var todoMain = require('../js/main.js')

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});

describe("todo",function(){

	// test extract file name
	describe("#extractFileName()",function(){
		it("file name must be the string with extension",function(){
			assert.equal(todoMain.extractFileName("abc/xyz.png/abc.jpeg"),"abc.jpeg")
		})

	})
	// test extract file name
	describe("#formatDateToTimeString()",function(){
		it("time string must have format of hh:mm:ss ",function(){
			var date = new Date();
			date.setHours(0,0,0)
			assert.equal(todoMain.formatDateToTimeString(date),"0:00:00")
		})

	})



})