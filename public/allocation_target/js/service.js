function calculateYearTotal(all_quarter){
    // param la mảng chứa input 4 quý
    // return object có chứa tổng 4 quý, trung bình 4 quý, quý gần nhất trong 4 quý
    var count = 0
    var total_quarter = {
        sum: null,
        average: null,
        most_recent_quarter: null
    }
    for(var i = 1; i < 5; i ++){
        if (all_quarter[i] != null) {
            count = count + 1
            total_quarter.sum = total_quarter.sum + all_quarter[i]
            total_quarter.average = total_quarter.sum / count
            total_quarter.most_recent_quarter = all_quarter[i]
        } else {
        }
    }
    return total_quarter
}
function calculationQuarterTotal(data_quarter_month) {
    //param là mảng chứa input trong 1 quý
    // return 1 object tổng 3 tháng có giá trị , trung bình 3 tháng có giá trị trong 1 quý, tháng gần nhất có giá trị
    var count = 0
    var total_month = {
        sum: null,
        average: null,
        most_recent_quarter: null
    }
    for(var index in data_quarter_month) {
        console.log(data_quarter_month[index])
        if (data_quarter_month[index] != null) {
            count = count + 1
            total_month.sum = total_month.sum + data_quarter_month[index]
            total_month.average = total_month.sum / count
            total_month.most_recent_quarter = data_quarter_month[index]
        } else {
        }
    };
    return total_month
}
function pemission_edit_kpi(logic_object) {
    // param is array logic
    //[is_user_system,
    // kpi.enable_edit,
    // organization.allow_edit_monthly_target,
    // organization.enable_to_edit]
    if (logic_object.is_user_system) return true;
    return (logic_object.enable_edit && logic_object.allow_edit_monthly_target && logic_object.enable_to_edit);
}

/* istanbul ignore next */
if (typeof exports !== undefined){
    exports.calculateYearTotal = calculateYearTotal
    exports.calculationQuarterTotal = calculationQuarterTotal
    exports.pemission_edit_kpi = pemission_edit_kpi
}