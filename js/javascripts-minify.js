/*!
 * Simple History v0.5.0
 *
 * Copyright 2011, Jörn Zaefferer
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function(window,undefined){var initial=location.href;window.SimpleHistory={supported:!!(window.history&&window.history.pushState),pushState:function(fragment,state){state=state||{};history.pushState(state,null,fragment);this.notify(state);},replaceState:function(fragment,state){state=state||{};history.replaceState(state,null,fragment);},notify:function(state){this.matcher(location.pathname+location.search,state);},start:function(matcher){this.matcher=matcher;window.addEventListener("popstate",function(event){if(initial&&initial===location.href){initial=null;return;}
SimpleHistory.notify(event.state||{});},false);}};}(window));(function(window,$,undefined){if(!SimpleHistory.supported){return;}
var $body=$('body');var $main=$('#main');var $title=$('title');var $div=$('<div/>');var path;var has_transitionend=('ontransitionend'in window);$.fn.addClassWait=function(name){var $el=this;var deferred=new $.Deferred();if(!has_transitionend){this.addClass(name);deferred.resolve();return deferred;}
var transitionender=function(){$el.unbind('transitionend',transitionender);deferred.resolve();};$el.bind('transitionend',transitionender).addClass(name);return deferred;}
$.load=function($el,path){var deferred=new $.Deferred();$div.load(path,function(){deferred.resolve();});return deferred;};var load_page=function(path){$.when($.load($div,path+' #main, title'),$main.addClassWait('loading')).done(function(){$main.html($div.find('#main').html());$title.html($div.find('title').html());$main.addClass('unloaded').removeClass('loading')
$main.removeClass('unloaded');;});};$body.delegate('a[href^="/"]','click',function(e){if(event.metaKey||event.shiftKey||event.ctrlKey){return;}
event.preventDefault();path=$(event.target).attr("href");SimpleHistory.pushState(event.target.href);});SimpleHistory.start(function(path){load_page(path);});})(window,jQuery);