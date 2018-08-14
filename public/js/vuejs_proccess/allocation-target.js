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


String.prototype.nextChar = function (i) {
    function nextChar(c) {
        var u = c.toUpperCase();
        if (same(u, 'Z')) {
            var txt = '';
            var i = u.length;
            while (i--) {
                txt += 'A';
            }
            return (txt + 'A');
        } else {
            var p = "";
            var q = "";
            if (u.length > 1) {
                p = u.substring(0, u.length - 1);
                q = String.fromCharCode(p.slice(-1).charCodeAt(0));
            }
            var l = u.slice(-1).charCodeAt(0);
            var z = nextLetter(l);
            if (z === 'A') {
                return p.slice(0, -1) + nextLetter(q.slice(-1).charCodeAt(0)) + z;
            } else {
                return p + z;
            }
        }
    }

    function nextLetter(l) {
        if (l < 90) {
            return String.fromCharCode(l + 1);
        }
        else {
            return 'A';
        }
    }

    function same(str, char) {
        var i = str.length;
        while (i--) {
            if (str[i] !== char) {
                return false;
            }
        }
        return true;
    }

    var n = i | 1;
    var char = this;
    while (n--) {
        char = nextChar(char);
    }
    return char;
};



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
        total_weight: '',
        storage_user: [],
        list_user_searched: [],
        list_surbodinates_user_viewed: [],
        organization: '',
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

            self.getCurrentQuarter();
            self.getUserProfile();
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
            var self = this;
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
                refer_to:'',
                name_kpi_parent:"",
            };
            // add field to export excel
            tempTableData.code = item.code == undefined ? "" : item.code;
            tempTableData.group = item.group == undefined ? "" : item.group;
            if (item.refer_to){
                tempTableData.weight_child = item.weight == undefined ? 0 : item.weight;
            }else{
                tempTableData.weight = item.weight == undefined ? 0 : item.weight;
            }
            tempTableData.owner_email = item.owner_email;
            tempTableData.unit = item.unit == undefined ? "" : item.unit;
            tempTableData.current_goal = item.current_goal == undefined ? "" : item.current_goal;     // measurement method
            tempTableData.operator = item.operator == undefined ? "" : item.operator;
            tempTableData.score_calculation_type = item.score_calculation_type;
            tempTableData.assigned_to = item.assigned_to == undefined ? "" : item.assigned_to;
            tempTableData.data_source = '';
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
            tempTableData.refer_to = item.refer_to
            // biến sử dung truyền khi request lên server
            tempTableData.disable_edit = !(this.is_superuser || (item.enable_edit && this.allow_edit_monthly_target) || this.is_admin);
            tempTableData.kpi_id = item.id;
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

        getUserProfile: function () {
            var self = this;
            cloudjetRequest.ajax({
                type: "GET",
                url: '/api/profile/?user_id=' + self.currentUserId,
                success: function (data) {
                    self.user_profile = data;
                },
            })
        },
        getOrg: function () {
            self = this;
            cloudjetRequest.ajax({
                method: "GET",
                url: "/api/organization",
                success: function (data) {
                    if (data) {
                        self.organization = data;
                    }
                },
                error: function () {
                }
            });
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

                    self.kpiList = result.map(function(elmParent){
                        elmParent.children = elmParent.children.filter(function(elm){
                            return parseInt(elm.user) === parseInt(self.currentUserId)
                        });
                        return elmParent
                    })
                    self.kpiList = result
                    self.groupFinancial = []
                    self.groupCustomer = []
                    self.groupInternal = []
                    self.groupLearn = []
                    self.groupMore = []
                    if (self.kpiList != null) {
                        for (var i = 0; i < self.kpiList.length; i++) {
                            self.createdKpiForCategory(self.kpiList[i])
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
        createdKpiForCategory: function (kpi) {
            var self = this
            var temp = []
            temp.push(self.createItem(kpi));
            var email_parent = kpi.owner_email
            if(kpi.children.length >0){
                for(var i = 0; i < kpi.children.length; i++){
                    if(email_parent === kpi.children[i].owner_email){
                        temp.push(self.createItem(kpi.children[i]));
                    }
                }
            }
            temp = temp.map(function (element) {
                element.name_kpi_parent = kpi.name
                return element
            })
            if (kpi.bsc_category == 'financial') {
                //self.groupFinancial.push(temp)
                self.groupFinancial.push.apply(self.groupFinancial, self.groupFinancial.concat.apply([], temp));
            } else if (kpi.bsc_category == 'customer') {
                self.groupCustomer.push.apply(self.groupCustomer, self.groupCustomer.concat.apply([], temp));
            } else if (kpi.bsc_category == 'internal') {
                self.groupInternal.push.apply(self.groupInternal, self.groupInternal.concat.apply([], temp));
            } else if (kpi.bsc_category == 'learninggrowth') {
                self.groupLearn.push.apply(self.groupLearn, self.groupLearn.concat.apply([], temp));
            } else if (kpi.bsc_category == 'other') {
                self.groupMore.push.apply(self.groupMore, self.groupMore.concat.apply([], temp));
            } else {
            }
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
                    that.list_surbodinates_user_viewed = data.length > 0 ? data : [];
                    this.has_manage = that.list_surbodinates_user_viewed.length > 0
                    // console.log("=============surbodinate user==========")
                    // console.log(this.has_manage)
                }
            })
        },

        downloadFile: function (wb, filename) {
            if (wb) wb.xlsx.writeBuffer().then(function (buffer) {
                var filesaver = saveAs(new Blob([buffer], {
                    type: "application/octet-stream"
                }), filename);

                setTimeout(function () {
                    window.close();
                }, 4000);
            });
        },

        get_simple_kpi: function () {
            var self = this;
            var wb = new ExcelJS.Workbook();
            wb.creator = 'Cloudjet';
            var ws = wb.addWorksheet('KPI',{pageSetup:{showGridLines:true,orientation:'landscape',paperSize: 9,fitToPage: true, fitToHeight: 0, fitToWidth: 1}});
            ws.pageSetup.margins = {
                left: 0.1, right: 0.1,
                top: 0.2, bottom: 0.2,
                header: 0.3, footer: 0.3
            };

            var headerData = {
                row: 9,
                height: 20,
                columns: [{
                    id: null,
                    child: null,
                    text: gettext('KPI Code'),
                    slug: 'code',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('Group'),
                    slug: 'group',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('Weight'),
                    slug: 'weight',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('% Weight'),
                    slug: 'weight_percent',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('KPI name'),
                    slug: 'ten_KPI',
                    width: '20',
                    style: {
                        alignment: {
                            vertical: 'middle',
                            horizontal: 'left',
                            wrapText: true
                        },
                    }
                }, {
                    id: null,
                    child: null,
                    text: gettext('Assign to'),
                    slug: 'owner_email',
                    width: '25',
                    style: {
                        alignment: {
                            vertical: 'middle',
                            horizontal: 'left',
                            wrapText: true
                        },
                    }
                }, {
                    id: null,
                    child: null,
                    text: gettext('Weight child'),
                    slug: 'weight_child',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('% Weight child'),
                    slug: 'weight_child_percent',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('Unit'),
                    slug: 'unit',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('Measurement'),
                    slug: 'current_goal',
                    width: '20',
                    style: {
                        alignment: {
                            vertical: 'middle',
                            horizontal: 'left',
                            wrapText: true
                        },
                    }
                }, {
                    id: null,
                    child: null,
                    text: gettext('Data source'),
                    slug: 'data_source',
                    width: '20',
                    style: 'center'
                }, {
                    id: null,
                    child: null,
                    text: gettext('Operator'),
                    slug: 'operator',
                    width: '20',
                    style: 'center'
                },{
                    id: null,
                    child: null,
                    text: gettext('Target alignment'),
                    slug: 'score_calculation_type',
                    width: '20',
                    style: 'center'
                },{
                    id: null,
                    text: gettext('Target'),
                    slug: 'target',
                    width: '20',
                    style: 'center',
                    child: [
                        {
                            text: gettext("Year"),
                            slug: 'year',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 1"),
                            slug: 'months_target.quarter_1.month_1',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 2"),
                            slug: 'months_target.quarter_1.month_2',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 3"),
                            slug: 'months_target.quarter_1.month_3',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Quarter 1"),
                            slug: 'quarter_1',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 4"),
                            slug: 'months_target.quarter_2.month_1',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 5"),
                            slug: 'months_target.quarter_2.month_2',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 6"),
                            slug: 'months_target.quarter_2.month_3',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Quarter 2"),
                            slug: 'quarter_2',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 7"),
                            slug: 'months_target.quarter_3.month_1',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 8"),
                            slug: 'months_target.quarter_3.month_2',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 9"),
                            slug: 'months_target.quarter_3.month_3',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Quarter 3"),
                            slug: 'quarter_3',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 10"),
                            slug: 'months_target.quarter_4.month_1',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 11"),
                            slug: 'months_target.quarter_4.month_2',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Month 12"),
                            slug: 'months_target.quarter_4.month_3',
                            width: '20',
                            style: 'center',
                        },{
                            text: gettext("Quarter 4"),
                            slug: 'quarter_4',
                            width: '20',
                            style: 'center',
                        }

                    ]


                }]
            };

            var headerFormat = {
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                font: {
                    name: 'Arial',
                    size: 12,
                    color: {
                        argb: 'FFFFFFFF'
                    },
                    bold: true
                },
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    bgColor: {
                        argb: '008B8B'
                    },
                    fgColor: {
                        argb: '008B8B'
                    }
                },
                border: {
                    top: {style: 'thin', color: {argb: 'FF000000'}},
                    left: {style: 'thin', color: {argb: 'FF000000'}},
                    bottom: {style: 'thin', color: {argb: 'FF000000'}},
                    right: {style: 'thin', color: {argb: 'FF000000'}}
                }
            };

            var headerInfoFormat = {
                company: {
                    alignment: {
                        vertical: 'left',
                        horizontal: 'left',
                        wrapText: true
                    },
                    font: {
                        name: 'Arial',
                        size: 18,
                        color: {
                            argb: 'FF000000'
                        },
                        bold: true
                    },
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: {
                            argb: 'FFFFFFFF'
                        },
                        fgColor: {
                            argb: 'FFFFFFFF'
                        }
                    },

                },
                title: {
                    alignment: {
                        vertical: 'middle',
                        horizontal: 'center',
                        wrapText: true
                    },
                    font: {
                        name: 'Arial',
                        size: 16,
                        color: {
                            argb: 'FF000000'
                        },
                        bold: true
                    },
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: {
                            argb: 'FFFFFFFF'
                        },
                        fgColor: {
                            argb: 'FFFFFFFF'
                        }
                    },

                },
                info:{
                    alignment: {
                        vertical: 'left',
                        horizontal: 'left',
                        wrapText: true
                    },
                    font: {
                        name: 'Arial',
                        size: 12,
                        color: {
                            argb: 'FF000000'
                        },
                        bold: true
                    },
                    fill: {
                        type: 'pattern',
                        pattern: 'solid',
                        bgColor: {
                            argb: 'FFFFFFFF'
                        },
                        fgColor: {
                            argb: 'FFFFFFFF'
                        }
                    },

                }
            };

            var targetFormat = {
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                font: {
                    name: 'Arial',
                    size: 12,
                    color: {
                        argb: 'FFFFFFFF'
                    },
                    bold: true
                },
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    bgColor: {
                        argb: '31859B'
                    },
                    fgColor: {
                        argb: '31859B'
                    }
                },
                border: {
                    top: {style: 'thin', color: {argb: 'FF000000'}},
                    left: {style: 'thin', color: {argb: 'FF000000'}},
                    bottom: {style: 'thin', color: {argb: 'FF000000'}},
                    right: {style: 'thin', color: {argb: 'FF000000'}}
                }
            };

            var bodyFormat = {
                alignment: {
                    vertical: 'middle',
                    horizontal: 'center',
                    wrapText: true
                },
                font: {
                    name: 'Arial',
                    size: 12,
                    color: {
                        argb: 'FF000000'
                    },
                    bold: false
                },
                fill: {
                    type: 'pattern',
                    pattern: 'solid',
                    bgColor: {
                        argb: 'FFFFFFFF'
                    },
                    fgColor: {
                        argb: 'FFFFFFFF'
                    }
                },
                border: {
                    top: {style: 'thin', color: {argb: 'FF000000'}},
                    left: {style: 'thin', color: {argb: 'FF000000'}},
                    bottom: {style: 'thin', color: {argb: 'FF000000'}},
                    right: {style: 'thin', color: {argb: 'FF000000'}}
                }
            };
            console.log("header data:", headerData);

            // hidden column A
            ws.getColumn('A').hidden = true;

            var end_column = 'AE';
            // merge cell company name
            ws.mergeCells('B1:' + end_column + '1');
            // cell title
            ws.mergeCells('B2:' + end_column + '5');
            // cell title display_name
            ws.mergeCells('B6:C6');
            // cell title employee_code
            ws.mergeCells('B7:C7');
            // cell title email
            ws.mergeCells('B8:C8');
            // cell display_name
            ws.mergeCells('D6:' + end_column + '6');
            // cell employee_code
            ws.mergeCells('D7:' + end_column + '7');
            // cell email
            ws.mergeCells('D8:' + end_column + '8');
            // set value
            setCellVal('B1', self.organization.name);
            setCellVal('B2', 'BẢNG CHỈ TIÊU CÁ NHÂN');
            // full name
            setCellVal('B6', gettext('Full name'));
            setCellVal('D6', self.user_profile.display_name);
            // employee_code
            setCellVal('B7', gettext('Employee code'));
            setCellVal('D7', self.user_profile.employee_code);
            // email
            setCellVal('B8', 'Email');
            setCellVal('D8', self.user_profile.email);


            // set format
            setFormatCell('B1', headerInfoFormat.company);
            setFormatCell('B2', headerInfoFormat.title);
            setFormatCell('B6', headerInfoFormat.info);
            setFormatCell('D6', headerInfoFormat.info);

            setFormatCell('B7', headerInfoFormat.info);
            setFormatCell('D7', headerInfoFormat.info);

            setFormatCell('B8', headerInfoFormat.info);
            setFormatCell('D8', headerInfoFormat.info);

            renderHeader(headerData, headerFormat);
            totalWeight(this.tableData);
            renderData(this.tableData, headerData);



            function renderHeader(headerData, headerFormat) {
                row = headerData.row;
                var id_start = 'B';
                ws.getRow(row).height = headerData.height;
                headerData.columns.forEach(function (col, index) {
                    setWidthCol(id_start, col.width);
                    cell = id_start + row;
                    if (col.child){
                        setValueCell(cell, col.text);                   // set value target
                        setFormatCell(cell, headerFormat);
                        var row_child = row + 1;                         // merge cell target
                        ws.mergeCells(cell + ':' + (end_column + row));
                        col.child.forEach(function (child) {            // render year target -> month target
                            cell_child = id_start + row_child;
                            setWidthCol(id_start, child.width);
                            setValueCell(cell_child, child.text);
                            setFormatCell(cell_child, targetFormat);
                            id_start = id_start.nextChar();
                        })
                    }else{
                        ws.mergeCells(id_start + '9:' + id_start + '10');
                        setFormatCell(cell, headerFormat);
                        setValueCell(cell, col.text);
                    }
                    id_start = id_start.nextChar();
                });
            }


            // https://stackoverflow.com/questions/24221803/javascript-access-object-multi-level-property-using-variable
            function resolve(obj, path){
                if (path == 'weight_percent'){
                    return 'weight_percent'
                }
                if (path == 'weight_child_percent'){
                    return 'weight_child_percent'
                }
                path = path.split('.');
                var current = obj;
                while(path.length) {
                    if(typeof current !== 'object') return undefined;
                    current = current[path.shift()];
                }
                return current;
            }

            function totalWeight(tableData) {
                total = 0;
                tableData.forEach(function (row) {
                    if (row.weight != undefined && !row.refer_to ){
                        total = total + row.weight;
                    }
                    this.total_weight = total;
                })
            }

            function renderData(tableData, headerData) {
                start_row = 11;
                var id_start = 'B';
                var val = '';
                var total_weight_percent = 0;
                tableData.forEach(function (row) {
                    if (!row.isGroup){
                        headerData.columns.forEach(function (col) {
                            setWidthCol(id_start, col.width);
                            cell = id_start + start_row;
                            if (col.child) {
                                col.child.forEach(function (child) {            // render cell year target -> cell quarter 4 target
                                    cell = id_start + start_row;
                                    val = resolve(row, child.slug);
                                    setCellVal(cell, val);
                                    setFormatCell(cell, bodyFormat);
                                    id_start = id_start.nextChar();             // sang chu tiep thep eg: A -> B
                                })
                            } else {
                                val = resolve(row, col.slug);
                                if (col.slug == 'score_calculation_type'){
                                    val = gettext(val);
                                    console.log("type:", val);
                                }
                                // if (!row.refer_to){}
                                if (val == 'weight_percent') {
                                    if (!row.refer_to){
                                        val = (row.weight / this.total_weight);
                                        total_weight_percent = total_weight_percent + val;
                                        setNumFormat(cell, '0.00%')
                                    }else{
                                        val = '';
                                    }

                                }
                                if (val == 'weight_child_percent'){
                                    if (row.refer_to){
                                        var total_weight_child = 0;
                                        tableData.forEach(function (_row) {
                                            if (_row.refer_to == row.refer_to){
                                                total_weight_child += _row.weight_child;
                                            }
                                        });
                                        val = (row.weight_child / total_weight_child);
                                        setNumFormat(cell, '0.00%')
                                    }else{
                                        val ='';
                                    }
                                }
                                setCellVal(cell, val);
                                setFormatCell(cell, bodyFormat);
                                setFormatCell(cell, col.style);

                            }
                            id_start = id_start.nextChar();

                        });
                        id_start = 'B';
                        start_row++;
                    }

                });
                setValueCell((id_start + start_row ), gettext('Sum'));
                setValueCell(('D' + start_row ), this.total_weight);

                setValueCell(('E' + start_row ), total_weight_percent);
                setNumFormat('E' + start_row, '0.00%');
                headerData.columns.forEach(function (col) {         // set mau dong cuoi cung
                    cell = id_start + start_row;
                    if (col.child){
                        setFormatCell(cell, headerFormat);
                        col.child.forEach(function (child) {
                            cell_child = id_start + start_row;
                            setFormatCell(cell_child, headerFormat);
                            id_start = id_start.nextChar();
                        })
                    }else{
                        setFormatCell(cell, headerFormat);
                    }
                    id_start = id_start.nextChar();
                });


            }




            var date = new Date();
            var today = self.user_profile.email + date.getDate() + '.' + parseInt(date.getMonth() + 1) + '.' + date.getFullYear();
            window.wb = wb;
            self.downloadFile(wb, today + '.xlsx');


            function setNumFormat(cell, format) {
                if (cell && format) {
                    ws.getCell(cell).numFmt = format;
                }
            }

            function setWidthCol(col, width) {
                if (col && width) ws.getColumn(col).width = width;
            }

            function setCellVal(cell, value, notWrap) {
                if (cell && value!=null)
                    ws.getCell(cell).value = value;
                if (notWrap == null)
                    ws.getCell(cell).alignment = {wrapText: true};
                else if (notWrap == true)
                    ws.getCell(cell).alignment = {wrapText: false};
            }

            function setValueCell(cell, text) {
                cell = ws.getCell(cell);

                cell.value = text;
            }

            function setCellFormat(cell, format) {
                cell = ws.getCell(cell);
                if (format) {
                    if (format.hasOwnProperty('alignment')) {
                        cell.alignment = format.alignment;
                    }
                    if (format.hasOwnProperty('font')) {
                        cell.font = format.font;
                    }
                    if (format.hasOwnProperty('fill')) {
                        cell.fill = format.fill;
                    }
                    if (format.hasOwnProperty('border')) {
                        cell.border = format.border;
                    }
                }

            }

            function setFormatCell(cell, format) {
                cell = ws.getCell(cell);
                if (format) {
                    if (format.hasOwnProperty('alignment')) {
                        cell.alignment = format.alignment;
                    }
                    if (format.hasOwnProperty('font')) {
                        cell.font = format.font;
                    }
                    if (format.hasOwnProperty('fill')) {
                        cell.fill = format.fill;
                    }
                    if (format.hasOwnProperty('border')) {
                        cell.border = format.border;
                    }
                }
            }

            function setFormatRange(fromCol, toCol, fromRow, toRow, format) {
                fromCol = fromCol.charCodeAt(0);
                toCol = toCol.charCodeAt(0);
                for (var i = fromCol; i <= toCol; i++) {
                    for (var j = fromRow; j <= toRow; j++) {
                        setCellFormat(String.fromCharCode(i) + j, format);
                    }
                }
            }



        },
    },
    created: function () {
        window.targetApp = this;
        this.option = $('#change-style-drop').children().eq(0).text();
        this.isShowMonth = true;
        this.storage_user = this.getHistoryStorageByEmail(COMMON.UserRequestEmail);
        this.get_surbodinate_user_viewed();
        this.setCurrentUser(COMMON.UserViewedId, COMMON.UserName);
        this.getOrg();
        this.getUserProfile();
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