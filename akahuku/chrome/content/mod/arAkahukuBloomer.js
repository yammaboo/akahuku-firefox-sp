/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */

/**
 * Require: arAkahukuConfig, arAkahukuFile
 */

/**
 * ブルマ女将管理
 *   [ブルマ女将]
 */
var arAkahukuBloomer = {
  enable : false,         /* Boolean  ブルマ女将 */
  keycode : 0,            /* Number  ショートカットキーのキーコード */
  modifiersAlt : false,   /* Boolean  ショートカットキーの Alt */
  modifiersCtrl : false,  /* Boolean  ショートカットキーの Ctrl */
  modifiersMeta : false,  /* Boolean  ショートカットキーの Meta */
  modifiersShift : false, /* Boolean  ショートカットキーの Shift */
  file : "",              /* String  ブルマ女将の場所 */
    
  /**
   * 初期化処理
   */
  init : function () {
    window.addEventListener
    ("keydown",
     function () {
      arAkahukuBloomer.onKeyDown (arguments [0]);
    }, true);
  },
    
  /**
   * 設定を読み込む
   */
  getConfig : function () {
    /* [ブルマ] タブの設定 */
    arAkahukuBloomer.enable
    = arAkahukuConfig
    .initPref ("bool", "akahuku.bloomer", false);
    if (arAkahukuBloomer.enable) {
      var value
        = arAkahukuConfig
        .initPref ("char", "akahuku.bloomer.keycode", "VK_F2");
      value
        = unescape (value);
      arAkahukuBloomer.keycode
        = Components.interfaces.nsIDOMKeyEvent ["DOM_" + value];
            
      arAkahukuBloomer.modifiersAlt
        = arAkahukuConfig
        .initPref ("bool", "akahuku.bloomer.modifiers.alt", false);
      arAkahukuBloomer.modifiersCtrl
        = arAkahukuConfig
        .initPref ("bool", "akahuku.bloomer.modifiers.ctrl", false);
      arAkahukuBloomer.modifiersMeta
        = arAkahukuConfig
        .initPref ("bool", "akahuku.bloomer.modifiers.meta", false);
      arAkahukuBloomer.modifiersShift
        = arAkahukuConfig
        .initPref ("bool", "akahuku.bloomer.modifiers.shift", false);
            
      arAkahukuBloomer.file
        = arAkahukuConfig
        .initPref ("char", "akahuku.bloomer.file", "");
      arAkahukuBloomer.file
        = unescape (arAkahukuBloomer.file);
      try {
        var tmp
          = arAkahukuFile.getURLSpecFromFilename
          (arAkahukuBloomer.file);
        if (tmp) {
          arAkahukuBloomer.file = tmp;
        }
      }
      catch (e) {
      }
    }
  },
    
  /**
   * キーが押されたイベント
   *
   * @param  Event event
   *         対象のイベント
   */
  onKeyDown : function (event) {
    if (Akahuku.enableAll
        && arAkahukuBloomer.enable) {
      if (arAkahukuBloomer.keycode == event.keyCode
          && arAkahukuBloomer.modifiersAlt == event.altKey
          && arAkahukuBloomer.modifiersCtrl == event.ctrlKey
          && arAkahukuBloomer.modifiersMeta == event.metaKey
          && arAkahukuBloomer.modifiersShift == event.shiftKey) {
        arAkahukuBloomer.openBloomer ();
        event.preventDefault ();
      }
    }
  },
    
  /**
   * ブルマ女将を開く
   */
  openBloomer : function () {
    if (Akahuku.enableAll
        && arAkahukuBloomer.enable) {
      var tabbrowser = document.getElementById ("content");
      var newTab = tabbrowser.addTab (arAkahukuBloomer.file);
      tabbrowser.selectedTab = newTab;
    }
  }
};
