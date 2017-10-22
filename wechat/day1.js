var koa = require('koa');
var xss = require('xss');

var app = koa();

app.use(function *(){
	var echo = this.query.echo;
	var snippet1 = '<!DOCTYPE html><html><head><title>回声集</title></head><body><span style="color:#ff6600;border:1px solid #ddd;">';
	var snippet2 = '</span></body></html>';

	if (!echo) {
		this.body = snippet1 + 'bilili!hahahah' + snippet2;
	}else{
		echo = xss(echo);

		this.body = snippet1 + echo + snippet2;
	}
});

app.listen(3000);
console.log('success');