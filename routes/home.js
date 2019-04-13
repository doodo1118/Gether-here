var express = require('express');
var app = express();
var router = express.Router();
var nodemailer = require('nodemailer');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
app.use(cookieParser);
// 세션 설정
app.use(expressSession({
    secret: 'my key',
    resave: true,
    saveUninitialized: true
}));
var rand, rand1, mailOptions, host, link; //인증번호 랜덤함수(이메일, 휴대폰)변수


//===== MySQL 데이터베이스를 사용할 수 있도록 하는 mysql 모듈 불러오기 =====//
var mysql = require('mysql');

//===== MySQL 데이터베이스 연결 설정 =====//
var pool = mysql.createPool({
    connectionLimit: 1000,
    host: 'localhost',
    user: 'root',
    password: 'gachon654321',
    database: 'project',
    debug: false
});



/*
    Here we are configuring our SMTP Server details.
    STMP is mail server which is responsible for sending and recieving email.
*/


var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "jyujin8328@gmail.com",
        pass: "marking96"
    }
});



//홈화면 라우팅
router.get('/', function (req, res) {

    if (!req.session.user) {
        res.render('index', {
            user: false
        });
    } else {
        res.render('index', {
            user: req.session.user
        });
    }

});

router.get('/my-account', function (req, res) {

    if (!req.session.user) {
        res.render('my-account', {user: false});
    } else {
        res.render('my-account', {user: req.session.user });
    }
});

router.get('/personal_page', function (req, res) {

    if (!req.session.user) {
        res.render('personal_page', {user: false});
    } else {
        res.render('personal_page', {user: req.session.user });
    }
});


//이메일 인증 
router.get('/sendEmail', function (req, res) {
    rand = Math.floor(Math.random() * 1000000) + 111111;

    mailOptions = {
        to: req.query.to,
        subject: "[가천대학교 강의실 예약시스템]",
        html: "안녕하세요,<br>인증번호는 " + rand + " 입니다.<br>감사합니다."
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            console.log("이메일 전송이 완료되었습니다.: ");
            res.end("sent");
        }
    });
});

//문의메일 전송
router.get('/sendQna', function (req, res) {
    adminEmail ="tamittu@gc.gachon.ac.kr";
    mailOptions = {
        to: adminEmail,
        subject: "[가천대학교 강의실 예약시스템]" + req.query.name +" 님의 문의메일입니다.",
        html: "이름 : " +req.query.name + "<br>휴대폰번호 : " +req.query.phoneNum+
        "<br>이메일: " + req.query.email + "<br>문의내용 : " + req.query.contents
    }
    console.log(mailOptions);
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
            res.end("error");
        } else {
            console.log("문의메일 전송이 완료되었습니다.: ");
            res.end("sent");
        }
    });
});

//이메일 인증 
router.get('/verifyEmail', function (req, res) {

    if (req.query.emailNum == rand) {
        console.log("인증번호 확인완료");
        res.end("checked");
    } else {
        console.log("잘못된 인증번호");
        res.end("error");
    }

});

router.get('/sendSms', function (req, res) {
    rand1 = Math.floor(Math.random() * 1000000) + 111111;
    //my-account.ejs로 보낼 데이터값 설정
    var checkSms = function (data) {
        if (data == 'sent')
            res.end('sent');
        else
            res.end('error');
    };

    var https = require("https");
    var credential = 'Basic ' + new Buffer('Gachon_class' + ':' + '9e781a1455b611e9a8680cc47a1fcfae').toString('base64');


    var data = {
        "sender": '01093608328',
        "receivers": [req.query.phoneNum],
        "content": '[가천대학교 강의실 예약시스템] 인증번호는 ' + rand1 + ' 입니다.'
    }
    var body = JSON.stringify(data);

    var options = {
        host: 'api.bluehouselab.com',
        port: 443,
        path: '/smscenter/v1.0/sendsms',
        headers: {
            'Authorization': credential,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(body)
        },
        method: 'POST'
    };
    var req = https.request(options, function (res) {
        console.log(res.statusCode);
        var body = "";
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function (d) {
            if (res.statusCode == 200) {
                console.log(JSON.parse(body));
                checkSms('sent');

            } else {
                console.log(body);
                checkSms('error');
            }
        });


    });


    req.write(body);
    req.end();
    req.on('error', function (e) {
        console.error(e);

    });




});

router.get('/verifySms', function (req, res) {

    if (req.query.smsNum == rand1) {
        console.log("인증번호 확인완료");
        res.end("checked");
    } else {
        console.log("잘못된 인증번호");
        res.end("error");
    }

});

//아이디, 휴대폰번호 중복체크(회원가입시)
router.get('/doubleCheck', function (req, res) {
    console.log('/doubleCheck 호출됨');

    var id = req.query.to;
    var phoneNum = req.query.phoneNum;
    var checkDouble = function (data) {
        if (data == 'existId')
            res.end('existId');
        if (data == 'existPhoneNum')
            res.end('existPhoneNum');
        if (data == 'success')
            res.end('success');
    };

    if (pool) {

        console.log('데이터베이스 연결');

        // SQL 문을 실행합니다.
        //데이터베이스 테이블 이름: users
        var exec = pool.query("select id from users where id = ?", [id], function (err, rows) {

            if (rows.length > 0) {
                console.log('아이디 [%s]가 일치하는 사용자 찾음.', id);
                checkDouble('existId');

            } else {
                // SQL 문을 실행합니다.
                var exec = pool.query("select phoneNum from users where phoneNum = ?", [phoneNum], function (err, rows) {

                    //console.log('실행 대상 SQL : ' + exec.sql);

                    if (rows.length > 0) {
                        console.log('휴대폰번호 [%s]가 일치하는 사용자 찾음.', phoneNum);
                        checkDouble('existPhoneNum');
                    } else {
                        console.log("일치하는 사용자를 찾지 못함.");
                        checkDouble('success');

                    }
                });
            }
        });

        pool.on('error', function (err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

        });


    }


});



//사용자 추가
router.get('/addUser', function (req, res) {
    console.log('/addUser 호출됨');
    var id = req.query.to;
    var phoneNum = req.query.phoneNum;
    var password = req.query.password;

    if (pool) {
        pool.query('INSERT INTO users( id, phoneNum, password ) VALUES (?,?,?)',
                  [id, phoneNum, password],
            function () {
                res.end('completed');
                console.log('사용자 추가 완료됨');
            });
    }
});

router.get('/authUser', function (req, res) {
    console.log('/authUser 호출됨');
    var id = req.query.login_id;
    var password = req.query.login_password;
    var checkAuth = function (data) {
        if (data == 'auth')
            res.end('auth');
        if (data == 'fail')
            res.end('fail');
    };
    if (pool) {

        console.log('데이터베이스 연결');

        // SQL 문을 실행합니다.
        //데이터베이스 테이블 이름: users
        var exec = pool.query("select id, password from users where id = ? and password= ?", [id, password], function (err, rows) {

            if (rows.length > 0) {
                console.log('아이디 [%s], 비밀번호가 일치하는 사용자 찾음.', id);
                checkAuth('auth');

            } else {
                console.log('아이디 [%s], 비밀번호가 일치하는 사용자 찾지못함.', id);
                checkAuth('fail');
            }
        });

        pool.on('error', function (err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

        });


    }


});

router.get('/login', function (req, res) {
    var paramId = req.query.login_id;
    var paramPassword = req.query.login_password;

    if (req.session.user) {
        console.log('이미 로그인되어 있습니다.');
    } else {
        //console.log('로그인 진행합니다.');
        
        req.session.user = {
            id: paramId,
            authorized: true,
            nickname: '마이'
        };
        res.render('index', {user: req.session.user });
        console.log('로그인 후');
        console.log(req.session.user);
    }



});

router.get('/logout', function (req, res) {
    if (req.session.user) {
        console.log('로그아웃합니다.');

        req.session.destroy(function (err) {
            if (err) {
                throw err;
            }
            console.log('세션을 삭제하고 로그아웃되었습니다.');
            res.render('index', {
                user: false
            });
            
        });
    } else {
        console.log('아직 로그인되어 있지 않습니다.');
        res.render('index', {
            user: false
        });
    }
});

router.get('/adminAuth', function(req, res){
    console.log('/adminAuth 호출됨');
    var id = req.query.admin_id;
    var password = req.query.admin_password;
    var checkAuth = function (data) {
        if (data == 'auth')
            res.end('auth');
        if (data == 'fail')
            res.end('fail');
    };
    if (pool) {

        console.log('데이터베이스 연결');

        // SQL 문을 실행합니다.
        //데이터베이스 테이블 이름: users
        var exec = pool.query("select id, password from admin where id = ? and password= ?", [id, password], function (err, rows) {

            if (rows.length > 0) {
                console.log('아이디 [%s], 비밀번호가 일치하는 관리자 찾음.', id);
                checkAuth('auth');

            } else {
                console.log('아이디 [%s], 비밀번호가 일치하는 관리자 찾지못함.', id);
                checkAuth('fail');
            }
        });

        pool.on('error', function (err) {
            console.log('데이터베이스 연결 시 에러 발생함.');
            console.dir(err);

        });


    }
});
router.get('/adminLogin', function(req, res){
   
    var paramId = req.query.admin_id;
    var paramPassword = req.query.admin_password;

    if (req.session.user) {
        console.log('이미 로그인되어 있습니다.');
    } else {
        console.log('관리자 로그인 진행합니다.');
        
        req.session.user = {
            id: paramId,
            authorized: true,
            nickname: '관리자'
        };
        res.render('index', {user: req.session.user });
        console.log('관리자 로그인 후');
        console.log(req.session.user);
    }

});



router.get('/menu-list', function (req, res) {

    if (!req.session.user) {
        res.render('menu-list', {
            user: false
        });
    } else {
        res.render('menu-list', {
            user: req.session.user
        });
    }

});


router.get('/menu-details', function (req, res) {

    if (!req.session.user) {
        res.render('menu-details', {
            user: false
        });
    } else {
        res.render('menu-details', {
            user: req.session.user
        });
    }

});


router.get('/contact', function (req, res) {

    if (!req.session.user) {
        res.render('contact', {
            user: false
        });
    } else {
        res.render('contact', {
            user: req.session.user
        });
    }

});


router.get('/cart', function (req, res) {

    if (!req.session.user) {
        res.render('cart', {
            user: false
        });
    } else {
        res.render('cart', {
            user: req.session.user
        });
    }

});


module.exports = router;