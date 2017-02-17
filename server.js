
// 引入http模块
// var http = require('http');


// console.log('server started');

// express是node.js中管理路由响应请求的模块，根据请求的URL返回相应的HTML页面。

// 服务器及页面部分
var express = require('express'),
		app = express(),
		server = require('http').createServer(app),
		io = require('socket.io').listen(server), 	// 引入socket.io模块并绑定到服务器
		users = [];	//保存所有在线用户的昵称
app.use('/', express.static(__dirname+ '/www'));	//指定静态HTML文件的位置

server.listen(80);

// socket部分
io.on('connection', function (socket) {
	// 昵称设置
	socket.on('login', function (nickname) {
		if (users.indexOf(nickname) > -1) {
			socket.emit('nickExisted');	// 用户已存在，向浏览器出发nickExisted事件
		}else {
			// userIndex为用户的索引
			socket.userIndex = users.length;
			socket.nickname = nickname;
			users.push(nickname);	// 将用户保存到用户数据
			socket.emit('loginSuccess');	// 向客户端发送登录成功的提示
			io.sockets.emit('system', nickname, users.length, 'login');	//向所有连接到服务器的客户端发送当前登录用户的昵称
		}
	});
	socket.on('disconnect', function () {
		// 将断开连接的用户从users中删除
		users.splice(socket.userIndex, 1);
		// 通知除自己以外的所有人
		socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
	});
	// 接收新信息
	socket.on('postMsg', function (msg, color) {
		socket.broadcast.emit('newMsg', socket.nickname, msg, color);
	});
	// 接收用户发来的图片
	socket.on('img', function (imgData, color) {
		// 通过一个newImage时间分发到出自己外的每个用户
		socket.broadcast.emit('newImg', socket.nickname, imgData, color);
	});
})

