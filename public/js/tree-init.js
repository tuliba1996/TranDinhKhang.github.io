var st = null;
var node_id = null;
var language = 'VN';
var node_old_active = true;
function valid_input() {
	var message = [];
	var elms = [];
	if($("#id-employee-name-edit").val().trim().length == 0) {
		message.push(gettext("Full name field cannot be empty or name's format is not correct"));
		elms.push("#id-employee-name-edit");
    }
	
    if ($('#id-email-employee-edit').val() == ''){
    	message.push(gettext('Email field is required.'));
    	elms.push('#id-email-employee-edit');
    }
    
    if ($('#id-position-edit').val() == ''){
    	message.push(gettext('Position field is required.'));
    	elms.push('#id-position-edit');
    }
    
    if (message.length > 0) {
    	alert(message.join("\n"));
    	$(elms[0]).focus();
    	return false;
    }
    
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    if (!pattern.test($('#id-email-employee-edit').val())) {
        alert(gettext('Enter a valid E-mail address.'));
        $('#id-email-employee-edit').focus();
        return false;
    }
    
    if(!isFinite($("#id-employee-phone-edit").val()) && $("#id-employee-phone-edit").val().length>0){
        $("#id-employee-phone-edit").focus();
        alert(gettext("Phone's format is not correct"));
        return false;
    }

    if(peopleApp.emp_status == 0 && $("#id-employee-reason").val().length == 0
        && node_old_active == '1'){

        $("#id-employee-reason").focus();
        alert(gettext("Please input reason delay"));
        return false;
    }
    return true;
}

function load_data_node(node) {
    if($("#send-password").text()=="Send new password"){
        language = "EN";
    }
    $('#id-employee-name').html(node.data.name);
    $('#id-email-employee').html(node.data.email);
    $("#id-start-date").html(node.data.start_date);
    $("#id-role-start").html(node.data.role_start);
    $("#id-position").html(node.data.position);
    $("#id-department").html(node.data.department);
    $('#id-avatar').attr('src', node.data.avatar);
    $("#id-employee").html(node.data.employee_code);
    // $("#id-role-type-name").html(node.data.job_title_name);
    $("#id-phone").html(node.data.phone);
    $("#id-skype").html(node.data.skype);
    $("#id-unit_code").html(node.data.unit_code);
    $('#id-employee-name-edit').val(node.data.name);
    $('#id-email-employee-edit').val(node.data.email);
    // $("#id-role-category").val(node.data.job_category_id);
    // $("#id-role-type").val(node.data.job_title_id);
    $("#id-employee-reason").val(node.data.reason);
    if (node.data.active) {
        $("#id-active").prop("checked", true);
    } else {
        $("#id-inactive").prop("checked", true)
    }

    if (node.data.subscribe_email_kpi === 'true') {
        $('#subscribe_email_kpi').prop("checked", true);
    }else{
        $('#subscribe_email_kpi').prop("checked", false);
    }

    $(".role-access .checkbox input").removeAttr('checked');
    $("#email-reset").html(node.data.email);
    $("#id-user-id").val(node.data.user_id);
    $("#id-username").val(node.data.username);
    $("#id-email").val(node.data.email);
    
    // var short_name = node.data.job_title_name.substring(0, 18);
    // if (node.data.job_title_name.length > short_name.length) {
    //     $("#id-role-name").html(short_name + "...");
    // } else {
    //     $("#id-role-name").html(node.data.job_title_name);
    // }
    $("#id-role-name").attr('title', node.data.job_title_name);
    $("#id-start-date-picker").val(node.data.start_date);
    $("#id-role-date-picker").val(node.data.role_start);
    $("#id-position-edit").val(node.data.position);
    $("#id-avatar-edit").attr('src', node.data.avatar);
    $("#id-employee-edit").val(node.data.employee_code);
    $("#id-employee-phone-edit").val(node.data.phone);
    $("#id-employee-skype-edit").val(node.data.skype);
    if (node.data.unit_code == '') {
        $("#listuc").val('');
    } else {
        $("#listuc").val(node.data.unit_code);
    }
    // alert(node.data.type)
    if(!node.data.type || node.data.type!='only'){
        get_managers(node);
    }

    $('#id-edit-save').enable(true);
    $("#add-sub-person").enable(true);
}

function clear_form() {
    $('#id-employee-name-edit').val('');
    $('#id-email-employee-edit').val('');
    $("#id-start-date-picker").val('');
    $("#id-role-date-picker").val('');
    $("#id-position-edit").val('');
    $("#id-department-edit").val('');
    $("#id-avatar-edit").attr('src', 'http://88.cjs.vn/img/people/person.png');
    $("#id-employee-edit").val('');
    $("#id-role-name").html("");
    $("#id-role-category").html("");
    $("#id-role-type").val("");
    $("#id-employee-phone-edit").val("");
    $("#id-employee-skype-edit").val("");
    $("#listuc").val("");
}

function load_data_update(node){
    $('#id-employee-name-edit').val(node.data.name);
    $('#id-email-employee-edit').val(node.data.email);
    $("#id-role-category").val(node.data.job_category_id);
    $("#id-role-type").val(node.data.job_title_id);
    $("#id-start-date-picker").val(node.data.start_date);
    $("#id-role-date-picker").val(node.data.role_start);
    $("#id-position-edit").val(node.data.position);
    $("#id-department-edit").val(node.data.department);
    $("#id-avatar-edit").attr('src', node.data.avatar);
    $("#id-employee-edit").val(node.data.employee_code);
    $("#id-employee-phone-edit").val(node.data.phone);
    $("#id-employee-skype-edit").val(node.data.skype);
    if (node.data.active) {
    	$("#emp_active_1").click();
    } else {
    	$("#emp_active_0").click();
    }
    if (node.data.unit_code == '') {
        $("#listuc").val('');
    } else {
        $("#listuc").val(node.data.unit_code);
    }
}

function update_data_node(node) {
    node.data.name = $("#id-employee-name-edit").val().trim().replace(/[!&\/\\#,+()$~%.'@":*?<>{}]/g,'');
    node.data.email = $('#id-email-employee-edit').val();
    node.data.start_date = $("#id-start-date-picker").val();
    node.data.role_start = $("#id-role-date-picker").val();
    node.data.position = $("#id-position-edit").val();
    node.data.department = $("#id-department-edit").val();
    node.data.employee_code = $("#id-employee-edit").val();
    // node.data.job_title_name = $("#id-role-name").attr('title');
    // node.data.job_title_id = $("#id-role-type").val();
    // node.data.job_category_id = $("#id-role-category").val();
    node.data.phone = $("#id-employee-phone-edit").val();
    node.data.skype = $("#id-employee-skype-edit").val();
    node.data.unit_code = peopleApp.unitcode;
}

function update_info(node) {
    cloudjetRequest.ajax({
        type: 'POST',
        data: JSON.stringify({
            user_id: node.data.user_id,
            id: node.id,
            display_name: $("#id-employee-name-edit").val().trim().replace(/[!&\/\\#,+()$~%.'@":*?<>{}]/g,''),
            email: $('#id-email-employee-edit').val().trim(),
            start_date: $("#id-start-date-picker").val(),
            role_start: $("#id-role-date-picker").val(),
            position: $("#id-position-edit").val(),
            department: $("#id-department-edit").val(),
            employee_code: $("#id-employee-edit").val(),
            manager: $("#id-managers").val(),
            // job_title_id: $("#id-role-type").val(),
            phone: $("#id-employee-phone-edit").val().trim(),
            skype: $("#id-employee-skype-edit").val(),
            unit_code: peopleApp.unitcode,
            active: $("input[name='emp_status']:checked").val(),
            reason: $("input[name='emp_status']:checked").val() == '1' ? '':$("#id-employee-reason").val()
        }),
        url: "/api/profile/",
        beforeSend: function () {
            $("#id-edit-save").enable(false);
        },
        success: function (data) {
            if (typeof data == "object") {
                // console.log(data)
                $('#' + node.id + " span").html(data.short_name);
                update_data_node(node);
                node.data.active = data.active;
                node.data.reason = data.profile.reason;
                if (data.active) {
                	$('#' + node.id + " span").css("text-decoration", "none");
                } else {
                	$('#' + node.id + " span").css("text-decoration", "line-through");
                }
                load_data_node(node);
                peopleApp.get_list_backup_user();
                $("#id-edit-save").enable(true);
                $("#add-employee-modal").modal("hide");

            } else {
                $('#id-edit-save').enable(true);
                alert(data);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#id-edit-save").enable(true);
        }
    });
}

function get_managers(node) {
    var nodes = st.graph.getNode(st.root).getSubnodes();
    var choose = $('#id-managers');
    choose.html("");
    parent = node.getParents().pop();
    if (!parent) return;
    for (i in nodes) {
        obj = nodes[i];
        if (obj._depth <= node._depth) {
            if (parent.id == obj.id) {
                choose.append('<option selected value="' + obj.id + '">' + obj.data.name + '</option>');
                $("#id-managers").select2('val', obj.id);
            } else if (obj.id != node.id) {
                choose.append('<option value="' + obj.id + '">' + obj.data.name + '</option>');
            }
        }
    }
}

function get_managers_for_new_person(node) {
    var nodes = st.graph.getNode(st.root).getSubnodes();
    var choose = $('#id-managers');
    choose.html("");
    parent = node;
    for (i in nodes) {
        obj = nodes[i];
        if (obj._depth <= node._depth) {
            if (parent.id == obj.id) {
                choose.append('<option selected value="' + obj.id + '">' + obj.data.name + '</option>');
                $("#id-managers").select2('val', obj.id);
            } else {
                choose.append('<option value="' + obj.id + '">' + obj.data.name + '</option>');
            }
        }
    }
}

function remove_person(node, delete_kpis) {

    var alertcf = gettext("Employee ") + node.data.name + gettext(" will be deleted immediately, are you sure?");
    swal({
        title: gettext("Warning"),
        text: alertcf,
        type: "warning",
        showCancelButton: true,
        cancelButtonText: gettext("Cancel"),
        confirmButtonColor: "#DD6B55",
        confirmButtonText: gettext("Delete"),
        closeOnConfirm: true
    }, function () {
         cloudjetRequest.ajax({
            type: 'POST',
            contentType: "application/json",

            data: JSON.stringify({
                id: node.id,
                user_id: node.data.user_id,
                delete_kpis: delete_kpis
            }),
            url: "/api/user/delete/",
            beforeSend: function () {
                $('#btn-delete-employee').enable(false);
            },
            success: function (data) {
                if (typeof data == 'object' && data.status == "ok") {
                	p = node.getParents().pop();
                    if (p) {
                        load_data_node(p);
                        st.onClick(st.root);
                    }

                    if(node.data.type){
                        peopleApp.get_list_backup_user();
                    }
                    st.removeSubtree(node.id, true, 'animate', {
                        hideLabels: false,
                        onComplete: function () {

                        }
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $('#btn-delete-employee').enable(true);
                //  alert("Lỗi xoá user");
                //alert(jqXHR.responseText);
            }
        });
    })
}

function get_subordinate(node) {
    var nodes = st.graph.getNode(st.root).getSubnodes();
    children = [];
    var parent_id = null;
    for (i in nodes) {
        obj = nodes[i];
        parent = obj.getParents();
        parent_id = null;
        if (parent.length == 1) {
            parent_id = parent[0].id;
        }
        if (obj._depth == node._depth + 1 && node.id == parent_id) {
            children.push(obj);
        }
    }
    return children;
}

function bind_new_person() {
    $('#add-save-new-person').unbind('click');
    $(".pass-control").show();
    $("#id_send_new_pass").prop('checked', true);
    $('#add-save-new-person').enable(true);
    $('#add-save-new-person').click(function () {
        if (!valid_input()) {
            return;
        }
        
        cloudjetRequest.ajax({
            type: 'POST',
            data: {
                name: $("#id-employee-name-edit").val().trim().replace(/[!&\/\\#,+()$~%.'@":*?<>{}]/g,''),
                email: $('#id-email-employee-edit').val().trim(),
                start_date: $("#id-start-date-picker").val(),
                role_start: $("#id-role-date-picker").val(),
                position: $("#id-position-edit").val(),
                department: $("#id-department-edit").val(),
                employee_code: $("#id-employee-edit").val(),
                manager: $("#id-managers").val(),
                job_title_id: $("#id-role-type").val(),
                send_pass: $("#id_send_new_pass").is(":checked"),
                phone: $("#id-employee-phone-edit").val(),
                skype: $("#id-employee-skype-edit").val(),
                unit_code: peopleApp.unitcode,
            },
            url: "/performance/people/new/",
            beforeSend: function () {
                $("#add-save-new-person").enable(false);
            },
            success: function (data) {
                //console.log("==========show data ============")
                //console.log(data)
                if (typeof data === 'string') {
                    alert(data);
                    $("#add-save-new-person").enable(true);
                    return;
                }
                $("#add-employee-modal").modal("hide");

                // st.addSubtree(data, 'replot', {
                // https://philogb.github.io/jit/static/v20/Jit/Examples/Spacetree/example3.html
                st.addSubtree(data, 'animate', {
                    onComplete: function () {
                        //alert('add subtree complete! ' + peopleApp.current_node.id);// this deo chay

                         st.onClick('u'+peopleApp.current_node.id);
                    }
                });
                swal({
                    type: 'success',
                    title: gettext("Employee added successfully."),
                    showConfirmButton: true,
                })
                //alert(gettext("Employee added successfully."));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $("#add-save-new-person").enable(true);
                alert(gettext("Data error"));
            }
        });
    });
}

function bind_avatar_upload(node) {
    $('#id-btn-upload').unbind('click');
    $('#id-btn-upload').click(function () {
        $("#id-avatar-upload").click();
    });

    $("#id-avatar-upload").data('ajaxUploader-setup', false);
    $("#id-avatar-upload").ajaxfileupload({
        action: "/performance/people/",
        params: {
            'csrfmiddlewaretoken': '{{ csrf_token }}',
            id: node.id
        },
        onComplete: function (response) {
            obj = $.parseJSON($(response).text())
            if (obj) {
                $('.progress-striped .bar').css('width', '100%');
                $('#id-avatar-edit').attr('src', obj.link);
                node = st.graph.getNode('u' + obj.id);
                node.data.avatar = obj.link;
                $('.progress-striped').hide();
                $('.progress-striped .bar').css('width', '60%');
            } else {
                console.log(response);
            }
            //alert(JSON.stringify(response));
        },
        onStart: function () {
            $('.progress-striped').show();
        },
        onCancel: function () {
            console.log('no file selected');
        }
    });
}

function send_email() {
    cloudjetRequest.ajax({
        type: 'POST',
        data: {
            user_id: $("#id-user-id").val(),
            username: $("#id-username").val(),
            email: $("#id-email").val()
        },
        url: "/performance/people/reset-password/",
        beforeSend: function () {
            $("#icon-processing").show();
            $("#btn-send-email").attr("disabled", "disabled");
        },
        success: function (data) {
            $("#icon-processing").hide();
            $("#btn-send-email").removeAttr("disabled");
            $("#reset-password-modal").modal('toggle');
            alert(gettext('E-mail reset password was sent'));
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#btn-send-email").removeAttr("disabled");
            $("#icon-processing").hide();
            alert(gettext('Reset password unsuccessful!'));
        }
    });
}

function send_group_email() {
    cloudjetRequest.ajax({
        type: 'POST',
        data: {
            user_id: $("#id-user-id").val(),
            username: $("#id-username").val(),
            email: $("#id-email").val()
        },
        url: "/performance/people/reset-password-group/",
        beforeSend: function () {
            $("#icon-processing1").show();
            $("#btn-send-group-email").attr("disabled", "disabled");
        },
        success: function (data) {
            $("#icon-processing1").hide();
            $("#btn-send-group-email").removeAttr("disabled");
            $("#send-group-password-modal").modal('toggle');
            alert(gettext('E-mail reset password was sent'));
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#icon-processing1").hide();
            $("#btn-send-group-email").removeAttr("disabled");
            alert(gettext('Reset password unsuccessful!'));
        }
    });
}

function init_group_user_reset_password(node) {
    var nodes = get_subordinate(node);
    if (nodes.length == 0) {
        $("#send-group-password").hide();
    } else {
        $("#send-group-password").show();
        $(".email-list").html("");
        for (i in nodes) {
            obj = nodes[i];
            $(".email-list").append("<li>" + obj.data.email + "</li>");
        }
        $('#btn-send-group-email').unbind('click');
        $("#btn-send-group-email").click(function () {
            send_group_email();
        });
    }
}

function update_permission(node) {
    var value = $("input[name='actgroup']:checked").val();
    if ((value == "active" && node.data.active) || (value == "inactive" && !node.data.active)) {
        return;
    }
    if (!node.data.user_id) {
        if (value == 'active') {
            $("#id-inactive").prop("checked", true);
        } else {
            $("#id-active").prop("checked", true)
        }
        return;
    }
    if (value == "inactive") {
        return;
    }
    cloudjetRequest.ajax({
        type: 'POST',
        data: {
            user_id: node.data.user_id,
            username: node.data.username,
            active: value
        },
        url: "/performance/people/",
        beforeSend: function () {
            $("#id_saved").hide();
            $("#id_saving").show();
        },
        success: function (data) {
            $("#id_saving").hide();
            $("#id_saved").show();
            node.data.active = data.active;
            node.name = data.name;
            $("#" + node.id).html(data.name);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#id_saving").hide();
            $("#id_saved").hide();
            if (value == 'active') {
                $("#id-inactive").prop("checked", true);
            } else {
                $("#id-active").prop("checked", true)
            }
        }
    });
}

function init_node(node) {
    if (node_id) {
        $(node_id).css('font-weight', 'normal');
    }
    node_id = "#" + node.id + " span";
    $("#" + node.id + " span").css('font-weight', 'bolder');
    $('#submit_ava').hide();
    $("#id_open_team").text(interpolate(gettext("%s's KPIs"), [node.data.name]));
    $('span.employee_name').html(node.data.name);
    $("#id_open_team").attr('href', '/performance/kpi-editor/emp/' + node.data.user_id);
    load_data_node(node);
    bind_avatar_upload(node);
    $("#id-edit-save").unbind('click');
    $("#add-sub-person").enable(true);
    $("#id_user_export").val(node.data.user_id);

    $("#btn-edit-employee").click(function(){
        load_data_update(node);
    })
    $('#id-edit-person').hide();
    $('#id-person-info').fadeIn();

    $("#id-edit-save").unbind('click');
    $("#id-edit-save").click(function () {
        if (!valid_input()) {
            return;
        }
        update_info(node);
    });
    bind_update_role(node);
    $('#btn-send-email').unbind('click');
    $("#btn-send-email").click(function () {
        send_email();
    });

    init_group_user_reset_password(node);

    $("#add-sub-person").unbind('click');
    $("#add-sub-person").click(function () {
        clear_form();
        get_managers_for_new_person(node);
        bind_new_person();
        $("#reason_box").hide();
    });

    $("#id-active").unbind('click');
    $("#id-inactive").unbind('click');
    $("#id-active").click(function () {
        update_permission(node);
    });
    $("#id-inactive").click(function () {
        update_permission(node);
    });

    $('#btn-delete-employee').unbind('click');
    $('#btn-delete-employee').click(function () {
        peopleApp.status_confirm=false;
        peopleApp.email_confirm='';
        $('#alert_confirm').css('display','none');
        //$('#email_confirm').val('');
        $("#confirm-delete").modal();
        $('.modal').on('shown.bs.modal', function() {
            $(this).find('[autofocus]').focus();
        });
        $("#btn-delete-user-with-kpis").css('display','none');
        $("#btn-delete-user-with-kpis").unbind('click');
        $("#btn-delete-user-with-kpis").click(
            function () {
                    $("#confirm-delete").modal('toggle');
                remove_person(node, true);
                }
        );
        $("#btn-delete-only-user").css('display','none');
        $("#btn-delete-only-user").unbind('click');
        $("#btn-delete-only-user").click(
            function () {
                $("#confirm-delete").modal('toggle');
                remove_person(node, false);
                }
        );

        });

    $("#id_login_as_employee").unbind('click');
    $("#id_login_as_employee").click(function () {
        $.post("/performance/login/employee/", {user_id: node.data.user_id}, function (response) {
            if (response == "ok") {
                location.href = "/performance/home/";
            } else {
                alert(gettext("Login failed."))
            }
        }).fail(function () {
            alert(gettext("Something wrong. Please try again."));
        });
    });

    node_old_active = node.data.active;

    $('input[type=radio][name=emp_status]').change(function() {
        if (this.value == '1') {
            $("#reason_box").hide();
        }
        else if (this.value == '0' && peopleApp.mode == 'edit') {
            $("#reason_box").show();
        }
    });

    // peopleApp.$set('current_node', node.data);
    // peopleApp.hide_btn(peopleApp.permission);
    peopleApp.permission = true;
    $("#add-sub-person").show();
    peopleApp.current_node = node.data;
}

var data_node = {};

function getTree(nodeId, level, onComplete) {
    var subtree = {
        id: nodeId,
        children: []
    }, data = [];

    node = st.graph.getNode(nodeId);
    if (!node.data.has_child) {
        onComplete.onComplete(nodeId, subtree);
        return;
    }
    if (data_node[nodeId]) {
        subtree.children = data_node[nodeId];
        onComplete.onComplete(nodeId, subtree)
        return;
    }
    cloudjetRequest.ajax({
        url: '/performance/people/node/?node_id=' + nodeId,
        success: function (res) {
            if (typeof res == "object") {
                subtree.children = res.children;
                data_node[nodeId] = res.children;
                onComplete.onComplete(nodeId, subtree);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            data = getTree(nodeId, level);
        },
        cache: true
    });
}

function init() {
    //init data
    $jit.ST.Plot.NodeTypes.implement({
        'nodeline': {
            'render': function (node, canvas, animating) {
                if (animating === 'expand' || animating === 'contract') {
                    var pos = node.pos.getc(true), nconfig = this.node, data = node.data;
                    var width = nconfig.width, height = nconfig.height;
                    var algnPos = this.getAlignedPos(pos, width, height);
                    var ctx = canvas.getCtx(), ort = this.config.orientation;
                    ctx.beginPath();
                    if (ort == 'left' || ort == 'right') {
                        ctx.moveTo(algnPos.x, algnPos.y + height / 2);
                        ctx.lineTo(algnPos.x + width, algnPos.y + height / 2);
                    } else {
                        ctx.moveTo(algnPos.x + width / 2, algnPos.y);
                        ctx.lineTo(algnPos.x + width / 2, algnPos.y + height);
                    }
                    ctx.stroke();
                }
            }
        }

    });
    //end
    //init Spacetree
    //Create a new ST instance
    st = new $jit.ST({
        //id of viz container element
        injectInto: 'infovis',
        //set duration for the animation
        duration: 300,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 20,
        orientation: 'top',
        siblingOffset: 0,
        constrained: true,
        offsetY: 200,
        offsetX: 0,
        levelsToShow: 20,
        //enable panning
        Navigation: {
            enable: true,
            panning: true
        },
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 100,
            width: 70,
            type: 'nodeline',
            overridable: true
        },
        Tips: {
            enable: true,
            offsetX: 15,
            offsetY: 15,
            onShow: function (tip, node) {
                content = _.template($("#employee-info").html());
                tip.innerHTML = content({node: node});
                tip.style.overflow = 'hidden';
            }
        },
        Edge: {
            type: 'bezier',
            overridable: true,
            color: '#ccc',
            lineWidth: 2,
            alpha: 0.5
        },
        Events: {
            enable: true,
            onClick: function (node, eventInfo, e) {
                if (node) {
                    init_node(node);
                }
            }
        },
        onBeforeCompute: function (node) {
            console.log("loading " + node.name);
        },
        onAfterCompute: function () {

            console.log("done");
            reach_node();

        },
        request: function (nodeId, level, onComplete) {
            getTree(nodeId, level, onComplete);
        },
        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function (label, node) {
            label.id = node.id;
            label.innerHTML = node.name;
            label.onclick = function () {
                st.onClick(node.id);
                init_node(node);
            };
            //set label styles
            var style = label.style;
            style.width = 70 + 'px';
            style.height = 90 + 'px';
            style.cursor = 'pointer';
            style.color = '#ccc';
            style.fontSize = '1em';
            style.textAlign = 'center';
            style.paddingTop = '3px';
        },

        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function (node) {
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#fff";
            }
            else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                if (!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function (n) {
                        count++;
                    });
                    //assign a node color based on
                    //how many children it has
                    node.data.$color = ['#fff', '#fff', '#fff', '#fff', '#fff', '#fff'][count];
                }
            }
        },

        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function (adj) {
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#f00";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    //load json data
    st.loadJSON(json_data);
    //compute node positions and layout
    st.compute();
    //optional: make a translation of the tree
    st.geom.translate(new $jit.Complex(-100, 0), "current");
    //emulate a click on the root node.
    st.onClick(st.root);

    // duan
    // st.refresh();

    function changeHandler() {
        if (this.checked) {
            top.disabled = bottom.disabled = right.disabled = left.disabled = true;
            st.switchPosition(this.value, "animate", {
                onComplete: function () {
                    top.disabled = bottom.disabled = right.disabled = left.disabled = false;
                }
            });
        }
    };

    setTimeout(function () {
    	init_node(st.graph.getNode(st.root));
    }, 500)
}

function bind_update_role(node) {
    $("#id_saving").hide();
    $("#id_saved").hide();
    $("#id-admin-role").unbind('click');
    $("#id-admin-role").click(function (e) {
        var is_checked = $(this).is(':checked');
        if (confirm(gettext("Are you sure?"))) {
        	cloudjetRequest.ajax({
                type: 'POST',
                data: {
                    user_id: node.data.user_id,
                    username: node.data.username,
                    is_checked: is_checked
                },
                url: "/performance/people/",
                beforeSend: function () {
                    $("#id_saved").hide();
                    $("#id_saving").show();
                },
                success: function (data) {
                    $("#id_saving").hide();
                    $("#id_saved").show();
                    node.data.is_admin = is_checked;
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    $("#id_saving").hide();
                    $("#id_saved").hide();
                }
            });
        } else {
        	e.preventDefault();
        }
    });
}

var node_search_list = [];

function search_person(id) {

    node_search_list = [];

    var name = id;
    $('.symbol_loading').show();

    if (name) {
        var found = false;
        st.graph.eachNode(function (node) {
            if (node.data.user_id == name) {
                found = true;
                st.onClick(node.id);
                // neu ten ton trai tren cay co san, thi se click vao node do
                init_node(node);
                $('.symbol_loading').hide();
                $('.mango_search_input').focus();
                return;
            }
        });
        // if no node matched
        // do get node line up, trigger existed node st.onClick(node.id)--> get node until reach searched node
        if (!found) {
            node_ids = [];
            cloudjetRequest.ajax({
                type: 'get',
                async: false,
                url: '/performance/people/node/?lineup=' + name,
                success: function (res) {
                    console.log(res)

                    // node_ids=res.reverse();
                    node_ids = res;
                    //node_search_list = [1355, 1354, 1353, 99]
                    node_search_list = res;
                    node_search_list = adjust_node_ids(node_search_list);
                    reach_node(node_search_list);


                },
                error: function () {

                }
            });

        }


    } else {
        alert(gettext("Emloyee's name field cannot be empty or is incorrect"));
        $(".mango_search_input").focus();
    }
    //$('.symbol_loading').hide();
    //alert("ko co ten can tim tren cay nhan su")
}

var auto_timeout_id = 0;

function reach_node() {

    if (node_search_list.length) {
        var thenode_id = node_search_list[node_search_list.length - 1];
        var found_node_id = null;
        st.graph.eachNode(function (node) {
            if (node.id.slice(1) == thenode_id) {
                node_search_list = node_search_list.slice(0, node_search_list.length - 1);
                found_node_id = node.id;
                console.log(node.id);
                st.onClick(node.id);
                init_node(node);
                return;
            }
        });
        if (node_search_list.length == 0 && found_node_id) {

            // $('#'+found_node_id).trigger('click');
            // auto_timeout_id=setTimeout(function(){
            // 	st.onClick(found_node_id);
            // 	init_node(node);
            // },200);
            auto_timeout_id = setInterval(function () {
                if (!st.busy) {
                    st.onClick(found_node_id);
                    $('.symbol_loading').hide();
                    $('.mango_search_input').focus();
                    clearInterval(auto_timeout_id);
                }

            }, 50);
            // st.onClick(found_node_id);
            // st.refresh();
        }

    }

}

function adjust_node_ids() {
    var found = false;
    // var _node_ids=[];
    for (var i = 0; i < node_search_list.length; i++) {
        st.graph.eachNode(function (node) {
            if (node.id.slice(1) == node_search_list[i]) {
                found = true;
                return;
            }
        });
        if (found) {
            node_search_list = node_search_list.slice(0, i + 1);
            break;
        }
    }
    return node_search_list;

}

function change_uc(UC) {
    if (UC == '-------') {
        return '';
    }
    return UC;
}

