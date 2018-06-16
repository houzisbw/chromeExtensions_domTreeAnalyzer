/*
 * 该js不注入页面，只是操作chrome插件弹出的面板，注意该js需要同注入页面的content-scripts进行通信
 * 该js无法获取dom以及操作网页js
 */



//消息常量
//开始分析
var START_ANALYSIS = 'START_ANALYSIS';
//高亮被点击的tag
var HIGHLIGHT_SELECTED_TAG  = 'HIGHLIGHT_SELECTED_TAG';
//取消高亮
var CANCEL_HIGHLIGHT_TAG = 'CANCEL_HIGHLIGHT_TAG';
//显示最长路径
var SHOW_LONGEST_PATH = 'SHOW_LONGEST_PATH';
//高亮最深元素
var HIGHLIGHT_DEEPEST_NODE = 'HIGHLIGHT_DEEPEST_NODE';

//获取开始分析按钮
var startBtn = document.getElementById('dom-tree-start-button');
startBtn.addEventListener('click',function(){
	//展示loading界面
	$('.dom-tree-start-btn-wrapper').hide();
	$('.loading-analysis').show();
	$('.dom-tree-data-show-wrapper').hide();
	//3秒延时是为了让网页尽量加载完全
	setTimeout(function(){
		sendMessageToContentScript({cmd:START_ANALYSIS}, function(response) {
			$('.loading-analysis').hide();
			$('.dom-tree-data-show-wrapper').show();
			buildResultPanel(response);
		});
	},3000);
});


//根据返回的网页数据消息构建界面
function buildResultPanel(pageData){
	//构建网页基本参数部分
	renderPageBasicParams(pageData)
}
//构建网页基本参数部分
function renderPageBasicParams(pageData){
	//根据pageData生成表格参数
	var pageDataList = [];
	pageDataList.push(['网页最小宽度',pageData.pageParamObj.pageWidth?(pageData.pageParamObj.pageWidth+'像素'):'自适应宽度'])
	pageDataList.push(['网页高度',pageData.pageParamObj.pageHeight+'像素']);
	pageDataList.push(['网页高度屏数',pageData.pageParamObj.screenNum+'屏']);
	pageDataList.push(['总html标签数',pageData.nodeArguments.totalNodeNum]);
	pageDataList.push(['最多子标签数',pageData.nodeArguments.maxNodeNum]);
	//高亮最深元素
	var deepestHtml = pageData.depthArguments.depth+'<div class="dom-tree-item-box show-deepest-node">高亮最深元素</div>';
	pageDataList.push(['dom树深度',deepestHtml]);
	//网页标签种类及个数
	var pageHtmlTagTypeNum = 0;
	var domNodes = pageData.nodeArguments.node;
	for(var key in domNodes){
		pageHtmlTagTypeNum++;
	}
	//网页标签各自数目
	var tagHtml = '';
	for(var key in domNodes){
		tagHtml += '<div data-tag='+key+ " class='dom-tree-item-box show-tag'>";
		tagHtml += key+'('+domNodes[key]+')'+'</div>';
	}
	tagHtml+='<div class="dom-tree-item-box cancel-show-tag">取消高亮</div>';
	pageDataList.push(['网页标签分布 (点击高亮页面对应标签,少数标签无法高亮)',tagHtml]);
	pageDataList.push(['网页标签种类数',pageHtmlTagTypeNum]);
	//dom树最长路径(根到叶节点)
	var longestPath = ['dom树最长路径'];
	var longestPathHtml = '';
	for(var i=pageData.depthArguments.pathList.length-1;i>=0;i--){
		longestPathHtml+='<div class="dom-tree-item-box">'+pageData.depthArguments.pathList[i]+(i>0?'</div><span>-></span>':'</div>');
	}
	//longestPathHtml+='<div class="dom-tree-item-box dom-tree-show-longestpath">显示dom树最长路径</div>'
	longestPath.push(longestPathHtml);
	pageDataList.push(longestPath);

	//网页js框架使用情况
	var jsFrameObj = pageData.nodeArguments.jsFrameworkList;
	var jsFrame = ['Js框架使用情况'];
	var jsFrameList = ['jQuery','Vue','React','Angular'];
	var jsHtml = '';
	for(var i=0;i<jsFrameList.length;i++){
		jsHtml+='<div class="dom-tree-item-box'+(jsFrameObj[jsFrameList[i]]?'':' dom-tree-item-box-inactive')+'">'+jsFrameList[i]+'</div>';
	}
	jsFrame.push(jsHtml);
	pageDataList.push(jsFrame);

	//网页css框架使用情况
	var cssFrameList = pageData.nodeArguments.cssList;
	var cssFrame = ['css框架使用情况'];
	var cssFrameListAll = ['iconfont','animated','bootstrap',
		'bulma','semantic','foundation',
		'uikit','miligram','kube','vital','pavilion',
		'luxbar','waffle-grid','pure'];
	var cssHtml = '';
	for(var i=0;i<cssFrameListAll.length;i++){
		cssHtml+='<div class="dom-tree-item-box';
		cssHtml+=cssFrameList.indexOf(cssFrameListAll[i])!==-1?'':' dom-tree-item-box-inactive';
		cssHtml+='">'+cssFrameListAll[i]+'</div>';
	}
	cssFrame.push(cssHtml);
	pageDataList.push(cssFrame);



	var innerHtml = '<tr><td colspan="2">网页基本参数</td></tr>';
	for(var i=0;i<pageDataList.length;i++){
		innerHtml+='<tr>'+
						'<td>'+pageDataList[i][0]+'</td>'+
						'<td>'+pageDataList[i][1]+'</td>'+
			       '</tr>'
	}


	//添加事件委托处理:标签被点击高亮页面中对应的所有标签
	$('.dom-tree-data-table').on('click','div',function(){
		//判断该div是否含有show-tag类
		var className = $(this).attr('class');
		if(className.indexOf('show-tag')!==-1){
			sendMessageToContentScript({
				cmd:HIGHLIGHT_SELECTED_TAG,
				param:{tagName:$(this).data('tag')}
			});
		}else if(className.indexOf('cancel-show-tag')!==-1){
			//取消高亮
			sendMessageToContentScript({
				cmd:CANCEL_HIGHLIGHT_TAG,
				param:{}
			});
		}else if(className.indexOf('dom-tree-show-longestpath')!==-1){
			//显示最长路径
			sendMessageToContentScript({
				cmd:SHOW_LONGEST_PATH,
				param:{}
			});
		}else if(className.indexOf('show-deepest-node')!==-1){
			//高亮最深的元素
			sendMessageToContentScript({
				cmd:HIGHLIGHT_DEEPEST_NODE,
				param:{}
			});
		}
	});
	$('.dom-tree-data-table').html(innerHtml);
}


//与注入页面的js通信
function sendMessageToContentScript(message, callback) {
	//查询当前激活的面板并发送数据,发送者为当前面板
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			if(callback) callback(response);
		});
	});
}
