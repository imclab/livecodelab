var isCanvasSupported, startEnvironment;

$(document).ready(function() {
  document.getElementById("blendedThreeJsSceneCanvas").width = window.innerWidth;
  document.getElementById("blendedThreeJsSceneCanvas").height = window.innerHeight;
  return startEnvironment({
    blendedThreeJsSceneCanvas: document.getElementById("blendedThreeJsSceneCanvas"),
    canvasForBackground: document.getElementById("backGroundCanvas"),
    forceCanvasRenderer: false,
    bubbleUpErrorsForDebugging: false,
    testMode: false
  });
});

isCanvasSupported = function() {
  var elem;
  elem = document.createElement("canvas");
  return !!(elem.getContext && elem.getContext("2d"));
};

startEnvironment = function(paramsObject) {
  "use strict";

  var autocoder, bigCursor, colourNames, editor, editorDimmer, eventRouter, liveCodeLabCore, programLoader, stats, ui, urlRouter,
    _this = this;
  if (!isCanvasSupported) {
    $("#noCanvasMessage").modal({
      onClose: function() {
        $("#loading").text("sorry :-(");
        return $.modal.close();
      }
    });
    $("#simplemodal-container").height(200);
    return;
  }
  eventRouter = createEventRouter();
  stats = new Stats;
  if (paramsObject.forceCanvasRenderer === undefined) {
    paramsObject.forceCanvasRenderer = false;
  }
  if (paramsObject.forceCanvasRenderer === null) {
    paramsObject.forceCanvasRenderer = false;
  }
  colourNames = new Colours;
  liveCodeLabCore = createLiveCodeLabCore({
    blendedThreeJsSceneCanvas: paramsObject.blendedThreeJsSceneCanvas,
    canvasForBackground: paramsObject.canvasForBackground,
    forceCanvasRenderer: paramsObject.forceCanvasRenderer,
    eventRouter: eventRouter,
    statsWidget: stats,
    testMode: paramsObject.testMode
  });
  urlRouter = createUrlRouter(eventRouter);
  bigCursor = new BigCursor(eventRouter);
  eventRouter.bind("big-cursor-show", function() {
    return bigCursor.unshrinkBigCursor();
  });
  eventRouter.bind("big-cursor-hide", function() {
    return bigCursor.shrinkBigCursor();
  });
  editor = createEditor(eventRouter, CodeMirror);
  attachMouseWheelHandler(editor);
  ui = createUi(eventRouter, stats);
  autocoder = createAutocoder(eventRouter, editor, colourNames);
  editorDimmer = createEditorDimmer(eventRouter, bigCursor);
  programLoader = createProgramLoader(eventRouter, editor, liveCodeLabCore);
  eventRouter.bind("reset", liveCodeLabCore.paintARandomBackground);
  eventRouter.trigger("editor-toggle-dim", true);
  eventRouter.bind("livecodelab-running-stably", ui.showStatsWidget);
  eventRouter.bind("code_changed", function(updatedCodeAsString) {
    if (updatedCodeAsString !== "") {
      eventRouter.trigger("big-cursor-hide");
    } else {
      eventRouter.trigger("set-url-hash", "");
      eventRouter.trigger("big-cursor-show");
      ui.hideStatsWidget();
    }
    return liveCodeLabCore.updateCode(updatedCodeAsString);
  });
  eventRouter.bind("runtime-error-thrown", function(e) {
    eventRouter.trigger("report-runtime-or-compile-time-error", e);
    if (autocoder.active) {
      editor.undo();
    } else {
      liveCodeLabCore.runLastWorkingDrawFunction();
    }
    if (paramsObject.bubbleUpErrorsForDebugging) {
      throw e;
    }
  });
  eventRouter.bind("compile-time-error-thrown", function(e) {
    eventRouter.trigger("report-runtime-or-compile-time-error", e);
    if (autocoder.active) {
      return editor.undo();
    }
  });
  eventRouter.bind("clear-error", ui.clearError, ui);
  eventRouter.bind("all-sounds-loaded-and tested", ui.soundSystemOk);
  liveCodeLabCore.loadAndTestAllTheSounds();
  liveCodeLabCore.paintARandomBackground();
  liveCodeLabCore.startAnimationLoop();
  if (!Detector.webgl || paramsObject.forceCanvasRenderer) {
    $("#noWebGLMessage").modal({
      onClose: eval_("$.modal.close()", "liveCodeLabCore.isAudioSupported")
    });
    $("#simplemodal-container").height(200);
  }
  editor.focus();
  if (!urlRouter.urlPointsToDemoOrTutorial()) {
    setTimeout(liveCodeLabCore.playStartupSound, 650);
  }
  bigCursor.toggleBlink(true);
  return ui.setup();
};