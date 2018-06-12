/*
 * 该js不注入页面，只是操作chrome插件弹出的面板，注意该js需要同注入页面的content-scripts进行通信
 * 该js无法获取dom以及操作网页js
 */

//获取开始按钮
// var startBtn = document.getElementById('dom-tree-start-button');
// startBtn.addEventListener('click',function(){
//
// });





//与注入页面的js通信
function sendMessageToContentScript(message, callback) {
	//查询当前激活的面板并发送数据,发送者为当前面板
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response)
		{
			if(callback) callback(response);
		});
	});
}
sendMessageToContentScript({cmd:'test', value:'你好，我是popup！'}, function(response)
{
	console.log('来自content的回复：'+response);
});