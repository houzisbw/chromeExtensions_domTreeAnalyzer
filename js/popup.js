/*
 * 该js不注入页面，只是操作chrome插件弹出的面板，注意该js需要同注入页面的content-scripts进行通信
 * 该js无法获取dom以及操作网页js
 */
//消息常量
//开始分析
var START_ANALYSIS = 'START_ANALYSIS';

//获取开始按钮
var startBtn = document.getElementById('dom-tree-start-button');
startBtn.addEventListener('click',function(){
	//展示loading界面
	$('.dom-tree-start-btn-wrapper').hide();
	$('.loading-analysis').show();
	sendMessageToContentScript({cmd:START_ANALYSIS}, function(response) {
		$('.loading-analysis').hide();
		console.log(response);
	});
});





//与注入页面的js通信
function sendMessageToContentScript(message, callback) {
	//查询当前激活的面板并发送数据,发送者为当前面板
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			if(callback) callback(response);
		});
	});
}
