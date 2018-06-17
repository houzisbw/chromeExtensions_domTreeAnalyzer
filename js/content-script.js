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
	//是否反色
	var isColorReversed = false;
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
				//注意最上层是document对象，无法执行getComputedStyle
				while(t!==document){
					//该元素是否隐藏,这里需要判断是否存在style属性
					var isHidden = getComputedStyle(t).display === 'none';
					if(t.classList && isHidden){
						t.classList.add('dom-tree-highlight-show');
					}
					t = t.parentNode;
				}
				deepestNode.scrollIntoView();
			}
		},
		//左右翻转页面
		'REVERSE_PAGE':function(){
			document.body.classList.add('dom-tree-page-reverse')
		},
		//上下翻转页面
		'REVERSE_UPSIDEDOWN':function(){
			document.body.classList.add('dom-tree-page-reverse-upsidedown')
		},
		//页面反色
		'COLOR_INVERSE':function(){
			isColorReversed = !isColorReversed;
			//bfs遍历每个节点，添加类inverse-color,颜色取当前节点颜色的反
			//注意返回的颜色分为rgb和rgba 2种，分别处理(没有16进制颜色)
			var nodeQueue = [];
			nodeQueue.unshift(htmlNode);
			while(nodeQueue.length){
				var curNode = nodeQueue.pop();
				//获取该节点的背景色和文字颜色
				if(curNode.nodeType === 1){
					var bgColor = window.getComputedStyle(curNode).backgroundColor;
					var wordColor = window.getComputedStyle(curNode).color;
					//背景颜色:判断是否是rgba
					var rgbaReg = /^rgba/g;
					if(rgbaReg.test(bgColor)){
						//获取rgba中的r,g,b;
						var bgColorStr = bgColor.replace('rgba(','').replace(')','');
						var splitted = bgColorStr.split(',');
						var r = splitted[0],g=splitted[1],b=splitted[2],a=splitted[3];
						var newColor = 'rgba('+(255-parseInt(r,10))+','+(255-parseInt(g,10))+','+(255-parseInt(b,10))+','+a+')';
						curNode.style.backgroundColor = newColor
					}else{
						//如果是rgb
						var bgColorStr = bgColor.replace('rgb(','').replace(')','');
						var splitted = bgColorStr.split(',');
						var r = splitted[0],g=splitted[1],b=splitted[2];
						var newColor = 'rgb('+(255-parseInt(r,10))+','+(255-parseInt(g,10))+','+(255-parseInt(b,10))+')';
						curNode.style.backgroundColor = newColor
					}

					//文字颜色反色:文字颜色只会是rgb
					var wordColorReg = /^rgb\(/g;
					if(wordColorReg.test(wordColor)){
						var colorStr = wordColor.replace('rgb(','').replace(')','');
						var splitted = colorStr.split(',');
						var r = splitted[0],g=splitted[1],b=splitted[2];
						var newColor = 'rgb('+(255-parseInt(r,10))+','+(255-parseInt(g,10))+','+(255-parseInt(b,10))+')';
						curNode.style.color = newColor
					}


				}
				for(var i=0;i<curNode.children.length;i++){
					nodeQueue.unshift(curNode.children[i]);
				}
			}
		},
		//页面旧报纸特效
		'COLOR_OLD_PAPER':function(){
			var nodeQueue = [];
			nodeQueue.unshift(htmlNode);
			while(nodeQueue.length){
				var curNode = nodeQueue.pop();
				//获取该节点的背景色和文字颜色
				if(curNode.nodeType === 1){
					var bgColor = window.getComputedStyle(curNode).backgroundColor;
					var wordColor = window.getComputedStyle(curNode).color;
					//背景颜色:判断是否是rgba
					var rgbaReg = /^rgba/g;
					if(rgbaReg.test(bgColor)){
						//获取rgba中的r,g,b;
						var bgColorStr = bgColor.replace('rgba(','').replace(')','');
						var splitted = bgColorStr.split(',');
						var r = splitted[0],g=splitted[1],b=splitted[2],a=splitted[3];
						var averageColor = Math.floor((parseInt(r,10)+parseInt(g,10)+parseInt(b,10))/3);
						var newColor = 'rgba('+averageColor+','+averageColor+','+averageColor+','+a+')';
						curNode.style.backgroundColor = newColor
					}else{
						//如果是rgb
						var bgColorStr = bgColor.replace('rgb(','').replace(')','');
						var splitted = bgColorStr.split(',');
						var r = splitted[0],g=splitted[1],b=splitted[2];
						var averageColor = Math.floor((parseInt(r,10)+parseInt(g,10)+parseInt(b,10))/3);
						var newColor = 'rgb('+averageColor+','+averageColor+','+averageColor+')';
						curNode.style.backgroundColor = newColor
					}

					//文字颜色反色:文字颜色只会是rgb
					var wordColorReg = /^rgb\(/g;
					if(wordColorReg.test(wordColor)){
						var colorStr = wordColor.replace('rgb(','').replace(')','');
						var splitted = colorStr.split(',');
						var r = splitted[0],g=splitted[1],b=splitted[2];
						var averageColor = Math.floor((parseInt(r,10)+parseInt(g,10)+parseInt(b,10))/3);
						var newColor = 'rgb('+averageColor+','+averageColor+','+averageColor+')';
						curNode.style.color = newColor
					}


				}
				for(var i=0;i<curNode.children.length;i++){
					nodeQueue.unshift(curNode.children[i]);
				}
			}
		},
		//取消所有特效
		'CANCEL_ALL_EFFECT':function(){
			//所有特效类数组
			var effectList = ['dom-tree-page-reverse','dom-tree-page-reverse-upsidedown'];
			for(var i=0;i<effectList.length;i++){
				document.body.classList.remove(effectList[i]);
			}
			//取消反色
			if(isColorReversed){
				onMessageStrategy['COLOR_INVERSE']();
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
	});

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
