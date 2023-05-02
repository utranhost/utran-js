/**
 * @license
 * utran v1.0.0
 * Copyright (c) 2023 utran.
 * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
 */
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ws')) :
typeof define === 'function' && define.amd ? define(['exports', 'ws'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.utran = {}, global.WebSocket));
})(this, (function (exports, WebSocket) { 'use strict';

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

var UtType;
(function (UtType) {
    UtType["GET"] = "get";
    UtType["RPC"] = "rpc";
    UtType["POST"] = "post";
    UtType["SUBSCRIBE"] = "subscribe";
    UtType["UNSUBSCRIBE"] = "unsubscribe";
    UtType["PUBLISH"] = "publish";
})(UtType || (UtType = {}));
/**
 * FullRequest转UtRequest
 * @param fullrequest
 * @returns
 */
function fullRequestConvert2UtRequest(fullrequest) {
    var copy = JSON.parse(JSON.stringify(fullrequest));
    if (copy.timeout === undefined) {
        return copy;
    }
    delete copy.timeout;
    return copy;
}
var FutrueError = /** @class */ (function (_super) {
    __extends(FutrueError, _super);
    function FutrueError(err) {
        var _this = _super.call(this, err) || this;
        _this.name = 'FutrueError';
        return _this;
    }
    return FutrueError;
}(Error));
var Futrue = /** @class */ (function () {
    function Futrue(source) {
        var _this = this;
        this.isPending = true;
        this.source = source;
        this.promise = new Promise(function (resolve, reject) {
            _this.reject = reject;
            _this.resolve = resolve;
        });
    }
    Futrue.prototype.getSource = function () {
        if (this.source === undefined)
            throw new FutrueError('<Futrue>: 不能获取source，初始化Futrue时未指定。');
        return this.source;
    };
    Futrue.prototype.holding = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.result !== undefined)
                            return [2 /*return*/, this.result];
                        return [4 /*yield*/, this.promise];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Futrue.prototype.getResult = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.result !== undefined)
                            return [2 /*return*/, this.result];
                        return [4 /*yield*/, this.promise];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Futrue.prototype.finally = function (cb) {
        this.promise.finally(function () { return cb(); });
    };
    Futrue.prototype.setError = function (err) {
        if (!this.isPending)
            throw new FutrueError('任务已完成不能重复调用"setError"方法.');
        this.reject(err);
        this.isPending = false;
    };
    Futrue.prototype.setResult = function (res) {
        if (!this.isPending)
            throw new FutrueError('任务已完成不能重复调用"setResult"方法.');
        this.result = res;
        this.resolve(res);
        this.isPending = false;
    };
    return Futrue;
}());
var RequestParamError = /** @class */ (function (_super) {
    __extends(RequestParamError, _super);
    function RequestParamError(err, request) {
        var _this = _super.call(this, err) || this;
        _this.name = 'RequestParamError';
        _this.request = request;
        return _this;
    }
    return RequestParamError;
}(Error));
/** @class */ ((function (_super) {
    __extends(RequestFaildError, _super);
    function RequestFaildError(err, request) {
        var _this = _super.call(this, err) || this;
        _this.name = 'RequestFaildError';
        _this.request = request;
        return _this;
    }
    return RequestFaildError;
})(Error));
/** @class */ ((function (_super) {
    __extends(RequestBreakError, _super);
    function RequestBreakError(err, request) {
        var _this = _super.call(this, err) || this;
        _this.name = 'RequestBreakError';
        _this.request = request;
        return _this;
    }
    return RequestBreakError;
})(Error));
var LoaclWaitTimoutError = /** @class */ (function (_super) {
    __extends(LoaclWaitTimoutError, _super);
    function LoaclWaitTimoutError(err) {
        var _this = _super.call(this, err) || this;
        _this.name = 'LoaclWaitTimoutError';
        return _this;
    }
    return LoaclWaitTimoutError;
}(Error));
var ConnectionFaildError = /** @class */ (function (_super) {
    __extends(ConnectionFaildError, _super);
    function ConnectionFaildError(err) {
        var _this = _super.call(this, err) || this;
        _this.name = 'ConnectionFaildError';
        return _this;
    }
    return ConnectionFaildError;
}(Error));
function request2Faild(request, errMsg) {
    var response;
    if (request.requestType === UtType.RPC) {
        var id = request.id, requestType = request.requestType, methodName = request.methodName;
        response = { id: id, responseType: requestType, state: 0, methodName: methodName, error: errMsg };
    }
    else {
        var id = request.id, requestType = request.requestType;
        response = { id: id, responseType: requestType, state: 0, error: errMsg };
    }
    return response;
}
var RequestFuture = /** @class */ (function (_super) {
    __extends(RequestFuture, _super);
    function RequestFuture() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RequestFuture.prototype.setRequest2Faild = function (errMsg) {
        var utRequest = this.getSource();
        var response = request2Faild(utRequest, errMsg);
        this.setResult(response);
        return response;
    };
    return RequestFuture;
}(Futrue));
var FullRequestFuture = /** @class */ (function (_super) {
    __extends(FullRequestFuture, _super);
    function FullRequestFuture() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    FullRequestFuture.prototype.setRequest2Faild = function (errMsg) {
        var fullRequest = this.getSource();
        var response = request2Faild(fullRequest, errMsg);
        this.setResult(response);
        return response;
    };
    FullRequestFuture.prototype.getFullRequest = function () {
        return this.getSource();
    };
    FullRequestFuture.prototype.getUtRequest = function () {
        return fullRequestConvert2UtRequest(this.getFullRequest());
    };
    return FullRequestFuture;
}(Futrue));
var UtCache = /** @class */ (function () {
    function UtCache(name) {
        if (name === void 0) { name = 'Cache'; }
        this.name = name;
        this.data = {};
    }
    UtCache.prototype.push = function (id, value) {
        if (this.data[id] !== undefined)
            console.warn("<".concat(this.name, "[").concat(id, "]>: is overwritten!"));
        this.data[id] = value;
    };
    UtCache.prototype.pop = function (id) {
        if (this.data[id] !== undefined) {
            var res = this.data[id];
            delete this.data[id];
            return res;
        }
        return null;
    };
    UtCache.prototype.getAllData = function () {
        return Object.values(this.data);
    };
    UtCache.prototype.clear = function () {
        var data = Object.values(this.data);
        this.data = {};
        return data;
    };
    return UtCache;
}());
var FullRequstFutureCache = /** @class */ (function (_super) {
    __extends(FullRequstFutureCache, _super);
    function FullRequstFutureCache() {
        return _super.call(this, 'FullRequstFutureCache') || this;
    }
    /**
     * 将所有的Future设置为失败响应
     * @param errMsg
     * @returns
     */
    FullRequstFutureCache.prototype.setAllRequest2Faild = function (errMsg) {
        this.clear().forEach(function (fullRequestFuture) {
            fullRequestFuture.setRequest2Faild(errMsg);
        });
    };
    FullRequstFutureCache.prototype.getAllUtRequest = function () {
        return this.getAllData().map(function (fullRequestFuture) {
            return fullRequestFuture.getUtRequest();
        });
    };
    return FullRequstFutureCache;
}(UtCache));
var UtState;
(function (UtState) {
    UtState["RUNING"] = "\u6B63\u5E38\u8FD0\u884C\u4E2D";
    UtState["DISCONECTION"] = "\u8FDE\u63A5\u65AD\u5F00";
    UtState["UN_START"] = "\u5BA2\u6237\u7AEF\u672A\u542F\u52A8";
    UtState["RECONNECTING"] = "\u6B63\u5728\u91CD\u8FDE\u4E2D";
    UtState["RECONNECT_FAILDE"] = "\u91CD\u8FDE\u5931\u8D25";
    UtState["CONNECT_FAILED"] = "\u8FDE\u63A5\u670D\u52A1\u7AEF\u5931\u8D25";
})(UtState || (UtState = {}));
var ClientState = /** @class */ (function () {
    function ClientState(state, extra) {
        if (extra === void 0) { extra = ''; }
        this.state = state;
        this.extra = extra;
    }
    ClientState.prototype.changeState = function (state, extra) {
        if (extra === void 0) { extra = ''; }
        this.state = state;
        this.extra = extra;
    };
    ClientState.prototype.getState = function () {
        return this.state;
    };
    ClientState.prototype.getMsg = function () {
        if (this.extra === '') {
            return this.state;
        }
        return this.state + ',' + this.extra;
    };
    return ClientState;
}());
var TopicHandlerCollection = /** @class */ (function () {
    function TopicHandlerCollection() {
        this.handler = [];
        this.topics = [];
    }
    TopicHandlerCollection.prototype.add = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        var self = this;
        items.forEach(function (e) {
            self.topics.push(e[0]);
            self.handler.push(e[1]);
        });
    };
    TopicHandlerCollection.prototype.getCallback = function (topic) {
        var self = this;
        return self.handler.filter(function (_, index) { return topic === self.topics[index]; });
    };
    TopicHandlerCollection.prototype.getAllTopics = function () {
        return this.topics;
    };
    TopicHandlerCollection.prototype.remove = function (topic) {
        var n = this.topics.length;
        var self = this;
        for (var i = n - 1; i >= 0; i--) {
            if (self.topics[i] === topic) {
                self.topics.splice(i, 1);
                self.handler.splice(i, 1);
            }
        }
    };
    return TopicHandlerCollection;
}());

function isErrorInstanceOf(error, errorType) {
    if (typeof error === 'object' && 'name' in error) {
        if (error.name === errorType.name)
            return true;
        return false;
    }
    return false;
}
/**
 * 数据转二进制
 * @param data
 * @returns
 */
function toBuffer(data) {
    return new TextEncoder().encode(JSON.stringify(data)).buffer;
}
function isNodePlatform() {
    return typeof window === 'undefined';
}
function ArrayBufferToString(buffer) {
    var decoder = new TextDecoder();
    var json = decoder.decode(buffer);
    return json;
}
/**
 * 二进制数据转字符串
 * @param buffer
 * @returns
 */
function BufferToString(buffer) {
    if (typeof buffer === 'string')
        return buffer;
    if (isNodePlatform()) {
        var d = buffer instanceof ArrayBuffer ? ArrayBufferToString(buffer) : buffer;
        var a = d instanceof Buffer ? d.toString() : d instanceof Array ? d.map(function (v) { return v.toString(); }).join('') : d;
        return a;
    }
    else {
        var d = buffer instanceof ArrayBuffer ? ArrayBufferToString(buffer) : buffer;
        return d;
    }
}
/**
 * 生成token
 * @param usename
 * @param password
 * @returns
 */
function basicAuth(usename, password) {
    var b = btoa("".concat(usename, ":").concat(password));
    return "Basic ".concat(b);
}
/**
 * 参数解构,返回请求所需的参数,args和dicts
 * @param params
 * @returns
 */
function parameterDeconstruction() {
    var params = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        params[_i] = arguments[_i];
    }
    var p = __assign({}, params);
    var keys = Object.keys(p);
    var args = [];
    var dicts = {};
    keys.forEach(function (key, index) {
        var param = p[key];
        if (parseInt(key) === index) {
            if (typeof param === 'object') {
                Object.assign(dicts, param);
            }
            else {
                args.push(param);
            }
        }
        else {
            dicts[key] = param;
        }
    });
    return { args: args, dicts: dicts };
}
var UtTypeValues = Object.values(UtType);
/**
 * 检查请求体
 * @param request
 * @returns
 */
function checkRequstIsError(request) {
    if (typeof request.id !== 'number') {
        return new RequestParamError('请求体必需包含"id"字段,且必须是number', request);
    }
    if (!UtTypeValues.includes(request.requestType)) {
        return new RequestParamError("\u8BF7\u6C42\u4F53\u5FC5\u9700\u5305\u542B\"requestType\"\u5B57\u6BB5,\u4E14\u503C\u5FC5\u987B\u662F[".concat(UtTypeValues.toString(), "]\u5176\u4E2D\u4E4B\u4E00."), request);
    }
    var requestType = request.requestType;
    if (requestType === UtType.RPC) {
        if (!('methodName' in request)) {
            return new RequestParamError("".concat(UtType.RPC, "\u8BF7\u6C42\u5FC5\u987B\u6709\"methodName\"\u5B57\u6BB5."), request);
        }
        if (!('args' in request)) {
            return new RequestParamError("".concat(UtType.RPC, "\u8BF7\u6C42\u5FC5\u987B\u6709\"args\"\u5B57\u6BB5."), request);
        }
        if (!('dicts' in request)) {
            return new RequestParamError("".concat(UtType.RPC, "\u8BF7\u6C42\u5FC5\u987B\u6709\"dicts\"\u5B57\u6BB5."), request);
        }
        return null;
    }
    else if ((requestType === UtType.SUBSCRIBE) || (requestType === UtType.UNSUBSCRIBE)) {
        if (!('topics' in request)) {
            return new RequestParamError("".concat(request.requestType, "\u8BF7\u6C42\u5FC5\u987B\u6709\"topics\"\u5B57\u6BB5."), request);
        }
        return null;
    }
    return null;
}

var RequestFutureCache = /** @class */ (function (_super) {
    __extends(RequestFutureCache, _super);
    function RequestFutureCache() {
        return _super.call(this, 'RequestFutureCache') || this;
    }
    return RequestFutureCache;
}(UtCache));
var BreakErrorMsg = '请求失败，连接非安全退出而中断';
var UtSocket = /** @class */ (function () {
    function UtSocket(url, disconnectCallback, publishCallback) {
        if (disconnectCallback === void 0) { disconnectCallback = function () { }; }
        if (publishCallback === void 0) { publishCallback = function () { }; }
        this.url = url;
        this.disconnectCallback = disconnectCallback;
        this.publishCallback = publishCallback;
        this.requestFutureCahe = new RequestFutureCache();
        this.allMsgListener = [];
        this.allOpenListener = [];
        this.allCloseListener = [];
        this.allErrorListener = [];
        this.isruning = false;
        this.isSafeExit = false;
        this.isNodePlatform = isNodePlatform();
        this.disconnectCallback = disconnectCallback;
        this.publishCallback = publishCallback;
    }
    UtSocket.prototype.getState = function () {
        return this.isruning;
    };
    /**
     * 启动socket
     * @returns
     */
    UtSocket.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var self;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        if (!self.isruning) return [3 /*break*/, 2];
                        return [4 /*yield*/, self.startFutrue.holding()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        self.isruning = true;
                        self.startFutrue = new Futrue();
                        self.soket = new WebSocket(self.url);
                        // const {publicKey,privateKey} = await generateKeyPair()
                        self.onError(function (event) {
                            console.error("\u8FDE\u63A5\u51FA\u9519: ".concat(String(event)));
                            self.startFutrue.setError(new ConnectionFaildError(String(event)));
                        }, true);
                        // self.onOpen(event=>{
                        //   // event.target
                        // },true)
                        self.onMessage(function (event) {
                            (function () { return __awaiter(_this, void 0, void 0, function () {
                                var data, msg;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            data = event.data;
                                            if (!(data instanceof Blob)) return [3 /*break*/, 2];
                                            return [4 /*yield*/, data.arrayBuffer()];
                                        case 1:
                                            data = _a.sent();
                                            _a.label = 2;
                                        case 2:
                                            msg = BufferToString(data);
                                            if (msg === 'ok') {
                                                console.log('连接成功.');
                                                self.isSafeExit = false;
                                                self.initListener();
                                                self.startFutrue.setResult(self);
                                            }
                                            else {
                                                self.startFutrue.setError(new ConnectionFaildError(msg));
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); })().then(function () { }).catch(function (err) {
                                console.error(err);
                                self.startFutrue.setError(new ConnectionFaildError(err));
                            });
                        }, true);
                        self.onClose(function () {
                            console.log('连接关闭.');
                            self.isruning = false;
                        }, true);
                        return [4 /*yield*/, self.startFutrue.holding()];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 发送请求
     * @param request
     * @param timeout
     * @returns
     */
    UtSocket.prototype.send = function (request, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            var reqFutrue, paramError, self_1, timer_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        reqFutrue = new RequestFuture(request);
                        this.requestFutureCahe.push(request.id, reqFutrue);
                        paramError = checkRequstIsError(request);
                        if (!(paramError !== null)) return [3 /*break*/, 2];
                        reqFutrue.setError(paramError);
                        return [4 /*yield*/, reqFutrue.getResult()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        this.soket.send(toBuffer(request));
                        if (typeof timeout === 'number') {
                            self_1 = this;
                            timer_1 = setTimeout(function () {
                                self_1.requestFutureCahe.pop(request.id);
                                reqFutrue.setRequest2Faild("\u672C\u5730\u7B49\u5F85\u8D85\u65F6\uFF1A".concat(timeout, "s"));
                            }, timeout * 1000);
                            reqFutrue.finally(function () {
                                if (timer_1 !== undefined)
                                    clearTimeout(timer_1);
                            });
                        }
                        return [4 /*yield*/, reqFutrue.getResult()];
                    case 3: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 初始化监听
     */
    UtSocket.prototype.initListener = function () {
        var self = this;
        self.offAllListener(); // 清除所有的监听
        self.onMessage(self.onResponse.bind(self));
        self.onError(function (event) {
            console.warn("onError\u9519\u8BEF:".concat(String(event.error)));
        });
        self.onClose(function () {
            var requestFutures = self.requestFutureCahe.clear();
            if (self.isSafeExit) {
                self.requestFutureCahe.clear().forEach(function (reqFutrue) {
                    // reqFutrue.setError(new RequestFaildError('请求失败，Socket已经关闭', reqFutrue.getSource()))
                    reqFutrue.setRequest2Faild('请求失败，Socket已执行退出关闭');
                });
            }
            else {
                requestFutures.forEach(function (reqFutrue) {
                    // reqFutrue.setError(new RequestBreakError('请求失败，连接非安全退出而中断', reqFutrue.getSource()))
                    reqFutrue.setRequest2Faild(BreakErrorMsg);
                });
            }
            self.isruning = false;
            self.offAllListener(); // 清除所有的监听
            self.disconnectCallback(self.isSafeExit);
        });
    };
    /**
     * 退出，关闭soket
     */
    UtSocket.prototype.exit = function () {
        this.isSafeExit = true;
        this.soket.close();
        console.log('程序退出');
    };
    /**
     * 清除soket上所有的监听
     */
    UtSocket.prototype.offAllListener = function () {
        var self = this;
        this.allMsgListener.forEach(function (cb) {
            self.soket.removeEventListener('message', cb);
        });
        this.allOpenListener.forEach(function (cb) {
            self.soket.removeEventListener('open', cb);
        });
        this.allCloseListener.forEach(function (cb) {
            self.soket.removeEventListener('close', cb);
        });
        this.allErrorListener.forEach(function (cb) {
            self.soket.removeEventListener('error', cb);
        });
    };
    UtSocket.prototype.onMessage = function (cb, once) {
        if (once === void 0) { once = false; }
        this.allMsgListener.push(cb);
        this.soket.addEventListener('message', cb, { once: once });
    };
    UtSocket.prototype.onOpen = function (cb, once) {
        if (once === void 0) { once = false; }
        this.allOpenListener.push(cb);
        this.soket.addEventListener('open', cb, { once: once });
    };
    UtSocket.prototype.onClose = function (cb, once) {
        if (once === void 0) { once = false; }
        this.allCloseListener.push(cb);
        this.soket.addEventListener('close', cb, { once: once });
    };
    UtSocket.prototype.onError = function (cb, once) {
        if (once === void 0) { once = false; }
        this.allErrorListener.push(cb);
        this.soket.addEventListener('error', cb, { once: once });
    };
    UtSocket.prototype.onResponse = function (event) {
        var data = BufferToString(event.data);
        var response = JSON.parse(data);
        if (response.responseType === UtType.PUBLISH) {
            var _a = response.result, topic = _a.topic, msg = _a.msg;
            this.publishCallback(topic, msg);
        }
        if ([UtType.RPC, UtType.SUBSCRIBE, UtType.UNSUBSCRIBE].includes(response.responseType)) {
            var reqFutrue = this.requestFutureCahe.pop(response.id);
            if (reqFutrue !== null) {
                reqFutrue.setResult(response);
            }
        }
    };
    return UtSocket;
}());

var BaseClient = /** @class */ (function () {
    function BaseClient(url, token, maxReconnectNum) {
        if (maxReconnectNum === void 0) { maxReconnectNum = 32; }
        this.requestId = 0;
        this.fullRequstFutureCache = new FullRequstFutureCache();
        this.state = new ClientState(UtState.UN_START);
        this.topicHandlers = new TopicHandlerCollection();
        this.url = "".concat(url, "?ticket=").concat(token);
        this.socket = new UtSocket(this.url, this.onDisconnect.bind(this), this.onPublish.bind(this));
        this.maxReconnectNum = maxReconnectNum;
    }
    BaseClient.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.socket.start()];
                    case 1:
                        _a.sent();
                        this.state.changeState(UtState.RUNING);
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        this.state.changeState(UtState.CONNECT_FAILED, error_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BaseClient.prototype.genRequestId = function () {
        this.requestId++;
        return this.requestId;
    };
    BaseClient.prototype.onDisconnect = function (isSafeExit, reconnectNum) {
        if (reconnectNum === void 0) { reconnectNum = 0; }
        var self = this;
        var faildRequest = self.fullRequstFutureCache.getAllUtRequest();
        self.reconnectFuture = new Futrue();
        if (isSafeExit) {
            // 安全退出
            self.state.changeState(UtState.RECONNECT_FAILDE);
            self.fullRequstFutureCache.setAllRequest2Faild('请求发送失败，原因:执行安全退出');
            self.reconnectFuture.setResult(false);
            return;
        }
        console.warn("\u5C1D\u8BD5\u91CD\u8FDE:".concat(reconnectNum, "/").concat(self.maxReconnectNum));
        self.state.changeState(UtState.DISCONECTION);
        new UtSocket(this.url, this.onDisconnect.bind(this), this.onPublish.bind(this)).start()
            .then(function (socket) {
            // 重连成功
            self.socket = socket;
            self.state.changeState(UtState.RUNING);
            // 重新订阅
            self.reSubscribe().finally(function () { });
            // 重新发起请求
            faildRequest.forEach(function (request) {
                socket.send(request)
                    .then(function (response) {
                    // 请求发送成功
                    self.state.changeState(UtState.RUNING);
                    var fullRequestFuture = self.fullRequstFutureCache.pop(response.id);
                    if (fullRequestFuture !== null) {
                        if (fullRequestFuture.isPending)
                            fullRequestFuture.setResult(response);
                    }
                })
                    .catch(function (err) {
                    // 请求发送失败
                    self.state.changeState(UtState.DISCONECTION);
                    console.warn("\u91CD\u53D1[".concat(request.requestType, "]").concat(request.id, "\u8BF7\u6C42\u5931\u8D25:").concat(String(err)));
                });
            });
            self.reconnectFuture.setResult(true);
        }).catch(function (err) {
            console.warn("\u8FDE\u63A5\u5931\u8D25\uFF0C\u5269\u4F59\u91CD\u8FDE\uFF1A".concat(reconnectNum, "/").concat(self.maxReconnectNum));
            if (reconnectNum < self.maxReconnectNum) {
                self.state.changeState(UtState.RECONNECTING);
                reconnectNum++;
                setTimeout(function () {
                    self.onDisconnect(false, reconnectNum);
                }, 1000 * Math.log(reconnectNum) * 2);
            }
            else {
                self.state.changeState(UtState.RECONNECT_FAILDE);
                self.fullRequstFutureCache.setAllRequest2Faild("\u8BF7\u6C42\u53D1\u9001\u5931\u8D25\uFF0C\u539F\u56E0:".concat(self.state.getMsg()));
                self.reconnectFuture.setResult(false);
                console.error("\u8FDE\u63A5\u5931\u8D25\uFF0C\u7ED3\u675F\u91CD\u8FDE.\n".concat(String(err)));
            }
        });
    };
    BaseClient.prototype.onPublish = function (topic, msg) {
        this.topicHandlers.getCallback(topic).forEach(function (cb) {
            cb(topic, msg);
        });
    };
    BaseClient.prototype.reSubscribe = function () {
        return __awaiter(this, void 0, void 0, function () {
            var id, topics, request, response, _a, allTopics_1, subTopics, diff;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        id = this.genRequestId();
                        topics = this.topicHandlers.getAllTopics();
                        if (topics.length === 0)
                            return [2 /*return*/, true];
                        console.log('重新订阅:', topics);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        request = { id: id, requestType: UtType.SUBSCRIBE, topics: topics };
                        return [4 /*yield*/, this.socket.send(request)];
                    case 2:
                        response = _b.sent();
                        if (response.state === 1) {
                            _a = response.result, allTopics_1 = _a.allTopics, subTopics = _a.subTopics;
                            diff = topics.filter(function (item) {
                                return !allTopics_1.includes(item);
                            });
                            console.log('已重新订阅:', subTopics);
                            if (diff.length !== 0) {
                                console.error('有未成功的订阅:', diff);
                                return [2 /*return*/, false];
                            }
                            return [2 /*return*/, true];
                        }
                        return [2 /*return*/, false];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BaseClient.prototype.sendRequest2 = function (fullRequest) {
        var id = fullRequest.id;
        var self = this;
        var fullreqFutrue = new FullRequestFuture(fullRequest);
        if (self.state.getState() !== UtState.RUNING) {
            fullreqFutrue.setRequest2Faild("\u8BF7\u6C42\u53D1\u9001\u5931\u8D25\uFF0C\u539F\u56E0:".concat(self.state.getMsg()));
            return fullreqFutrue;
        }
        self.fullRequstFutureCache.push(id, fullreqFutrue);
        self.socket.send(fullreqFutrue.getUtRequest(), fullRequest.timeout)
            .then(function (response) {
            if (response.error === BreakErrorMsg)
                return;
            if (fullreqFutrue.isPending)
                fullreqFutrue.setResult(response);
            self.fullRequstFutureCache.pop(id);
        })
            .catch(function (error) {
            if (isErrorInstanceOf(error, RequestParamError)) {
                if (fullreqFutrue.isPending)
                    fullreqFutrue.setResult(error);
            }
        });
        return fullreqFutrue;
    };
    BaseClient.prototype.sendRequest = function (fullRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var id, fullreqFutrue, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = fullRequest.id;
                        fullreqFutrue = new FullRequestFuture(fullRequest);
                        if (this.state.getState() !== UtState.RUNING) {
                            return [2 /*return*/, fullreqFutrue.setRequest2Faild("\u8BF7\u6C42\u53D1\u9001\u5931\u8D25\uFF0C\u539F\u56E0:".concat(this.state.getMsg()))];
                        }
                        this.fullRequstFutureCache.push(id, fullreqFutrue);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 7]);
                        return [4 /*yield*/, this.socket.send(fullreqFutrue.getUtRequest(), fullRequest.timeout)];
                    case 2:
                        response = _a.sent();
                        if (!(response.error === BreakErrorMsg)) return [3 /*break*/, 4];
                        return [4 /*yield*/, fullreqFutrue.getResult()];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        if (fullreqFutrue.isPending)
                            fullreqFutrue.setResult(response);
                        this.fullRequstFutureCache.pop(id);
                        return [2 /*return*/, response];
                    case 5:
                        error_3 = _a.sent();
                        if (isErrorInstanceOf(error_3, RequestParamError)) {
                            throw error_3;
                        }
                        return [4 /*yield*/, fullreqFutrue.getResult()];
                    case 6: return [2 /*return*/, _a.sent()];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    BaseClient.prototype.subscribe = function (topic, callback, timeout, isReSub) {
        if (isReSub === void 0) { isReSub = false; }
        return __awaiter(this, void 0, void 0, function () {
            var id, fullRequest, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = this.genRequestId();
                        fullRequest = { id: id, requestType: UtType.SUBSCRIBE, topics: [topic], timeout: timeout };
                        return [4 /*yield*/, this.sendRequest(fullRequest)];
                    case 1:
                        response = _a.sent();
                        if (response.state === 1 && !isReSub) {
                            // 添加订阅
                            this.topicHandlers.add([topic, callback]);
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    BaseClient.prototype.unsubscribe = function (topics, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            var id, fullRequest, response, self_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = this.genRequestId();
                        fullRequest = { id: id, requestType: UtType.UNSUBSCRIBE, topics: topics, timeout: timeout };
                        return [4 /*yield*/, this.sendRequest(fullRequest)];
                    case 1:
                        response = _a.sent();
                        if (response.state === 1) {
                            self_1 = this;
                            topics.forEach(function (topic) {
                                self_1.topicHandlers.remove(topic);
                            });
                        }
                        return [2 /*return*/, response];
                }
            });
        });
    };
    BaseClient.prototype.exit = function () {
        try {
            this.socket.exit();
        }
        catch (error) {
            this.onDisconnect(true);
        }
        console.log('安全退出.');
    };
    return BaseClient;
}());
var UtClient = /** @class */ (function (_super) {
    __extends(UtClient, _super);
    function UtClient(url, utclientInitOptions) {
        if (utclientInitOptions === void 0) { utclientInitOptions = {}; }
        var _this = this;
        var _a = utclientInitOptions.username, username = _a === void 0 ? 'utranhost' : _a, _b = utclientInitOptions.password, password = _b === void 0 ? 'utranhost' : _b, _c = utclientInitOptions.maxReconnectNum, maxReconnectNum = _c === void 0 ? 32 : _c, timeout = utclientInitOptions.timeout, _d = utclientInitOptions.outputResult, outputResult = _d === void 0 ? false : _d, defaultResult = utclientInitOptions.defaultResult, _e = utclientInitOptions.throwTimeoutError, throwTimeoutError = _e === void 0 ? false : _e;
        var token = basicAuth(username, password);
        _this = _super.call(this, url, token, maxReconnectNum) || this;
        _this.timeout = timeout;
        _this.outputResult = outputResult;
        _this.defaultResult = defaultResult;
        _this.throwTimeoutError = throwTimeoutError;
        return _this;
    }
    UtClient.prototype.setOptions = function (opts) {
        this.tempOpts = opts;
        return this;
    };
    UtClient.prototype.getOptions = function (isclear) {
        if (isclear === void 0) { isclear = true; }
        var _a = this.tempOpts, timeout = _a.timeout, outputResult = _a.outputResult, defaultResult = _a.defaultResult, throwTimeoutError = _a.throwTimeoutError;
        timeout = timeout === undefined ? this.timeout : timeout;
        outputResult = outputResult === undefined ? this.outputResult : outputResult;
        defaultResult = defaultResult === undefined ? this.defaultResult : defaultResult;
        throwTimeoutError = throwTimeoutError === undefined ? this.throwTimeoutError : throwTimeoutError;
        if (isclear)
            this.tempOpts = {};
        return { timeout: timeout, outputResult: outputResult, defaultResult: defaultResult };
    };
    UtClient.prototype.callByName = function (methodName) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a, timeout, outputResult, defaultResult, _b, args, dicts, id, fullrequest, response;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.getOptions(), timeout = _a.timeout, outputResult = _a.outputResult, defaultResult = _a.defaultResult;
                        _b = parameterDeconstruction.apply(void 0, __spreadArray([], __read(params), false)), args = _b.args, dicts = _b.dicts;
                        id = this.genRequestId();
                        fullrequest = { id: id, requestType: UtType.RPC, methodName: methodName, args: args, dicts: dicts, timeout: timeout };
                        return [4 /*yield*/, this.sendRequest(fullrequest)];
                    case 1:
                        response = _c.sent();
                        if (outputResult === true) {
                            return [2 /*return*/, response.result === undefined ? defaultResult : response.result];
                        }
                        else {
                            return [2 /*return*/, response];
                        }
                }
            });
        });
    };
    UtClient.prototype.multicall = function () {
        var miniRequests = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            miniRequests[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._multicall(miniRequests)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    UtClient.prototype._multicall = function (miniRequests) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, timeout, outputResult, defaultResult, throwTimeoutError, self, timeoutMsg, calls, callFutures, responses, isTimeout, index, r, _b, args, dicts, methodName, id, fullrequest, futrue, index, response, result;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = this.getOptions(), timeout = _a.timeout, outputResult = _a.outputResult, defaultResult = _a.defaultResult, throwTimeoutError = _a.throwTimeoutError;
                        self = this;
                        timeoutMsg = "multicall\u672C\u5730\u7B49\u5F85\u8D85\u65F6\uFF1A".concat(timeout, "s");
                        calls = [];
                        callFutures = [];
                        responses = [];
                        isTimeout = false;
                        if (typeof timeout === 'number')
                            setTimeout(function () { isTimeout = true; }, timeout * 1000);
                        for (index = 0; index < miniRequests.length; index++) {
                            if (isTimeout && throwTimeoutError === true)
                                throw new LoaclWaitTimoutError(timeoutMsg);
                            r = miniRequests[index];
                            _b = parameterDeconstruction.apply(void 0, __spreadArray([], __read(r.params), false)), args = _b.args, dicts = _b.dicts;
                            methodName = r.methodName;
                            id = this.genRequestId();
                            fullrequest = { id: id, requestType: UtType.RPC, methodName: methodName, args: args, dicts: dicts, timeout: timeout };
                            futrue = self.sendRequest2(fullrequest);
                            callFutures.push(futrue);
                            calls.push(futrue.getResult());
                        }
                        index = 0;
                        _c.label = 1;
                    case 1:
                        if (!(index < calls.length)) return [3 /*break*/, 4];
                        if (isTimeout) {
                            if (throwTimeoutError === true)
                                throw new LoaclWaitTimoutError(timeoutMsg);
                            responses = [];
                            callFutures.forEach(function (fullRequestFuture) {
                                self.fullRequstFutureCache.pop(fullRequestFuture.getSource().id);
                                if (outputResult === true) {
                                    responses.push(fullRequestFuture.isPending ? defaultResult : fullRequestFuture.result.result);
                                }
                                else {
                                    responses.push(fullRequestFuture.isPending ? fullRequestFuture.setRequest2Faild(timeoutMsg) : fullRequestFuture.result.result);
                                }
                            });
                            return [3 /*break*/, 4];
                        }
                        return [4 /*yield*/, calls[index]];
                    case 2:
                        response = _c.sent();
                        result = outputResult !== true ? response : response.result !== undefined ? response.result : defaultResult;
                        responses.push(result);
                        _c.label = 3;
                    case 3:
                        index++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, responses];
                }
            });
        });
    };
    return UtClient;
}(BaseClient));

var CallAgent = /** @class */ (function (_super) {
    __extends(CallAgent, _super);
    function CallAgent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._methodName = '';
        _this._options = {};
        return _this;
    }
    return CallAgent;
}(Function));
function createCallAgent(client) {
    var callAgent = new CallAgent();
    var proxy = new Proxy(callAgent, {
        get: function (target, p) {
            if (typeof p === 'string') {
                callAgent._methodName += callAgent._methodName === '' ? p : '.'.concat(p);
                return proxy;
            }
            return target[p];
        },
        apply: function (target, _thisArg, argArray) {
            if (target._methodName === '') {
                target._options = argArray[0];
                return proxy;
            }
            client.setOptions(Object.keys(callAgent._options).length !== 0 ? callAgent._options : client._get_opts());
            callAgent._options = {};
            var methodName = target._methodName;
            target._methodName = '';
            var res = client.callByName.apply(client, __spreadArray([methodName], __read(argArray), false));
            return res;
        }
    });
    return proxy;
}
var Client = /** @class */ (function (_super) {
    __extends(Client, _super);
    function Client() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.call = createCallAgent(_this);
        return _this;
    }
    Client.prototype._get_opts = function () {
        return this.tempOpts;
    };
    return Client;
}(UtClient));

/**
 * Utran version
 * @return {string}
 */
function version() {
    return '1.0.0';
}

exports.Client = Client;
exports.version = version;

}));
