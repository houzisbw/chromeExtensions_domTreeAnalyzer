/*
 * 该js注入实际目标网页
 * 该js可以获取dom以及操作网页js
 */
//html节点
;(function(){
	var htmlNode = document.getElementsByTagName('html')[0];
	//最长路径
	var longestPathList = [];
	//最深的元素
	var deepestNode = null;
	//应对消息的策略对象,每个方法有返回值
	var onMessageStrategy = {
		//开始分析
		'START_ANALYSIS':function(){
			//定义返回对象
			var ret = {};
			//获取树的深度
			ret.depthArguments = caculateDomTreeDepth(htmlNode);
			longestPathList = ret.depthArguments.nodeList;
			deepestNode = ret.depthArguments.nodeList[0];
			//获取树各个节点的数量
			ret.nodeArguments = analysisDomTree();
			//获取网页宽高
			ret.pageParamObj = getPageSize()
			return ret
		},
		//高亮选中的tag
		'HIGHLIGHT_SELECTED_TAG':function(param){
			var tagName = param.tagName;
			//不需要高亮的元素
			var unhighlighted = ['head','link','script','br','meta','title'];
			//遍历dom树高亮选中的tag
			var nodeQueue = [];
			nodeQueue.unshift(htmlNode);
			while(nodeQueue.length){
				var curNode = nodeQueue.pop();
				var nodeTagName = curNode.tagName.toLowerCase();
				if(nodeTagName===tagName && unhighlighted.indexOf(nodeTagName)===-1){
					curNode.classList.add('dom-tree-highlight-red-outline');
				}else{
					curNode.classList.remove('dom-tree-highlight-red-outline','dom-tree-highlight-show');
				}
				for(var i=0;i<curNode.children.length;i++){
					nodeQueue.unshift(curNode.children[i])
				}
			}
		},
		//取消高亮
		'CANCEL_HIGHLIGHT_TAG':function(){
			var nodeQueue = [];
			nodeQueue.unshift(htmlNode);
			while(nodeQueue.length){
				var curNode = nodeQueue.pop();
				curNode.classList.remove('dom-tree-highlight-red-outline','dom-tree-highlight-show');
				for(var i=0;i<curNode.children.length;i++){
					nodeQueue.unshift(curNode.children[i])
				}
			}
		},
		//显示最长路径,暂时不做，效果不好
		'SHOW_LONGEST_PATH':function(){

		},
		//高亮最深元素
		'HIGHLIGHT_DEEPEST_NODE':function(){
			if(deepestNode){
				deepestNode.classList.add('dom-tree-highlight-red-outline','dom-tree-highlight-show');
				//把它的父节点都显示出来:display:block,否则无法显示该元素
				var t = deepestNode.parentNode;
				while(t){
					if(t.classList){
						t.classList.add('dom-tree-highlight-show');
					}
					t = t.parentNode;
				}
				deepestNode.scrollIntoView();
			}
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
				returnValue = onMessageStrategy[request.cmd](request.param);
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
		//分析dom树


	})

	//分析方法

	//获取dom树的深度
	function caculateDomTreeDepth(root){
		if(!root)return {depth:0,pathList:[],nodeList:[]};
		var tempDepth = 0;
		var tempList = [];
		var nodeList = [];
		for(var i=0;i<root.children.length;i++){
			var ret = caculateDomTreeDepth(root.children[i]);
			tempDepth = Math.max(tempDepth,ret.depth);
			if(ret.pathList.length>tempList.length){
				tempList = ret.pathList.slice();
				nodeList = ret.nodeList.slice();
			}
		}
		tempList.push(root.nodeName.toLowerCase());
		nodeList.push(root);
		return {
			depth:tempDepth+1,
			pathList:tempList,
			nodeList:nodeList
		};
	}
	//获取dom树各个节点的数量,检测css框架使用的情况,检测使用框架的情况
	function analysisDomTree(){
		//js框架列表
		var jsFrameworkObj = {};
		//知名css框架名称
		var wellKnownCssFrameworks = [
			'iconfont','animated','bootstrap',
			'bulma','semantic','foundation',
			'uikit','miligram','kube','vital','pavilion',
			'luxbar','waffle-grid','pure'];
		var cssFrameworkList= [];
		var domNodeObj = {};
		var maxChildrenNum = 0;
		//采用bfs遍历dom树
		var nodeQueue = [];
		nodeQueue.unshift(htmlNode);
		var nodeWithMostChildren = htmlNode;
		while(nodeQueue.length){
			var curNode = nodeQueue.pop();
			//更新domNodeObj
			var nodeName = curNode.tagName.toLowerCase();
			//如果是link节点
			if(nodeName==='link'){
				//获取该节点的rel属性
				var rel = curNode.getAttribute('rel');
				if(rel && rel === 'stylesheet'){
					//获取href属性
					var href = curNode.getAttribute('href');
					if(href){
						//获取最后的css
						var splitted = href.split('/');
						var cssName = splitted[splitted.length-1];
						for(var i=0;i<wellKnownCssFrameworks.length;i++){
							if(cssName.indexOf(wellKnownCssFrameworks[i])!==-1){
								cssFrameworkList.push(wellKnownCssFrameworks[i])
							}
						}
					}
				}
			}
			//检测jquery
			if(nodeName==='script'){
				var src = curNode.getAttribute('src');
				//必须判断src存在才能使用toLowerCase
				if(src && src.toLowerCase().indexOf('jquery')!==-1){
					jsFrameworkObj['jQuery']=1;
				}
			}
			//检测三大框架
			checkJsFramework(jsFrameworkObj,curNode);
			//统计节点数目
			if(domNodeObj[nodeName]===undefined){
				domNodeObj[nodeName]=1
			}else{
				domNodeObj[nodeName]++;
			}
			//更新儿子最多的节点
			var curChildrenNum = curNode.children.length;
			if(maxChildrenNum<curChildrenNum){
				maxChildrenNum = curChildrenNum;
				nodeWithMostChildren = curNode;
			}
			//将当前node的儿子节点加入queue中
			for(var i=0;i<curNode.children.length;i++){
				nodeQueue.unshift(curNode.children[i])
			}
		}
		//计算总结点个数
		var nodeCnt = 0;
		for(var key in domNodeObj){
			if(domNodeObj.hasOwnProperty(key)){
				nodeCnt+=domNodeObj[key]
			}
		}
		return {
			node:domNodeObj,
			jsFrameworkList:jsFrameworkObj,
			cssList:cssFrameworkList,
			totalNodeNum:nodeCnt,
			maxNodeNum:maxChildrenNum
		};
	}

	//检测使用js框架的情况
	function checkJsFramework(jsFrameworkObj,domNode){
		//获取属性列表
		var attrList = domNode.attributes;
		var speicalAttr = {
			'data-reactid':'React',
			'data-v-':'Vue',
			'ng-':'Angular'
		};
		//特征点数组
		for(var i=0;i<attrList.length;i++){
			var attrName = attrList[i].nodeName;
			for(var key in speicalAttr){
				if(attrName.indexOf(key)!==-1){
					jsFrameworkObj[speicalAttr[key]]=1;
				}
			}
		}
	}

	//获取网页宽高,最小宽度和几屏
	function getPageSize(){
		var ret = {};
		var pageHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
		var clientHeight = document.documentElement.clientHeight || document.body.clientHeight;
		var screenNum = (pageHeight / clientHeight).toFixed(1);
		//获取网页最小宽度，查看body的min-width属性
		var bodyMinWidth = getComputedStyle(document.body)['min-width'];
		ret.pageWidth = bodyMinWidth?(parseInt(bodyMinWidth,10)):null;
		ret.pageHeight = pageHeight;
		ret.screenNum = screenNum;
		return ret
	}

})();
