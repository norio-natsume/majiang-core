const assert = require('assert');

const Majiang = require('../');

let MSG = [];

class Player {
    constructor(id, reply = [], delay = 0) {
        this._id    = id;
        this._reply = reply;
        this._delay = delay;
    }
    action(msg, callback) {
        MSG[this._id] = msg;
        if (callback)
            setTimeout(()=>callback(this._reply.shift()), this._delay);
    }
}

suite('Majiang.Game', ()=>{

    test('クラスが存在すること', ()=> assert.ok(Majiang.Game));

    suite('constructor(players, callback, rule)', ()=>{
        test('インスタンスが生成できること', ()=> assert.ok(new Majiang.Game()));
    });

    suite('delay(callback, timeout)', ()=>{

        const game = new Majiang.Game();

        test('speed: 0 → 0ms', (done)=>{
            let called;
            game._speed = 0;
            game.delay(()=>{ called = 1 });
            assert.ifError(called);
            setTimeout(()=>{ assert.ok(called); done() }, 0);
        });
        test('speed: 1 → 500ms', (done)=>{
            let called;
            game._speed = 1;
            game.delay(()=>{ called = 1 });
            setTimeout(()=>{ assert.ifError(called)    }, 200);
            setTimeout(()=>{ assert.ok(called); done() }, 500);
        });
        test('speed: 3 → 600ms', (done)=>{
            let called;
            game._speed = 3;
            game.delay(()=>{ called = 1 });
            setTimeout(()=>{ assert.ifError(called)    }, 500);
            setTimeout(()=>{ assert.ok(called); done() }, 600);
        });
        test('speed: 0, timeout: 100 → 0ms', (done)=>{
            let called;
            game._speed = 0;
            game.delay(()=>{ called = 1 }, 100);
            assert.ifError(called);
            setTimeout(()=>{ assert.ok(called); done() }, 0);
        });
        test('speed: 5, timeout: 100 → 100ms', (done)=>{
            let called;
            game._speed = 5;
            game.delay(()=>{ called = 1 }, 100);
            setTimeout(()=>{ assert.ifError(called)    }, 0);
            setTimeout(()=>{ assert.ok(called); done() }, 100);
        });
    });

    suite('stop()', ()=>{

        const game = new Majiang.Game();

        test('停止すること', (done)=>{
            game.stop();
            assert.ok(game._stop);
            assert.ok(! game._timeout_id);
            done();
        });
    });

    suite('start()', ()=>{

        const game = new Majiang.Game();

        test('再開すること', (done)=>{
            game.stop();
            game._reply = [];
            game.start();
            assert.ok(! game._stop);
            assert.ok(game._timeout_id);
            setTimeout(()=>{
                assert.ok(! game._timeout_id);
                done();
            }, 0);
        });
        test('二重起動しないこと', ()=>{
            game._timeout_id = 1;
            game.start();
            assert.equal(game._timeout_id, 1);
        });
    });

    suite('notify_players(type, msg)', ()=>{

        const players = [0,1,2,3].map(id => new Player(id));
        const game = new Majiang.Game(players);
        let msg  = ['a','b','c','d'];

        test('通知が伝わること', (done)=>{
            MSG = [];
            game.notify_players(msg);
            assert.equal(MSG.length, 0);
            setTimeout(()=>{
                assert.deepEqual(MSG, msg);
                done();
            }, 0);
        });
    });

    suite('call_players(type, msg, timeout)', ()=>{

        const players = [0,1,2,3].map(id => new Player(id));
        const game = new Majiang.Game(players);
        game._speed = 1;
        let type = 'test';
        let msg  = ['a','b','c','d'];

        test('通知が伝わること', (done)=>{
            MSG = [];
            game._callback = done;
            game.call_players(type, msg);
            assert.equal(MSG.length, 0);
            setTimeout(()=>{
                assert.deepEqual(MSG, msg, 10);
            }, 0);
        });
        test('応答が返ること', (done)=>{
            MSG = [];
            game._callback = done;
            game.call_players(type, msg);
        });
        test('遅い player がいても応答を取得できること', (done)=>{
            MSG = [];
            for (let player of players) { player._delay = 100 }
            game._callback = done;
            game.call_players(type, msg, 0);
        });
    });

    suite('static get_dapai(rule, shoupai)', ()=>{

        let shoupai = Majiang.Shoupai.fromString('m1234p567,z111=,s789-')
                                     .fulou('m1-23');
        test('喰い替えなし', ()=>
            assert.deepEqual(
                Majiang.Game.get_dapai(
                    Majiang.rule({'喰い替え許可レベル':0}), shoupai),
                ['p5','p6','p7']));
        test('現物以外の喰い替えあり', ()=>
            assert.deepEqual(
                Majiang.Game.get_dapai(
                    Majiang.rule({'喰い替え許可レベル':1}), shoupai),
                ['m4','p5','p6','p7']));
        test('現物喰い替えもあり', ()=>
            assert.deepEqual(
                Majiang.Game.get_dapai(
                    Majiang.rule({'喰い替え許可レベル':2}), shoupai),
                ['m1','m4','p5','p6','p7']));
    });

    suite('static get_chi_mianzi(rule, shoupai, p, paishu)', ()=>{

        let shoupai1 = Majiang.Shoupai.fromString('m1234,p456-,z111=,s789-');
        let shoupai2 = Majiang.Shoupai.fromString('m1123,p456-,z111=,s789-');

        test('喰い替えなし', ()=>{
            const rule = Majiang.rule({'喰い替え許可レベル':0});
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(rule, shoupai1, 'm1-', 1), []);
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(rule, shoupai2, 'm1-', 1), []);
        });
        test('現物以外の喰い替えあり', ()=>{
            const rule = Majiang.rule({'喰い替え許可レベル':1});
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(rule, shoupai1, 'm1-', 1),
                ['m1-23']);
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(rule, shoupai2, 'm1-', 1), []);
        });
        test('現物喰い替えもあり', ()=>{
            const rule = Majiang.rule({'喰い替え許可レベル':2});
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(rule, shoupai1, 'm1-', 1),
                ['m1-23']);
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(rule, shoupai2, 'm1-', 1),
                ['m1-23']);
        });
        test('ハイテイは鳴けない', ()=>{
            assert.deepEqual(
                Majiang.Game.get_chi_mianzi(
                    Majiang.rule({'喰い替え許可レベル':2}), shoupai1, 'm1-', 0),
                []);
        });
    });

    suite('static get_peng_mianzi(rule, shoupai, p, paishu)', ()=>{

        let shoupai = Majiang.Shoupai.fromString('m1112,p456-,z111=,s789-');

        test('喰い替えのためにポンできないケースはない', ()=>
            assert.deepEqual(
                Majiang.Game.get_peng_mianzi(
                    Majiang.rule({'喰い替え許可レベル':0}), shoupai, 'm1+', 1),
                ['m111+']));
        test('ハイテイは鳴けない', ()=>
            assert.deepEqual(
                Majiang.Game.get_peng_mianzi(
                    Majiang.rule({'喰い替え許可レベル':0}), shoupai, 'm1+', 0),
                []));
    });

    suite('static get_gang_mianzi(rule, shoupai, p, paishu)', ()=>{

        let shoupai1 = Majiang.Shoupai.fromString('m1112p456s789z111z1*');
        let shoupai2 = Majiang.Shoupai.fromString('m1112p456s789z111m1*');
        let shoupai3 = Majiang.Shoupai.fromString('m23p567s33345666s3*');
        let shoupai4 = Majiang.Shoupai.fromString('s1113445678999s1*');

        test('リーチ後の暗槓なし', ()=>{
            const rule = Majiang.rule({'リーチ後暗槓許可レベル':0});
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai1, null, 1), []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai2, null, 1), []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai3, null, 1), []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai4, null, 1), []);
        });
        test('リーチ後の牌姿の変わる暗槓なし', ()=>{
            const rule = Majiang.rule({'リーチ後暗槓許可レベル':1});
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai1, null, 1),
                ['z1111']);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai2, null, 1), []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai3, null, 1), []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai4, null, 1), []);
        });
        test('リーチ後の待ちの変わる暗槓なし', ()=>{
            const rule = Majiang.rule({'リーチ後暗槓許可レベル':2});
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai1, null, 1),
                ['z1111']);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai2, null, 1), []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai3, null, 1),
                ['s3333']);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule, shoupai4, null, 1),
                ['s1111']);
        });
        test('ハイテイはカンできない', ()=>{
            const rule = Majiang.rule();
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule,
                    Majiang.Shoupai.fromString('m1112p456s789z111z1'),
                    null, 0),
                []);
            assert.deepEqual(
                Majiang.Game.get_gang_mianzi(rule,
                    Majiang.Shoupai.fromString('m1112p456s789z111'),
                    'z1=', 0),
                []);
        });
    });

    suite('static allow_lizhi(rule, shoupai, p, paishu, defen)', ()=>{

        const rule = Majiang.rule();

        test('打牌できない場合、リーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z1122');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai));
        });
        test('すでにリーチしている場合、リーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11223*');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai));
        });
        test('メンゼンでない場合、リーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z23,z111=');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai));
        });
        test('ツモ番がない場合、リーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11223');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai, 'z3', 3));
        });
        test('ルールが許せばツモ番がなくてもリーチは可能', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11223');
            assert.ok(Majiang.Game.allow_lizhi(
                            Majiang.rule({'ツモ番なしリーチあり':true}),
                            shoupai, 'z3', 3));
        });
        test('持ち点が1000点に満たない場合、リーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11223');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai, 'z3', 4, 900));
        });
        test('トビなしなら持ち点が1000点に満たなくてもリーチは可能', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11223');
            assert.ok(Majiang.Game.allow_lizhi(
                            Majiang.rule({'トビ終了あり':false}),
                            shoupai, 'z3', 4, 900));
        });
        test('テンパイしていない場合、リーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11234');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai));
        });
        test('形式テンパイと認められない牌姿でリーチはできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11112');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai, 'z2'));
        });
        test('指定された打牌でリーチ可能な場合、真を返すこと', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z11112');
            assert.ok(Majiang.Game.allow_lizhi(rule, shoupai, 'z1'));
        });
        test('打牌が指定されていない場合、リーチ可能な打牌一覧を返す', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s788z11122');
            assert.deepEqual(Majiang.Game.allow_lizhi(rule, shoupai),
                             ['s7','s8']);
            shoupai = Majiang.Shoupai.fromString('m123p456s789z11223');
            assert.deepEqual(Majiang.Game.allow_lizhi(rule, shoupai),
                             ['z3_']);
        });
        test('リーチ可能な打牌がない場合、false を返す', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m11112344449999');
            assert.ok(! Majiang.Game.allow_lizhi(rule, shoupai));
        });
    });

    suite('static allow_hule(shoupai, p, zhuangfeng, menfeng, '
                                                + 'hupai, neng_rong)', ()=>{
        const rule = Majiang.rule();

        test('フリテンの場合、ロン和了できない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456z1122,s789-');
            assert.ok(! Majiang.Game.allow_hule(
                                rule, shoupai, 'z1=', 0, 1, false, false));
        });
        test('和了形になっていない場合、和了できない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456z11223,s789-');
            assert.ok(! Majiang.Game.allow_hule(
                                rule, shoupai, null, 0, 1, false, true));
        });
        test('役あり和了形の場合、和了できる', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z3377');
            assert.ok(Majiang.Game.allow_hule(
                                rule, shoupai, 'z3+', 0, 1, true, true));
        });
        test('役なし和了形の場合、和了できない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z3377');
            assert.ok(! Majiang.Game.allow_hule(
                                rule, shoupai, 'z3+', 0, 1, false, true));
        });
        test('クイタンなしの場合、クイタンでは和了できない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m22555p234s78,p777-');
            assert.ok(! Majiang.Game.allow_hule(
                                Majiang.rule({'クイタンあり':false}),
                                shoupai, 's6=', 0, 1, false, true));
        });
        test('ツモ和了', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456s789z33377');
            assert.ok(Majiang.Game.allow_hule(
                                rule, shoupai, null, 0, 1, false, false));
        });
        test('ロン和了', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m123p456z1122,s789-');
            assert.ok(Majiang.Game.allow_hule(
                                rule, shoupai, 'z1=', 0, 1, false, true));
        });
    });

    suite('static allow_pingju(rule, shoupai, diyizimo)', ()=>{

        const rule = Majiang.rule();

        test('第一ツモでない場合、九種九牌とならない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m1234569z1234567');
            assert.ok(! Majiang.Game.allow_pingju(rule, shoupai, false));
        });
        test('途中流局なし場合、九種九牌とならない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m1234569z1234567');
            assert.ok(! Majiang.Game.allow_pingju(
                            Majiang.rule({'途中流局あり':false}), shoupai, true));
        });
        test('八種九牌は流局にできない', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m1234567z1234567');
            assert.ok(! Majiang.Game.allow_pingju(rule, shoupai, true));
        });
        test('九種九牌', ()=>{
            let shoupai = Majiang.Shoupai.fromString('m1234569z1234567');
            assert.ok(Majiang.Game.allow_pingju(rule, shoupai, true));
        });
    });
});