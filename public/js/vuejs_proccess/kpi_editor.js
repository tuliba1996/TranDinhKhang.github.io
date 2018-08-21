Vue.config.delimiters = ['${', '}$'];
var Bonus = Vue.extend({
    type: 'bonus-component',
    template: $('div.bonus-wrapper').html(), // Fuck tap lam moi ra cho nay <3
    data: function () {
        return {
            filter_text: '',
            current_user_profile: null,
            user_data_dict: null,
            lib_data_dict: null,
            bonus_ready: false,
            render_lib_data_list : [],
            render_user_data_list : [],
            dictionary: {
                plus: gettext('EXTRA') + " (" + gettext("UP TO 20") + "%)",
                minus: gettext('MINUS'),
                zero: gettext('ZERO')
            },
            month_name: '',
            current_quarter: {},
            total_score:{}
        }
    },
    events: {
        'fetch_current_quarter': function(current_quarter){
            var that = this
            if(that.month == 1){
                that.month_name = that.$parent.month_1_name.toUpperCase()
            }
            if(that.month == 2){
                that.month_name = that.$parent.month_2_name.toUpperCase()
            }
            if(that.month == 3){
                that.month_name = that.$parent.month_3_name.toUpperCase()
            }
            that.$set('current_quarter',current_quarter)
        },
        'fetch_exscore_lib': function(){
            var that = this
            // Fetch data from $parent
            that.$set('lib_data_dict',that.$parent.exscore_lib_data)
            that.render_exscore_lib()
            that.$emit('fetch_user_exscore_group')
        },
        'fetch_exscore': function(){
            var that = this
            // Fetch data from $parent
            that.$set('user_data_dict',that.$parent.exscore_user_data[that.month])
            // Process render data
            that.render_exscore_user()
            setTimeout(function(){
                if (that.bonus_ready == false){
                    that.$set('bonus_ready',true)
                }
            },2000)
            that.$emit('fetch_user_exscore_group')
        },
        'fetch_user_profile_from_parent': function(){
            var that = this
            that.$set('current_user_profile',that.$parent.current_user_profile)
        },
        'fetch_user_exscore_group': function() {
            var that = this
            if(that.lib_data_dict != null && that.user_data_dict != null){

                for(var key in that.user_data_dict){
                    that.user_data_dict[key].map(function(user_exscore_elem){

                        // Get lib index
                        var group_id_list = that.lib_data_dict[key].map(function(lib_exscore_elem){
                            return lib_exscore_elem.id
                        })
                        var group_index = group_id_list.indexOf(user_exscore_elem.exscore_lib)
                        // Get group
                        user_exscore_elem.group = that.lib_data_dict[key][group_index].group
                    })
                }
                that.render_exscore_user()
            }
        },
        'fetch_user_id': function(){
            var that = this
            that.$set('user_id',that.$parent.user_id)
        }
    },
    ready: function(){
        this.$emit('fetch_current_user_profile')
        this.$emit('fetch_user_id')
    },
    watch: {
        'total_score': {
            handler: function(value, old_value){
                this.$dispatch('update_exscore',this.month,value)
            }
        },
        'bonus_ready': {
            handler: function(newVal,oldVal){
                if(newVal == true){
                    $('div#bonus-ready').hide()
                    $('div#bonus-modal-header').show()
                }
            }
        },
        'render_user_data_list': {
            handler: function(val,oldValue){

                var that = this
                var data = that.calculate_final_score();
                that.$set('total_score',data)
            },
            deep: true
        },
        'filter_text': {
            handler: function(newVal,oldVal){
                var that = this
                that.restoreExscoreLib()
                that.searchExscoreLib()
            }
        }
    },
    props:[
        'month'
    ],
    methods: {

        render_exscore_user: function(){
            var that = this
            var render_data_index = 0
            // Ánh xạ sang lib_data_dict để lấy group
            for (var key in that.user_data_dict){

                var temp_dict = {
                    slug: key,
                    text: that.dictionary[key],
                    lan: gettext("Language"),
                    data: that.extract_exscore_v2(that.user_data_dict[key]),
                    sum_score: that.get_sum_exscore(that.user_data_dict[key],key)
                }
                that.$set('render_user_data_list['+(render_data_index++)+']',temp_dict)
            }
        },
        render_exscore_lib: function(){
            var that = this
            // Process render data
            var render_data_index = 0
            for (var key in that.lib_data_dict){
                var temp_dict = {
                    slug: key,
                    text: that.dictionary[key],
                    data: that.extract_exscore_v2(that.lib_data_dict[key]),
                }
                that.$set('render_lib_data_list['+(render_data_index++)+']',temp_dict)
            }
        },
        restoreExscoreLib: function(){
            var that = this
            that.$emit('fetch_exscore_lib')
        },
        searchExscoreLib: function(){
            var that = this
            if (that.filter_text != '') {
                console.log('starting searching with ' + that.filter_text)
                // First is to restore original data
                // Now to filter
                var data = Object.assign({},that.lib_data_dict)
                for (var key in data){
                    var _data = data[key].filter(function(elem){
                        return (
                            // Search co dau
                            (
                                elem.name.toLowerCase().indexOf(that.filter_text.trim().toLowerCase()) != -1 || // co dau
                                elem.code.toLowerCase().indexOf(that.filter_text.trim().toLowerCase()) != -1
                            )
                            ||
                            // Search khong dau
                            (
                                latinize(elem.name.toLowerCase()).indexOf(that.filter_text.trim().toLowerCase()) != -1 || // co dau
                                latinize(elem.code.toLowerCase()).indexOf(that.filter_text.trim().toLowerCase()) != -1
                            )

                        )
                    })
                    data[key] = _data
                }

                that.$set('lib_data_dict',data)
                that.render_exscore_lib()
            }
        },
        removeExscore: function(month,render_data_index,type,index_in_user_data_dict){
            var that = this;
            // Remove element in real dict
            var data = that.user_data_dict[type][index_in_user_data_dict]

            cloudjetRequest.ajax({
                type: 'DELETE',
                url: '/api/v2/exscore/' + data.id + '/',
                data: {},
                success: function(res){
                    that.user_data_dict[type].$remove(data) // Remove in frontend
                    that.$dispatch('fetch_user_exscore')
                }
            })
        },
        calculate_final_score: function(){
            console.log('triggered calculate_final_score')
            var that = this
            var zero_score = that.get_sum_exscore(that.user_data_dict['zero'],'zero')
            var minus_score = that.get_sum_exscore(that.user_data_dict['minus'],'minus')
            var plus_score = that.get_sum_exscore(that.user_data_dict['plus'],'plus')
            var data = {

                zero: zero_score > 0 ? true : false,
                score: plus_score - minus_score
            }
            return data
        },
        get_sum_exscore: function(list_data, score_type){

            var score = list_data.reduce(function(a,b){
                if(score_type=='zero') return a + 1
                return a + b.employee_points;
            },0);
            if(score_type == 'plus'){
                score = score <= 20 ? score: 20
            }
            return score;
        },
        addExscore: function(month,exscore){
            var that = this;
            var data = {
                month: that.month,
                user_id: that.user_id,
                exscore_lib_id: exscore.id,
                group: exscore.group
            }
            // Remove element in real dict
            cloudjetRequest.ajax({
                type: 'POST',
                url: '/api/v2/exscore/',
                data: JSON.stringify(data),
                contentType:'application/json',
                success: function(res){
                    that.$dispatch('fetch_user_exscore')
                }
            })
        },
        extract_lib_exscore: function(title,sum_list){
            // Clone to new object

            var sum_list_res = jQuery.extend(true, {}, sum_list); // Cloning is required

            var that = this
            // Extract exscore with lib
            var exscore_lib_list = [{
                order: 'I',
                is_exscore: false,
                name: 'Điểm ' + title + ' chung',
                category: 'first'
            }];
            var exscore_list = [{
                order: 'II',
                is_exscore: false,
                name: 'Điểm ' + title + ' chuyên môn',
                category: 'first'
            }];
            for(var item in sum_list_res){
                sum_list_res[item].index = item;
                exscore_lib_list.push(sum_list_res[item])
            }
            // Sort into category
            exscore_lib_list = that.sort_with_group(exscore_lib_list);
            exscore_lib_list = exscore_lib_list.slice(1,exscore_lib_list.length);

            exscore_list = that.sort_with_group(exscore_list);
            exscore_list = exscore_list.slice(1,exscore_list.length);


            sum_list_res = exscore_lib_list.concat(exscore_list);
            return sum_list_res;
        },
        extract_exscore_v2: function(sum_list){
            var that = this
            var sum_list_res = jQuery.extend(true, [], sum_list); // Cloning is required
            for(var item in sum_list_res){
                sum_list_res[item].index = item;
            }
            sum_list_res = that.sort_with_group(sum_list_res);
            return sum_list_res
        },
        extract_exscore: function(title,sum_list){
            // Clone to new object

            var sum_list_res = jQuery.extend(true, {}, sum_list); // Cloning is required

            var that = this
            // Extract exscore with lib
            var exscore_lib_list = [{
                order: 'I',
                is_exscore: false,
                name: 'Điểm ' + title + ' chung',
                category: 'first'
            }];
            var exscore_list = [{
                order: 'II',
                is_exscore: false,
                name: 'Điểm ' + title + ' chuyên môn',
                category: 'first'
            }];
            for(var item in sum_list_res){
                sum_list_res[item].index = item;
                if(sum_list_res[item].exscore_lib == null){
                    exscore_list.push(sum_list_res[item])
                }else{
                    exscore_lib_list.push(sum_list_res[item])
                }
            }
            // Sort into category
            exscore_lib_list = that.sort_with_group(exscore_lib_list);
            exscore_lib_list = exscore_lib_list.slice(1,exscore_lib_list.length);

            exscore_list = that.sort_with_group(exscore_list);
            exscore_list = exscore_list.slice(1,exscore_list.length);


            sum_list_res = exscore_lib_list.concat(exscore_list);
            return sum_list_res;
        },
        sort_with_group: function(list_data){
            var that = this;
            var group_container = {};
            var _sum_list = [];
            var sum_list = [];
            // Extract exscore with category

            // Get unique group list
            var _sum_list_index = 0;
            var cloned_list_data = Object.assign([],list_data)
            cloned_list_data.map(function(elem,index,_cloned_list_data){
                // Set flag is_exscore for exscore
                elem.is_exscore = true
                if(!(elem.group in group_container) && elem.group != null){
                    if(typeof group_container[elem.group] == 'undefined'){
                        group_container[elem.group] = {}
                    }
                    group_container[elem.group].ready = true
                    group_container[elem.group].index = _sum_list_index
                    _sum_list[_sum_list_index] = []
                    _sum_list[_sum_list_index++].push({
                        name: elem.group,
                        is_exscore: false,
                        category: 'second'
                    });
                }
            })
            // Filter with group
            for (var group in group_container){
                var list = cloned_list_data.filter(function(elem){
                    return elem.group == group
                })
                _sum_list[group_container[group].index] = _sum_list[group_container[group].index].concat(list)
            }
            // Return rendered data
            _sum_list.map(function(elem){
                sum_list = sum_list.concat(elem)
            })

            return sum_list;
        },
        sort_with_group_to_dict: function(list_data){
            var data_container = {};
            var new_list = list_data.map(function(elem,index,array){
                var key = elem.category.replace(/\s+/g, '_');

                if(key in data_container){
                    data_container[key].push(elem);
                }
                else{
                    data_container[key]= [];
                    data_container[key].push(elem);
                }
                return elem;
            });
            return data_container;
        }
    }
});
Vue.component('bonus',Bonus);




function kpi_ready(kpi_id, controller_prefix, ready) {
    if (ready) {
        $('#' + controller_prefix + kpi_id).show()
    }
    else {
        $('#' + controller_prefix + kpi_id).hide()
    }
}

function filter_kpi(val, parent_id) {
    var listOfObjects = [];
    var listKey = Object.keys(val);

    listKey.forEach(function (key) {
        if (parseInt(val[key].refer_to) === parseInt(parent_id) && val[key].old_weight > 0) {
            listOfObjects.push(val[key]);
        } else if (parent_id == null || listKey.indexOf(String(parent_id)) < 0) {
            // truong hop kpi cha duoc phan cong
            if (listKey.indexOf(String(val[key].refer_to)) < 0 && val[key].old_weight > 0) {
                listOfObjects.push(val[key]);
            }
        }
    });
    return listOfObjects;
}
function getKPIParent(kpi_list,excludeParentID){
    var result = {};
    // KPI cha duoc phan cong
    var listKey = Object.keys(kpi_list)
    var listKPIList = listKey.map(function(kpi_id){
        return kpi_list[kpi_id]
    })
    var filteredKPIParent = listKPIList.filter(function(elm){
        var baseCondition = excludeParentID.indexOf(elm.id) === -1 // id must not in excluded list
        var condition2 = (
            elm.refer_to !== null && // refer_to is not null
            listKPIList.map(function(elm2){
                return parseInt(elm2.id)
            }).indexOf(parseInt(elm.refer_to))  === -1 // and refer_to must not be in current kpi list
        )
        var condition1 = (elm.refer_to === null)
        return baseCondition && (condition1 || condition2)
    })
    filteredKPIParent.map(function(elm){
        result[elm.id] = Object.assign({},elm)
    })
    console.log("PARENT KPI ===========================")
    console.log(result)
    return result
}
function calculateParentKPIWeight(kpi_list,excludeParentID){
    var result = 0;
    var dataSource = getKPIParent(kpi_list,excludeParentID) // KPI cha thi moi lay
    for(var kpi_id in dataSource){
        result += parseFloat(kpi_list[kpi_id].weight)
    }
    return result
}


function total_weight_on_level(val, parent_id) {
    var total_weight = 0;
    var listKey = Object.keys(val);
    listKey.forEach(function (key) {
        if (val[key].refer_to == parent_id) {
            total_weight += Number(val[key].weight);
        } else if (parent_id == null || parent_id == "" || listKey.indexOf(String(parent_id)) < 0) {
            // truong hop kpi cha duoc phan cong
            if (listKey.indexOf(String(val[key].refer_to)) < 0 && val[key].weight > 0) {
                // truong hop kpi cha duoc phan cong
                total_weight += Number(val[key].weight);
            }
        }
    });

    return total_weight;
}

function total_old_weight_on_level(val, parent_id) {
    var total_old_weight = 0;
    var listKey = Object.keys(val);
    listKey.forEach(function (key) {
        if (val[key].refer_to == parent_id) {
            total_old_weight += Number(val[key].old_weight);
        } else if (parent_id == null || parent_id == "" || listKey.indexOf(String(parent_id)) < 0) {
            // truong hop kpi cha duoc phan cong
            if (listKey.indexOf(String(val[key].refer_to)) < 0 && val[key].old_weight > 0) {
                // truong hop kpi cha duoc phan cong
                total_old_weight += Number(val[key].old_weight);
            }
        }
    });
    return total_old_weight;
}

Vue.config.delimiters = ['${', '}$'];
//filter date format
Vue.filter('dateFormat', function (value) {
    var language_code = COMMON.LanguageCode;
    if (value) {
        if (language_code == 'en') return moment(value).format('DD/MMM/YYYY')
        if (language_code == 'vi') return moment(value).format('DD/MM/YYYY')
    }
});
Vue.filter('createdat_format', function (value) {
    return moment(value).format('H:mm:ss - DD/MM/YYYY')
});
Vue.filter('url_decode', function (str) {
    return decodeURIComponent(str)
});
Vue.filter('rounder', {
    // model -> view
    // formats the value when updating the input element.
    read: function (val) {
        try {
            return val.toFixed(0)
        }
        catch (err) {
            return val
        }
    }
});
Vue.filter('weightDisplay', {
    // model -> view
    // formats the value when updating the input element.
    read: function (val) {
        try {
            return (val.toFixed(1) == 'NaN') ? 0 + "%" : val.toFixed(1) + "%"
        }
        catch (err) {
            return val
        }
    },
    // view -> model
    // formats the value when writing to the data.
    write: function (val, oldVal) {
        var number = +val.replace(/[^\d.]/g, '')
        return isNaN(number) ? 0 : parseFloat(number.toFixed(2))
    }
});
Vue.filter('scoreDisplay', {
    // model -> view
    // formats the value when updating the input element.
    read: function (val) {
        try {
            return typeof(val) == 'number' ? (val == 0 ? "0%" : (val.toFixed(2) + "%")) : "0%";
        }
        catch (err) {
            return "0%";
        }
    },
    // view -> model
    // formats the value when writing to the data.
    write: function (val, oldVal) {
        var number = +val.replace(/[^\d.]/g, '');
        return isNaN(number) ? 0 : parseFloat(number.toFixed(2))
    }
});
Vue.filter('monthDisplay', {
    // model -> view
    // formats the value when updating the input element.
    read: function (val, quarter, order) {
        try {
            var arrMonth = val.split('|');
            return (arrMonth[((quarter - 1) * 3 + order) - 1] == undefined) ? '0' : arrMonth[((quarter - 1) * 3 + order) - 1];
        }
        catch (err) {
            return val;
        }
    }

});
Vue.filter('decimalDisplay', {
    // model -> view
    // formats the value when updating the input element.
    // Tuan Note:
    // + sync number
    // + auto automatically separate numbers when in thousands
    // + do not let the user enter characters
    read: function (val) {
        return (val === 0) ? 0 : (val == null || val === '') ? '' : format(val);
    },
    // view -> model
    // formats the value when writing to the data.
    write: function (val, oldVal) {
        if (val === '') {
            return '';
        }
        else {
            var number = val.split(",").join("");
            number = Number(number);
            // Toan note: ref https://stackoverflow.com/a/5963202/2599460
            return isNaN(number) ? 0 : parseFloat(number.toFixed(4));
        }
    }

});

Vue.filter('filter_kpi_level', function (val) {
    var id = v.active_kpi_id;
    if (id != '' && id != undefined && parseInt(id) > 0) {
        var parent_id = val[id].refer_to;
        return filter_kpi(val, parent_id);
    }
    return val;
});

// Vue.filter('filter_total_weight', function (val) {
//     var total_weight = 0;
//     var id = v.active_kpi_id;
//     var parent_id = "";
//     if (id != '' && id != undefined && id > 0) {
//         parent_id = val[id].refer_to;
//     }
//     total_weight = total_weight_on_level(val, parent_id);
//     return total_weight;
// });
Vue.filter('filter_total_weight_exclude_delayed', function (val) {
    var total_weight = 0;
    var id = v.active_kpi_id;
    var dataSource = Object.assign({},val)
    var excludeParentID = [parseFloat(id),]
    total_weight = calculateParentKPIWeight(dataSource,excludeParentID);
    return total_weight;
});

Vue.filter('filter_cal_rate_weight', function (val, weight) {
    var total_weight = 0;
    var id = v.active_kpi_id;
    var dataSource = Object.assign({},val)
    var excludeParentID = [parseFloat(id),]
    total_weight = calculateParentKPIWeight(dataSource,excludeParentID);
    return weight * 100 / total_weight;
});

Vue.filter('filter_total_old_weight', function (val) {
    var total_old_weight = 0;
    var id = v.active_kpi_id;
    var parent_id = "";
    if (id != '' && id != undefined && id > 0) {
        parent_id = val[id].refer_to;
    }
    total_old_weight = total_old_weight_on_level(val, parent_id);
    return total_old_weight;
});

Vue.filter('filter_cal_rate_old_weight', function (val, weight) {
    var total_old_weight = 0;
    var id = v.active_kpi_id;
    var parent_id = "";
    if (id != '' && id != undefined && id > 0) {
        parent_id = val[id].refer_to;
    }
    total_old_weight = total_old_weight_on_level(val, parent_id);

    return weight * 100 / total_old_weight;
});


Vue.component('tag-search', {
    props: ['options', 'value'],
    template: '#select2-template',
    ready: function () {
        var vm = this
        $(this.$el)
        // init select2
            .select2({
                placeholder: "Tìm theo thẻ",
                width: '100%',
                multiple: true,
                ajax: {
                    url: COMMON.LinkTagSearch,
                    quietMillis: 500,
                    cache: true,
                    dataType: 'json',
                    data: function (params) {
                        var query = {
                            q: params
                        }
                        // Query parameters will be ?search=[term]&type=public
                        return query;
                    },
                    results: function (data) {
                        employee_options = data;
                        var results = $.map(data, function (obj) {
                            obj.text = obj.name // replace name with the property used for the text
                            obj.id = obj.name
                            return obj;
                        });
                        return {
                            results: data
                        };
                    }
                }
            })
            .val(this.value)
            .trigger('change').on('change', function () {
            vm.$emit('input', this.value)
        })
    },
    watch: {
        value: function (value) {
            // update value
            $(this.$el).val(value)
        },
        options: function (options) {
            // update options
            $(this.$el).empty().select2({data: options})
        }
    },
    destroyed: function () {
        $(this.$el).off().select2('destroy')
    }
});

Vue.component('kpi-editable', {
    delimiters: ["${", "}$"],
    props: ['kpi', 'field', 'can_edit'],
    template: $('#kpi-edit-template').html(),
    data: function () {
        return {
            show_edit: false,
            edit_value: null
        }
    },
    ready: function () {
        this.edit_value = this.kpi[this.field];
    },
    methods: {

        edit_toggle: function () {
            if (!this.can_edit) {
                return;
            }
            this.show_edit = !this.show_edit;
            if (this.show_edit) {
                setTimeout(function () {
                    $(".id-text-edit").focus();
                }, 300);
            }
        },
        save_change: function () {
            var _this = this;
            this.show_edit = false;
            if (this.edit_value == this.kpi[this.field]) {
                return;
            }
            var data = {
                id: this.kpi.id,
            }
            data[this.field] = this.edit_value;
            cloudjetRequest.ajax({
                method: "POST",
                url: '/api/kpi/',
                data: JSON.stringify(data),
                success: function (data) {
                    _this.kpi[_this.field] = data[_this.field];
                }
            })

        }
    },
});

Vue.directive('autofocus', {
    // When the bound element is inserted into the DOM...
    inserted: function (el) {
        // Focus the element
        setTimeout(function () {
            el.focus();
        }, 100);
    },
})
function findRootKPI(kpi_id,kpi_list){
    var parent_id = kpi_list[kpi_id].refer_to
    if (kpi_list[parent_id] === undefined){
        return kpi_id
    }else{
        return findRootKPI(parent_id,kpi_list)
    }
}
var v = new Vue({
    el: '#container',
    data: {
        evidences: {},
        filename: '',
        action_plan_filename:'',
        month: '',
        month_name: '',
        list_evidence: [],
        list_action_plan_file:[],
        user_action_plan_permission: false,
        evidence_id: '',
        content: '',
        kpi_list: {},
        list_group: {},
        total_weight: {},
        toggle_states: {},
        total_weight_bygroup: {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0},
        total_kpis_bygroup: {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0},
        total_old_weight: {},
        total_old_weight_bygroup: {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0},
        total_old_kpis_bygroup: {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0},
        active_kpi_id: '',
        is_child: true,
        status_error: false,
        message_error: '',
        new_group_total: {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0},
        month_1_name: "M1",
        month_2_name: "M2",
        month_3_name: "M3",
        current_quarter: {},
        quarter_by_id: {},
        current_kpi: {},
        employee_performance: {},
        total_zero_score_kpis: [],
        complete_review: '',
        search: false,
        A_CHANGE: false,
        B_CHANGE: false,
        C_CHANGE: false,
        O_CHANGE: false,
        G_CHANGE: false,
        current_user_id: COMMON.UserId,
        categories: {
            selected: '',
            category: ['financial', 'customer', 'internal', 'learninggrowth', 'other']
        },
        backup_month: [],
        user_id: COMMON.OrgUserId,
        current_user_profile: {},
        exscore_user_data: {},
        exscore_lib_data: {},
        exscore_score: {
            '1': {
                month_name: '',
                score: 0,
                signal: 'safe'
            },
            '2': {
                month_name: '',
                score: 0,
                signal: 'safe'
            },
            '3': {
                month_name: '',
                score: 0,
                signal: 'safe'
            },
            'current': '1'
        },
        has_perm: {'MANGER_REVIEW': false},
        company_params: {
            ceo_id: null,
            quarter_id: null,
            performance: 0
        },
        quarter_list: {},
        backups_list: [],
        chosen_backup_month: null,
        backup_kpis: [],
        backup_month_name: '',
        current_backup: null,
        reason_kpi: '',
        check_submit_reason: true,
        confirm_delay_kpi: false,
        elm_kpi: null,
        manager_kpis: [],
        selected_manager_kpi: null,
        selected_kpi: null,
        translate: {
            'financial': gettext('Financial'),
            'customer': gettext('Customer'),
            'internal': gettext('Internal Process'),
            'learninggrowth': gettext('Learn & Growth'),
            'other': gettext('Others')
        },
        temp_value: {},
        cache_weight: '',
        adjusting_kpi: {},
        adjusting_chart: null,
        estimated_result_with_threshold: '',
        query: '',
        list_user_searched: [],
        list_surbodinates: [],
        list_surbodinates_user_viewed: [],
        storage_user: [],
        preview_attach_url: '',
        is_img: true,
        current_children_data: {},
        tag_list: {},
        tag_input: "",
        is_user_system: false,
        timeout: null,
        tags: [],
        searched_kpis: [],
        next_url_kpi_lib: '',
        DEPARTMENTS: COMMON.Departments,
        FUNCTIONS: [],
        extra_tags: [],
        selected_tags: "",
        selected_kpilib: {},
        BSC_CATEGORY: COMMON.BSCCategory,
        EXTRA_FIELDS: COMMON.ExtraFields,
        unique_code_cache: '',
        total_edit_weight: {},
        kpi_list_cache: [],
        option_export: 'q-m',
        status_upload_evidence: true,
        status_upload_action_plan: true,
        action_plan_to_be_deleted: {},
        preview_attach_modal_type:'',
        same_user: false,
        disable_upload: false,

        //datatemp for kpilib
        visible: false,
        // end data temp for kpi lib
    },
    validators: {
        numeric: { // `numeric` custom validator local registration
            message: 'Invalid numeric value',
            check: function (val) {
                return /^[-+]?[0-9]+$/.test(val)
            }
        },
    },
    computed: {
        parentKPIs: function (){
            var self = this;
            return getKPIParent(self.kpi_list,[]);
        },
        adjust_min_performance: function () {
            var self = this;
            return ((self.adjusting_kpi.achievement_calculation_method_extra.bottom.target / self.adjusting_kpi['month_' + self.adjusting_kpi.adjusting_month + '_target']) * 100).toFixed(2);
        },
        filtered_kpi_level: function(){
            var  self =  this;
            var id = self.active_kpi_id;
            if (id != '' && id != undefined && parseInt(id) > 0) {
                var parent_id = self.kpi_list[id].refer_to;
                return filter_kpi(self.kpi_list, parent_id);
            }
            return self.kpi_list;
        }

    },
    ready: function () {
        //readmore
        this.get_current_organization();
        var md1 = new MobileDetect(window.navigator.userAgent);
        if (md1.mobile()) {//if is mobile
            $('#company-vision').readmore({
                collapsedHeight: 100,
                moreLink: '<a href="#"> <i class="fa fa-angle-double-right"></i> ' + ("Read more") + '</a>',
                lessLink: '<a href="#"> <i class="fa fa-angle-double-up"></i> ' + gettext("Less") + '</a>'
            });
        }
        $('#company-mission').readmore({
            collapsedHeight: 200,
            moreLink: '<a href="#"> <i class="fa fa-angle-double-right"></i> ' + gettext("Read more") + '</a>',
            lessLink: '<a href="#"> <i class="fa fa-angle-double-up"></i> ' + gettext("Less") + '</a>'
        });
        this.fetch_exscore_lib();
        this.fetch_exscore();
        this.fetch_current_user_profile();
        var p = JSON.parse(localStorage.getItem('history_search_u'));
        if (p == null) localStorage.removeItem('history_search');
        this.storage_user = (p == null) ? [] : JSON.parse(localStorage.getItem('history_search'))[p.indexOf(COMMON.UserRequestEmail)];
        this.is_user_system = (COMMON.IsAdmin == 'True' || COMMON.IsSupperUser == 'True') ? true : false;
        this.get_surbodinate();
        this.same_user = (COMMON.UserRequestID == COMMON.UserViewedId) ? true : false;  // -> hot fix, has_perm(KPI__EDITING) => actor == target cho phep nhan vien tu chinh sua kpi, nhung logic moi thi khong cho phep
        this.get_surbodinate_user_viewed();

    },
    filters: {
        //marked: marked
        type_ico_url: function(type){
            var doc_type = ['docx','pdf','xls','xlsx','doc'];
            var img_type = ['jpg', 'jpeg', 'bmp', 'png'];

            var type = type.split('.');
            if(doc_type.indexOf(type[type.length -1 ].toLowerCase()) > -1){
                return COMMON.StaticUrl+'images/ico-document-format.png';
            }
            if(img_type.indexOf(type[type.length -1 ].toLowerCase()) > -1){
                return COMMON.StaticUrl+'images/ico-image-format.png';
            }
        },
        type_ico: function(type){
            var img_type = ['jpg', 'jpeg', 'bmp', 'png'];

            var type = type.split('.');
            if(img_type.indexOf(type[type.length -1 ].toLowerCase()) > -1){
                return true;
            }
            return false;
        },
        percent_progressbar: function(kpi_id){
            return this.kpi_list[kpi_id].latest_score*100/this.organization.max_score;
        }
    },
    watch: {
        kpi_list: {
            handler: function (val, oldVal) {
                this.calculate_total_weight();
                this.getListGroupV2();
                // this.getListGroup();
            }
            //,deep: true <-- slow
        },
        'current_quarter': {
            handler: function (val, oldVal) {
                var that = this
                this.$children.map(function (elem, index, children_arr) {
                    elem.$emit('fetch_current_quarter', val);
                })
            }
        },
        'exscore_score.current': {
            handler: function (val, old) {
                console.log('select value is: ' + val)
                $('#month-1').hide().parent().removeClass('active')
                $('#month-2').hide().parent().removeClass('active')
                $('#month-3').hide().parent().removeClass('active')
                $('#month-' + val).show().parent().addClass('active')
            }
        },
        'organization': {
            handler: function (newVal, oldVal) {
                var that = this
                that.$emit('update_lock_exscore_review', newVal.monthly_review_lock)
                that.$set('company_params.ceo_id', newVal.ceo)
                that.get_company_performance(that.company_params)
            }
        },
        selected_tags: {
            handler: function (newVal, oldVal) {
                this.search_kpi_library();
            }
        },
        searched_kpis: {
            handler: function(){
                if(this.organization.enable_kpi_lib) {
                    kpi_lib.data_kpi_editor = v;
                    kpi_lib.searched_kpis_lib = v.searched_kpis;
                }
            }
        }
    },
    created: function(){
        try{
            ELEMENT.locale(ELEMENT.lang[COMMON.LanguageCode]);
        }
        catch (e){
            console.log(e);
        }
    },
    methods: {
        getKPIParent: function(){
            var self  = this;
            return getKPIParent(self.kpi_list,[]);
        },
        constructOldWeight: function(){
            var self = this;
            for(var kpi_id in self.kpi_list){
                self.kpi_list[kpi_id].old_weight = self.kpi_list[kpi_id].weight;
            }
            self.$set('kpi_list',Object.assign({},self.kpi_list))
        },
        inputKPIWeight: function(val){
            var self = this;
            if (parseFloat(val) === 0){

            }
        },
        findGroupBySlug: function(slug,dataSource){
            var self = this;
            var listGroups = Object.keys(dataSource).map(function(elm){
                return dataSource[elm]
            })
            var groups = listGroups.slice().filter(function(elm){
                return elm.slug === slug
            })
            return groups;
        },
        findGroupByID: function(id,dataSource){
            var self = this;
            var listGroups = Object.keys(dataSource).map(function(elm){
                return parseInt(dataSource[elm].id)
            })
            var found = listGroups.indexOf(parseInt(id))
            return found;
        },
        getListGroup: function(){
            //debugger;
            var listGroup ={};
            var count = 0;
            var tmp = [];
            var group_in_category = []
            //console.log("==========gtx 1000============")
            //console.log(this.kpi_list)
            for (kpi in this.kpi_list) {
                if(tmp.indexOf(this.kpi_list[kpi].bsc_category) == -1) {
                    tmp.push(this.kpi_list[kpi].bsc_category)
                    group_in_category[this.kpi_list[kpi].bsc_category] = []
                }
                if (group_in_category[this.kpi_list[kpi].bsc_category].indexOf(this.kpi_list[kpi].kpi_group_id) == -1
                    && (this.kpi_list[kpi].refer_to == null || this.kpi_list[this.kpi_list[kpi].refer_to] == null)) {
                    listGroup[count] = {
                        name: this.kpi_list[kpi].refer_group_name,
                        slug: this.kpi_list[kpi].kpi_refer_group,
                        category: this.kpi_list[kpi].bsc_category,
                        refer_to: this.kpi_list[kpi].refer_to,
                        id: this.kpi_list[kpi].kpi_group_id
                    };

                    group_in_category[this.kpi_list[kpi].bsc_category].push(this.kpi_list[kpi].kpi_group_id);
                    count += 1;
                    //console.log(group_in_category)
                }
            }

            this.list_group = listGroup;
            // console.log("======================tttttttttt===================")
            // console.log(this.list_group)
        },




        getListGroupV2: function(){
            //debugger;
            var self = this;
            var listGroup = {};


            /*
            // console.log("parent kpi", self.getKPIParent());
            for(var kpi_id in self.getKPIParent()){

                console.log("elm:", kpi_id);
                var group = {
                    name: self.kpi_list[kpi_id].refer_group_name,
                    slug: self.kpi_list[kpi_id].kpi_refer_group,
                    category: self.kpi_list[kpi_id].bsc_category,
                    refer_to: self.kpi_list[kpi_id].refer_to, // if this KPI is assigned to user
                    id: self.kpi_list[kpi_id].group_kpi
                };
                //
                var matchedGroup = self.findGroupByID(group.id, listGroup);
                // if found group by id that does not exist in current listGroup -> push into list Group
                if (matchedGroup === -1){
                    result[index] = group;
                    index++;
                    listGroup.push(group);
                }
            }

            var parent_kpis = self.getKPIParent();

            function unique(array){
                return $.grep(array,function(el,index){
                    return index == $.inArray(el,array);
                });
            }

            */

            //groups=$.map(parent_kpis, function(kpi, index){
            var groups = $.map(self.kpi_list, function(kpi, index){
                var group = {
                    name: kpi.refer_group_name,
                    slug: kpi.kpi_refer_group,
                    category: kpi.bsc_category,
                    refer_to: kpi.refer_to, // if this KPI is assigned to user
                    // id: self.kpi_list[kpi_id].group_kpi
                };
                return group;
            });

            // self.kpi_list[kpi_id].kpi_refer_group
            var result=$.grep(groups,function(group, index){
                // return index == $.inArray(group, array);
                var first_index_found=groups.findIndex(g => g.slug == group.slug);
                return index == first_index_found;
                // return index == $.inArray(group, array);
            });

            for(var index in result){
                listGroup[index] = result[index] // note: convert result to dict, not list
            }

            // self.$set('list_group',listGroup);


            self.list_group = listGroup;
            console.log("====================== list group ===================")
            console.log(this.list_group)
        },









        delete_all_kpis: function () {
            cloudjetRequest.ajax({
                method: "POST",
                url: '/api/kpi/services/',
                data: {
                    'command': 'delele_all_kpis',
                    'user_id': COMMON.UserViewedId,
                },
                success: function (data) {
                    window.location.reload(true);
                }

            })
        },
        disable_edit_target: function(kpi){
            if (this.is_user_system) return false;
            console.log("target:", kpi.id)
            return !(kpi.enable_edit && this.organization.allow_edit_monthly_target && this.organization.enable_to_edit);

        },
        can_edit_current_month: function (current_month, monthly_review_lock){ //check whether currrent month is allowed to edit
            return monthly_review_lock == "allow_all"?true: current_month==monthly_review_lock
        },
        disable_review_kpi: function(parent_id, current_month){
            if (this.is_user_system) return false;
            var is_manager = COMMON.UserId != COMMON.UserViewedId;
            var current_month_locked = !(this.can_edit_current_month(current_month, this.organization.monthly_review_lock));
            if (is_manager){ // if current Login user is parent of user viewed
                return ( !this.organization.allow_manager_review || current_month_locked ) // manager can edit if enable_to_edit not pass
            }
            else {
                return ( !this.organization.allow_employee_review || current_month_locked ) // employee can edit(review) kpi only if not pass self_review_date
            }
        },
        hide_modal: function (modal_id) {
            $(modal_id).modal('hide');
        },
        check_email_delete: function () {
            var email = this.email_confirm.replace(/\s/g,'');
            if (email.length == COMMON.UserViewedEmail.length && email == COMMON.UserViewedEmail ){
                this.status_confirm = false;
            }else{
                this.status_confirm = true;
            }

        },

        reset_modal_delete: function () {
            var that = this;
            that.status_confirm = true;
            that.email_confirm = '';
        },
        search_kpi_library: function (page=null) {
            var self = this;
            var url = `/api/v2/kpilib/search/?${kpi_lib.query_search_kpi_lib}`;
            if(page != 1 && self.next_url_kpi_lib){
                url = updateQueryStringParameter(self.next_url_kpi_lib, 'page', page)
            }
            self.searched_kpis = [];
            cloudjetRequest.ajax({
                method: "GET",
                url: url,
                success: function (data) {
                    self.searched_kpis = data.results;
                    self.next_url_kpi_lib = data.next;
                    if(self.organization.enable_kpi_lib == true)
                        kpi_lib.isLoading = false;
                    kpi_lib.total_page = data.count;
                }
            });
        },
        fetch_kpi_tag: function (children_data_object, kpi_child_id) {
            var kpi_tag = [];
            try {
                var tag_index = children_data_object.children_weights.map(function (elm, index) {
                    return elm.kpi_id;
                }).indexOf(kpi_child_id);
                kpi_tag = children_data_object.children_weights[tag_index].relation_type;

            } catch (e) {
                console.log(e)
            }
            return Object.assign([], kpi_tag);
        },
        update_relation_type_object: function (children_data_object, kpi_id) {
            var self = this;
            var cloned_children_data_object = Object.assign({}, children_data_object);
            var cloned_relation_type = Object.assign([], self.tag_list[kpi_id]);
            var relation_index = children_data_object.children_weights.map(function (elm) {
                return elm.kpi_id;
            }).indexOf(kpi_id);
            cloned_children_data_object.children_weights[relation_index].relation_type = cloned_relation_type;
            return cloned_children_data_object;
        },
        open_tag_input: function (kpi_id) {
            var self = this;
            var elm_wrapper = $("#tag-wrapper-" + kpi_id);
            var temp_relation_type = Object.assign([], self.tag_list[kpi_id]);
            self.$set('tempo_relation_type[' + kpi_id + ']', temp_relation_type);
            if (!elm_wrapper.hasClass('input')) {
                elm_wrapper.addClass('input');
                ;
                $('#tag-wrapper-' + kpi_id + ' input').focus();
                self.$set('tag_' + kpi_id, true);
            }
        },
        close_tag_input: function (kpi_id) {
            var self = this;
            var elm_wrapper = $("#tag-wrapper-" + kpi_id);
            if (elm_wrapper.hasClass('input')) {
                elm_wrapper.removeClass('input');
                self.$set('tag_' + kpi_id, false);
            }
            var refer_to_id = self.kpi_list[kpi_id].refer_to;
            var data = self.update_relation_type_object(self.kpi_list[kpi_id].parent_children_data, kpi_id);
            console.log(data)
            cloudjetRequest.ajax({
                method: 'post',
                url: '/api/v2/kpi/children_weights/' + refer_to_id + '/',
                data: JSON.stringify(data),
                success: function (data) {
                    self.$set('kpi_list[' + kpi_id + '].parent_children_data', data);
                    self.$set("tag_list[" + kpi_id + ']', self.fetch_kpi_tag(data, kpi_id))
                }
            });
        },
        cancel_tag_input: function (kpi_id) {
            var self = this;
            var elm_wrapper = $("#tag-wrapper-" + kpi_id);
            if (elm_wrapper.hasClass('input')) {
                elm_wrapper.removeClass('input');
                self.$set('tag_' + kpi_id, false);
            }
            self.$set('tag_list[' + kpi_id + ']', self.tempo_relation_type[kpi_id])
        },
        display_tag: function (kpi_id) {
            var self = this;
            if (self.tag_list[kpi_id].length === 0) self.tag_list[kpi_id].push(self.tag_input);
            else {

            }
            self.tag_input = '';
        },
        get_children_refer_by_id: function (kpi_id) {
            var self = this;
            var kpi_index = self.current_children_data.refer_kpis.map(
                function (elem) {
                    return elem.id;
                }
            ).indexOf(kpi_id);
            return self.current_children_data.refer_kpis[kpi_index];
        },
        get_children_v2: function (kpi_id) {
            // Pace.start();
            var self = this;
            cloudjetRequest.ajax({
                type: 'get',
                url: '/api/v2/kpi/children_weights/' + kpi_id + '/',

                success: function (data) {

                    data['parent_kpi_id'] = kpi_id;
                    data['edit'] = false;
                    self.$set('current_children_data', data);
                    self.$set('kpi_list[' + kpi_id + '].children_data', Object.assign({}, data.children_data))
                    console.log(self.current_children_data)
                    self.$compile(self.$el)
                    $('#childrenKPIModal').modal();
                    //    that.$set('children_kpis', data.children);
                },
                error: function () {
                    alert('error');
                },
                complete: function (data) {
                    $('.add_kpi').show();
                }
            });

        },
        confirm_switching_autocal: function(close_modal = true) {
            var self = this;
            //  if(self.organization.default_auto_score_parent === true){
            self.current_children_data.children_data.children_weights.map(function (elm) {
                elm.weight = parseFloat(elm.weight);
                elm.weight_temp = parseFloat(elm.weight_temp);
                return elm;
            });
            cloudjetRequest.ajax({
                type: 'post',
                url: '/api/v2/kpi/children_weights/' + self.current_children_data.parent_kpi_id + '/',
                contentType: 'application/json',
                data: JSON.stringify(self.current_children_data.children_data),
                success: function (data) {
                    self.$set('kpi_list[' + self.current_children_data.parent_kpi_id + '].children_data', data);

                    console.log(data)
                    if (close_modal) {
                        $('#childrenKPIModal').modal('hide');

                        var root = self.get_root_kpi_wrapper(self.current_children_data.parent_kpi_id);
                        $(root).reload_kpi_anchor();
                        self.current_children_data = {};
                    }
                },
                error: function () {
                    alert('error');
                },
                complete: function (data) {
                    $('.add_kpi').show();
                }
            });
            // }
        },
        cancel_switching_autocal: function () {
            var self = this;
            self.current_children_data = {};
        },
        check_status_msg_expired: function () {
            var that = this
            var date_expired = new Date(that.organization.edit_to_date);
            var date_now = new Date();
            var cache_date = [];
            _date_expired = JSON.parse(localStorage.getItem('date_expired'));
            if (_date_expired == null || localStorage.getItem('status_msg_expired') == null) {
                cache_date.push({'day': date_expired.getDate(), 'month': date_expired.getMonth() + 1});
                localStorage.setItem('date_expired', JSON.stringify(cache_date));
                localStorage.setItem('status_msg_expired', false);
            } else if (_date_expired.length > 0 && localStorage.getItem('status_msg_expired') == 'true') {
                var _day = date_expired.getDate();
                var _month = date_expired.getMonth() + 1;
                if (date_expired.getMonth() + 1 == _date_expired[0].month && date_expired.getDate() > _date_expired[0].day) {
                    _day = date_expired.getDate();
                    _month = date_expired.getMonth() + 1;
                    localStorage.setItem('status_msg_expired', false);
                } else if (date_expired.getMonth() + 1 > _date_expired[0].month) {
                    _day = date_expired.getDate();
                    _month = date_expired.getMonth() + 1;
                    localStorage.setItem('status_msg_expired', false);
                }
                cache_date.push({'day': date_expired.getDate(), 'month': date_expired.getMonth() + 1});
                localStorage.setItem('date_expired', JSON.stringify(cache_date));
            }
        },
        get_surbodinate: function () {
            var that = this;
            cloudjetRequest.ajax({
                method: "GET",
                dataType: 'json',
                url: '/api/team/?user_id=' + COMMON.UserRequestID,
                success: function (data) {
                    that.list_surbodinates = data;
                }
            })
        },
        get_surbodinate_user_viewed: function () {
            var that = this;
            cloudjetRequest.ajax({
                method: "GET",
                dataType: 'json',
                url: '/api/team/?user_id=' + COMMON.UserViewedId,
                success: function (data) {
                    that.list_surbodinates_user_viewed = data;
                }
            })
        },
        page_employee: function (user_id, p) {
            var that = this;
            if (p != -1) {
                var _storage = [];
                var _all = [];
                var user_current = (JSON.parse(localStorage.getItem('history_search_u')) != null) ? JSON.parse(localStorage.getItem('history_search_u')) : [];
                var position = user_current.indexOf(COMMON.UserRequestEmail);
                if (position == -1) {
                    user_current.push(COMMON.UserRequestEmail);
                    localStorage.setItem('history_search_u', JSON.stringify(user_current));
                }
                _all = (JSON.parse(localStorage.getItem('history_search')) != null) ? JSON.parse(localStorage.getItem('history_search')) : [];
                _storage = (typeof _all[user_current.indexOf(COMMON.UserRequestEmail)] != 'undefined') ? _all[user_current.indexOf(COMMON.UserRequestEmail)] : [];

                // Check user_id has existed in list
                var has_user = false;
                _storage.forEach(function(e, i){
                    if(that.list_user_searched[p].user_id == e.user_id){
                        if (i>0 && has_user==false){
                            // Move item to first in array
                            var temp = _storage[0];
                            _storage[0] = e;
                            _storage[i] = temp;
                        }
                        has_user = true;
                        return;
                    }
                })
                // If user hasn't in list, push user to list
                if (has_user==false)_storage.insert(0, that.list_user_searched[p]);
                _all[user_current.indexOf(COMMON.UserRequestEmail)] = _storage
                if (_all[user_current.indexOf(COMMON.UserRequestEmail)].length > 3) _all[user_current.indexOf(COMMON.UserRequestEmail)].splice(3, 1);
                localStorage.setItem('history_search', JSON.stringify(_all));
                console.log(_all);
            }
            var url = COMMON.LinkKPIEditorEmp;
            index = url.substr(0, url.length - 1).lastIndexOf('/');
            location.href = url.substr(0, index) + "/" + user_id + "/";
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
                            console.log(that.list_user_searched);
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
        get_total_children_weight: function (children_weight_object) {
            var result = 1;
            if (children_weight_object && children_weight_object.children_data.children_weights.length > 0) {
                result = children_weight_object.children_data.children_weights.reduce(function (prevVal, elm) {
                    return prevVal + parseFloat(elm.weight);
                }, 0)
            }
            return result;
        },
        toggle_adjusting_estimation: function () {
            var self = this;
            self.$set('adjusting_kpi.enable_estimation', !self.adjusting_kpi.enable_estimation)
            if (self.adjusting_kpi.enable_estimation === true) {
                $('#adjuster-estimation').slideDown();
            }
            else {
                $('#adjuster-estimation').slideUp();
            }
            self.update_adjusting_chart();
        },
        get_adjusting_key: function () {
            var self = this;
            if (self.adjusting_kpi.adjusting_month === 'quarter') {
                console.log('quarter')
                return 'quarter';
            }
            else {
                console.log('month_' + self.adjusting_kpi.adjusting_month)
                return 'month_' + self.adjusting_kpi.adjusting_month;
            }

        },
        // Calculate for adjusting_kpi object, calculate by month
        calculate_score_with_level: function (_result = null) {
            var self = this;
            var _month = self.adjusting_kpi.adjusting_month; // get month
            var _target = 0;
            _target = parseFloat(self.adjusting_kpi['month_' + _month + '_target']); // get target
            if (_month === 'quarter') {
                _target = parseFloat(self.adjusting_kpi['target']);
            }
            console.log(_result)
            if (_result === null) { // calculate fof default values

                _result = parseFloat(self.adjusting_kpi['month_' + _month]);
                if (_month === 'quarter') {
                    _result = parseFloat(self.adjusting_kpi['real']);

                }

            } // get result}


            var _min = 0;
            var _max = 0;
            var _max_score = parseFloat(self.organization.max_score);
            var _operator = self.adjusting_kpi.operator;

            if (_operator === '>=') {
                console.log(calculate_with_operator_greater())
                console.log(_result)
                _min = parseFloat(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].bottom); // get min target
                _max = parseFloat(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].top); // get max target
                var score = calculate_with_operator_greater();
                if (score < 0) return (0.0).toFixed(2);
                return score;

            }
            if (_operator === '<=') {
                _min = parseFloat(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].top); // get min target
                _max = parseFloat(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].bottom); // get max target
                var score = calculate_with_operator_less();
                if (score < 0) return (0.0).toFixed(2);
                return score;
            }

            function calculate_with_operator_greater() {
                var score = (0.0).toFixed(2);

                if (_result < _min) {
                    return (0.0).toFixed(2); // zero if less than min
                }
                if (_result <= _target && _result >= _min) {
                    score = ((_result / _target) * 100).toFixed(2); // follow with function in document
                    return score;
                }
                if (_result >= _target && _result < _max) {
                    score = (
                        (_result - _target) / (_max - _target) * (_max_score - 100) + 100 // follow with function in document
                    ).toFixed(2);
                    return score;
                }
                if (_result >= _max) {
                    return _max_score.toFixed(2); // max score gained if greater than max
                }
            }

            function calculate_with_operator_less() {
                var score = (0.0).toFixed(2);


                if (_result <= _min) {
                    return _max_score.toFixed(2); // max score gained if less than or equal to min
                }
                if (_result > _min && _result <= _target) {
                    score = (
                        (_result - _min) / (_target - _min) * (100 - _max_score) + _max_score // follow with function in document
                    ).toFixed(2);
                    return score;
                }
                if (_result >= _target && _result <= _max) {
                    score = (
                        (2 - _result / _target) * 100  // follow with function in document
                    ).toFixed(2);
                    return score;
                }
                if (_result > _max) {
                    return (0.0).toFixed(2); // zero if greater than max
                }
            }
        },
        fetch_chart_data: function () {
            var self = this;
            var data = [];
            if (self.adjusting_kpi.operator === '>=') {
                data = [
                    {
                        x: self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].bottom,
                        y: self.calculate_score_with_level(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].bottom)
                    }, {
                        x: self.adjusting_kpi.adjusting_month === 'quarter' ? self.adjusting_kpi['target'] : self.adjusting_kpi['month_' + self.adjusting_kpi.adjusting_month + '_target'],
                        y: 100
                    }, {
                        x: self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].top,
                        y: self.organization.max_score
                    }]
            }
            else if (self.adjusting_kpi.operator === '<=') {
                data = [
                    {
                        x: self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].top,
                        y: self.organization.max_score

                    }, {
                        x: self.adjusting_kpi.adjusting_month === 'quarter' ? self.adjusting_kpi['target'] : self.adjusting_kpi['month_' + self.adjusting_kpi.adjusting_month + '_target'],
                        y: 100
                    }, {
                        x: self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].bottom,
                        y: self.calculate_score_with_level(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()].bottom)
                    }]
            }
            return data;

        },
        update_adjusting_chart: function () {
            var self = this;
            console.log('triggered')
            console.log(self.adjusting_kpi.achievement_calculation_method_extra[self.get_adjusting_key()])
            if (self.adjusting_chart === null) {
                self.init_adjusting_chart();
            }
            var data = self.fetch_chart_data();

            self.adjusting_chart.data.datasets[1].data = data; // update performance chart
            if (self.adjusting_kpi.enable_estimation) {
                self.adjusting_chart.data.datasets[0].data = [
                    {
                        x: self.estimated_result_with_threshold,
                        y: self.calculate_score_with_level(self.estimated_result_with_threshold)
                    }
                ]; // update estimated result chart
            } else { // remove if false
                self.adjusting_chart.data.datasets[0].data = [];
            }
            self.adjusting_chart.update()
        },
        init_adjusting_chart: function () {
            var self = this;
            var element_chart = $('#performance-adjusting-chart');
            var data = self.fetch_chart_data();
            var chart = new Chart(element_chart, {
                type: 'scatter',
                data: {
                    datasets: [
                        {
                            label: gettext('Esimated result'), // Estimated result chart, index = 0
                            data: [],
                            fill: true,
                            showLine: false,
                            lineTension: 0,
                            borderDashOffset: false,
                            backgroundColor: [
                                'rgba(182, 52, 52,1)'
                            ],
                            borderColor: [
                                'rgba(182, 52, 52,1)'
                            ],
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: 'red'
                        },
                        {
                            label: gettext("Performance"), // Performance chart, index = 1
                            data: data,
                            fill: true,
                            showLine: true,
                            lineTension: 0,
                            borderDashOffset: false,
                            backgroundColor: [
                                'rgba(51, 122, 183, 0.15)'
                            ],
                            borderColor: [
                                'rgba(51, 122, 183, 1.0)'
                            ],
                            pointHoverRadius: 5,
                            pointHoverBackgroundColor: 'red'
                        },
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    legend: {
                        display: false
                    },
                    scales: {
                        xAxes: [{
                            gridLines: {
                                display: false,
                                color: "rgba(51, 122, 183, 0.6)",
                            },
                            ticks: {
                                stepSize: 20,
                                beginAtZero: true,
                                display: false

                            },
                            scaleLabel: {
                                display: true,
                                labelString: gettext("Result")
                            },

                        }],
                        yAxes: [{
                            gridLines: {
                                display: false,
                                color: "rgba(51, 122, 183, 0.15)",
                            },
                            ticks: {
                                stepSize: 150,
                                beginAtZero: true,
                                display: false
                            },
                            scaleLabel: {
                                display: true,
                                labelString: gettext("Performance"),
                            }
                        }]
                    }
                }
            });
            self.adjusting_chart = chart;

        },
        confirm_adjust: function (elm) {
            var self = this;
            cloudjetRequest.ajax({
                type: 'post',
                url: '/api/kpi/services/',
                contentType: 'application/json',
                data: JSON.stringify({
                    id: self.adjusting_kpi.id,
                    achievement_calculation_method: self.adjusting_kpi.achievement_calculation_method,
                    achievement_calculation_method_extra: self.adjusting_kpi.achievement_calculation_method_extra,
                    command: 'update_kpi_threshold'
                }),
                success: function (res) {
                    var enable_edit = self.kpi_list[self.adjusting_kpi.id].enable_edit;
                    var enable_review = self.kpi_list[self.adjusting_kpi.id].enable_review;
                    var enable_delete = self.kpi_list[self.adjusting_kpi.id].enable_delete;

                    res.enable_edit = enable_edit;
                    res.enable_review = enable_review;
                    res.enable_delete = enable_delete;
                    self.$set('kpi_list[' + self.adjusting_kpi.id + ']', res);
                    self.reset_adjust();


                },
                error: function (res) {
                }
            });
        },
        reset_adjust: function () {
            var self = this;
            self.adjusting_kpi = {};
            // Reset to month 1

        },
        init_adjust: function (kpi_id) {
            var self = this;
            // Clone to temp object
            self.adjusting_kpi = Object.assign({}, self.kpi_list[kpi_id]);
            // Setup adjusting month to regenerate chart

            $.extend(true, self.adjusting_kpi, {
                adjusting_month: 1,
                enable_estimation: false,
                estimated_result: 0
            })

            if (self.adjusting_kpi.achievement_calculation_method_extra === null) {

                self.$set('adjusting_kpi.achievement_calculation_method_extra', Object.assign({}, {
                    month_1: {
                        top: '',
                        bottom: ''
                    },
                    month_2: {
                        top: '',
                        bottom: ''
                    },
                    month_3: {
                        top: '',
                        bottom: ''
                    },
                    quarter: {
                        top: '',
                        bottom: ''
                    }
                }))
            } else {
                try {
                    self.adjusting_kpi.achievement_calculation_method_extra = JSON.parse(self.adjusting_kpi.achievement_calculation_method_extra);
                } catch (err) {

                }
            }

            // Default tab will be related to achievement_calculation_method
            var default_tab = 1;
            if (self.adjusting_kpi.achievement_calculation_method === 'topbottom') {
                default_tab = 2;
            }
            $('#performance-result-based .nav-pills li:nth-child(' + default_tab + ')').tab('show');
            $('#adjusting-dashboard .nav-tabs li:nth-child(' + self.adjusting_kpi.adjusting_month + ')').tab('show') // reset tab 1
            self.update_adjusting_chart();

        },
        adjust_performance_level: function (kpi_id) {
            var self = this;
            self.init_adjust(kpi_id);
            console.log(self.adjusting_kpi)
            $('#performance-level-adjust').modal();
            resetErrorWhenShow();
        },
        formatTime: function (time) {
            if (COMMON.LanguageCode == 'en'){
                return moment(time).format('YYYY-MM-DD HH:mm:ss');
            }
            return moment(time).format('HH:mm:ss DD/MM/YYYY');
        },
        check_quarter_plan: function (kpi_id, type) {
            var that = this;
            var quarter = "one";
            switch (that.current_quarter.quarter) {
                case 1:
                    quarter = "one";
                    break;
                case 2:
                    quarter = "two";
                    break;
                case 3:
                    quarter = "three";
                    break;
                case 4:
                    quarter = "four"
                    break;
                default:
                    break;
            }
            var quarter_plan = that.kpi_list[kpi_id]['quarter_' + quarter + '_target'];
            var month_1_target = that.kpi_list[kpi_id].month_1_target ? that.kpi_list[kpi_id].month_1_target : 0;
            var month_2_target = that.kpi_list[kpi_id].month_2_target ? that.kpi_list[kpi_id].month_2_target : 0;
            var month_3_target = that.kpi_list[kpi_id].month_3_target ? that.kpi_list[kpi_id].month_3_target : 0;
            var actual_target = parseFloat((month_1_target + month_2_target + month_3_target).toFixed(5));
            return that.kpi_list[kpi_id].score_calculation_type == 'sum' && (that.kpi_list[kpi_id].target != quarter_plan || that.kpi_list[kpi_id].target != actual_target);
        },
        kpi_ready: function (kpi_id, controller_prefix, ready) {
            kpi_ready(kpi_id, controller_prefix, ready);
        },
        get_company_performance: function (company_params) {
            if (company_params.ceo_id == null) {
                return false
            }
            var that = this
            //var ceo_id ='';
            var quarter_id = getUrlVars()['quarter_id'];
            var url = '/api/user_kpi/' + company_params.ceo_id + '/';
            if (quarter_id) {
                url += '?quarter_id=' + quarter_id;
            }
            cloudjetRequest.ajax({
                type: 'get',
                url: url,
                contentType: 'application/json',
                success: function (res) {
                    that.$set('company_params.performance', res)
                },
                error: function (res) {
                }
            });
        },
        fetch_current_user_profile: function () {
            var that = this;
            cloudjetRequest.ajax({
                type: 'GET',
                url: '/api/v2/profile/' + that.user_id,
                success: function (res) {
                    that.$set('current_user_profile', res)
                    that.$broadcast('fetch_user_profile_from_parent')
                    that.get_backups_list();

                }
            });
        },
        fetch_exscore_lib: function () {
            var that = this;
            cloudjetRequest.ajax({
                type: 'GET',
                url: '/api/v2/exscore/lib/',
                success: function (data) {
                    that.$set('exscore_lib_data', data)
                    that.$children.map(function (elem, index, children) {
                        elem.$emit('fetch_exscore_lib')
                    })
                }

            })
        },
        fetch_exscore: function () {
            var that = this;
            cloudjetRequest.ajax({
                type: 'GET',
                url: '/api/v2/exscore/',
                data: {
                    user_id: that.user_id,
                },
                success: function (data) {
                    that.$set('exscore_user_data', data);
                    that.$children.map(function (elem, index, children) {
                        elem.$emit('fetch_exscore')
                    })
                }
            });

        },
        get_weight_bygroup: function (group) {
            return this.total_weight_bygroup[group];
        },
        is_root_kpi: function (kpi) {

            that = this;
            if (kpi.parent == 0 || kpi.parent == undefined || kpi.parent == null) {
                return true;
            }
            else {
                return true;
            }
        },
        get_title_tooltip: function (kpi_month_value, disable, month_number, kpi_type) {
            that = this;
            var message;
            var month_name = month_number == 1 ? that.month_1_name : month_number == 2 ? that.month_2_name : month_number == 3 ? that.month_3_name : '';
            switch (kpi_type) {
                case 1:
                    switch (month_number) {
                        case 1:
                            if ((!kpi_month_value.enable_review || !disable.enable_month_1_review))
                                if ((kpi_month_value.month_2 != null || kpi_month_value.month_3 != null) && kpi_month_value.month_1 == null) {
                                    message = gettext("You forget review the result") + ' ' + month_name;
                                } else if ((kpi_month_value.month_2 == null || kpi_month_value.month_3 == null) && kpi_month_value.month_1 == null) {
                                    message = gettext("You can not to review the result earlier than the specified time") + ' ' + month_name;
                                    if (!(!kpi_month_value.enable_review || !disable.enable_month_2_review) || !(!kpi_month_value.enable_review || !disable.enable_month_3_review)) {
                                        message = gettext("You forget review the result") + ' ' + month_name;
                                    }
                                } else if ((kpi_month_value.month_2 != null || kpi_month_value.month_3 != null) && kpi_month_value.month_1 != null) {
                                    message = gettext("Over time to review the KPI result") + ' ' + month_name;
                                }
                            break;
                        case 2:
                            if ((!kpi_month_value.enable_review || !disable.enable_month_2_review))
                                if ((kpi_month_value.month_1 != null || kpi_month_value.month_3 != null) && kpi_month_value.month_2 == null) {
                                    message = gettext("You forget review the result") + ' ' + month_name;
                                } else if ((kpi_month_value.month_1 == null || kpi_month_value.month_3 == null) && kpi_month_value.month_2 == null) {
                                    message = gettext("You can not to review the result earlier than the specified time") + ' ' + month_name;
                                    if (!(!kpi_month_value.enable_review || !disable.enable_month_3_review)) {
                                        message = gettext("You forget review the result") + ' ' + month_name;
                                    }
                                } else if ((kpi_month_value.month_1 != null || kpi_month_value.month_3 != null) && kpi_month_value.month_2 != null) {
                                    message = gettext("Over time to review the KPI result") + ' ' + month_name;
                                }
                            break;
                        case 3 :
                            if ((!kpi_month_value.enable_review || !disable.enable_month_3_review))
                                if ((kpi_month_value.month_2 != null || kpi_month_value.month_1 != null) && kpi_month_value.month_3 == null) {
                                    message = gettext("You forget review the result") + ' ' + month_name;
                                } else if ((kpi_month_value.month_2 == null || kpi_month_value.month_1 == null) && kpi_month_value.month_3 == null) {
                                    message = gettext("You can not to review the result earlier than the specified time") + ' ' + month_name;
                                } else if ((kpi_month_value.month_2 != null || kpi_month_value.month_1 != null) && kpi_month_value.month_3 != null) {
                                    message = gettext("Over time to review the KPI result") + ' ' + month_name;
                                }
                            break;
                        default:
                            message = null;
                            break;
                    }
                    break;
                case 2:
                    if (disable)
                        return gettext("You can not change the KPI Goal") + ' ' + month_name + ' ' + gettext("switch to the Latest month caculation method to change");
                    break;
                case 3:
                    if (disable)
                        return gettext("This is KPI Achievements") + ' ' + month_name + ' ' + gettext("you can only view and can not edit");
                    break;
                default:
                    break;
            }
            return message;
        },
        get_url_order_quarter: function (id) {
            if (window.location.href.search('/emp/') != -1) {
                if (id == that.current_quarter.id) {
                    return COMMON.LinkDashBoard + 'emp/' + that.user_id + '/';
                }
                return COMMON.LinkDashBoard + 'emp/' + that.user_id + '/' + '?quarter_id=' + id;
            } else {
                if (id == that.current_quarter.id) {
                    return COMMON.LinkDashBoard;
                }
                return COMMON.LinkDashBoard + '?quarter_id=' + id;
            }
        },
        get_time: function (date, format) {
            var dateParts = date.split("-");
            if (dateParts.length != 3)
                return null;
            var year = dateParts[0];
            var month = dateParts[1];
            var day = dateParts[2];
            var date_c = new Date(year, month, day);
            switch (format) {
                case 'm':
                    return gettext('Month') + ' ' + date_c.getMonth();
                    break;
                case 'd':
                    return gettext('Day') + ' ' + date_c.getDate();
                    break;
                case 'y':
                    return gettext('Year') + ' ' + date_c.getFullYear();
                    break;
                case 'dmy':
                    return gettext('Day') + ' ' + date_c.getDate() + ' ' + gettext('Month') + ' ' + date_c.getMonth() + ' ' + gettext('Year') + ' ' + date_c.getFullYear();
                    break;
                default:
                    return '';
                    break;
            }
        },

        calculate_total_old_weight: function () {
            that = this;
            that.total_old_weight = {};
            that.total_old_weight_bygroup = {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0};
            that.total_old_kpis_bygroup = {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0};

            Object.keys(that.kpi_list).forEach(function (key) {
                // console.log(key, obj[key]);
                var current = 0;
                //   console.log(that.kpi_list[key]);
                var kpi = that.kpi_list[key];

                if (that.total_old_weight[kpi.user] != undefined) {
                    current = parseFloat(that.total_old_weight[kpi.user]);
                }

                if (kpi.parent == 0 || kpi.parent == undefined || kpi.parent == null) {
                    that.total_old_weight[kpi.user] = parseFloat(current) + parseFloat(kpi.old_weight);

                    Object.keys(that.total_old_weight_bygroup).forEach(function (key) {
                        if (key == kpi.group) {
                            that.total_old_weight_bygroup[key] += parseFloat(kpi.old_weight);
                            that.total_old_kpis_bygroup[key] += 1;
                        }
                    });
                }

                // Calculate % by group and around
                if (kpi.bsc_category == 'financial' && kpi.refer_to == null){
                    var weight = parseFloat(kpi.weight*100/that.total_weight[kpi.user]).toFixed(1);
                    that.total_edit_weight.financial_ratio += parseFloat(weight);
                    return;
                }
                if (kpi.bsc_category == 'customer' && kpi.refer_to == null){
                    var weight = parseFloat(kpi.weight*100/that.total_weight[kpi.user]).toFixed(1);
                    that.total_edit_weight.customer_ratio += parseFloat(weight);
                    return;
                }
                if (kpi.bsc_category == 'internal' && kpi.refer_to == null){
                    var weight = parseFloat(kpi.weight*100/that.total_weight[kpi.user]).toFixed(1);
                    that.total_edit_weight.internal_ratio += parseFloat(weight);
                    return;
                }
                if (kpi.bsc_category == 'learninggrowth' && kpi.refer_to == null){
                    var weight = parseFloat(kpi.weight*100/that.total_weight[kpi.user]).toFixed(1);
                    that.total_edit_weight.learninggrowth_ratio += parseFloat(weight);
                    return;
                }
                if (kpi.bsc_category == 'other' && kpi.refer_to == null){
                    var weight = parseFloat(kpi.weight*100/that.total_weight[kpi.user]).toFixed(1);
                    that.total_edit_weight.other_ratio += parseFloat(weight);
                    return;
                }
                // console.log(kpi.user)
                // console.log(that.total_weight)
            });
        },

        calculate_total_weight: function () {
            that = this;
            that.total_weight = {};
            that.total_weight_bygroup = {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0};
            that.total_kpis_bygroup = {'A': 0, 'B': 0, 'C': 0, 'O': 0, 'G': 0};
            that.total_edit_weight = {'financial':0,'financial_ratio':0,'financial_total':0,
                'customer':0,'customer_ratio':0,'customer_total':0,
                'internal':0,'internal_ratio':0,'internal_total':0,
                'learninggrowth':0,'learninggrowth_ratio':0,'learninggrowth_total':0,
                'other':0,'other_ratio':0,'other_total':0};


            Object.keys(that.kpi_list).forEach(function (key) {

                // console.log(key, obj[key]);
                var current = 0;
                //   console.log(that.kpi_list[key]);
                var kpi = that.kpi_list[key];
                if (that.total_weight[kpi.user] != undefined) {
                    current = parseFloat(that.total_weight[kpi.user]);
                }

                if (kpi.parent == 0 || kpi.parent == undefined || kpi.parent == null) {
                    that.total_weight[kpi.user] = parseFloat(current) + parseFloat(kpi.weight);

                    Object.keys(that.total_weight_bygroup).forEach(function (key) {
                        if (key == kpi.group) {
                            that.total_weight_bygroup[key] += parseFloat(kpi.weight);
                            that.total_kpis_bygroup[key] += 1;
                        }
                    })
                }

                // Total weight by category
                if (kpi.bsc_category == 'financial' && kpi.refer_to ==  null) {
                    that.total_edit_weight.financial += parseFloat(kpi.weight);
                    that.total_edit_weight.financial_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'customer' && kpi.refer_to == null){
                    that.total_edit_weight.customer += parseFloat(kpi.weight);
                    that.total_edit_weight.customer_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'internal' && kpi.refer_to ==null){
                    that.total_edit_weight.internal += parseFloat(kpi.weight);
                    that.total_edit_weight.internal_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'learninggrowth' && kpi.refer_to == null){
                    that.total_edit_weight.learninggrowth += parseFloat(kpi.weight);
                    that.total_edit_weight.learninggrowth_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'other' && kpi.refer_to == null ){
                    that.total_edit_weight.other += parseFloat(kpi.weight);
                    that.total_edit_weight.other_total += 1;
                    return;
                }
                // Total weight by category
                if (kpi.bsc_category == 'financial' && kpi.refer_to ==  null) {
                    that.total_edit_weight.financial += parseFloat(kpi.weight);
                    that.total_edit_weight.financial_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'customer' && kpi.refer_to == null){
                    that.total_edit_weight.customer += parseFloat(kpi.weight);
                    that.total_edit_weight.customer_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'internal' && kpi.refer_to ==null){
                    that.total_edit_weight.internal += parseFloat(kpi.weight);
                    that.total_edit_weight.internal_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'learninggrowth' && kpi.refer_to == null){
                    that.total_edit_weight.learninggrowth += parseFloat(kpi.weight);
                    that.total_edit_weight.learninggrowth_total += 1;
                    return;
                }
                if (kpi.bsc_category == 'other' && kpi.refer_to == null ){
                    that.total_edit_weight.other += parseFloat(kpi.weight);
                    that.total_edit_weight.other_total += 1;
                    return;
                }

                // console.log(kpi.user)
                // console.log(that.total_weight)

            });

            this.calculate_total_old_weight();
        },
        change_weight: function(kpi){
            var that = this;
            if(kpi.weight<=0){
                swal({
                    type: 'error',
                    title: gettext("Unsuccess"),
                    text: gettext("Please deactive this KPI before you change KPI's weight to 0"),
                    showConfirmButton: true,
                    timer: 5000,
                })
                that.kpi_list[kpi.id].weight = that.cache_weight;
                return false;
            }
            this.calculate_total_weight();
        },
        catch_change_weight: function(kpi_id, kpi_weight){
            // Push kpi changed
            var kpis = {'kpi_id':kpi_id, 'weight':kpi_weight};
            var that = this;
            that.cache_weight = kpi_weight;
            that.kpi_list_cache.push(kpis);
        },
        resume_weight: function () {
            var that = this;
            that.status_error = false;
            console.log("Triggered resume weight")
            Object.keys(that.kpi_list).forEach(function (key) {
                that.kpi_list[key].weight = that.kpi_list[key].old_weight;
            })
            that.$set('kpi_list',Object.assign({}, that.kpi_list));
        },
        update_kpi_default_real: function (kpi, show_blocking_modal) {
            var data = {};
            data['default_real'] = kpi.default_real;
            data['kpi_id'] = kpi.id;


            cloudjetRequest.ajax({
                url: COMMON.LinkKPICommand,
                type: 'post',
                data: JSON.stringify(data),
                success: function (data) {
                    $('#kpi_reload' + kpi.id).click();
                },
                error: function () {
                    alert('Update  Error');
                }
            });


        },
        change_weight: function(kpi){
            var that = this;
            if(kpi.weight<=0){
                swal({
                    type: 'error',
                    title: gettext("Unsuccessful"),
                    text: gettext('Please deactive this KPI before you change KPI\'s weight to 0'),
                    showConfirmButton: true,
                    timer: 5000,
                })
                that.kpi_list[kpi.id].weight = that.cache_weight;
                return false;
            }
            this.calculate_total_weight();
        },
        show_unique_code_modal: function (kpi) {

            this.current_kpi = kpi;
            this.unique_code_cache = kpi.unique_code;
            $('#kpi-uniquecode').modal();
        },
        // update_group_name: function (kpi) {
        //     //$('.group-header-kpi-name' + kpi.id).text(kpi.refer_group_name);
        // },
        update_kpi: function (kpi, show_blocking_modal, callback) {
            var show_blocking_modal = (typeof show_blocking_modal !== 'undefined') ? show_blocking_modal : false;

            if (show_blocking_modal) {
                //cwaitingDialog.show('{% trans 'Loading!' %}', {dialogSize: 'sm', progressType: 'warning'});
            }
            if (kpi.weight <= 0) { // in case, user inputs 0.01
                swal({
                    type: 'error',
                    title: gettext("Unsuccessful"),
                    text: gettext('Please deactive this KPI before you change KPI\'s weight to 0'),
                    showConfirmButton: true,
                    timer: 5000,
                })
                this.kpi_list[kpi.id].weight = this.cache_weight;
                return false;
            }
            //    Pace.start();
            this.calculate_total_weight();
            var that = this;
            data = {};
            data['id'] = kpi.id;
            data['name'] = kpi.name;
            data['weight'] = kpi.weight;
            data['group'] = kpi.group;
            data['bsc_category'] = kpi.bsc_category;
            data['reviewer_email'] = kpi.reviewer_email;
            data['unique_code'] = kpi.unique_code;
//                data['refer_group_name'] = kpi.name; // do not update refer_group_name here, must be processed automatically
            cloudjetRequest.ajax({
                type: "POST",
                url: COMMON.LinkKPIAPI,
                data: JSON.stringify(data),
                success: function (data) {
                    console.log("success");
                    that.get_current_employee_performance();
                    that.$set('kpi_list['+kpi.id+ ']',data);

                    // this line will trigger rebuild editor because of changing group list
                    // but, this is not good solution
                    that.getListGroupV2();
                    //$('.group-header-kpi-name' + kpi.id).text(kpi.refer_group_name);
                    if (typeof callback == "function") {
                        callback(0);
                    }
                },
                error: function (obj) {
                    if (callback) {
                        callback(1);
                    }
                }
            });
        },
        check_is_valid: function (kpi_id) {
            that = this;
            var result = true;
            var kpi_deplay = that.kpi_list[kpi_id];
            var list_kpi_update = [];
            Object.keys(that.kpi_list).forEach(function (key) {

                if (!that.isNumber(that.kpi_list[key].weight)) {
                    result = false;
                    return;
                }

            });

            return result;
        },
        get_root_kpi_wrapper: function (kpi_id) {
            var hidden_input = $("#kpi-wrapper-" + kpi_id);
            $ancestors = $(hidden_input).parentsUntil('.kpi-group-category', '.kpi-parent-wrapper').last().find("div[id*='kpi-wrapper-']").first();
            if ($ancestors.length > 0) {
                return $($ancestors);
            } else {
                return hidden_input;
            }
        },
        update_kpis: function (kpi_id, elm) {
            that = this;
            that.status_error = false;
            var kpi_deplay = that.kpi_list[kpi_id];
            var list_kpi_update = [];
            Object.keys(that.kpi_list).forEach(function (key) {
                if (that.kpi_list[key].refer_to == kpi_deplay.refer_to && that.kpi_list[key].old_weight != that.kpi_list[key].weight) {
                    list_kpi_update.push(that.kpi_list[key]);
                }
            });

            var list_data = [];
            list_kpi_update.forEach(function (kpi) {
                var data = {};
                data['id'] = kpi.id;
                data['name'] = kpi.name;
                data['weight'] = kpi.weight;
                data['group'] = kpi.group;
                data['bsc_category'] = kpi.bsc_category;
                data['reviewer_email'] = kpi.reviewer_email;
                data['unique_code'] = kpi.unique_code;
                list_data.push(data);
            });
            if (list_data.length > 0) {
                cloudjetRequest.ajax({
                    url: COMMON.LinkKPIAPI,
                    data: JSON.stringify({type: 'multi', data: list_data}),
                    type: 'POST',
                    success: function (res) {
                        that.get_current_employee_performance();
                        $ancestors = that.get_root_kpi_wrapper(kpi_id);
                        // close modal and alter message success
                        $('#modalReason').modal('hide');
                        //update new old_weight value
                        list_kpi_update.forEach(function (item) {
                            that.kpi_list[item.id].old_weight = item.weight;
                        });

                        var t = that.kpi_list;
                        that.$set('kpi_list', '');
                        that.$set('kpi_list', t);
                        setTimeout(function () {
                            swal({
                                type: 'success',
                                title: gettext("Delay KPI success"),
                                showConfirmButton: false,
                                timer: 3000
                            })
                        }, 1000)
                    },
                    error: function (a, b, c) {
                        // co loi xay ra
                        if (a.responseJSON != undefined && a.responseJSON.length > 0) {
                            that.status_error = true;
                            that.message_error = '';
                            a.responseJSON.forEach(function (kpi) {
                                that.message_error += kpi.id + " " + kpi.name + ": " + gettext('Is error') + "<br/>";
                            });
                        }
                    }
                });
            } else {
                // close modal and alter message success
                $('#modalReason').modal('hide');
                setTimeout(function () {
                    swal({
                        type: 'success',
                        title: gettext("Delay KPI success"),
                        showConfirmButton: false,
                        timer: 3000
                    })
                }, 1000)
                $ancestors = that.get_root_kpi_wrapper(kpi_id);
                if ($ancestors.length > 0) {
                    $($ancestors).reload_kpi_anchor();
                } else {
                    $(elm).reload_kpi_anchor();
                }

            }
        },
        // upload evidence
        count_evidence: function (month_number, kpi_id) {
            var that = this;
            var tmp = 0;
            cloudjetRequest.ajax({
                url: '/api/v2/kpi/' + kpi_id + '/evidence/upload/',
                type: 'get',
                data: {
                    type: "json",
                    month: month_number,
                    kpi_id: kpi_id,
                    count: true,
                },
                success: function (response) {
                    res = response[0];
                    if (!that.evidences[kpi_id]) that.$set('evidences[' + kpi_id + ']', []);
                    console.log("evidences:" + res)
                    that.$set('evidences[' + kpi_id + '][' + month_number + ']', res)
                    console.log("count evidence:" + that.evidences[kpi_id][month_number]);
                    console.log("items evidence: " + that.evidences);
                },
                error: function () {

                },
            })
        },
        showModal_e: function (month_number, kpi_id) {
            var that = this;
            console.log("KPI ID:" + kpi_id);
            var month_name = month_number == 1 ? v.month_1_name : month_number == 2 ? v.month_2_name : month_number == 3 ? v.month_3_name : '';
            this.month_name = month_name;
            this.month = month_number;
            this.disable_upload = this.check_disable_upload_evidence(this.kpi_list[kpi_id]);
            that.$set('evidence_id', kpi_id);
            cloudjetRequest.ajax({
                url: '/api/v2/kpi/' + kpi_id + '/evidence/upload/',
                type: 'get',
                data: {
                    type: "json",
                    kpi_id: kpi_id,
                    month: month_number,
                },
                success: function (response) {
                    that.$set('list_evidence', response);
                    console.log("stopped here");
                    if (that.list_evidence.length > 0) {
                        that.list_evidence.forEach(function (el, index) {
                            cloudjetRequest.ajax({
                                url: '/api/v2/profile/' + el.user + '/',
                                type: 'get',
                                success: function (data) {
                                    var key1 = 'avatar';
                                    var key2 = 'actor';
                                    that.$set('list_evidence[' + index + '].avatar', data.get_avatar);
                                    that.$set('list_evidence[' + index + '].actor', data.display_name);
                                    console.log('new evidence:' + that.list_evidence[index].avatar);

                                }
                            })
                        });
                    }
                    console.log('passed here');

                },
                error: function () {
                    alert("error");
                },
            }).done(function () {
                console.log('DONE!!!!!');
                $('#evidence-modal').modal('show');
                console.log(that.list_evidence)
                console.log("shown!")
            });

        },

        showModal_kpi_action_plan: function(){
            // alert('hello guys');
            cloudjetRequest.ajax({
                url: COMMON.LinkActionPlan,
                type: 'get',
                data: {
                    type: "json",
                    // kpi_id: kpi_id,
                    // month: month_number,
                },
                success: function (response) {
                    that.$set('list_action_plan_file', response.data);
                    that.$set('user_action_plan_permission', response.permission);


                    // if (that.list_action_plan_file.length > 0) {
                    //     that.list_action_plan_file.forEach(function (el, index) {
                    //         cloudjetRequest.ajax({
                    //             url: '/api/v2/profile/' + el.user + '/',
                    //             type: 'get',
                    //             success: function (data) {
                    //                 var key1 = 'avatar';
                    //                 var key2 = 'actor';
                    //                 // that.$set('list_action_plan_file[' + index + '].avatar', data.get_avatar);
                    //                 // that.$set('list_action_plan_file[' + index + '].actor', data.display_name);
                    //                 console.log('new action plan:' + that.list_action_plan_file[index].avatar);
                    //
                    //             }
                    //         })
                    //     });
                    // }

                },
                error: function () {
                    // alert("error");
                },
            }).done(function () {
                console.log('DONE!!!!!');
                $('#kpi_action_plan-modal').modal('show');
                console.log(that.list_action_plan_file)
                console.log("shown!")
            });


            // $('#kpi_action_plan-modal').modal('show');

        },

        check_disable_upload_evidence: function (kpi) {
            if (this.month == 1 && this.organization.enable_month_1_review == true && kpi.enable_review){
                return false;
            }
            if (this.month == 2 && this.organization.enable_month_2_review == true && kpi.enable_review){
                return false;
            }
            if (this.month == 3 && this.organization.enable_month_3_review == true && kpi.enable_review){
                return false;
            }
            return true;


        },
        check_disable_edit: function (kpi) {
            if (this.is_user_system){
                return true
            }else{
                if (!that.organization.allow_edit_monthly_target){
                    return false
                }else {
                    if (COMMON.UserRequestID == COMMON.UserViewedId) {
                        return false
                    } else {
                        if (kpi.enable_edit) {
                            return true
                        }
                    }
                }
            }
            return false
        },


        showPreview: function (file_url) {
            if (window.location.protocol == 'https:' && file_url.match('^http://'))
                file_url = file_url.replace("http://", "https://");
            var patt1 = /\.[0-9a-z]+$/i;
            this.preview_attach_url = file_url;
            var file_ext = file_url.match(patt1);
            console.log(file_ext);

            if (['.png', '.jpg', '.bmp', '.gif', '.jpeg', '.pdf', '.odf'].indexOf(file_ext[0].toLowerCase()) < 0) {
                window.open(file_url, 'Download');
            }
            else {
                if (['.pdf', '.odf'].indexOf(file_ext[0]) >= 0) {
                    this.is_img = false;
                    this.preview_attach_url = COMMON.StaticUrl + 'ViewerJS/index.html#' + file_url;
                }
                else {
                    this.is_img = true;
                }
                this.preview_attach_modal_type='evidence';
                $('#evidence-modal').modal('hide');
                $('#preview-attach-modal').modal('show');

            }
        },


        showPreview_action_plan: function (file_url) {
            if (window.location.protocol == 'https:' && file_url.match('^http://'))
                file_url = file_url.replace("http://", "https://");
            var patt1 = /\.[0-9a-z]+$/i;
            this.preview_attach_url = file_url;
            var file_ext = file_url.match(patt1);
            console.log(file_ext);

            if (['.png', '.jpg', '.bmp', '.gif', '.jpeg', '.pdf', '.odf'].indexOf(file_ext[0]) < 0) {
                window.open(file_url, 'Download');
            }
            else {
                if (['.pdf', '.odf'].indexOf(file_ext[0]) >= 0) {
                    this.is_img = false;
                    this.preview_attach_url = COMMON.StaticUrl + 'ViewerJS/index.html#' + file_url;
                }
                else {
                    this.is_img = true;
                }
                this.preview_attach_modal_type='action_plan'
                $('#kpi_action_plan-modal').modal('hide');
                $('#preview-attach-modal').modal('show');

            }
        },
        post_kpi_action_plan:function () {
            var formData = new FormData();
            var that = this;

            formData.append('content', $("#board-upload-action-plan .action-plan-descr").val().replace("\r\n", "<br/>"));
            formData.append('attachment', $("#file-upload-action-plan-input")[0].files[0]);

            if ($("#file-upload-action-plan-input")[0].files[0]) {
                cloudjetRequest.ajax({
                    url: COMMON.LinkActionPlan,
                    type: 'post',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        console.log(response);
                        alert('Post action plan successfully!');
                        // The unshift() method adds new items to the beginning of an array, and returns the new length.
                        that.list_action_plan_file.unshift(response);
                        // that.list_action_plan_file[0].avatar = COMMON.UserAvatar;
                        that.list_action_plan_file[0].actor = COMMON.UserDisplayName;
                        // var tmp = that.evidences[that.evidence_id][that.month];
                        // that.$set('evidences[' + that.evidence_id + '][' + that.month + ']', tmp + 1);
                        console.log(tmp);
                    },
                    error: function () {
                        // alert("error");
                    }
                }).done(function () {
                    // $('#save-evidence').attr('disabled', 'disabled');
                    $('#file-upload-action-plan-input').val('');
                    that.action_plan_filename = '';
                    $("#board-upload-action-plan .action-plan-descr").val('');
                    $('#kpi_action_plan-modal .form-start').show();
                });
            }
            else alert(gettext('Please select a file!'));
        },
        postEvidence: function () {
            var formData = new FormData();
            var that = this;
            console.log("KPI_ID POST:" + that.evidence_id);
            formData.append('content', $("#e-content").val().replace("\r\n", "<br/>"));
            formData.append('month', that.month);
            formData.append('attachment', $("#file-upload")[0].files[0]);
            if ($("#file-upload")[0].files[0]) {
                cloudjetRequest.ajax({
                    url: '/api/v2/kpi/' + that.evidence_id + '/evidence/upload/',
                    type: 'post',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function (response) {
                        that.list_evidence.unshift(response);
                        that.list_evidence[0].avatar = COMMON.UserAvatar;
                        that.list_evidence[0].actor = COMMON.UserDisplayName;
                        var tmp = that.evidences[that.evidence_id][that.month];
                        that.$set('evidences[' + that.evidence_id + '][' + that.month + ']', tmp + 1);
                        console.log(tmp);
                    },
                    error: function () {
                        alert("error");
                    }
                }).done(function () {
                    // $('#save-evidence').attr('disabled', 'disabled');
                    $('#file-upload').val('');
                    that.filename = '';
                    $('#e-content').val('');
                    $('.form-start').show();
                });
            }
            else alert(gettext('Please select a file!'));
        },
        show_Modal_delevi: function(index){
            var that = this;
            that.current_evidence = that.list_evidence[index];
            $('#evidence-modal').modal('hide');
            $('#confirm-delete-evidence').modal('show');
        },
        show_modal_delete_action_plan: function(index){
            var that = this;
            that.action_plan_to_be_deleted = that.list_action_plan_file[index];
            $('#kpi_action_plan-modal').modal('hide');
            $("#confirm-delete-action-plan-modal").modal('show');

        },


        deleteEvidence: function(id, kpi_id, month){
            var that = this;
            cloudjetRequest.ajax({
                url: '/api/v2/kpi/' + kpi_id + '/evidence/upload/',
                type: 'delete',
                data: {
                    type: "json",
                    id: id,
                    month: month
                },
                success: function (response) {

                },
                error: function () {
                    // alert("error");
                    $("#confirm-delete-evidence").modal('hide');
                    $('#evidence-modal').modal('show');
                },
            }).done(function () {
                $("#confirm-delete-evidence").modal('hide');
                that.showModal_e(month,kpi_id);
                that.count_evidence(month,kpi_id);
            });
        },

        delete_action_plan: function(id){
            var that = this;
            cloudjetRequest.ajax({
                // url: '/api/v2/kpi/' + kpi_id + '/evidence/upload/',
                url: COMMON.LinkActionPlan,
                type: 'delete',
                data: {
                    type: "json",
                    id: id,
                },
                success: function (response) {

                },
                error: function () {
                    // alert("error");
                    $("#confirm-delete-action-plan-modal").modal('hide');
                    $('#kpi_action_plan-modal').modal('show');
                },
            }).done(function () {
                $("#confirm-delete-action-plan-modal").modal('hide');
                that.showModal_kpi_action_plan(); // fucking, this will be request to server again

            });
        },

        handleFile:function (e){
            $('.form-start').hide();
            var width = 1;
            var file = $('#file-upload')[0].files[0];
            var file_name = $('#file-upload')[0].files[0].name;
            that.filename = file_name;
            var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.docx|\.pdf|\.xls|\.xlsx|\.doc|\.bmp)$/i;
            if(!allowedExtensions.exec(file_name) || file.size/1024/1024 > 5) {
                that.status_upload_evidence = false;
                return false;
            }
            else{
                that.status_upload_evidence = true;
                var id = setInterval(frame, 10);
            }
            function frame() {
                if (width >= 100) {
                    clearInterval(id);
                    $("#ico-circle-check").css('color','#7ed321');
                    $("#myBar").hide();
                    $("#title-loading").hide();
                    $("#e-content").show();
                    $("#btn-cancel-evi").show();
                    $("#btn-save-evi").show();

                } else {
                    width++;
                    $("#percentage").text(width+'%');
                    $("#myBar").css('width', width + '%');
                }
            }
        },

        // Done
        handleFile_action_plan:function (e){
            $('#kpi_action_plan-modal .form-start').hide();
            var width = 1;
            var file = $('#file-upload-action-plan-input')[0].files[0];
            var file_name = $('#file-upload-action-plan-input')[0].files[0].name;
            that.action_plan_filename = file_name;
            var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.docx|\.pdf|\.xls|\.xlsx|\.doc|\.bmp)$/i;
            if(!allowedExtensions.exec(file_name) || file.size/1024/1024 > 5) {
                that.status_upload_action_plan = false;
                return false;
            }
            else{
                that.status_upload_action_plan = true;
                var id = setInterval(frame, 10);
            }
            function frame() {
                if (width >= 100) {
                    clearInterval(id);
                    $("#board-upload-action-plan .ico-circle-check").css('color','#7ed321');
                    $("#board-upload-action-plan .file-upload-progress-bar-wrapper .file-upload-progress-bar").hide();
                    $("#board-upload-action-plan .title-loading").hide();
                    $("#board-upload-action-plan .action-plan-descr").show();
                    $("#board-upload-action-plan .btn-start-over").show();
                    $("#board-upload-action-plan .btn-save-upload").show();

                } else {
                    width++;
                    $("#board-upload-action-plan .file-upload-percentage").text(width+'%');
                    $("#board-upload-action-plan .file-upload-progress-bar-wrapper .file-upload-progress-bar").css('width', width + '%');
                }
            }
        },

        get_current_quarter: function () {
            that = this;
            cloudjetRequest.ajax({
                type: 'get',
                async: false,
                url: COMMON.LinkQuarter + '?get_current_quarter=yes',
                success: function (data) {
                    that.month_1_name = data['month_1_name'];
                    that.month_2_name = data['month_2_name'];
                    that.month_3_name = data['month_3_name'];
                    that.$set('current_quarter', data['fields']);
                },
                error: function () {
                    alert('error');
                },
                complete: function (data) {
                    $('.add_kpi').show();
                }
            });
        },

        get_quarter_by_id: function () {
            that = this;
            var quarter_id = getUrlVars()['quarter_id'];
            if (quarter_id) {
                cloudjetRequest.ajax({
                    type: 'get',
                    url: COMMON.LinkQuarter + '?quarter_id=' + quarter_id,
                    success: function (data) {
                        that.$set('quarter_by_id', data);
                        that.month_1_name = data['month_1_name'];
                        that.month_2_name = data['month_2_name'];
                        that.month_3_name = data['month_3_name'];
                    },
                    error: function () {
                        alert('error');
                    },
                    complete: function (data) {
                    }
                });
            } else {
                that.quarter_by_id = that.current_quarter;
            }
        },

        get_current_employee_performance: function () {
            this.get_employee_performance(COMMON.OrgUserId);
        },

        get_employee_performance: function (emp_id) {
            that = this;
            var quarter_id = getUrlVars()['quarter_id'];
            var url = '/api/user_kpi/' + emp_id + '/';
            if (quarter_id) {
                url += '?quarter_id=' + quarter_id;
            }
            cloudjetRequest.ajax({
                type: 'get',
                url: url,
                success: function (res) {
                    that.$set('employee_performance', res);
                    that.get_backups_list(true);
                    // console.log('jahskjfkjsdaasdh');
                    that.$children.map(function (elem, index, children_array) {
                        elem.$emit('fetch_exscore')
                    })
                },
                error: function (res) {
                }
            });
        },

        get_current_organization: function () {
            var that = this;
            cloudjetRequest.ajax({
                type: 'get',
                async: false,
                url: COMMON.LinkOrgAPI,
                success: function (data) {
                    that.$set('organization', data);
                    console.log(that.organization)
                    that.check_status_msg_expired();
                },
                error: function () {
                    alert('error getting organization');
                },
                complete: function () {

                }
            });
        },
        update_current_organization: function () {
            that = this;
            console.log('update_current_organization');
            cloudjetRequest.ajax({
                url: COMMON.LinkOrgAPI,
                type: 'post',
                data: JSON.stringify(that.organization),
                success: function (data) {
                    that.$set('organization', data);
                },
                error: function () {
                    alert('Update organization Error');
                }
            });
        },

        count_zero_score_kpi: function (recheck) {
            var user_id = COMMON.OrgUserId;

            var that = this;
            that.total_zero_score_kpis = [];
            var quarter_id = getUrlVars()['quarter_id'];
            var url = COMMON.LinkKPIParentAPI + '?user_id=' + user_id;
            url += (quarter_id != undefined) ? '&quarter_id=' + quarter_id : '';
            if (recheck == true) {
                url += "&recheck=true"
            }

            cloudjetRequest.ajax({
                url: url,
                type: 'post',
                success: function (results) {
//                         results = jQuery.grep(results, function(item){
//                            return (item.month_1_score ==0 || item.month_2_score ==0 || item.month_3_score==0 || item.latest_score==0)
//                         });
                    results.forEach(function (item) {
                        // var value_weight = $('.kpi-rating[data-id=' + item.id + ']').find('span.weighting_score>span').text();
                        // value_weight = parseFloat(value_weight.slice(1, -2));
                        // item.weight_percentage = value_weight;//use jquery to locate to weight percenatge in kpi-editor relative to kpi

                        // Update lai weight KPI
                        var value_weight = parseFloat(item.weight*100/that.total_weight[user_id]);
                        item.weight_percentage = value_weight;

                    })
                    that.$set('total_zero_score_kpis', results);
                    if (recheck == true) {
                        location.reload();
                    }

                },
                error: function () {
                    alert('Load Kpis Error');
                }
            });

        },

        get_children: function (kpi_id) {
            // Pace.start();
            var self = this;
            cloudjetRequest.ajax({
                type: 'get',
                url: COMMON.LinkKPIAPI + '?kpi_id=' + kpi_id,
                success: function (data) {
                    $('#childrenKPIModal').modal();
                    self.$set('current_kpi', data);
                    console.log(self.current_kpi)
                    self.$compile(self.$el)
                    //    that.$set('children_kpis', data.children);
                },
                error: function () {
                    alert('error');
                },
                complete: function (data) {
                    $('.add_kpi').show();
                }
            });

        },
        show_copy_kpi_modal: function (kpi_id) {
            //  not used any more
            that = this;
            $('#copy-kpi-modal').modal();


        },
        copy_kpi: function (kpi_id) {
            //  not used any more
            that = this;
            cloudjetRequest.ajax({
                type: 'get',
                url: COMMON.LinkKPIAPI + '?kpi_id=' + kpi_id,
                success: function (data) {
                    that.$set('current_kpi', data);
                    that.$compile(that.$el);
                    //    that.$set('children_kpis', data.children);
                },
                error: function () {
                    alert('error');
                },
                complete: function (data) {
                }
            });

        },
        change_category: function (kpi_id) {
            //     Pace.start();
            that = this;
            cloudjetRequest.ajax({
                type: 'get',
                url: COMMON.LinkKPIAPI + '?kpi_id=' + kpi_id,
                success: function (data) {
                    $('#categoryKPIModal').modal()
                    that.$set('current_kpi', data);
                    that.$compile(that.$el);
                },
                error: function () {
                    alert('error');
                },
                complete: function (data) {
                    $('.add_kpi').show();
                }
            });

        },

        change_group: function (kpi) {
            if (!kpi.enable_edit) {
                return false;
            }


            self = this;

            switch (kpi.group) {
                case "A":
                    kpi.group = "B";
                    self.kpi_list[kpi.id].group = kpi.group;
                    break;
                case "B":
                    kpi.group = "C";
                    self.kpi_list[kpi.id].group = kpi.group;
                    break;
                case "C":
                    kpi.group = "O";
                    self.kpi_list[kpi.id].group = kpi.group;
                    break;
                case "O":
                    kpi.group = "G";
                    self.kpi_list[kpi.id].group = kpi.group;
                    break;
                default:
                    kpi.group = "A";
                    self.kpi_list[kpi.id].group = kpi.group;
            }
            self.update_kpi(kpi);
        },
        update_quarter_target: function (kpi, callback = null) {
            var that = this;
            kpi.command = 'update_quarter_target';
            cloudjetRequest.ajax({
                type: "POST",
                url: COMMON.LinkKPISevices,
                data: JSON.stringify(kpi),
                success: function (data) {
                    that.kpi_list[kpi.id] = Object.assign(that.kpi_list[kpi.id], data);
                    that.get_current_employee_performance();

                    for (i = 1; i <= 4; i++) {
                        $('#qtip' + kpi.id + '_' + i).qtip({
                            content: {
                                text: $('#qtip' + kpi.id + '_' + i + ' input').val()
                            },
                            style: {
                                classes: 'qtip-green'
                            }
                        });
                    }

                    success_requestcenter(gettext("Update successful!"));
                },
                contentType: "application/json"
            });
            if (typeof callback === 'function') {
                callback();
            }
        },

        set_month_target_from_last_quarter_three_months_result: function (kpi_id, user_id, kpi_unique_key, last_quarter_id) {
            // Khang build this function
            //       Pace.start(); // Monitor ajax
            var that = this;
            var review_type = that.kpi_list[kpi_id].score_calculation_type; // Get review type
            if (review_type !== "most_recent") {
                sweetAlert(gettext("ACTION FAILED"), gettext("This feature is only use for most-recent score calculate type!"), "error");
                return false;
            }
            else {
                cloudjetRequest.ajax({
                    method: "GET",
                    url: "/api/v2/user/" + user_id + "/kpis",
                    data: {
                        unique_key: kpi_unique_key,
                        quarter_period_id: last_quarter_id
                    },
                    success: function (kpi_result_list) {
                        if (kpi_result_list.length) {
                            var kpi = kpi_result_list[0];
                            var month_1 = parseFloat(kpi['month_1']);
                            var month_2 = parseFloat(kpi['month_2']);
                            var month_3 = parseFloat(kpi['month_3']);
                            var new_target = null;
                            var kpi_object = that.kpi_list[kpi_id];// Clone to new object
                            if (isNaN(month_1) && isNaN(month_2) && isNaN(month_3)) {
                                sweetAlert(gettext("ACTION FAILED"), gettext("Score can't be updated because no score were founds!"), "error");
                                return false;
                            }
                            else {
                                var sum = ((!isNaN(month_1) ? month_1 : 0) + (!isNaN(month_2) ? month_2 : 0) + (!isNaN(month_3) ? month_3 : 0));
                                var divide = ((!isNaN(month_1) ? 1 : 0) + (!isNaN(month_2) ? 1 : 0) + (!isNaN(month_3) ? 1 : 0));
                                new_target = sum / divide;
                                kpi_object['month_1_target'] = kpi_object['month_2_target'] = kpi_object['month_3_target'] = new_target;

                                that.$set('kpi_list[' + kpi_id + ']', kpi_object);
                                that.update_month_target(that.kpi_list[kpi_id]);
                                sweetAlert(gettext("ACTION COMPLETED"), gettext("The KPI is successfully updated"), "success");
                            }
                        }
                        else {
                            sweetAlert(gettext("ACTION FAILED"), gettext("Score can't be updated because no score were founds!"), "error");
                            return false;
                        }
                    },
                    error: function (err) {
                        sweetAlert(gettext("ACTION FAILED"), gettext("System Error: ") + err, "error");

                    },
                    complete: function (data) {

                    }
                });
            }

            // Ref:https://vuejs.org/v2/api/#vm-watch
        },
        update_month_target: function (kpi, check_disabled, callback = null) {
            if (!check_disabled) {
                var that = this;
                //  $('#loading-gif' + kpi.id).toggleClass('loading-gif');
                kpi.command = 'update_month_target';
                cloudjetRequest.ajax({
                    type: "POST",
                    url: COMMON.LinkKPISevices,
                    data: JSON.stringify(kpi),
                    success: function (data) {
                        //   console.log(data);
                        that.kpi_list[kpi.id] = Object.assign(that.kpi_list[kpi.id], data);

                        that.get_current_employee_performance();

                        success_requestcenter(gettext("Update successful!"));
                    },
                    error: function () {

                    },
                    contentType: "application/json"

                });

            } else {
                error_requestcenter("Error[403] " + gettext("You don't have permisson"));
            }
            if (typeof callback === 'function') {
                callback();
            }
        },
        copy_monthly_goal: function (kpi) {
            var that = this;
            swal({
                title: gettext("Quarter target will be copied to the target of each month"),
                text: gettext("Are you sure?"),
                type: "warning",
                showCancelButton: true,
                cancelButtonText: gettext("Cancel"),
                confirmButtonColor: "#DD6B55",
                confirmButtonText: gettext("OK"),
                closeOnConfirm: true
            }, function () {
                kpi.month_1_target = kpi.target;
                kpi.month_2_target = kpi.target;
                kpi.month_3_target = kpi.target;
                that.update_month_target(kpi);
            })
        },
        findRootKPI: function(kpi_id){
            return findRootKPI(kpi_id,this.kpi_list)
        },
        triggeredReloadTargetPerformance: function(child_id){
            var self = this;
            var root_id = self.findRootKPI(child_id)
            if (parseInt(child_id) !== root_id) {
                $('#kpi_reload' + root_id).click()
            }
        },
        update_score: function (kpi, update_quarter_target, callback = null) {
            //alert(kpi.id)
            //this.calculate_total_weight();
            var that = this;
            var okay_to_edit = kpi.enable_review && (!isNaN(kpi.month_1_target)) && (!isNaN(kpi.month_2_target)) && (!isNaN(kpi.month_3_target));

            if (!okay_to_edit) {
                guide_requestcenter(gettext("Not allowed to modify KPI, please check if any wrong data in KPI"));
            } else {

                if (update_quarter_target != undefined) {
                    kpi.update_quarter_target = update_quarter_target;
                }
                clearTimeout(this.update_timeout);

                //console.log('#loading-gif' + kpi.id)
//                $('#loading-gif' + kpi.id).toggleClass('loading-gif');

                that.$set('kpi_list[' + kpi.id + '].month_1_target', kpi.month_1_target != '' ? kpi.month_1_target : kpi.get_target)
                that.$set('kpi_list[' + kpi.id + '].month_2_target', kpi.month_2_target != '' ? kpi.month_2_target : kpi.get_target)
                that.$set('kpi_list[' + kpi.id + '].month_3_target', kpi.month_3_target != '' ? kpi.month_3_target : kpi.get_target)
                if (that.kpi_list[kpi.id].score_calculation_type == 'sum') {
                    var month_1_target = kpi.month_1_target ? kpi.month_1_target : 0;
                    var month_2_target = kpi.month_2_target ? kpi.month_2_target : 0;
                    var month_3_target = kpi.month_3_target ? kpi.month_3_target : 0;
                    that.$set('kpi_list[' + kpi.id + '].target', month_1_target + month_2_target + month_3_target)
                }

                //console.log(that.kpi_list[kpi.id].month_2_target);

                this.update_timeout = setTimeout(function () {
                    cloudjetRequest.ajax({
                        type: "POST",
                        url: '/performance/kpi/update-score/',
                        data: kpi,
                        success: function (data) {
                            that.$set('kpi_list[' + kpi.id + '].month_1_score', data.kpi.month_1_score)
                            that.$set('kpi_list[' + kpi.id + '].month_2_score', data.kpi.month_2_score)
                            that.$set('kpi_list[' + kpi.id + '].month_3_score', data.kpi.month_3_score)


                            that.$set('kpi_list[' + kpi.id + '].month_1', data.kpi.month_1)
                            that.$set('kpi_list[' + kpi.id + '].month_2', data.kpi.month_2)
                            that.$set('kpi_list[' + kpi.id + '].month_3', data.kpi.month_3)
                            that.kpi_list[kpi.id].month_1_score = data.kpi.get_month_1_score;
                            that.kpi_list[kpi.id].month_2_score = data.kpi.get_month_2_score;
                            that.kpi_list[kpi.id].month_3_score = data.kpi.get_month_3_score;

                            that.$set('kpi_list[' + kpi.id + '].get_month_1_score_icon', data.kpi.get_month_1_score_icon)
                            that.$set('kpi_list[' + kpi.id + '].get_month_2_score_icon', data.kpi.get_month_2_score_icon)
                            that.$set('kpi_list[' + kpi.id + '].get_month_3_score_icon', data.kpi.get_month_3_score_icon)

                            that.kpi_list[kpi.id].get_month_1_score_icon = data.kpi.get_month_1_score_icon;
                            that.kpi_list[kpi.id].get_month_2_score_icon = data.kpi.get_month_2_score_icon;
                            that.kpi_list[kpi.id].get_month_3_score_icon = data.kpi.get_month_3_score_icon;
                            //that.$set('kpi_list[' + kpi.id + ']', data.kpi);
                            //$('.kpiprogressreview-wrapper').tooltip();
                            that.$set('kpi_list[' + kpi.id + '].latest_score', data.score)
                            that.$set('kpi_list[' + kpi.id + '].real', data.real)

                            that.kpi_list[kpi.id].latest_score = data.score; //JSON.parse(data);
                            that.kpi_list[kpi.id].real = data.real; //JSON.parse(data);
                            that.get_current_employee_performance();
                            that.triggeredReloadTargetPerformance(kpi.id)

                            success_requestcenter(gettext("Update successful!"));
                        },
                        error: function () {

                        },
                        complete: function (data) {
                        }
                    });
                }, 200);


            }
            if (typeof callback === 'function') {
                callback();
            }
            console.log(callback)

        },

        complete_review_modal: function () {
            $('#complate-review-modal').modal();
            this.count_zero_score_kpi();
        },

        edit_weight_modal: function (){
            var that = this;
            that.kpi_list_cache = [];
            that.calculate_total_weight();
            console.log(that.total_edit_weight.internal_total);
            $('#edit-all-weight-modal').modal();
        },
        cancel_edit_weight: function(){
            var that = this;
            that.kpi_list_cache.forEach(function(kpi){
                that.kpi_list[kpi.kpi_id].weight = kpi.weight;
            })
            that.calculate_total_weight();
        },
        show_kpi_msg: function (status) {
            if (status == 0) {
                swal({
                    type: 'success',
                    title: gettext("Successful"),
                    text: gettext("Change KPI's weight successful!"),
                    showConfirmButton: true,
                    timer: 2000,
                })
                $("#edit-all-weight-modal").modal('hide');
            } else {
                swal({
                    type: 'error',
                    title: gettext("Unsuccess"),
                    text: gettext("Change KPI's weight was unsuccessful!"),
                    showConfirmButton: true,
                    timer: 2000,
                })
            }
        },
        accept_edit_weight: function() {
            var that = this;
            that.kpi_list_cache.forEach(function(kpi){
                that.update_kpi(that.kpi_list[kpi.kpi_id], null, that.show_kpi_msg);
            })

        },

        show_backup_kpi: function () {
            $('#kpiscore-backup-help').modal('hide');
            $('#backup-kpi-modal').modal();
            this.get_backups_list(true);
        },
        get_backups_list: function (showModal) {
            self = this;
            if (showModal) $('#lb-load-backups-list').show();
            cloudjetRequest.ajax({
                type: 'get',
                url: '/api/v2/user/backup_kpis/' + self.user_id + '/' + self.current_quarter.id,
                success: function (data) {
                    $('#lb-load-backups-list').hide();
                    if ($.isArray(data)) {
                        self.backups_list = data;
                        data.forEach(function (_data) {
                            self.$set('employee_performance.month_' + _data.month + '_backup', true);
                            if (self.backup_month.indexOf(_data.month) == -1) {
                                self.backup_month.push(_data.month);
                            }
                        })
                    }
                }
            })
        },
        post_backup_kpis: function () {
            var self = this;
            swal({
                title: gettext("Do you want backup this KPIs?"),
                type: "warning",
                showCancelButton: true,
                cancelButtonText: gettext("Cancel"),
                confirmButtonColor: "#DD6B55",
                confirmButtonText: gettext("Agree"),
                closeOnConfirm: true
            }, function () {
                if (!self.chosen_backup_month) alert(gettext("Please choose the month to backup KPI"));
                else {
                    var btn_create_backup_kpi = $('#btn-create-backup-kpi');
                    var oldLabel = btn_create_backup_kpi.text();

                    btn_create_backup_kpi.prop('disabled', true);
                    btn_create_backup_kpi.text(gettext("Backup is in progressing") + ' ...');
                    self.hide_message('msg-id');
                    cloudjetRequest.ajax({
                        type: 'post',
                        url: '/api/v2/user/backup_kpis/' + self.user_id + '/' + self.current_quarter.id,
                        data: JSON.stringify({month: self.chosen_backup_month}),
                        success: function (data) {
                            function findBackup(id) {
                                return $.grep(self.backups_list, function (item) {
                                    return item.id === id;
                                });
                            };
                            if (data.length > 0) {
                                data.forEach(function (item) {
                                    var _backup = findBackup(item.id);
                                    console.log(_backup);
                                    if (_backup.length > 0) {
                                        self.show_message('msg-id', gettext("KPI Backup is exist!"));
                                        setTimeout(function () {
                                            self.hide_message('msg-id');
                                        }, 3000);
                                    }
                                    else {
                                        self.backups_list.push(item);
                                        self.backup_month.push(item.month);
                                        self.$set('employee_performance.month_' + item.month + '_backup', true);
                                    }
                                })
                            }
                            ;

                            btn_create_backup_kpi.prop('disabled', false);
                            btn_create_backup_kpi.text(oldLabel);
                            self.update_month_backup_display(self.chosen_backup_month);
                        },
                        fail: (function () {
                            self.show_message('msg-id', gettext("Error"));
                            btn_create_backup_kpi.prop('disabled', false);
                            btn_create_backup_kpi.text(oldLabel);
                        }),
                        error: function (jqXHR, textStatus, errorThrown) {
                            self.show_message('msg-id', gettext("Error"));
                            btn_create_backup_kpi.prop('disabled', false);
                            btn_create_backup_kpi.text(oldLabel);
                        }
                    })
                }
            });
        },
        show_message: function (idStr, content) {
            $('#' + idStr).css('display', 'block').css('text-align', 'center').css('color', 'red');
            $('#' + idStr).html(content);
        },
        hide_message: function (idStr) {
            $('#' + idStr).css('display', 'none');
            $('#' + idStr).html('');
        },
        hide_backup_kpi_modal: function () {
            $('#view-backup-kpi-modal').modal('hide');
            $('#backup-kpi-modal').modal();
        },
        view_backup_kpis: function (id) {
            var self = this;
            $('#view-backup-kpi-modal').modal();
            $('#backup-kpi-modal').modal('hide');
            // find backup by id
            self.current_backup = self.backups_list[id];
            console.log('fihihhihihc');

            if (self.current_backup && self.current_backup.hasOwnProperty('data')) {
                var kpis = self.current_backup.data;
                var total_weight = 0;
                self.current_backup.data.forEach(function(e){
                    total_weight += e.weight;
                })
                self.backup_month_name = self['month_' + self.current_backup.month + '_name']
                self.backup_kpis = kpis;
                self.backup_kpis.forEach(function(e, i){
                    self.backup_kpis[i].weight_percentage = parseFloat(e.weight/total_weight) * 100;
                })
            }
        },
        get_backup_month_score: function (index) {
            var self = this;
            var month = self.current_backup.month;
            return ((self.backup_kpis[index]['month_' + month + '_score'] > 0)?(self.backup_kpis[index]['month_' + month + '_score']).toFixed(2):0);
        },
        get_backup_month_name: function (month) {
            return self['month_' + month + '_name']
        },
        get_backup_month_target: function (index) {
            var self = this;
            var month = self.current_backup.month;
            return (self.backup_kpis[index]['month_' + month + '_target']).toFixed(2);
        },
        get_backup_month_real: function (index) {
            var self = this;
            var month = self.current_backup.month;
            return ((self.backup_kpis[index]['month_' + month] > 0)?(self.backup_kpis[index]['month_' + month]).toFixed(2):0);
        },
        update_month_backup_display: function (month) {
            var self = this;
            if (month) {
                self.$set('employee_performance.month_' + month + '_backup', true);
            }
        },
        delete_backup: function (index) {
            var self = this;
            swal({
                title: gettext('KPI Backup deleted can not be reversed'),
                text: gettext('You want to delete KPI Backup, are you sure?'),
                type: "warning",
                showCancelButton: true,
                cancelButtonText: gettext('Cancel'),
                confirmButtonColor: "#DD6B55",
                confirmButtonText: gettext('OK'),
                closeOnConfirm: false
            }, function () {
                var backup_kpi = self.backups_list[index];
                cloudjetRequest.ajax({
                    url: '/api/v2/user/backup_kpis/' + self.user_id + '/' + self.current_quarter.id,
                    type: 'delete',
                    data: JSON.stringify({month: backup_kpi.month}),
                    success: function (data, statusText, jqXHR) {
                        if (statusText === 'success') {
                            swal({
                                title: gettext('Successful'),
                                text: '<div style="padding: 5px;word-wrap: break-word;">' + gettext("KPI Backup deleted successful") + '</div>',
                                type: "success",
                                html: true,
                                confirmButtonText: gettext('OK'),
                            });
                            self.backups_list = self.backups_list.filter(function (item) {
                                return backup_kpi.month !== item.month;
                            });
                            self.backup_month.splice(self.backup_month.indexOf(backup_kpi.month), 1);
                            self.$set('employee_performance.month_' + backup_kpi.month + '_backup', false);
                            self.get_current_employee_performance();
                            self.get_backups_list(false);
                        }
                    }
                })
            });
        },
        normalize_group_weight: function (group, new_total_weight) {

            that = this;
            swal({
                title: gettext('Are you sure?'),
                text: gettext('This will set weighting score for all KPIs in group') + ' ' + group,
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                cancelButtonText: gettext('No'),
                confirmButtonText: gettext('Agree'),
                closeOnConfirm: false
            }, function () {
                var avg_weighting_score = parseFloat(that.new_group_total[group]) / that.total_kpis_bygroup[group];

                Object.keys(that.kpi_list).forEach(function (kpi_id) {
                    if (that.kpi_list[kpi_id].user == that.user_id
                        && that.kpi_list[kpi_id].group == group) {
                        var kpi = that.kpi_list[kpi_id];

                        kpi.weight = avg_weighting_score;
                        that.update_kpi(kpi);
                    }
                });

                swal(gettext('Successful') + "!", "", "success");
            });
        },

        sort_kpi_group: function () {
            function getSorted(selector, attrName) {
                return $($(selector).toArray().sort(function (a, b) {
                    var aVal = a.getAttribute(attrName),
                        bVal = b.getAttribute(attrName);
                    if (aVal != null) {
                        return aVal.localeCompare(bVal);
                    }
                    else {
                        return 1;
                    }

                }));
            }

            $('.kpi-row').css('margin-left', '0');
            //var $children = $(".kpi-parent-wrapper");
            //$children.detach();
            // $children = $children.sort(sort_kpi);
            var $children = getSorted('.kpi-parent-wrapper', 'data-kpi-group');
            $children.appendTo("#kpi-group-all");

        },

        compress_view: function () {

            $('#btn-back').show();
            $('#header').remove();
            $('.not-show-when-group').remove();

            $('#report-to-user-kpis').remove();
            $('#column-left').remove();
            $('.kpi-section-heading').remove();
            $('.kpi-group-heading').remove();

        },

        sort_by_group: function (obj) {
            this.compress_view();

            $('.kpi-refer-group').click();
            $('.kpi-refer-group').remove();
            $('.group-modifier').css('display', 'inline-block');
            $('#btn-add').remove();
            $('#btn-edit-weight').remove();

            this.sort_kpi_group();
            $(obj.currentTarget).removeClass("btn-cus-white").addClass("btn-cus-add");
            //$('.kpi-parent-wrapper').appendTo('#kpi-group-all');

        },

        get_order_quarter: function () {
            cloudjetRequest.ajax({
                type: 'get',
                url: '/api/quarter/?all_quarters=true',
                success: function (data) {
                    that.quarter_list = data;
                }
            })
        },
        we_complete_review_confirm: function () {
            this.complete_review_confirm();
        },

        setCookie: function (cname, cvalue) {
            var now = new Date(); // now
            // cvalue is second
            // getTime in milisecond
            var expiredDate = now.getTime() + cvalue * 1000;
            var d = new Date();
            d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString(); // expires for cookie, we dont care it
            document.cookie = cname + "=" + expiredDate + ";" + expires + ";path=/";
        },

        getCookie: function (name) {
            var value = "; " + document.cookie;
            var parts = value.split("; " + name + "=");
            if (parts.length === 2) return parts.pop().split(";").shift();
        },

        get_manager_kpis: function (user_id, bsc_category) {
            var that = this;
            cloudjetRequest.ajax({
                type: 'get',
                url: '/performance/kpi/align-up/?user_id=' + user_id + "&bsc_category=" + bsc_category,
                success: function (res) {
                    that.manager_kpis = res;
                    console.log(res);
                },
                error: function (res) {
                }
            });
        },

        init_data_align_up_kpi: function (user_id, kpi_id, bsc_category) {
            var that = this;
            $(".btn-align-up-kpi").button("reset");
            that.get_manager_kpis(user_id, bsc_category);
            that.selected_kpi = that.kpi_list[kpi_id];
            $("#id-modal-align-kpi").modal('show');
        },

        unlink_align_up_kpi: function (user_id, kpi_id, bsc_category, event) {
            var _this = this;
            if (confirm(gettext('Are you sure you want to unlink this KPI') + "?")) {
                var data = {
                    user_id: user_id,
                    aligned_kpi_id: _this.kpi_list[kpi_id].id
                }
                cloudjetRequest.ajax({
                    type: 'post',
                    url: '/performance/kpi/align-up/',
                    data: data,
                    success: function (res) {
                        var elm = event.target;
                        var $ancestors = $(elm).parentsUntil('.kpi-group-category', '.kpi-parent-wrapper').last();
                        if ($ancestors.length > 0) {
                            $($ancestors.get(0)).reload_kpi_anchor();
                        } else {
                            $(elm).reload_kpi_anchor();
                        }
                        sweetAlert(gettext("ACTION COMPLETED"), gettext("The KPI is successfully unlinked"), "success");
                    },
                    error: function (res) {

                    }
                });
            }
        },

        save_align_up_kpi: function () {
            var _this = this;
            if (!_this.user_id || _this.selected_kpi.id || _this.selected_manager_kpi) {

            }

            $(".btn-align-up-kpi").button("loading");
            var data = {
                user_id: _this.user_id,
                kpi_id: _this.selected_manager_kpi,
                aligned_kpi_id: _this.selected_kpi.id
            }

            cloudjetRequest.ajax({
                type: 'post',
                url: '/performance/kpi/align-up/',
                data: data,
                success: function (res) {
                    $("#id-modal-align-kpi").modal('hide');
                    $(".btn-align-up-kpi").button("reset");
                    $("#kpi_reload" + _this.selected_kpi.id).click();
                },
                error: function (res) {
                    $(".btn-align-up-kpi").button("reset");
                }
            });
        },

        complete_review_confirm: function () {
            that = this;
            $('#complate-review-modal').modal('hide');
            var temp = $('#btn-complete-review').html();
            $('#btn-complete-review').html(gettext('Downloading! Please wait ... '));
            cloudjetRequest.ajax({
                type: 'post',
                url: COMMON.LinkRDisAPI + "?key=confirm-kpi-quarter" + that.quarter_by_id.id,
                data: {value: new Date()},
                success: function (res) {
                    that.$set('complete_review', res['value']);
                    console.log(res['value']);
                },
                error: function (res) {
                }
            });
            cloudjetRequest.ajax({
                type: 'post',
                url: COMMON.LinkNotifyAPI,
                data: {
                    user_id: COMMON.OrgUserId,
                    notification_type: 'complete_review'
                },
                success: function (res) {
                    that.$set('complete_review', res['value']);
                },
                error: function (res) {
                }
            });

            // $('<form></form>').attr('action', "{% url 'SimpleExport' org_user.id %}").appendTo('body').submit().remove();

            window.open("/performance/report/#/?user_id=" + COMMON.OrgUserId + "&quarter_id=" + that.quarter_by_id.id);


            // $('#download-fixed').hide();
            $("#complate-review-modal").on("hidden.bs.modal", function () {

                html2canvas(document.body, {
                    onrendered: function (canvas) {
                        $('#btn-complete-review').html(temp);

                        var a = document.createElement('a');
                        // toDataURL defaults to png, so we need to request a jpeg, then convert for file download.
                        a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
                        // a.download = (new Date()) + '-kpi.jpg';
                        a.download = 'KPIs ' + (new Date()) + '.jpg';
                        a.click();
                    }

                });
            });
        },

        get_reason_delay_kpi: function () {
            that = this;
            return that.reason_kpi;
        },
        set_elm_kpi: function (elm) {
            that = this;
            that.elm_kpi = elm;
        },
        get_elm_kpi: function (elm) {
            that = this;
            return that.elm_kpi;
        },
        check_reason: function (kpi_id) {
            that = this;
            if (!that.reason_kpi.replace(/\s/g, '').length) {
                that.check_submit_reason = true;
                return;
            }
            if (that.reason_kpi.length > 500) {
                alert(gettext('Reason delay KPI does not exceed 500 characters'));
                that.reason_kpi = that.reason_kpi.substring(0, 500);
                that.check_submit_reason = false;
                return;
            }

            if (kpi_id != undefined)
                that.check_submit_reason = !that.check_is_valid(kpi_id);
            else
                that.check_submit_reason = false;
            return;
        },
        get_total_weight: function (refer_to) {
            var sum = 0;
            that = this;
            if (refer_to) {
                Object.keys(that.kpi_list).forEach(function (key) {
                    if (parseInt(that.kpi_list[key].refer_to) === refer_to) {
                        sum += parseFloat(that.kpi_list[key].weight) || 0;
                    }
                });
                console.log(sum);
                return sum;
            }
            return 1;
        },
        isNumberKey: function (evt, elm) {
            var charCode = (evt.which) ? evt.which : event.keyCode
            if (charCode >= 96 && charCode <= 105) {
                // Numpad keys
                charCode -= 48;
            }

            if (!this.isNumber(String.fromCharCode(charCode))) {
                $(elm).val('');
            }
            /*
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                    //return false;
                    $(elm).val('');
                }*/
            //return true;
        },
        isNumber: function (o) {
            // Validate Numeric inputs
            if (!(o == '' || !isNaN(o - 0)) || o < 0) {
                this.check_submit_reason = true;
                return false;
            }
            this.check_submit_reason = false;
            this.check_reason();
            return true;
        },

        checkChild: function (kpi_id) {
            var that = this;
            that.is_child = false;

            if (that.kpi_list[kpi_id].refer_to_id == 'None') {
                that.is_child = false;
                return;
            }

            Object.keys(that.kpi_list).forEach(function (key) {
                // console.log(that.kpi_list[key].id);
                // console.log(that.kpi_list[kpi_id].refer_to);
                if (that.kpi_list[key].id == that.kpi_list[kpi_id].refer_to) {

                    that.is_child = true;
                    return;
                }
            });
        },

        /***
         * To save temp value of a kpi to temp_value object follow this structure:
         * 'temp_value': {
             *      'kpi_id1: {
             *          'key1': {
             *              'prop1': ...,
             *              'prop2: ...,
             *              ....
             *           },
             *          'key2': {
             *              'prop1': ...,
             *              'prop2: ...,
             *              ....
             *          },
             *          ....
             *      },
             *      'kpi_id2': ....
             * }
         * kpi: kpi in kpi_list
         * key: a unique key in temp_value. Example: to save all value of quarter target include:
         'quarter_one_target', 'quarter_two_target', 'quarter_three_target', 'quarter_four_target', you can use:
         'quarter_target': {
                        'quarter_one_target': ....
                        'quarter_two_target': ....
                        'quarter_three_target': ....
                        'quarter_four_target': ....
                    }.
         When you add a key, make sure that your key is different from all other keys.
         * prop: property of object specific by key. Example for key 'quarter_target' prop will be 'quarter_one_target', ....
         *
         * ***/
        tempsave_value: function (kpi, prop, key) {
            var that = this;
            kpi_id = kpi['id'];
            if (!(that.temp_value.hasOwnProperty(kpi_id))) {
                that.temp_value[kpi_id] = {};
            }
            if (!(that.temp_value[kpi_id].hasOwnProperty(key))) {
                that.temp_value[kpi_id][key] = {};
            }
            if (that.temp_value[kpi_id][key][prop]) {
                return;
            }
            else {
                if (typeof kpi[prop] == 'undefined' || kpi[prop] == "")
                    that.temp_value[kpi_id][key][prop] = null;
                else {
                    that.temp_value[kpi_id][key][prop] = kpi[prop];
                }
            }
        },
        /***
         * To delete value of the object specific by key when you perform cancel of save action
         *
         ***/
        delete_temp: function (kpi, key) {
            var that = this;
            kpi_id = kpi['id'];
            delete that.temp_value[kpi_id][key];
        },
        /***
         * To revert value from temp_value to current kpi values
         *
         ***/
        cancel_action: function (kpi, key, controller_prefix) {
            var that = this;
            kpi_id = kpi['id'];
            for (prop in that.temp_value[kpi_id][key]) {
                kpi[prop] = that.temp_value[kpi_id][key][prop];
            }
            that.delete_temp(kpi, key);
            kpi_ready(kpi['id'], controller_prefix, false);
        },
        /***
         * To call functions to excute the save action
         * kpi: kpi in kpi_list
         * key: a unique key to specific which function will be call arcording to value of this key
         * controller_prefix: controller_prefix to use in kpi_ready function
         ***/
        save_action: function (kpi, key, controller_prefix) {
            var that = this;
            switch (key) {
                case 'quarter_target':
                    that.update_quarter_target(kpi);
                    break;
                case 'month_score':
                    that.update_score(kpi);
                    break;
                case 'month_target':
                    that.update_month_target(kpi, (!kpi.enable_edit && !that.organization.allow_edit_monthly_target) || kpi.score_calculation_type == 'average');
                    break;
                case 'score_calculation':
                    that.update_quarter_target(kpi);
                    break;
                case 'operator':
                    that.update_score(kpi);
                    break;
                default:
                    return;
            }
            that.delete_temp(kpi, key);
            kpi_ready(kpi['id'], controller_prefix, false);
        },
        add_selected_kpilib: function (k) {
            add_kpi(null, null, k.category, null, k);
        },
        set_selected_kpilib: function (k) {
            this.selected_kpilib = k;
        },
        average_3_month: function (employee_performance) {
            var count = 0;
            var total = 0;
            ['month_1_score', 'month_2_score', 'month_3_score'].forEach(function (key) {
                // if (key != 'current' && employee_performance[key] > 0) { # remove key since it was not neccessary
                if (employee_performance[key] > 0) {
                    total += employee_performance[key];
                    count += 1;
                }
            })

            if (count > 0) {
                return total / count;
            }
            return total;
        },
        get_prefix_category: function(cat) {
            if (cat == "financial")
                return "F"
            else if (cat == "customer")
                return "C"
            else if(cat == "internal")
                return "P"
            else if(cat == "learninggrowth")
                return "L"
            else
                return "O"
        },
        loadKPIs: function() {

            var that = this;
            var quarter_id = getUrlVars()['quarter_id'];

            cloudjetRequest.ajax({
                url: '/api/v2/user/'+this.user_id+'/kpis/',
                type: 'GET',
                data: {quarter_id: quarter_id},
                success: function (data) {
                    console.log("=======>>>>--------------")
                    console.log(data)
                    var dictResult = {};
                    data.forEach(function(a){
                        dictResult[a.id] = a;
                    })
                    that.kpi_list = dictResult;
                    // that.parentKPIs = JSON.parse(JSON.stringify(dictResult));
                    console.log(that.kpi_list);
                },
                error: function (a, b, c) {

                }
            });
        },
        getUserById: function (kpiId) {
            if(kpiId == null || this.kpi_list == null || this.kpi_list.length == 0) return null;
            for(var i = 0; i < this.kpi_list.length; ++i){
                if(this.kpi_list[i].id == kpiId)
                    return this.kpi_list[i].user
            }
            return null;
        },

        update_score_and_ready: function(kpi, controller_prefix, ready){
            this.update_score(kpi);
            this.kpi_ready(kpi.id, controller_prefix, ready);
        },

        update_month_target_and_ready: function (kpi, check_disabled, controller_prefix, ready) {
            this.update_month_target(kpi, check_disabled);
            this.kpi_ready(kpi.id, controller_prefix, ready);
        },
        update_quarter_target_and_ready: function (kpi, controller_prefix, ready) {
            this.update_quarter_target(kpi);
            this.kpi_ready(kpi.id, controller_prefix, ready);
        },
        init_data_for_kpilib: function(){
            if(self.organization.enable_kpi_lib == true) {
                kpi_lib.options = [];
                this.DEPARTMENTS.forEach(function(item){
                    var category = {};
                    category.label=`${item.name} (${item.count})`;
                    category.value=item.id;
                    category.children=[];
                    if(item.childs.length){
                        item.childs.forEach(function(child){
                            var sub_category = {};
                            sub_category.label = `${child.name} (${child.count})`;
                            sub_category.value = child.id;
                            category.children.push(sub_category);
                        })
                    }
                    kpi_lib.options.push(category)
                });
                //kpi_lib.options = this.options_category;
                kpi_lib.parent_cate = this.parent_category;
                kpi_lib.child_cate = this.child_category;
                kpi_lib.BSC_CATEGORY = this.BSC_CATEGORY;
                kpi_lib.EXTRA_FIELDS_KPI = this.EXTRA_FIELDS;
                kpi_lib.init_kpi_lib();
            }
        },
        get_data_kpilib: function(page=1){
            //get all kpi in kpilib when query_kpilib: ' ',
            var self = this;
            var url = '/api/v2/kpilib/';
            if(page && page != 1 && self.next_url_kpi_lib){
                url = updateQueryStringParameter(self.next_url_kpi_lib,'page', page);
            }
            self.searched_kpis = [];
            cloudjetRequest.ajax({
                method: "GET",
                url: url,
                success: function (data) {
                    self.searched_kpis = data.results;
                    self.next_url_kpi_lib = data.next;
                    if(page==1)kpi_lib.count_search = data.count;
                    if(self.organization.enable_kpi_lib == true)
                        kpi_lib.isLoading = false;
                    kpi_lib.total_page = data.count;
                }
            });
            if(page==1){
                this.init_data_for_kpilib();
            }
        },

    },

    events: {
        'update_lock_exscore_review': function (option) {
            var that = this
            console.log('triggered update_lock_exscore_review')
            if (option == 'allow_all') {
                $('select#exscore-select-control').prop('disabled', false)
                that.$set('exscore_score.current', '---')
            } else {
                that.$set('exscore_score.current', option);
                $('#month-' + option).show();

                $('select#exscore-select-control').prop('disabled', true)
            }
        },
        'update_exscore': function (month, data) {
            console.log('triggered update_exscore')
            var that = this
            var score = data.score
            console.log(data)
            if (data.zero || (score + that.employee_performance['month_' + month + '_score'] < 0)) {
                score = -that.employee_performance['month_' + month + '_score']
            }
            that.$set('exscore_score[' + month + '].score', score)
        },
        'fetch_user_exscore': function () {
            console.log('triggered fetch_user_exscore')
            this.fetch_exscore();
        }
    },

});

v.get_current_quarter();
v.get_quarter_by_id();

v.get_current_employee_performance();

v.loadKPIs();

/**
 * Module for displaying "Waiting for..." dialog using Bootstrap
 *
 * @author Eugene Maslovich <ehpc@em42.ru>
 */

var waitingDialog = waitingDialog || (function ($) {
    'use strict';

    // Creating modal dialog's DOM
    var $dialog = $(
        '<div class="modal fade" data-backdrop="static" data-keyboard="false" tabindex="-1" role="dialog" aria-hidden="true" style="padding-top:15%; overflow-y:visible;">' +
        '<div class="modal-dialog modal-m">' +
        '<div class="modal-content">' +
        '<div class="modal-header"><h3 style="margin:0;"></h3></div>' +
        '<div class="modal-body">' +
        '<div class="progress progress-striped active" style="margin-bottom:0;"><div class="progress-bar" style="width: 100%"></div></div>' +
        '</div>' +
        '</div></div></div>');

    return {
        /**
         * Opens our dialog
         * @param message Custom message
         * @param options Custom options:
         *                  options.dialogSize - bootstrap postfix for dialog size, e.g. "sm", "m";
         *                  options.progressType - bootstrap postfix for progress bar type, e.g. "success", "warning".
         */
        show: function (message, options) {
            // Assigning defaults
            if (typeof options === 'undefined') {
                options = {};
            }
            if (typeof message === 'undefined') {
                message = 'Loading';
            }
            var settings = $.extend({
                dialogSize: 'm',
                progressType: '',
                onHide: null // This callback runs after the dialog was hidden
            }, options);

            // Configuring dialog
            $dialog.find('.modal-dialog').attr('class', 'modal-dialog').addClass('modal-' + settings.dialogSize);
            $dialog.find('.progress-bar').attr('class', 'progress-bar');
            if (settings.progressType) {
                $dialog.find('.progress-bar').addClass('progress-bar-' + settings.progressType);
            }
            $dialog.find('h3').text(message);
            // Adding callbacks
            if (typeof settings.onHide === 'function') {
                $dialog.off('hidden.bs.modal').on('hidden.bs.modal', function (e) {
                    settings.onHide.call($dialog);
                });
            }
            // Opening dialog
            $dialog.modal();
        },
        /**
         * Closes dialo
         */
        hide: function () {
            $dialog.modal('hide');
        }
    };

})(jQuery);

function collapse_kpi_group(kpi_id, refer_to_id, get_kpi_refer_group, is_search_page) {

    if ($('#kpi-wrapper-' + refer_to_id).length == 0 && is_search_page != 'True') {

        if (v.toggle_states[kpi_id] == undefined) {
            $('.kpi-child-of-' + get_kpi_refer_group).hide();
        }
        $('.kpi-refer-' + get_kpi_refer_group).hide();
        $('.kpi-refer-' + get_kpi_refer_group).first().show();
    }
}

function format(number) {

    var decimalSeparator = ".";
    var thousandSeparator = ",";

    // make sure we have a string
    var result = String(number);

    // split the number in the integer and decimals, if any
    var parts = result.split(decimalSeparator);

    // reverse the string (1719 becomes 9171)
    result = parts[0].split("").reverse().join("");

    // add thousand separator each 3 characters, except at the end of the string
    result = result.replace(/(\d{3}(?!$))/g, "$1" + thousandSeparator);

    // reverse back the integer and replace the original integer
    parts[0] = result.split("").reverse().join("");

    // recombine integer with decimals
    return parts.join(decimalSeparator);

}

function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (uri.match(re)) {
        return uri.replace(re, '$1' + key + "=" + value + '$2');
    }
    else {
        return uri + separator + key + "=" + value;
    }
}

$(function () {
    $('#preview-attach-modal').on('hide.bs.modal', function () {
        if (v.$data.preview_attach_modal_type == 'action_plan'){
            $('#kpi_action_plan-modal').modal('show');
        }
        else if (v.$data.preview_attach_modal_type == 'evidence') {
            $('#evidence-modal').modal('show');
        }
        else {
            //do nothing
        }


    })
});

