

var pre 	= $('pre'),
	pre_api = $('pre', '#api'),
    code	= $('code');

code.each(function(index){
	var _this = $(this), // MOFO ugly! Never ever get used to this style.
    _txt = _this.text().split('\n');
    for(var i = 0 , len = _txt.length; i < len; ++i){
        _txt[i] = _txt[i].replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
    _this[0].textContent = _txt.join('\n');
});

pre.each(function(index){
    var _this = $(this); // MOFO ugly! Never ever get used to this style.
    if(_this.hasClass('jsdoc')){
        _this.removeClass('prettyprint');
    }else{
        _this.addClass('prettyprint');
    }
});

(function() {
	window.addEventListener('load', function(){
	    prettyPrint();
	},false);
})();
