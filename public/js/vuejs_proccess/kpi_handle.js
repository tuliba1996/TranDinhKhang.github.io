$('#file-upload').change(function() {
        var i = $(this).prev('label').clone();
        var file = $('#file-upload')[0].files[0];
        var file_name = $('#file-upload')[0].files[0].name;
        if (file.size/1024/1024 > 5) {
            $('#file-upload').val('');
            alert(gettext('File size must be under')+ ' 5 Mb!');
        }
        else{
            that.filename= file_name;
            $('#save-evidence').removeAttr('disabled')
        }

});

$(document).keydown(function(event) {
    if (event.keyCode == 27) {
        $('#evidence-modal').modal('hide');
        $('#save-evidence').attr('disabled','disabled');
    }
});


$('#file-upload-action-plan-input').change(function() {
        var i = $(this).prev('label').clone();
        var file = $('#file-upload-action-plan-input')[0].files[0];
        var file_name = $('#file-upload-action-plan-input')[0].files[0].name;
        // check upload file size whether exceeded limited size or not
        if (file.size/1024/1024 > 5) {
            $('#file-upload-action-plan-input').val('');
            alert(gettext('File size must be under')+ ' 5 Mb!');
        }
        else{
            // that.filename = file_name;// wtf here???
            $("#board-upload-action-plan .btn-save-upload").removeAttr('disabled');
        }

});



$("#evidence-modal").on("hidden.bs.modal", function(){
    $('#file-upload').val('');
    that.filename='';
    $('#e-content').val('');
});
$("#e-content").on("input", function(){
    var maxlength = parseInt($("#e-content").attr("maxlength"));
    if ($("#e-content").val().length>=maxlength)  {
        var tmp = $('#e-content').val().slice(0,maxlength-1);
        $('#e-content').val(tmp);
        alert("{% trans 'You have reached length limit!' %}");
    }
})