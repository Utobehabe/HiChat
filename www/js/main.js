
window.onload = function () {
	var hichat = new HiChat();
	hichat.init();
};

// 定义一个hichat类
var HiChat = function () {
	this.socket = null;
	this._picnum = 0;
};

HiChat.prototype = {
	/* 初始化程序 */
	init: function () {
		var that = this,
				chat_nicknameInput = document.getElementById('nicknameInput'),
				chat_loginBtn = document.getElementById('loginBtn'),
				chat_info = document.getElementById('info'),
				chat_loginWrapper = document.getElementById('loginWrapper'),
				chat_messageInput = document.getElementById('messageInput'),
				chat_sendBtn = document.getElementById('sendBtn'),
				chat_sendImage = document.getElementById('sendImage'),
				chat_emoji = document.getElementById('emoji'),
				chat_emojiWrapper = document.getElementById('emojiWrapper'),
				chat_clearBtn = document.getElementById('clearBtn');

		that._picnum = 40;	// 手动设置emoji的表情的数量

		that._initialEmoji();	// 初始化表情包
		/* 建立到服务器的socket连接 */
		that.socket = io.connect();
		/* 监听socket的connect的事件，此事件表示连接已经建立 */
		that.socket.on('connect', function () {
			// 连接到服务器后，显示昵称到输入框
			// document.getElementById('info').textContent = "get yourselt a nickname";
			// document.getElementById('nickWrapper').style.display = 'none';
			chat_nicknameInput.focus();		// 连接成功，使昵称输入框获取焦点
		});
		/* 登录按钮点击事件 */
		chat_loginBtn.addEventListener('click', function () {
			var nickName = chat_nicknameInput.value;
			// 检查昵称输入框是否为空
			if (nickName.trim().length != 0) {
				// console.log(that.socket);
				that.socket.emit('login', nickName);
			}else {
				chat_nicknameInput.focus();
			}
		}, false);
		/* 信息发送点击事件 */
		chat_sendBtn.addEventListener('click', function () {
			that._sendBtnMsg();
		}, false);
		/* 信息输入框键盘事件，enter发送 */
		chat_messageInput.addEventListener('keyup', function (e) {
			if (e.keyCode == 13) {
				that._sendBtnMsg();
			}
		}, false);
		/* 图片改变时触发事件 */
		chat_sendImage.addEventListener('change', function () {
			// 检查是否有文件被选中
			if (this.files.length != 0) {
				// 获取文件并用FileReader进行读取
				var file = this.files[0],
						reader = new FileReader();

				/* 系统不支持FileReader时，显示不支持信息 */
				if (!reader) {
					that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
					this.value = '';
					return;
				}
				reader.onload = function (e) {
					// 读取成功，显示在页面并发送到服务器
					this.value = '';
					var color = document.getElementById('colorStyle').value;
					that.socket.emit('img', e.target.result, color);
					that._displayImage('me', e.target.result, color);
				};
				reader.readAsDataURL(file);	// 用于读取文件的信息
			}
		}, false);
		/* 表情按钮点击，显示表情框 */
		chat_emoji.addEventListener('click', function (e) {
			chat_emojiWrapper.style.display = 'block';
			e.stopPropagation();	// 停止事件传播
		}, false);
		/* 奇效表情框的显示 */
		document.body.addEventListener('click', function (e) {
			if (e.target != chat_emojiWrapper) {
				chat_emojiWrapper.style.display = 'none';
			}
		}, false);
		/* 表情框点击触发事件 */
		chat_emojiWrapper.addEventListener('click', function (e) {
			// 获取被点击的表情
			var target = e.target;
			// 当检测的是图片img的时候，添加表情信息到输入框中。
			// 表情的显示为[emoji:xx]，xx为数字
			if (target.nodeName.toLowerCase() == 'img') {
				chat_messageInput.focus();
				chat_messageInput.value = chat_messageInput.value +' [emoji:'+ target.title +'] ';
			}
		}, false);
		/* 昵称输入框键盘事件，enter时提交信息 */
		chat_nicknameInput.addEventListener('keyup', function (e) {
			if (e.keyCode == 13) {
				var nickName = chat_nicknameInput.value;
				if (nickName.trim().length != 0) {
					that.socket.emit('login', nickName);
				}
			}
		}, false);
		/* 清除历史记录 */
		chat_clearBtn.addEventListener('click', function () {
			document.getElementById('historyMsg').textContent = '';
		}, false);
		that.socket.on('nickExisted', function () {
			chat_info.textContent = '!nickname is taken, choose other pls';	//显示昵称被占用的提示
		});
		that.socket.on('loginSuccess', function () {
			document.title = 'hichat | ' + chat_nicknameInput.value;
			chat_loginWrapper.style.display = 'none';	// 隐藏遮罩层聊天
			chat_messageInput.focus();	//让消息输入框获得焦点
		});
		that.socket.on('system', function (nickName, userCount, type) {
			// 判断用户是连接还是离开以显示不同的信息
			var msg = nickName + (type == 'login'?' joined':' left');
			that._displayNewMsg('system', msg, 'red');
			// 将在线人数显示到页面顶部
			document.getElementById('status').textContent = userCount +
					(userCount>1 ? ' users ':' user ')+ 'online';
		});
		that.socket.on('newMsg', function (user, msg, color) {
			that._displayNewMsg(user, msg, color);
		});
		that.socket.on('newImg', function (user, img, color) {
			that._displayImage(user, img, color);
		});
	},
	/* 将内容添加到历史信息中 */
	_displayNewMsg: function (user, msg, color) {
		var container = document.getElementById('historyMsg'),
				msgToDisplay = document.createElement('p'),
				date = new Date().toTimeString().substr(0, 8),
				msg = this._showEmoji(msg);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user+ '<span class="timespan">('+ date +')</span>：'+ msg;
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	/* 将图片显示到历史信息中 */
	_displayImage: function (user, imgData, color) {
		var container = document.getElementById('historyMsg'),
				msgToDisplay = document.createElement('p'),
				date = new Date().toTimeString().substr(0, 8);

		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user +'<span class="timespan">('+ date +')</sapn>:'
				+'<br><a href="'+ imgData +'" target="_blank">'
				+'<img src="'+ imgData +'"></a>';
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	/* 添加一个初始化所有表情包 */
	_initialEmoji: function () {
		var emojiContainer = document.getElementById('emojiWrapper'),
				docFragment = document.createDocumentFragment();	
		for (var i=this._picnum; i>0; i--) {
			var emojiItem = document.createElement('img');
			emojiItem.src = '../content/emoji/'+ i +'.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		}
		emojiContainer.appendChild(docFragment);
	},
	/*  */
	_showEmoji: function (msg) {
		var match, result = msg,	// match为匹配到的字符串
				reg = /\[emoji:\d+\]/g,	// 匹配的正则表达式
				emojiIndex,						// 获取表情的index
				totalEmojiNum = document.getElementById('emojiWrapper').children.length; // 获取img的数量
		while (match = reg.exec(msg)) {
			emojiIndex = match[0].slice(7, -1);
			if (emojiIndex > totalEmojiNum) {
				result = result.replace(match[0], '[X]');	// 如果下标是不存在，则替换成[X]
			}else {
				// 存在该图片，则替换成img图片
				result = result.replace(match[0], '<img class="emoji" src="../content/emoji/'+ emojiIndex +'.gif">');
			}
		}
		return result;
	},
	/* 将发送信息封装成一个函数 */
	_sendBtnMsg: function () {
		var chat_messageInput = document.getElementById('messageInput'),
				chat_colorStyle = document.getElementById('colorStyle'),
				msg = chat_messageInput.value,
				color = chat_colorStyle.value;
		chat_messageInput.value = '';
		chat_messageInput.focus();
		if (msg.trim().length != 0) {
			this.socket.emit('postMsg', msg, color);	//把消息发送到服务器，并把颜色也传给服务器
			this._displayNewMsg('me', msg, color);	//把自己的消息显示到自己的窗口中。
		}
	}
}