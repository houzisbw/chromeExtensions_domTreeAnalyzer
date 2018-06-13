/*
 * 该js注入实际目标网页
 * 该js可以获取dom以及操作网页js
 */
//html节点
;(function(){
	var htmlNode = document.getElementsByTagName('html')[0];
	//应对消息的策略对象,每个方法有返回值
	var onMessageStrategy = {
		//开始分析
		'START_ANALYSIS':function(){
			//定义返回对象
			var ret = {};
			//获取树的深度
			ret.depthArguments = caculateDomTreeDepth(htmlNode);
			return ret
		}
	};

	document.addEventListener('DOMContentLoaded', function(){
		//添加侦听器，监听来自popup.js的消息,并返回回应
		//runtime就是运行环境，能够接收面板发来的消息
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
		{
			//收到消息并执行对应的处理方法
			var returnValue = null;
			if(onMessageStrategy[request.cmd]!==undefined){
				returnValue = onMessageStrategy[request.cmd]();
				sendResponse(returnValue);
			}
		});
		// //dom树根节点
		// var htmlNode = document.getElementsByTagName('html')[0];
		// //dom节点数量
		// var domNodeObj = {};
		// //dom树深度
		// var domTreeDepth = 0;
		// //儿子最多的节点
		// var nodeWithMostChildren = null;
		// //最多儿子数量
		// var maxChildrenNum = 0;
		// //开始分析按钮
		// var startButton;
		// //dom加载完成后回调,注意必须延时几秒执行，否则页面还未加载完全
		// window.addEventListener('load',function(){
		//
		// 	//给按钮绑定事件
		// 	startButton = document.getElementById('dom');
		// 	console.log(startButton)
		// 	startButton.addEventListener('click',function(){
		// 		//计算dom树节点种类和个数
		// 		analysisDomTree();
		// 		//计算dom树的层次以及高亮最深层次的一个元素
		// 		var ret = caculateDomTreeDepth(htmlNode)
		// 		var deepestNode = ret.pathList[0];
		// 		//让最深路径上的元素都显示出来
		// 		for(var i=0;i<ret.pathList.length;i++){
		// 			var node = ret.pathList[i]
		// 			node.style.display = 'block';
		// 			node.style.visibility = 'visible';
		// 		}
		// 		//高亮最深的元素
		// 		deepestNode.style.border = '3px solid red';
		// 		deepestNode.scrollIntoView();
		//
		// 		console.log(nodeWithMostChildren)
		// 		console.log(maxChildrenNum)
		// 	});
		//
		// });
		// //分析dom树
		// function analysisDomTree(){
		// 	//采用bfs遍历dom树
		// 	var nodeQueue = [];
		// 	nodeQueue.unshift(htmlNode);
		// 	nodeWithMostChildren = htmlNode;
		// 	while(nodeQueue.length){
		// 		var curNode = nodeQueue.pop();
		// 		//更新domNodeObj
		// 		var nodeName = curNode.tagName.toLowerCase();
		// 		if(domNodeObj[nodeName]===undefined){
		// 			domNodeObj[nodeName]=1
		// 		}else{
		// 			domNodeObj[nodeName]++;
		// 		}
		// 		//更新儿子最多的节点
		// 		var curChildrenNum = curNode.children.length;
		// 		if(maxChildrenNum<curChildrenNum){
		// 			maxChildrenNum = curChildrenNum;
		// 			nodeWithMostChildren = curNode;
		// 		}
		// 		//将当前node的儿子节点加入queue中
		// 		for(var i=0;i<curNode.children.length;i++){
		// 			nodeQueue.unshift(curNode.children[i])
		// 		}
		// 	}
		//
		// }


	})

	//分析方法
	//获取dom树的深度
	function caculateDomTreeDepth(root){
		if(!root)return {depth:0,pathList:[]};
		var tempDepth = 0;
		var tempList = [];
		for(var i=0;i<root.children.length;i++){
			var ret = caculateDomTreeDepth(root.children[i]);
			tempDepth = Math.max(tempDepth,ret.depth);
			if(ret.pathList.length>tempList.length){
				tempList = ret.pathList.slice();
			}
		}
		tempList.push(root);
		return {
			depth:tempDepth+1,
			pathList:tempList
		};
	}

})();
