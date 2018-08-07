Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};
$(function () {
    $("#search_user").focus(function () {
        targetPage.query = targetPage.query == undefined ? "" : targetPage.query
//                 targetPage.refreshHistoryData()
        if (targetPage.query.length == 0) {
            $("#list_user_suggest").show();
            $(".arrow-up").show();
        } else if (targetPage.list_user_searched.length == 0) {
            $(".no-data").show();
            $(".arrow-up").show();
        }
        else {
            $("#result_searched").show();
        }
        $("#ico-search").show()
        $("#ico-clear").hide();
    });
    $("#search_user").focusout(function () {
        setTimeout(function () {
            $("#list_user_suggest").hide();
            $(".no-data").hide();
            $(".arrow-up").hide();
            $("#ico-search").hide()
            $("#ico-clear").show();
            targetPage.query = targetPage.oldQuery
            $("#result_searched").hide();
        }, 200);
        setTimeout(function () {
            $("#popup-progress").show();
        }, 1000)
    });
});

function clear_history_user() {
    targetPage.storage_user = [];
    var p = JSON.parse(localStorage.getItem('history_search_u'));
    var storage = JSON.parse(localStorage.getItem('history_search'));
    p.splice(p.indexOf('{{ request.user.email }}'), 1);
    storage.splice(p.indexOf('{{ request.user.email }}'), 1);
    localStorage.setItem('history_search', JSON.stringify(storage));
    localStorage.setItem('history_search_u', JSON.stringify(p));
    $(".history_user").hide();
}

function clear_search() {
    targetPage.query = '';
    $("#ico-clear").hide();
    $("#ico-search").show()
    $(".no-data").hide();
    $("#result_searched").hide();
    setTimeout(function () {
        $("#search_user").focus();
    }, 100);
}

// {% get_current_language as LANGUAGE_CODE %}
var targetPage = new Vue({
    delimiters: ['${', '}$'],
    el: '#target',
    data: {
        kpi_select_not_edit :{},
        enableFollowTarget: COMMON.EnableRquireTarget,
        is_admin:COMMON.UserIsAdmin,
        allow_edit_monthly_target:COMMON.AllowEditMonthlyTarget,
        is_superuser:COMMON.UserIsSuperUser,
        nameKPIEdit: "",
        get_current_quarter:"",
        selected_kpi:{},
        dialogFormVisible: false,
        dialogFormVisible_1: false,
        option: '',
        oldQuery: '',
        query: "",
        isShowMonth: true,
        currentUserId: '',
        kpiList: {},
        groupFinancial: [],
        groupCustomer: [],
        groupInternal: [],
        groupLearn: [],
        groupMore: [],
        tableData: [],
        storage_user: [],
        list_user_searched: [],
        list_surbodinates_user_viewed: [],
    },
    components: {},
    computed: {
//               storage_user: function(){
//                   console.log("triggered computed data")#}
//                   return this.getHistoryStorageByEmail(COMMON.UserRequestEmail)
//               ,
        dataToSearch: function () {
            return this.mergeSubordinateAndUserSearchList()
        },
    },
    methods: {
        refreshHistoryData: function () {
            var self = this;
            self.$set(self, 'storage_user', self.getHistoryStorageByEmail(COMMON.UserRequestEmail))
        },
        cloneObject: function (objectOriginal) {
            return JSON.parse(JSON.stringify(objectOriginal))
        },
        mergeSubordinateAndUserSearchList: function () {
            var self = this;
            var includedUserID = self.list_user_searched.filter(function (elm) {
                var subordinateID = self.list_surbodinates_user_viewed.slice().map(function (elm) {
                    return parseInt(elm.user)
                })
                return subordinateID.indexOf(parseInt(elm.user_id)) !== -1
            }).map(function (elm) {
                return parseInt(elm.user_id)
            })
            var userListFromSubordinate = self.list_surbodinates_user_viewed.slice().filter(function (elm) {
                return includedUserID.indexOf(parseInt(elm.user)) === -1
            })
            var result = self.list_user_searched.slice()
            userListFromSubordinate.map(function (elm) {
                elm.user_id = elm.user
                result.push(self.cloneObject(elm))
            })
            return result;

        },
        saveKpiSelected: function (kpi_select) {
            this.kpi_select_not_edit = JSON.parse(JSON.stringify(kpi_select))
        },
        checkUserExistedInSearchHistory: function (userID, searchHistoryArray) {
            var that = this;
            var result = searchHistoryArray.filter(function (elm) {
                return parseInt(elm.user_id) === parseInt(userID)
            })
            return result.length > 0;
        },
        selectView: function (e) {
            this.option = $(e.target).text()
            this.isShowMonth = $(e.target).attr('data-select') == 0;
        },
        setLocalStorageByKey: function (key, object) {
            localStorage.setItem(key, JSON.stringify(object));
        },
        getLocalStorageByKey: function (key) {
            return JSON.parse(localStorage.getItem(key))
        },
        getHistoryStorageByEmail: function (userEmail) {
            var self = this;
            var _all = [];
            var _storage = []
            // Step 1: fetch and construct data for history search email and history search object

            // 1. Fetch and construct history_search_u
            var historyArray = self.getLocalStorageByKey('history_search_u');
            var user_current = historyArray !== null ? historyArray : [];


            // 2. Fetch and construct history_search
            var historySearchAll = self.getLocalStorageByKey('history_search');
            _all = historySearchAll !== null ? historySearchAll : [];

            // Step 2: get user search history, init default if user don't have any data yet

            // 1. Construct default for history_search and history_search_u
            // Make sure history_search and history_search_u have the same number of elements
            // and same order followed by email
            var position = user_current.indexOf(userEmail);
            if (position === -1) {
                user_current.push(userEmail);
                _all.push(_storage)
                self.setLocalStorageByKey('history_search', _all);
                self.setLocalStorageByKey('history_search_u', user_current);
            }


            // 2. Get user search history by exact email
            position = user_current.indexOf(userEmail);
            var userSearchArray = _all[position];
            _storage = (userSearchArray !== undefined) ? userSearchArray : [];
            return _storage

        },
        setHistoryStorageByEmail: function (userEmail, storage) {
            var self = this;

            // Trigger to make sure already have data
            self.getHistoryStorageByEmail(userEmail);

            // 1. Fetch and construct history_search_u
            var historyArray = self.getLocalStorageByKey('history_search_u');
            var user_current = historyArray !== null ? historyArray : [];


            // 2. Fetch and construct history_search
            var historySearchAll = self.getLocalStorageByKey('history_search');
            var _all = historySearchAll ? historySearchAll : [];

            // Step 2: get user search history, init default if user don't have any data yet

            // 1. Construct default for history_search and history_search_u
            // Make sure history_search and history_search_u have the same number of elements
            // and same order followed by email
            var position = user_current.indexOf(userEmail);

            // Make sure data already have
            // 3: Limit search history at 3 user Objec

            var _storage = storage.slice()
            if (_storage.length > 3)
                _storage.splice(3, storage.length - 3);


            _all[position] = _storage
            self.setLocalStorageByKey('history_search', _all);


        },
        setCurrentUser: function (userId, userName) { //get user khi search
            var self = this
            self.query = userName
            self.oldQuery = userName
            self.tableData = []
            self.currentUserId = userId;

            var _storage = self.getHistoryStorageByEmail(COMMON.UserRequestEmail)

            // Step 3: Update search history

            // 1. Check if selected user were in the history search yet
            var userExisted = self.checkUserExistedInSearchHistory(userId, _storage)

            var indexOfSearchedUser = self.dataToSearch.map(function (elm) {
                return elm.user_id
            }).indexOf(parseInt(userId));


            // 2. If history search don't have user selected, insert user selected into history search
            if (userExisted === false && indexOfSearchedUser !== -1) {
                _storage.insert(0, self.dataToSearch[indexOfSearchedUser])
            }
            // 3: Limit search history at 3 user Objec
            if (_storage.length > 3)
                _storage.splice(3, 1);


            // Step 4: update to localStorage again
            self.setHistoryStorageByEmail(COMMON.UserRequestEmail, _storage)

            self.getCurrentQuarter()
            self.refreshHistoryData()
        },
        arraySpanMethod: function ({row, column, rowIndex, columnIndex}) {// merge cac cell cua row category
            if (this.tableData[rowIndex].isGroup == true) {
                if (this.isShowMonth) {
                    return [1, 19];
                } else {
                    return [1, 7]
                }
            }
        },
        tableRowClassName: function ({row, rowIndex}) { // add class cho category
            if (this.tableData[rowIndex].isGroup == true) {
                if (this.tableData[rowIndex].ten_KPI == gettext('Financial')) {
                    return 'target_fin_title';
                } else if (this.tableData[rowIndex].ten_KPI == gettext('Customer')) {
                    return 'target_client_title'
                }
                else if (this.tableData[rowIndex].ten_KPI == gettext('Internal')) {
                    return 'target_internal_title'
                }
                else if (this.tableData[rowIndex].ten_KPI == gettext('Learninggrowth')) {
                    return 'target_clean_title'
                }
                else if (this.tableData[rowIndex].ten_KPI == gettext('More')) {
                    return 'target_other_title'
                } else {
                }
                return '';
            }
        },
        createItem: function (item) { // created data cho tung kpi
            var self = this
            var tempTableData = {
                kpi_id: '',
                disable_edit:'',
                current_quarter:'',
                ten_KPI: '',
                year: '',
                months_target: {},
                quarter_1: "",
                quarter_2: "",
                quarter_3: "",
                quarter_4: "",
                isGroup: false,
                score_calculation_type: "",
                year_data: {},
                visible2: false,
            };
            // console.log(item.name)
            tempTableData.ten_KPI = item.name == undefined ? "" : item.name;
            tempTableData.year = item.year_target == undefined ? "" : item.year_target;
            tempTableData.quarter_1 = item.quarter_one_target == undefined ? "" : item.quarter_one_target;
            tempTableData.quarter_2 = item.quarter_two_target == undefined ? "" : item.quarter_two_target;
            tempTableData.quarter_3 = item.quarter_three_target == undefined ? "" : item.quarter_three_target;
            tempTableData.quarter_4 = item.quarter_four_target == undefined ? "" : item.quarter_four_target;
            tempTableData.edit = "";
            tempTableData.isGroup = item.isGroup == undefined ? false : true
            tempTableData.score_calculation_type = item.score_calculation_type == undefined ? "" : item.score_calculation_type
            // biến sử dung truyền khi request lên server
            tempTableData.disable_edit = !(this.is_superuser || (item.enable_edit && this.allow_edit_monthly_target) || this.is_admin);
            tempTableData.kpi_id = item.id
            tempTableData.current_quarter = self.get_current_quarter
            tempTableData.months_target = self.getMonthsTarget(item) == undefined ? "" : self.getMonthsTarget(item);
            tempTableData.yeardata = item.year_data == undefined ? "" : item.year_data;
            return tempTableData = tempTableData == undefined ? {} : tempTableData;
        },
        triggeredDismissModal: function(e){
            this.selected_kpi = Object.assign(this.selected_kpi, e) // gan e cho vung nho this.selected_kpi
            this.selected_kpi = e
            this.dialogFormVisible = false
            //this.$set(this,'selected_kpi',JSON.parse(JSON.stringify({})))
        },
        showModalEdit: function(kpi){
            // console.log('triggered show modal')
            this.selected_kpi = kpi
            this.dialogFormVisible = true
        },
        getMonthsTarget: function (item) { // tao field thang theo tung quy
            var temp_months_target = {
                quarter_1: {
                    month_1: '',
                    month_2: '',
                    month_3: ''
                },
                quarter_2: {
                    month_1: '',
                    month_2: '',
                    month_3: ''
                },
                quarter_3: {
                    month_1: '',
                    month_2: '',
                    month_3: ''
                },
                quarter_4: {
                    month_1: '',
                    month_2: '',
                    month_3: ''
                }
            }
            if (item.year_data != undefined) {
                temp_months_target = item.year_data.months_target == undefined ? temp_months_target : item.year_data.months_target;
            }
            if (this.get_current_quarter == 1) {
                temp_months_target.quarter_1.month_1 = item.month_1_target == undefined ? "" : item.month_1_target;
                temp_months_target.quarter_1.month_2 = item.month_2_target == undefined ? "" : item.month_2_target;
                temp_months_target.quarter_1.month_3 = item.month_3_target == undefined ? "" : item.month_3_target;
            } else if (this.get_current_quarter  == 2) {
                temp_months_target.quarter_2.month_1 = item.month_1_target == undefined ? "" : item.month_1_target;
                temp_months_target.quarter_2.month_2 = item.month_2_target == undefined ? "" : item.month_2_target;
                temp_months_target.quarter_2.month_3 = item.month_3_target == undefined ? "" : item.month_3_target;
            } else if (this.get_current_quarter  == 3) {
                temp_months_target.quarter_3.month_1 = item.month_1_target == undefined ? "" : item.month_1_target;
                temp_months_target.quarter_3.month_2 = item.month_2_target == undefined ? "" : item.month_2_target;
                temp_months_target.quarter_3.month_3 = item.month_3_target == undefined ? "" : item.month_3_target;
            } else if (this.get_current_quarter  == 4) {
                temp_months_target.quarter_4.month_1 = item.month_1_target == undefined ? "" : item.month_1_target;
                temp_months_target.quarter_4.month_2 = item.month_2_target == undefined ? "" : item.month_2_target;
                temp_months_target.quarter_4.month_3 = item.month_3_target == undefined ? "" : item.month_3_target;
            } else {
            }
            return temp_months_target
        },
        getCurrentQuarter: function() {
            var self = this
            cloudjetRequest.ajax({
                url: "/api/quarter/",
                dataType: "json",
                type: "GET",
                data: {
                    get_current_quarter: true
                },
                success: function (res) {
                    // console.log("quarter")
                    console.log(res);
                    self.get_current_quarter = res.fields.quarter
                    // console.log(this.get_current_quarter)
                    self.getListKpi()
                },
                error: function (a, b, c) {
                }
            })
        },
        updateTarget: function (kpi) { // update target khi edit tung field kpi
            var tempMonth_1 = "";
            var tempMonth_2 = "";
            var tempMonth_3 = "";
            var that = this;
            if (kpi.year_data == undefined) {
                kpi.year_data = {}
                kpi.year_data['months_target'] = kpi.months_target;
            } else {
                if (kpi.year_data.months_target == undefined) {
                    kpi.year_data['months_target'] = kpi.months_target;
                } else {
                    kpi.year_data.months_target = kpi.months_target;
                }
            }
            if (kpi.current_quarter == 1) {
                tempMonth_1 = kpi.months_target.quarter_1.month_1;
                tempMonth_2 = kpi.months_target.quarter_1.month_2;
                tempMonth_3 = kpi.months_target.quarter_1.month_3;
            } else if (kpi.current_quarter == 2) {
                tempMonth_1 = kpi.months_target.quarter_2.month_1;
                tempMonth_2 = kpi.months_target.quarter_2.month_2;
                tempMonth_3 = kpi.months_target.quarter_2.month_3;
            } else if (kpi.current_quarter == 3) {
                tempMonth_1 = kpi.months_target.quarter_3.month_1;
                tempMonth_2 = kpi.months_target.quarter_3.month_2;
                tempMonth_3 = kpi.months_target.quarter_3.month_3;
            } else if (kpi.current_quarter == 4) {
                tempMonth_1 = kpi.months_target.quarter_4.month_1;
                tempMonth_2 = kpi.months_target.quarter_4.month_2;
                tempMonth_3 = kpi.months_target.quarter_4.month_3;
            } else {
            }
            cloudjetRequest.ajax({
                type: 'post',
                url: '/api/v2/kpi/',
                dataType: "json",
                data: JSON.stringify({
                    id: kpi.kpi_id,
                    month_1_target: tempMonth_1 === ""? null : parseFloat(tempMonth_1),
                    month_2_target: tempMonth_2 === ""? null : parseFloat(tempMonth_2),
                    month_3_target: tempMonth_3 === ""? null : parseFloat(tempMonth_3),
                    score_calculation_type: kpi.score_calculation_type,
                    year_target: kpi.year === ""? null : parseFloat(kpi.year),
                    quarter_one_target: kpi.quarter_1 === ""? null : parseFloat(kpi.quarter_1),
                    quarter_two_target: kpi.quarter_2 === ""? null : parseFloat(kpi.quarter_2),
                    quarter_three_target: kpi.quarter_3 === ""? null : parseFloat(kpi.quarter_3),
                    quarter_four_target: kpi.quarter_4 === ""? null : parseFloat(kpi.quarter_4),
                    year_data: kpi.year_data
                }),
                success: function (result) {
                    // console.log("===================success============")
                    // console.log(result)
                    kpi.visible2 = false;
                    $('.el-popover').hide()
                },
                error: function () {
                    $('.el-popover').hide()
                }
            })
        },
        cancel: function (kpi_select) {
            kpi_select = Object.assign(kpi_select, this.kpi_select_not_edit)
            $('.el-popover').hide()
        },
        getListKpi: function () { // sap xep kpi theo category
            var self = this
            cloudjetRequest.ajax({
                type: 'GET',
                url: '/api/v2/user/' + this.currentUserId + '/kpis/',
                success: function (result) {
                    self.kpiList = result;
                    self.groupFinancial = []
                    self.groupCustomer = []
                    self.groupInternal = []
                    self.groupLearn = []
                    self.groupMore = []
                    if (self.kpiList != null) {
                        for (var i = 0; i < self.kpiList.length; i++) {
                            //
                            // if (self.kpiList[i].score_calculation_type == "most_recent") {
                            //     self.kpiList[i].score_calculation_type = gettext("Latest month")
                            // } else if (self.kpiList[i].score_calculation_type == "average") {
                            //     self.kpiList[i].score_calculation_type = gettext("Average 3 months")
                            // } else {
                            //     self.kpiList[i].score_calculation_type = gettext("Sum 3 months")
                            // }
                            var temp = self.createItem(self.kpiList[i]);
                            if (self.kpiList[i].bsc_category == 'financial') {
                                self.groupFinancial.push(temp)
                            } else if (self.kpiList[i].bsc_category == 'customer') {
                                self.groupCustomer.push(temp)
                            } else if (self.kpiList[i].bsc_category == 'internal') {
                                self.groupInternal.push(temp)
                            } else if (self.kpiList[i].bsc_category == 'learninggrowth') {
                                self.groupLearn.push(temp)
                            } else if (self.kpiList[i].bsc_category == 'more') {
                                self.groupMore.push(temp)
                            } else {
                            }
                        }
                    }
                    // console.log("==========>>>><<<<<<<<==========")
                    // console.log(self.groupFinancial)
                    // console.log(self.groupCustomer)
                    // console.log(self.groupInternal)
                    // console.log(self.groupLearn)
                    // console.log(self.groupMore)
                    //                             Array.prototype.pushArray = function() {
                    //    var toPush = this.concat.apply([], arguments);
                    //     for (var i = 0, len = toPush.length; i < len; ++i) {#}
                    //         this.push(toPush[i]);#}
                    //
                    // ;
                    if (self.groupFinancial.length > 0) {
                        self.tableData.push(self.createItem({name: gettext('Financial'), isGroup: true}));
                        self.tableData.push.apply(self.tableData, self.tableData.concat.apply([], self.groupFinancial));
                    }
                    if (self.groupCustomer.length > 0) {
                        self.tableData.push(self.createItem({name: gettext('Customer'), isGroup: true}));
                        self.tableData.push.apply(self.tableData, self.tableData.concat.apply([], self.groupCustomer));
                    }
                    if (self.groupInternal.length > 0) {
                        self.tableData.push(self.createItem({name: gettext('Internal'), isGroup: true}));
                        self.tableData.push.apply(self.tableData, self.tableData.concat.apply([], self.groupInternal));
                    }
                    if (self.groupLearn.length > 0) {
                        self.tableData.push(self.createItem({name: gettext('Learninggrowth'), isGroup: true}));
                        self.tableData.push.apply(self.tableData, self.tableData.concat.apply([], self.groupLearn));
                    }
                    if (self.groupMore.length > 0) {
                        self.tableData.push(self.createItem({name: gettext('More'), isGroup: true}));
                        self.tableData.push.apply(self.tableData, self.tableData.concat.apply([], self.groupMore));
                    }
                    // console.log(self.tableData)
                },

                error: function (a, b, c) {

                }

            })
        },
        search_user_limit: function () {
            var that = this;
            clearTimeout(that.timeout);
            that.timeout = setTimeout(function () {
                if (that.query.length > 1) {
                    $(".arrow-up").hide();
                    $("#list_user_suggest").hide();
                    $("#result_searched").show();
                    $("#ico-clear").show();
                    $("#ico-search").hide();
                    $("#popup-progress").hide();
                    cloudjetRequest.ajax({
                        method: "GET",
                        dataType: 'json',
                        url: COMMON.LinkSearchPeople + '?all_sublevel=1&limit=10&search_term=' + that.query,
                        success: function (data) {
                            that.list_user_searched = data.suggestions;
                            // console.log(that.list_user_searched);
                            // self.quarter_period = [];
                            // self.user_profile = null;
                            if (that.list_user_searched < 1) {
                                $(".no-data").show();
                            }
                            else {
                                $(".no-data").hide();
                            }
                            $(".arrow-up").show();
                        }
                    })
                } else {
                    $("#list_user_suggest").show();
                    that.list_user_searched = [];
                    $(".no-data").hide();
                    $(".arrow-up").show();
                    $("#ico-clear").hide();
                    $("#ico-search").show()
                }
            }, 300);
        },
        get_surbodinate_user_viewed: function () {
            var that = this;
            cloudjetRequest.ajax({
                method: "GET",
                dataType: 'json',
                url: '/api/team/?user_id=' + COMMON.UserViewedId,
                success: function (data) {
                    // console.log(data)
                    that.list_surbodinates_user_viewed = data;
                    this.has_manage = that.list_surbodinates_user_viewed.length > 0
                    // console.log("=============surbodinate user==========")
                    // console.log(this.has_manage)
                }
            })
        },
    },
    created: function () {
        window.targetApp = this;
        this.option = $('#change-style-drop').children().eq(0).text();
        this.isShowMonth = true;
        this.storage_user = this.getHistoryStorageByEmail(COMMON.UserRequestEmail)
        this.get_surbodinate_user_viewed();
        this.setCurrentUser(COMMON.UserViewedId, COMMON.UserName)
        // console.log("======> show enable target<===========")
        // console.log(COMMON.UserIsAdmin)
        // console.log(COMMON.UserIsSuperUser)
        // console.log(COMMON.AllowEditMonthlyTarget)
        // console.log(COMMON.EditToDate)
        // console.log(COMMON.EnableRquireTarget)

        setInterval(function(){
            $('#launcher').hide();
        }, 50);
    },

});