function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
function slugify(text) {
    //https://gist.github.com/mathewbyrne/1280286#gistcomment-2614193

    text = text.toString().toLowerCase().trim();

    const sets = [
        {to: 'a', from: '[ÀÁÂÃÄÅÆĀĂĄẠẢẤẦẨẪẬẮẰẲẴẶ]'},
        {to: 'c', from: '[ÇĆĈČ]'},
        {to: 'd', from: '[ÐĎĐÞ]'},
        {to: 'e', from: '[ÈÉÊËĒĔĖĘĚẸẺẼẾỀỂỄỆ]'},
        {to: 'g', from: '[ĜĞĢǴ]'},
        {to: 'h', from: '[ĤḦ]'},
        {to: 'i', from: '[ÌÍÎÏĨĪĮİỈỊ]'},
        {to: 'j', from: '[Ĵ]'},
        {to: 'ij', from: '[Ĳ]'},
        {to: 'k', from: '[Ķ]'},
        {to: 'l', from: '[ĹĻĽŁ]'},
        {to: 'm', from: '[Ḿ]'},
        {to: 'n', from: '[ÑŃŅŇ]'},
        {to: 'o', from: '[ÒÓÔÕÖØŌŎŐỌỎỐỒỔỖỘỚỜỞỠỢǪǬƠ]'},
        {to: 'oe', from: '[Œ]'},
        {to: 'p', from: '[ṕ]'},
        {to: 'r', from: '[ŔŖŘ]'},
        {to: 's', from: '[ßŚŜŞŠ]'},
        {to: 't', from: '[ŢŤ]'},
        {to: 'u', from: '[ÙÚÛÜŨŪŬŮŰŲỤỦỨỪỬỮỰƯ]'},
        {to: 'w', from: '[ẂŴẀẄ]'},
        {to: 'x', from: '[ẍ]'},
        {to: 'y', from: '[ÝŶŸỲỴỶỸ]'},
        {to: 'z', from: '[ŹŻŽ]'},
        {to: '-', from: '[·/_,:;\']'}
    ];

    sets.forEach(function(set){
        text = text.replace(new RegExp(set.from,'gi'), set.to)
    });

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/&/g, '-and-')         // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\--+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');             // Trim - from end of text
}

function cloneObject(object) {
    return JSON.parse(JSON.stringify(object))
}

function extractFileName(fileURL) {
    return fileURL.substring(fileURL.lastIndexOf('/')+1);
}
function formatDateToString(date){
    // 01, 02, 03, ... 29, 30, 31
    var dd = (date.getDate() < 10 ? '0' : '') + date.getDate();
    // 01, 02, 03, ... 10, 11, 12
    var MM = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
    // 1970, 1971, ... 2015, 2016, ...
    var yyyy = date.getFullYear();

    // create the format you want
    return (dd + "/" + MM + "/" + yyyy);
}
function formatDateToTimeString(date){
    // 01, 02, 03, ... 29, 30, 31
    var hh = date.getHours()
    // 01, 02, 03, ... 10, 11, 12
    var mm = ((date.getMinutes() + 1) < 10 ? '0' : '') + (date.getMinutes());
    // 1970, 1971, ... 2015, 2016, ...
    var ss =((date.getSeconds() + 1) < 10 ? '0' : '') + (date.getSeconds());
    // create the format you want
    return (hh + ":" + mm + ":" + ss);
}

function getDateStandard(date){
    // 01, 02, 03, ... 29, 30, 31 aaaa
    // Hello
    var dd = (date.getDate() < 10 ? '0' : '') + date.getDate();
    // 01, 02, 03, ... 10, 11, 12completed_date
    var MM = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);
    // 1970, 1971, ... 2015, 2016, ...
    var yyyy = date.getFullYear();

    // create the format you want
    return (yyyy + "-" + MM + "-" + dd);
}


/* todo app's permission */
function isManagerOrAdmin(userActor, userActorSubordinateList, userTargetID){
    // case 1: userActor is admin, then return true
    if (userActor.is_admin === true || userActor.is_superuser === true)
        return true;

    // case 2: user target included in userActor subordinates' list
    var matchedList = userActorSubordinateList.slice().filter(function(elm){
        // userActor is not targetUser
        // userActor is manager of targetUser
        return (parseInt(elm.user) === parseInt(userTargetID) && parseInt(userActor.user) !== parseInt(userTargetID))
    })
    if (matchedList.length > 0) return true

    // default: return false
    return false
}
function isManager(userActor, userActorSubordinateList, userTargetID){

    // case 2: user target included in userActor subordinates' list
    var matchedList = userActorSubordinateList.slice().filter(function(elm){
        // userActor is not targetUser
        // userActor is manager of targetUser
        return (parseInt(elm.user) === parseInt(userTargetID) && parseInt(userActor.user) !== parseInt(userTargetID))
    })
    if (matchedList.length > 0) return true

    // default: return false
    return false
}

function isAssigneeHavePermissionEditOrCommentOrViewOnly(userActor,taskObject){
    // check if userActor is creator or not, and check first
    if (userActor.user === taskObject.created_by_user.id){
        return 'edit'
    }else{
        // in case userActor is not creator, check 2 below conditions

        // userActor is not assignee, return 'view-only'
        if (userActor.user !== taskObject.assigned_to){
            return 'view-only'
        }else{
            // in case userActor is the assignee, return the permission declared in task
            return taskObject.permission
        }

    }



}

function extractPermission(userActor,userActorSubordinates,taskObjectData){
    if (isManager(userActor,userActorSubordinates,taskObjectData.assigned_to) === true){
        // neu la manager hoac actor thi co quyen edit
        return 'edit'
    } else{
        // neu khong phai la manager
        return isAssigneeHavePermissionEditOrCommentOrViewOnly(userActor,taskObjectData)
    }
}

/* istanbul ignore next */
function initModalHidden(modalSelector,callback){ // required jquery
    $(modalSelector).on('hidden.bs.modal',function(event){
        console.log('dismiss modal')
        event.stopPropagation()
        if($('body').find('.modal.in').length > 0){
            $('body').addClass('modal-open')
        }
        if (typeof(callback) === 'function'){
            callback()
        }
    })

}

/* istanbul ignore next */
// If we're running under Node,
if (typeof exports !== 'undefined') {
  exports.extractFileName = extractFileName;
  exports.formatDateToTimeString = formatDateToTimeString;
  exports.extractPermission = extractPermission;
  exports.isManagerOrAdmin = isManagerOrAdmin;
  exports.formatDateToString = formatDateToString;
  exports.getDateStandard = getDateStandard;
  exports.cloneObject = cloneObject;
  exports.slugify = slugify;
  exports.makeid = makeid;
  exports.initModalHidden = initModalHidden;
}
