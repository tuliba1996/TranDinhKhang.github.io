var assert = require('assert');

var todoMain = require('../js/main.js')

describe("todo",function(){
    var taskObjectModelFirst = {
        created_by_user: {
            id: 15
        },
        assigned_to: 10,
        permission: 'edit'
    }
    var taskObjectModelSecond = {
        created_by_user: {
            id: 15
        },
        assigned_to: 10,
        permission: 'comment'
    }
    var userAssignee = {
        user: 10,
        is_admin: false
    }
    var userAssigneeSubordinate = {
        user: 13,
        is_admin: false
    }
    var userRandom = {
        user: 11,
        is_admin: false
    }
    var userRandomSubordinate = {
        user: 9,
        is_admin: false
    }
    var userActor = {
        user: 15,
        is_admin: false
    }
    var userAdmin = {
        user: 16,
        is_admin: true
    }
    var subordinateListOfUserActor = [
        userAssignee,
        userRandom
    ]
    var subordinateListOfUserRandom = [
        userRandomSubordinate
    ]
    var subordinateListOfUserAssginee = [
        userAssigneeSubordinate
    ]
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
            date.setHours(0,10,0)
            assert.equal(todoMain.formatDateToTimeString(date),"0:10:00")
        })
        it("time string must have format of hh:mm:ss ",function(){
            var date = new Date();
            date.setHours(0,0,10)
            assert.equal(todoMain.formatDateToTimeString(date),"0:00:10")
        })
        it("time string must have format of hh:mm:ss ",function(){
            var date = new Date();
            date.setHours(0,0,0)
            assert.equal(todoMain.formatDateToTimeString(date),"0:00:00")
        })

    })

    // test extractPermission
    describe("#extractPermission()",function(){
        it("if user is actor and the manager of the task's assignee, then have the 'edit' permission",function(){
            assert.equal(todoMain.extractPermission(userActor,subordinateListOfUserActor,taskObjectModelFirst),'edit')
        })

        it("if user is actor of the task, then have the 'edit' permission",function(){
            assert.equal(todoMain.extractPermission(userActor,[],taskObjectModelFirst),'edit')
        })

        it("if user is not actor of the task nor the assignee, then have the 'view-only' permission",function(){
            assert.equal(todoMain.extractPermission(userRandom,subordinateListOfUserRandom,taskObjectModelFirst),'view-only')
        })

        it("if user is admin and not the actor nor the assignee, then have the 'view-only' permission",function(){
            assert.equal(todoMain.extractPermission(userAdmin,subordinateListOfUserRandom,taskObjectModelFirst),'view-only')
        })

        it("if user is the assignee of the task, then have the task's permission (edit)",function(){
            assert.equal(todoMain.extractPermission(userAssignee,subordinateListOfUserAssginee,taskObjectModelFirst),'edit')
        })

        it("if user is the assignee of the task, then have the task's permission (comment)",function(){
            assert.equal(todoMain.extractPermission(userAssignee,subordinateListOfUserAssginee,taskObjectModelSecond),'comment')
        })

    })

    // test extractPermission
    describe("#isManagerOrAdmin()",function(){
        it("if the user is admin or manager, return true, return false otherwise",function(){
            assert.equal(todoMain.isManagerOrAdmin(userActor,subordinateListOfUserActor,userAssignee.user),true)
        })
        it("if the user is admin or manager, return true, return false otherwise",function(){
            assert.equal(todoMain.isManagerOrAdmin(userAdmin,subordinateListOfUserAssginee,userAssignee.user),true)
        })
        it("if the user is admin or manager, return true, return false otherwise",function(){
            assert.equal(todoMain.isManagerOrAdmin(userRandom,subordinateListOfUserRandom,userAssignee.user),false)
        })
    })


    // test get Date standard

    describe("#getDateStandard()",function(){
        it("if the date is Feb 10, 2011 then return 2011-02-10",function(){
            var date = new Date()
            date.setDate(10)
            date.setMonth(1)
            date.setFullYear(2011)
            assert.equal(todoMain.getDateStandard(date),"2011-02-10")
        })
        it("if the date is Oct 10, 2011 then return 2011-10-10",function(){
            var date = new Date()
            date.setDate(10)
            date.setMonth(9)
            date.setFullYear(2011)
            assert.equal(todoMain.getDateStandard(date),"2011-10-10")
        })


        it("if the date is Feb 1, 2011 then return 2011-02-01",function(){
            var date = new Date()
            date.setDate(1)
            date.setMonth(1)
            date.setFullYear(2011)
            assert.equal(todoMain.getDateStandard(date),"2011-02-01")
        })
    })

    // test formatDateToString

    describe("#formatDateToString()",function(){
        it("if the date is Oct 10, 2011 then return 01/02/2011",function(){
            var date = new Date()
            date.setDate(10)
            date.setMonth(9)
            date.setFullYear(2011)
            assert.equal(todoMain.formatDateToString(date),"10/10/2011")
        })
        it("if the date is Feb 10, 2011 then return 10/02/2011",function(){
            var date = new Date()
            date.setDate(10)
            date.setMonth(1)
            date.setFullYear(2011)
            assert.equal(todoMain.formatDateToString(date),"10/02/2011")
        })
        it("if the date is Feb 1, 2011 then return 01/02/2011",function(){
            var date = new Date()
            date.setDate(1)
            date.setMonth(1)
            date.setFullYear(2011)
            assert.equal(todoMain.formatDateToString(date),"01/02/2011")
        })
    })

    // test cloneObject

    describe("#cloneObject()",function(){
        it("test clone object method, change prop of the old one won't affect new one",function(){
            var obj = {
                id: 1
            }
            // assert first time, id = 1
            assert.equal(obj.id,1)

            var obj2 = obj;
            obj2.id = 2
            // assert second time, id = 2
            assert.equal(obj.id,2)


            var obj3 = todoMain.cloneObject(obj)
            obj3.id = 1
            // this is the correct cloned Object
            assert.equal(obj.id,2)
            assert.equal(obj3.id,1)
        })
    })
    // test slugify

    describe("#slugify()",function(){
        it("test slugify a string, 'AAA BBB CCC' -> 'aaa-bbb-ccc'",function(){
            var str = 'AAA BBB CCC'
            assert.equal(todoMain.slugify(str),'aaa-bbb-ccc')
        })
    })

    // test makeid
    describe("#makeid()",function(){
        it("test makeid method, return unique string every calls",function(){
            var uStr = todoMain.makeid()
            var uStr2 = todoMain.makeid()
            assert.notEqual(uStr,uStr2)
        })
    })


})