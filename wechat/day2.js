var koa = require('koa');
var xss = require('xss');
var fs = require('fs');
var path = require('path');

var app = koa();

function count(filePath){
	if (!filePath) {
		throw new Error('却少统计文件路径')
	}

	var num = 0;

	try{
		fs.accessSync(filePath,fs.F_OK);
		num = parseInt(fs.readFileSync(filePath),10);
	}catch(e){
		fs.writeFileSync(filePath,num)
	}

	if (isNaN(num)) {
		num = 0;
	}

	return function *count(next){
		console.log(this.url)

		if (this.method === 'GET' && this.url.indexOf('/favicon.ico') === -1) {
			num++;
			fs.writeFileSync(filePath,num);
			this.count = num;
			yield* next;
		}
	}
}
app.use(count(path.join(__dirname,'./count.txt')));

app.use(function *(){
	var echo = this.query.echo;
	var snippet1 = '<!DOCTYPE html><html><head><title>回声集</title></head><body><span style="color:#ff6600;border:1px solid #ddd;">';
	var snippet2 = '</span></body></html>';
	var snippet3 = '回声次数：' + this.count;

	if (!echo) {
		this.body = snippet1 + 'bilili!hahahah' + snippet2;
	}else{
		echo = xss(echo);

		this.body = snippet1 + echo + snippet2 + snippet3;
	}
});

app.listen(3000);
console.log('success');