var socket = io.connect("http://localhost:4000");
var roomnum;
$(function () {
    var $userForm = $('#userForm');
    var $username = $('#username');
    var $roomnum = $('#roomnum');
    var $userFormArea = $('#userFormArea');
    var $roomArea = $('#roomArea');
    var $message = $('#message');
    var $vidlist = $('#vidlist');
    var $users = $('#users');
    var mainText = document.getElementById('mainText');
    var media = document.querySelector('video');
    var $messageForm = $('#messageForm');
    var msg = document.getElementById('message');
    var sync = document.getElementById('sync');
    var videoId = '';
    var $chat = $('#chat');
    var host = false;
    var notifyfix = false


    $messageForm.submit(function (e) {
        e.preventDefault();
        feedback.innerHTML = '';
        socket.emit('send message', $message.val());
        $message.val('');
    });

    mainText.addEventListener('keyup', ($event) => {
        let data = { 'val': $event.target.value, 'from': $username.val() }
        socket.emit('mainTyping', data);
    })

    socket.on('mainTypingFromServer', (data) => {
        if (data.from != $username.val())
            mainText.value = data.val;
    });
    msg.addEventListener('keypress', () => {
        socket.emit('typing', $username.val());
    })

    socket.on('typing', (data) => {
        if (data != $username.val()) {
            feedback.innerHTML = '<p><em>' + data + ' is typing a message...</em></p>';
        }
    })

    socket.on('tell_me', (data) => {
        if (host) {
            console.log('myTime', media.currentTime);
            socket.emit('hostTime', {
                time: media.currentTime
            })
        }
    })

    $userForm.submit(function (e) {
        e.preventDefault();
        if ($username.val() == "" || $roomnum.val() == "") {
            var noname = document.getElementById('missinginfo')
            noname.innerHTML = "Please enter the details below!"
        }
        else {
            username = $username.val()
            socket.emit('new_user', $username.val(), (data) => {
                if (data) {
                    $userFormArea.hide();
                    $roomArea.show();
                    if ($roomnum.val() != '') {
                        roomnum = $roomnum.val();
                    }
                }
            });
            socket.emit('new_room', $roomnum.val(), (data) => {
                if (data) {
                    console.log("Host is syncing the new socket!");
                    syncVideo(roomnum);
                }
            });
        }
    });

    socket.on('changeHostLabel', (data) => {
        var user = data.username;
        var hostlabel = document.getElementById('hostlabel');
        hostlabel.innerHTML = "<i class=\"fas fa-user\"></i> Current Host: " + user
    })

    socket.on('get vidlist', (data) => {
        console.log("updating the queue");
        var html5 = ''
        html5 += `<li class="vid-item"></li>`
        $vidlist.html(html5)
    })

    socket.on('getData', (data) => {
        socket.emit('sync host', {});
    })

    socket.on('setHost', () => {
        notifyfix = true;
        console.log("You are the new host!")
        host = true
    })

    socket.on('get users', (data) => {
        var html = '';
        for (i = 0; i < data.length; i++) {
            html += '<li style="padding-right: 10em;" class="list-group-item chat-users">' + data[i] + '</li>';
        }
        $users.html(html)
    })

    function getHostData(roomnum) {
        socket.emit('get host data', {
            room: roomnum
        });
    }

    function playOther(roomnum) {
        socket.emit('play other', {
            room: roomnum
        });
    }

    function pauseOther(roomnum) {
        socket.emit('pause other', {
            room: roomnum
        });
    }

    function seekOther(roomnum, currTime) {
        console.log(roomnum, currTime);
        socket.emit('seek other', {
            room: roomnum,
            time: currTime
        })
    }

    socket.on('justPlay', (data) => {
        if (media.paused) {
            media.play();
        }
    })

    socket.on('justPause', (data) => {
        media.pause();
    })

    socket.on('justSeek', (data) => {
        console.log('data.time:', data.time);
        currTime = data.time;
        media.currentTime = currTime;
    })

    socket.on('setAutoHost', (data) => {
        console.log("Here:");
        if (data.roomnum == roomnum) {
            changeHost(data.roomnum);
        }
    })

    function changeHost(roomnum) {
        if (!host) {
            console.log('calling to make me host');
            socket.emit('change host', {
                room: roomnum
            })
        }
    }

    socket.on('new message', function (data) {
        var last_div = $('.chat > div:last')[0]
        feedback.innerHTML = '';
        if (last_div !== undefined) {
            var myRegex = /.*<strong>(.+)<\/strong>.*/g
            var match = myRegex.exec(last_div.innerHTML)
            console.log(last_div.innerHTML)
            var last_user = ""
            if (match != null) {
                console.log("found the user!" + match[1])
                last_user = match[1]
            }
        }
        if (data.user != last_user) {
            if($username.val() != data.user){
                var audio = new Audio('Message.mp3')
                audio.play();
            }
            $chat.append('<div class="well well-sm message-well"><strong>' + data.user + '</strong>: ' + data.msg + '</div>');
        }
        else {
            last_div.innerHTML = last_div.innerHTML + " <br> " + data.msg
        }
        $('div#chat').scrollTop($('div#chat')[0].scrollHeight)
    });

});