var st;
var node_id = null;

function init_node(node) {
	if (node_id) {
        $('#' + node_id).removeClass("focused");
        $("#btn-edit-position-tree-"+node_id).hide();
        $("#btn-add-position-tree-"+node_id).hide();
    }
	node_id = node.id;
    $("#" + node.id).addClass("focused");
    $("#btn-edit-position-tree-"+node.id).show();
    $("#btn-add-position-tree-"+node.id).show();
    PositionApp.init_node(node);
}

function get_managers_for_new_person(node) {
    var nodes = st.graph.getNode(st.root).getSubnodes();
    var result = [];
    for (i in nodes) {
        obj = nodes[i];
        if (obj._depth <= node._depth) {
        	result.push({
        		id: obj.data.id,
        		name: obj.data.name
        	});
        }
    }
    return result;
}

function create_inner_html(node) {
	var name = node.name.replace(/^(.{15}[^\s]*).*/, "$1");
	if (node.name.length > 15 && node.name.length != name.length) {
		name += "...";
	}
	var html = `
    	<div class="p-node lv2">
    	<div data-original-title="${node.name}" onclick="init_form_by_node_id('${node.id}');" class="title" id="title-${node.id}">${name}</div>
    	<hr class='chart-line'/>
    	<div class="content">`;
	
	html += `<a class="pos-left" onclick="init_form_by_node_id('${node.id}');"><i class="material-icons btn-position-tree edit-position-tree" title="${gettext("Edit position")}" data-toggle="modal" data-target="#edit-position-modal">edit</i></a>`;
	

	if (node.data.people.length > 0) {
	    if(node.getSubnodes().length!=1){
		html += `<img class="img-circle content-img" style="" src="${node.data.people[0].avatar_url}">`;
        }
        else{
		html += `<img class="img-circle content-img" src="${node.data.people[0].avatar_url}">`;
		}
	}
	if (node.data.people.length > 1) {
		html += `<img class="img-circle content-img-2" src="${node.data.people[1].avatar_url}">`;
	}
	if (node.data.people.length > 2) {
		html += `<div class="content-img-3">+${node.data.people.length - 2}</div>`;
	}
	if (!(node.getSubnodes().length == 1 && node.data.people.length > 1)) {
		html += `<a class="pos-right" onclick="show_popup_add_position('${node.id}')"><i title="${gettext("Add position")}" class="material-icons btn-position-tree add-position-tree" style="float:right;margin-right:5px;">add</i></a>`;
    }
	html +=	`</div></div>`;
	$('.title').tooltip();

	setTimeout(function () {
		$('.add-position-tree').tooltip({container: 'body'});
        $('.edit-position-tree').tooltip({container: 'body'});
	},500);

	return html;

}

var data_node = {};

function getTree(nodeId, level, onComplete) {
    var subtree = {
        id: nodeId,
        children: []
    }, data = [];

    node = st.graph.getNode(nodeId);
    if (!node.data.has_child) {
        onComplete.onComplete(nodeId, subtree)
        return;
    }
    if (data_node[nodeId]) {
        subtree.children = data_node[nodeId];
        onComplete.onComplete(nodeId, subtree)
        return;
    }
    cloudjetRequest.ajax({
        url: '/performance/position-chart/node/?node_id=' + nodeId,
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
        cache: false
    });
}

function init(data) {
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
        injectInto: 'org-chart',
        //set duration for the animation
        duration: 300,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 50,
        orientation: 'top',
        siblingOffset: 30,
        constrained: true,
        offsetY: 100,
        offsetX: 0,
        levelsToShow: 20,
        //enable panning
        Navigation: {
            enable: true,
            panning: true,
            zooming: true
        },
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 100,
            width: 130,
            type: 'nodeline',
            overridable: true
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
                	PositionApp.selected_node = node;
                	init_node(node);
                }
            }
        },
        onBeforeCompute: function (node) {
        	if (node) {
        		console.log("loading " + node.name);
        	}
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
            label.className = `node position-level-${node.data.position_type}`;

            label.innerHTML = create_inner_html(node);
            label.onclick = function () {
                st.onClick(node.id);
            };
            //set label styles
            var style = label.style;
            style.width = 130 + 'px';
            style.height = 89 + 'px';
            style.cursor = 'pointer';
            style.color = '#ccc';
            style.fontSize = '1em';
            style.textAlign = 'center';
            style.paddingTop = '3px';
            setTimeout(function () {
            	$('.title').tooltip();
            }, 1000);
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
    if (data) {
    	dataSource = data;
    }
    //load json data
    st.loadJSON(dataSource);
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
}
var node_search_list = [];
var auto_timeout_id = 0;

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

function search_position(id) {

    node_search_list = [];

    var name = id;
    $('.symbol_loading').show();

    if (name) {
        var found = false;
        st.graph.eachNode(function (node) {
            if (node.data.id == name) {
                found = true;
                st.onClick(node.id);
                // neu ten ton trai tren cay co san, thi se click vao node do
                init_node(node);
                PositionApp.loading = false;
                PositionApp.node_data = node.data;
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
                url: '/performance/position/node/?lineup=' + name,
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
                	PositionApp.loading = false;
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
                PositionApp.node_data = node.data;
                return;
            }
        });
        if (node_search_list.length == 0 && found_node_id) {

            // $('#'+found_node_id).trigger('click');
            // auto_timeout_id=setTimeout(function(){
            //     st.onClick(found_node_id);
            //     init_node(node);
            // },200);
            auto_timeout_id = setInterval(function () {
                if (!st.busy) {
                    st.onClick(found_node_id);
                    init_node(node);
                    PositionApp.node_data = node.data;
                    PositionApp.loading = false;
                    clearInterval(auto_timeout_id);
                }

            }, 50);
            // st.onClick(found_node_id);
            // st.refresh();
        }
    } else {
    	PositionApp.loading = false;
    }
}