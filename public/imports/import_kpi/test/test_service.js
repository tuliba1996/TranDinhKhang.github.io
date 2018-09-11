var assert = require('assert');
var targetPage= require('../js/service.js')

describe("tinh tong 4 quy theo phương phap phan bo ",function(){
    //var kpi = JSON.parse('{"disable_edit":false,"current_quarter":3,"ten_KPI":"Tài chính","year":"","months_target":{"quarter_1":{"month_1":"","month_2":"","month_3":""},"quarter_2":{"month_1":"","month_2":"","month_3":""},"quarter_3":{"month_1":"","month_2":"","month_3":""},"quarter_4":{"month_1":"","month_2":"","month_3":""}},"quarter_1":"","quarter_2":"","quarter_3":"","quarter_4":"","isGroup":true,"score_calculation_type":"","year_data":{},"visible2":false,"name_kpi_parent":"","code":"","group":"","weight":0,"unit":"","current_goal":"","operator":"","assigned_to":"","data_source":"","edit":"","yeardata":""}')
    it("calculate year",function(){
        var array_quarter = [null,1,null,1,null]
        assert.equal(JSON.stringify(targetPage.calculateYearTotal(array_quarter)),JSON.stringify({sum:2,average: 1,most_recent_quarter: 1}))
    })
})

describe("tinh tong các tháng cho 4 quý theo phương phap phan bo ",function(){
    //var kpi = JSON.parse('{"disable_edit":false,"current_quarter":3,"ten_KPI":"Tài chính","year":"","months_target":{"quarter_1":{"month_1":"","month_2":"","month_3":""},"quarter_2":{"month_1":"","month_2":"","month_3":""},"quarter_3":{"month_1":"","month_2":"","month_3":""},"quarter_4":{"month_1":"","month_2":"","month_3":""}},"quarter_1":"","quarter_2":"","quarter_3":"","quarter_4":"","isGroup":true,"score_calculation_type":"","year_data":{},"visible2":false,"name_kpi_parent":"","code":"","group":"","weight":0,"unit":"","current_goal":"","operator":"","assigned_to":"","data_source":"","edit":"","yeardata":""}')
    it("calculate quarter",function(){
        var result_array_month =[
            {sum:2,
                average:1,
                most_recent_quarter:1
            },{sum:null,
                average:null,
                most_recent_quarter:null
            },{sum:3,
                average:1,
                most_recent_quarter:1
            }];

        var input_array_month =[
            {month_1:1,
                month_2:null,
                month_3:1
            },
            {month_1:null,
                month_2:null,
                month_3:null
            },
             {month_1:1,
                month_2:1,
                month_3:1
            }
        ];
        var input_case = [0,1,2];
        input_case.forEach(function (i) {
          assert.equal(JSON.stringify(targetPage.calculationQuarterTotal(input_array_month[i])),JSON.stringify(result_array_month[i]))
        })

    })
})