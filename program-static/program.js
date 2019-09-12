function $(x) { return document.getElementById(x); }

function $_(tag,attributes,html,appendTo,style)
{
  var elem = document.createElement(tag);
  if (attributes) {
    for (var att in attributes) {
      elem[att] = attributes[att];
    }
  }
  if (html) {
    elem.innerHTML = html;
  }
  if (style) {
    var stl = elem.style;
    for (var key in style) {
      stl[key] = style[key];
    }
  }
  if (appendTo) {
    appendTo.appendChild(elem);
  }
  return elem;
} // $_

function eventSource(event,attrib)
{
  event = event || window.event;
  if (! event) {
    return false;
  }
  var source = event.srcElement || event.target;
  if (! attrib) {
    return source;
  }
  while (source && !source[attrib] &&
	 (!source.getAttribute || !source.getAttribute(attrib))) {
    source = source.parentNode;
  }
  return source;
} // eventSource

if (document.addEventListener) {
  addEventHandler = function(element,event,handler) {
    element.addEventListener(event,handler,false);
  }
}
else if (document.attachEvent) {
  addEventHandler = function(element,event,handler) {
    element.attachEvent('on'+event,handler);
  }
}
else {
  var MyHandler = {
    all : [],
    add : function (element,event,handler)
    {
      for (var e = MyHandler.all.length-1;e >= 0;e--) {
	var eh = MyHandler.all[e];
	if (eh[0] == element) {
	  var handlers = eh[1];
	  var hlist = handlers[event];
	  if (hlist) {
	    for (var j = hlist.length-1;j >= 0;j--) {
	      if (hlist[j] == handler) {
		return;
	      }
	    }
	    hlist.push(handler);
	    return;
	  }
	  hlist = element[event] ? [element[event],handler] : [handler];
	  handlers[event] = hlist;
	  element[event] = function(ev) {MyHandler.iterate(ev,hlist);};
	  return;
	}
      }
      var hlist = element[event] ? [element[event],handler] : [handler];
      MyHandler.all.push([element,{event:hlist}]);
      element[event] = function(ev) {MyHandler.iterate(ev,hlist);};
    },

    iterate : function(event,hlist)
    {
      for (var i = 0;i < hlist.length;i++) {
	if (hlist[i](event)) return true;
      }
      return false;
    }
  };
  addEventHandler = function(element,event,handler) {
    MyHandler.add(element,'on'+event,handler);
  }
}

var Program = {
  expandBox : {},
  shrinkBox : {},
  boxExpand : {},
  boxShrink : {},
  boxHeight : {},
  boxIndex : {},
  nextId : 0,
  shrunk : {},
  tried : {},
  ping1 : function(url,handler,message)
  {
    if (!Program.data) {
      return;
    }
    var request = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
    request.open('POST',url,true);
    if (handler) {
      request.onreadystatechange = function () {
	if (request.readyState == 4 && request.status == 200) {
	  var response = request.responseText;
	  if (response != '') {
	    handler(response);
	  }
	}
      }
    }
    request.setRequestHeader('Content-Type',
			     'application/x-www-form-urlencoded');
    request.send(message);
  },
  ping2 : function(response)
  {
    if (!Program.data) {
      return;
    }
    Program.ping1('/statistics/page_access_x.cgi',false,
		  'm2='+response+';pr='+Program.data.pr+';co='+Program.data.co+';pk='+Program.data.pk);
  },
  // function to find the absolute position of an HTML element in the 
  // document
  absPosition : function (elem)
  {
    var left = 0;
    var top = 0;
    for (var out = elem; out; out=out.offsetParent) {
      left += out.offsetLeft; 
      top += out.offsetTop; 
    }
    return {left : left,
            right : left + elem.offsetWidth,
            top : top,
            bottom : top + elem.offsetHeight}
  },
  checkBoxOverflow : function(boxInfo)
  {
    for (var spanId in boxInfo) {
      var spanBottom = Program.absPosition($(spanId)).bottom;
      var boxId = boxInfo[spanId];
      var box = $(boxId);
      var boxBottom = Program.absPosition(box).bottom;
      if (boxBottom < spanBottom - 2) {
	Program.nextId++;
	var imageId = 'expand' + Program.nextId;
	var expand = $_('img',
			{className:'box_expand',
			 src:"/images/eye.png",
			 id : imageId},
			'',box);
	Program.expandBox[imageId] = boxId;
	Program.boxExpand[boxId] = imageId;
	addEventHandler(expand,'mouseover',Program.expandBox);

	imageId = 'shrink' + Program.nextId;
	var shrink = $_('img',
			{className:'box_shrink',
			 src:"/images/cross_red.gif",
			 title:'click to close',
			 id : imageId},
			'',$(boxId),
			{visibility:'hidden'});
	Program.shrinkBox[imageId] = boxId;
	Program.boxShrink[boxId] = imageId;
	addEventHandler(shrink,'click',Program.shrinkBox);
      }
    }
  },
  addPixels : function(string,pixels)
  {
    return (Number(string.substring(0,string.length-2))+pixels) + 'px';
  },
  expandBox : function(event)
  {
    var image = eventSource(event);
    var boxId = Program.expandBox[image.id];
    var box = $(boxId);
    if (!Program.tried[boxId]) {
      Program.tried[boxId] = true;
      addEventHandler(box,'mouseleave',Program.shrinkBox1);
    }
    Program.shrunk[boxId] = false;
    var boxStyle = box.style;
    Program.boxIndex[boxId] = boxStyle.zIndex;
    Program.boxHeight[boxId] = boxStyle.height;
    boxStyle.zIndex = 999999;
    boxStyle.height = null;
    boxStyle.padding = '25px';
    boxStyle.backgroundColor='white';
    boxStyle.left = Program.addPixels(boxStyle.left,-22);
    boxStyle.top = Program.addPixels(boxStyle.top,-22);
    boxStyle.boxShadow = '10px 10px 5px #999';
    boxStyle.borderRadius='10px';
    image.style.visibility = 'hidden';
    $(Program.boxShrink[boxId]).style.visibility = 'visible';
  },
  shrinkBox : function(event)
  {
    Program.shrink(eventSource(event));
  },
  shrinkBox1 : function(event)
  {
    Program.shrink($(Program.boxShrink[eventSource(event).id]));
  },
  shrink : function(image) {
    var boxId = Program.shrinkBox[image.id];
    if (Program.shrunk[boxId]) {
      return;
    }
    Program.shrunk[boxId] = true;
    var box = $(boxId);
    var boxStyle = box.style;
    boxStyle.zIndex = Program.boxIndex[boxId];
    boxStyle.height = Program.boxHeight[boxId];
    boxStyle.padding = '3px';
    boxStyle.backgroundColor = null;
    boxStyle.left = Program.addPixels(boxStyle.left,22);
    boxStyle.top = Program.addPixels(boxStyle.top,22);
    boxStyle.boxShadow = null;
    boxStyle.borderRadius = null;
    image.style.visibility = 'hidden';
    $(Program.boxExpand[boxId]).style.visibility = 'visible';
  }
};

