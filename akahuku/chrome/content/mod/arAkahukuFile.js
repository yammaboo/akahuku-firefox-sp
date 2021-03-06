/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */

/**
 * gzip ファイル展開用
 *   Inherits From: nsIStreamListener, nsIRequestObserver
 */
function arAkahukuGZIPReader (callback) {
  this.callback = callback;
}
arAkahukuGZIPReader.prototype = {
  data : "",
  callback : null,
    
  /**
   * インターフェースの要求
   *   nsISupports.QueryInterface
   *
   * @param  nsIIDRef iid
   *         インターフェース ID
   * @throws Components.results.NS_NOINTERFACE
   * @return nsIStreamListener
   *         this
   */
  QueryInterface : function (iid) {
    if (iid.equals (nsISupports)
        || iid.equals (nsIStreamListener)
        || iid.equals (nsIRequestObserver)) {
      return this;
    }
        
    throw Components.results.NS_NOINTERFACE;
  },
    
  /**
   * リクエスト開始のイベント
   *   nsIRequestObserver.onStartRequest
   *
   * @param  nsIRequest request
   *         対象のリクエスト
   * @param  nsISupports context
   *         ユーザ定義
   */
  onStartRequest : function (request, context) {
  },
    
  /**
   * リクエスト終了のイベント
   *   nsIRequestObserver.onStopRequest
   *
   * @param  nsIRequest request
   *         対象のリクエスト
   * @param  nsISupports context
   *         ユーザ定義
   * @param  Number statusCode
   *         終了コード
   */
  onStopRequest : function (request, context, statusCode) {
    this.callback (this.data);
  },
    
  /**
   * データ到着のイベント
   *   nsIStreamListener.onDataAvailable
   *
   * @param  nsIRequest request
   *         対象のリクエスト
   * @param  nsISupports context
   *         ユーザ定義
   * @param  nsIInputStream inputStream
   *         データを取得するストリーム
   * @param  PRUint32 offset
   *         データの位置
   * @param  PRUint32 count 
   *         データの長さ
   */
  onDataAvailable : function (request, context, inputStream, offset, count) {
    var bstream
    = Components.classes ["@mozilla.org/binaryinputstream;1"]
    .createInstance (Components.interfaces.nsIBinaryInputStream);
    bstream.setInputStream (inputStream);
    this.data += bstream.readBytes (count);
  }
};

/**
 * ファイル管理
 */
var arAkahukuFile = {
  fileProtocolHandler : null, /* nsIFileProtocolHandler  プロトコルの変換器 */
    
  separator : "\\",           /* String  ネイティブパスのセパレータ */
  systemDirectory : "",       /* String  システムディレクトリ
                               *   Profile ディレクトリ/Akahuku となる */
    
  /**
   * 初期化
   */
  init : function () {
    arAkahukuFile.fileProtocolHandler
    = Components.classes ["@mozilla.org/network/io-service;1"]
    .getService (Components.interfaces.nsIIOService)
    .getProtocolHandler ("file")
    .QueryInterface (Components.interfaces.nsIFileProtocolHandler);
        
    /* 各種ディレクトリを作る */
    arAkahukuFile.makeSystemDirectory ();
  },
    
  /**
   * 現在のユーザの Profile ディレクトリを取得する
   *
   * @return  String
   *          現在のユーザの Profile ディレクトリ
   */
  getProfileDirectory : function () {
    return arAkahukuFile.getDirectory ("ProfD");
  },

  getDirectory : function (key) {
    var dirname;
        
    try {
      dirname
        = Components.classes ["@mozilla.org/file/directory_service;1"]
        .getService (Components.interfaces.nsIProperties)
        .get (key, Components.interfaces.nsIFile).path;
    }
    catch (e) {
      dirname = "";
    }
        
    return dirname;
  },
    
  /**
   * システムディレクトリを作成する
   */
  makeSystemDirectory : function () {
    var dirname = arAkahukuFile.getProfileDirectory ();
    if (dirname.indexOf ("\\") != -1) {
      arAkahukuFile.separator = "\\";
    }
    else if (dirname.indexOf ("/") != -1) {
      arAkahukuFile.separator = "/";
    }
    else if (dirname.indexOf (":") != -1) {
      arAkahukuFile.separator = ":";
    }
    arAkahukuFile.systemDirectory
    = dirname + arAkahukuFile.separator + "Akahuku";
        
    arAkahukuFile.createDirectory (arAkahukuFile.systemDirectory);
  },
    
  /**
   * nsILocalFile オプジェクトを作成する
   * ファイルの実体は作成しない
   *
   * @param  String filename
   *         ファイル名
   * @return nsILocalFile
   */
  initFile : function (filename) {
    var file = null;
    try {
      file
        = Components.classes ["@mozilla.org/file/local;1"]
        .createInstance (Components.interfaces.nsILocalFile);
      file.initWithPath (filename);
    }
    catch (e) {
    }
        
    return file;
  },
    
  /**
   * ファイルを作成する
   *
   * @param  String filename
   *         ファイル名
   * @param  String text
   *         ファイルの内容
   */
  createFile : function (filename, text) {
    var file = null;
    try {
      file
        = Components.classes ["@mozilla.org/file/local;1"]
        .createInstance (Components.interfaces.nsILocalFile);
      file.initWithPath (filename);
      if (!file.exists ()) {
        file.create (0x00, 420/* 0644 */);
      }
    }
    catch (e) {
      file = null;
    }
        
    if (file) {
      try {
        var fstream
        = Components
        .classes ["@mozilla.org/network/file-output-stream;1"]
        .createInstance (Components.interfaces.nsIFileOutputStream);
        fstream.init (file, 0x02 | 0x08 | 0x20, 420/* 0644 */, 0);
        fstream.write (text, text.length);
        fstream.close ();
      }
      catch (e) {
      }
    }
  },

  /**
   * ファイルを作成する(非同期)
   *
   * @param  String filename
   *         ファイル名
   * @param  String text
   *         ファイルの内容
   * @param  function callback
   *         コールバック関数
   */
  asyncCreateFile : function (filename, text, callback) {
    var fstream = null;
    try {
      var file
        = Components.classes ["@mozilla.org/file/local;1"]
        .createInstance (Components.interfaces.nsILocalFile);
      file.initWithPath (filename);
      if (!file.exists ()) {
        file.create (0x00, 420/* 0644 */);
      }
      fstream
      = Components.classes ["@mozilla.org/network/file-output-stream;1"]
      .createInstance (Components.interfaces.nsIFileOutputStream);
      fstream.init (file, 0x02 | 0x08 | 0x20, 420/* 0644 */, 0);
    }
    catch (e) {
      fstream = null;
    }

    if (!fstream) {
      if (typeof callback === "function") {
        arAkahukuUtil.executeSoon
          (callback, [Components.results.NS_ERROR_FAILURE]);
      }
      return;
    }

    if ("nsIAsyncStreamCopier" in Components.interfaces) {
      var istream
      = Components.classes ["@mozilla.org/io/string-input-stream;1"]
      .createInstance (Components.interfaces.nsIStringInputStream);
      istream.setData (text, text.length);
      var copier
      = Components.classes ["@mozilla.org/network/async-stream-copier;1"]
      .createInstance (Components.interfaces.nsIAsyncStreamCopier);
      copier.init (istream, fstream, null, true, false, 0x8000, true, true);
      var observer = {
        onStartRequest: function (r, c) {},
        onStopRequest: function (r, c, statusCode) {
          callback (statusCode);
        }
      }
      copier.asyncCopy (observer, null);
    }
    else {
      // 非対応環境で非同期呼び出しを模擬
      arAkahukuUtil.executeSoon (function () {
        try {
          fstream.write (text, text.length);
          fstream.close ();
        }
        catch (e if e instanceof Components.interfaces.nsIXPCException) {
          callback.apply (null, [e.result]);
          return;
	}
        catch (e) {
          callback.apply (null, [Components.results.NS_ERROR_FAILURE]);
          return;
        }
        callback.apply (null, [Components.results.NS_OK]);
      });
    }
  },
    
  /**
   * ファイルを読み込む
   *
   * @param  String filename
   *         ファイル名
   * @return String
   *         ファイルの内容
   */
  readFile : function (filename) {
    var text = "";
    var file = null;
        
    try {
      file
        = Components.classes ["@mozilla.org/file/local;1"]
        .createInstance (Components.interfaces.nsILocalFile);
      file.initWithPath (filename);
    }
    catch (e) {
      file = null;
    }
        
    if (file) {
      try {
        var fstream
        = Components
        .classes ["@mozilla.org/network/file-input-stream;1"]
        .createInstance (Components.interfaces.nsIFileInputStream);
        var sstream
        = Components
        .classes ["@mozilla.org/scriptableinputstream;1"]
        .createInstance (Components.interfaces
                         .nsIScriptableInputStream);
        fstream.init (file, 0x01, 292/* 0444 */, 0);
        sstream.init (fstream);
        text = sstream.read (-1);
        sstream.close ();
        fstream.close ();
      }
      catch (e) {
        text = "";
      }
    }
        
    return text;
  },
    
  /**
   * バイナリファイルを読み込む
   *
   * @param  String filename
   *         ファイル名
   * @return String
   *         ファイルの内容
   */
  readBinaryFile : function (filename) {
    var bindata = "";
    var file = null;
        
    try {
      file
        = Components.classes ["@mozilla.org/file/local;1"]
        .createInstance (Components.interfaces.nsILocalFile);
      file.initWithPath (filename);
    }
    catch (e) {
      file = null;
    }
        
    if (file) {
      try {
        var fstream
        = Components
        .classes ["@mozilla.org/network/file-input-stream;1"]
        .createInstance (Components.interfaces.nsIFileInputStream);
        var bstream
        = Components
        .classes ["@mozilla.org/binaryinputstream;1"]
        .createInstance (Components.interfaces.nsIBinaryInputStream);
        fstream.init (file, 0x01, 292/* 0444 */, 0);
        bstream.setInputStream (fstream);
        bindata = bstream.readBytes (file.fileSize);
        bstream.close ();
        fstream.close ();
      }
      catch (e) {
        bindata = "";
      }
    }
        
    return bindata;
  },
    
  /**
   * ディレクトリを作成する
   *
   * @param  String dirname
   *         ディレクトリ名
   */
  createDirectory : function (dirname) {
    try {
      var dir
      = Components.classes ["@mozilla.org/file/local;1"]
      .createInstance (Components.interfaces.nsILocalFile);
      dir.initWithPath (dirname);
      if (!dir.exists ()) {
        dir.create (0x01, 493/* 0755 */);
      }
    }
    catch (e) {
    }
  },
    
  /**
   * ネイティブパスを file プロトコルに変換する
   *
   * @param  String filename
   *         ネイティブパス
   * @return String
   *         file プロトコル
   */
  getURLSpecFromFilename : function (filename) {
    var targetFile = arAkahukuFile.initFile (filename);
        
    var url = "";

    try {
      url
        = arAkahukuFile.fileProtocolHandler
        .getURLSpecFromFile (targetFile);
    }
    catch (e) {
    }
        
    return url;
  },

  /**
   * ネイティブパスを file プロトコルに変換する
   *
   * @param  String dirname
   *         ネイティブパス
   * @return String
   *         file プロトコル(末尾に"/"が付く)
   */
  getURLSpecFromDirname : function (dirname) {
    var targetFile = arAkahukuFile.initFile (dirname);
    var url = "";
    var ph = arAkahukuFile.fileProtocolHandler;
    try {
      if ("getURLSpecFromDir" in ph) { // requires Gecko >= 1.9.2
        url = ph.getURLSpecFromDir (targetFile);
      }
      else {
        url = ph.getURLSpecFromFile (targetFile);
        if (url.charAt (url.length - 1) != "/") {
          url += "/";
        }
      }
    }
    catch (e) {
    }
    return url;
  },
    
  /**
   * ファイルを file プロトコルに変換する
   *
   * @param  nsILocalFile file
   *         ファイル
   * @return String
   *         file プロトコル
   */
  getURLSpecFromFile : function (file) {
    var url = null;
        
    try {
      url
        = arAkahukuFile.fileProtocolHandler
        .getURLSpecFromFile (file)
        }
    catch (e) {
    }
        
    return url;
  },
    
  /**
   * file プロトコルをネイティブパスに変換する
   *
   * @param  String uri
   *         file プロトコル
   * @return String
   *         ネイティブパス
   */
  getFilenameFromURLSpec : function (uri) {
    var filename = "";
        
    try {
      filename
        = arAkahukuFile.fileProtocolHandler
        .getFileFromURLSpec (uri).path;
    }
    catch (e) {
    }
        
    return filename;
  },
    
  /**
   * file プロトコルをファイルに変換する
   *
   * @param  String uri
   *         file プロトコル
   * @return nsIFile
   *         ファイル、もしくは
   */
  getFileFromURLSpec : function (uri) {
    var file = null;
        
    try {
      file
        = arAkahukuFile.fileProtocolHandler
        .getFileFromURLSpec (uri);
    }
    catch (e) {
    }
        
    return file;
  },
  
  /**
   * gzip されたファイルを展開する
   */
  gunzip : function (data, callback) {
    var sstream
    = Components.classes ["@mozilla.org/io/string-input-stream;1"]
    .createInstance (Components.interfaces.nsIStringInputStream);
    sstream.setData (data, data.length);
    
    var listener = new arAkahukuGZIPReader (callback);
    
    var converter
    = Components.classes
    ["@mozilla.org/streamconv;1?from=gzip&to=uncompressed"]
    .createInstance (Components.interfaces.nsIStreamConverter);
    converter.asyncConvertData ("gzip", "uncompressed", listener, null);
    
    var listener
    = converter.QueryInterface
    (Components.interfaces.nsIStreamListener);
    listener.onStartRequest (null, null);
    listener.onDataAvailable (null, null,
                              sstream, 0, data.length);
    sstream.close ();
    listener.onStopRequest (null, null, 0);
  }
};
