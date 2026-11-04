import QtQuick 2.4
import Eos.Window 0.1
import Qt.labs.settings 1.0
import "Quotes.js" as Library
import "Content.js" as Content

WebOSWindow {
    id: root
    width: 1920; height: 1080
    color: "black"
    windowType: "_WEBOS_WINDOW_TYPE_SCREENSAVER"
    appId: "com.webos.app.screensaver"
    title: "Replikli Ekran Koruyucu"
    property var incoming: typeof params === "undefined" ? ({}) : params
    property bool configureOnly: incoming && incoming.configureOnly === true
    property string mode: "quotes"
    visible: !configureOnly
    Settings {
        id: preferences
        fileName: "/var/lib/webos-launcher-tr/screensaver/preferences.ini"
        category: "Screensaver"
        property string mode: "quotes"
    }
    Timer { id: configExit; interval: 400; onTriggered: Qt.quit() }
    property var fact: Content.facts[0]
    property var artwork: Content.paintings[0]
    property int corner: 0
    property real naturalScale: Math.min(width/artwork.width,height/artwork.height)
    property real sideGap: Math.max(0,(width-artwork.width*naturalScale)/2)
    property real topGap: Math.max(0,(height-artwork.height*naturalScale)/2)
    property bool sidePlaque: sideGap>=360
    property bool bandPlaque: !sidePlaque && topGap>=plaque.height+32
    property bool reserveCaption: !sidePlaque && !bandPlaque
    Settings {
        id: otherHistory
        fileName: "/var/lib/webos-launcher-tr/screensaver/"+root.mode+"-deck.ini"
        category: "ContentDeck"
        property int lastIndex: -1
        property string remaining: "[]"
        property string signature: ""
        property int cycle: 0
    }
    function advanceOther() {
        var list=mode==="art"?Content.paintings:Content.facts;
        var sig=mode==="art"?Content.artSignature:Content.factsSignature;
        var deck;try{deck=JSON.parse(otherHistory.remaining);}catch(e){deck=[];}
        var next=Library.nextSelection({index:otherHistory.lastIndex,remaining:deck,signature:otherHistory.signature,cycle:otherHistory.cycle},list.length,Math.random,sig);
        otherHistory.lastIndex=next.index;otherHistory.remaining=JSON.stringify(next.remaining);
        otherHistory.signature=next.signature;otherHistory.cycle=next.cycle;
        if(mode==="art") { artwork=list[next.index];corner=(corner+1+Math.floor(Math.random()*3))%4; }
        else { fact=list[next.index];dwell=Math.max(18000,Math.min(45000,8000+fact.text.split(/\s+/).length*650)); }
        console.log("CONTENT_DECK mode="+mode+" index="+next.index+" remaining="+next.remaining.length);
    }
    property var current: Library.quotes[0]
    property int dwell: 16000
    property bool initialized: false
    property bool exitArmed: false
    Timer { id: armExit; interval: 1200; onTriggered: root.exitArmed=true }
    property date now: new Date()
    property real offsetX: 0
    property real offsetY: 0
    FontLoader { id: scifi; source: "fonts/Orbitron.ttf" }
    FontLoader { id: fantasy; source: "fonts/Cinzel.ttf" }
    FontLoader { id: action; source: "fonts/BebasNeue.ttf" }
    FontLoader { id: classic; source: "fonts/PlayfairDisplay.ttf" }
    FontLoader { id: mono; source: "fonts/ShareTechMono.ttf" }
    FontLoader { id: comic; source: "fonts/ComicNeue.ttf" }
    function quoteFont() {
        var style=current.fontStyle;
        if(style==="scifi")return scifi.name || "sans-serif";
        if(style==="fantasy")return fantasy.name || "serif";
        if(style==="action")return action.name || "sans-serif";
        if(style==="mono")return mono.name || "monospace";
        if(style==="comic")return comic.name || "sans-serif";
        return classic.name || "serif";
    }

    Settings {
        id: history
        fileName: "/var/lib/webos-launcher-tr/screensaver/quote-deck.ini"
        category: "WebosLauncherTrQuoteDeck100"
        property int lastIndex: -1
        property string remaining: "[]"
        property string signature: ""
        property int cycle: 0
    }
    function advance() {
        if(mode!=="quotes"){advanceOther();offsetX=(Math.random()-0.5)*120;offsetY=(Math.random()-0.5)*80;return;}
        var deck;
        try { deck=JSON.parse(history.remaining); } catch(error) { deck=[]; }
        var next=Library.nextSelection({index:history.lastIndex,remaining:deck,signature:history.signature,cycle:history.cycle},Library.quotes.length,Math.random);
        history.lastIndex=next.index; history.remaining=JSON.stringify(next.remaining);
        history.signature=next.signature; history.cycle=next.cycle;
        current=Library.quotes[next.index]; dwell=Library.durationMs(current);
        offsetX=(Math.floor(Math.random()*5)-2)*75;
        offsetY=(Math.floor(Math.random()*5)-2)*40;
        console.log("QUOTE_DECK index="+next.index+" remaining="+next.remaining.length+" cycle="+next.cycle+" film="+current.film);
    }
    function restartCycle() {
        if(!initialized || configureOnly)return;
        sequence.stop();artFadeIn.stop();artFadeOut.stop();artHold.stop();artRetry.stop();
        if(!visible)return;
        if(mode==="art"){clockLayer.opacity=0;quoteLayer.opacity=0;advanceOther();return;}
        sequence.stop(); clockLayer.opacity=1; quoteLayer.opacity=0;
        now=new Date(); dial.requestPaint();
        if(visible)sequence.start();
    }
    onVisibleChanged: restartCycle()
    Component.onCompleted: {
        var requested=incoming && incoming.mode;
        if(requested==="quotes"||requested==="facts"||requested==="art")preferences.mode=requested;
        mode=preferences.mode;
        if(mode!=="quotes"&&mode!=="facts"&&mode!=="art")mode="quotes";
        initialized=true;
        if(configureOnly)configExit.start();else { armExit.start();restartCycle(); }
    }

    Item {
        anchors.fill: parent; focus: true
        Keys.onPressed: { event.accepted=true; if(root.exitArmed && !event.isAutoRepeat)Qt.quit(); }
        MouseArea {
            anchors.fill: parent
            property bool freshPress: false
            onPressed: freshPress=root.exitArmed
            onClicked: { if(freshPress && root.exitArmed)Qt.quit();freshPress=false; }
            onCanceled: freshPress=false
        }
    }
    Item {
        id: clockLayer
        width: 800; height: 600
        x: (root.width-width)/2+root.offsetX
        y: (root.height-height)/2+root.offsetY
        opacity: 1
        Text {
            anchors.horizontalCenter: parent.horizontalCenter; y: 30
            text: Library.turkishDate(root.now)
            color: "#777777"; font.pixelSize: 32
        }
        Canvas {
            id: ring
            anchors.horizontalCenter: parent.horizontalCenter; y: 120
            width: 420; height: 420
            onPaint: {
                var c=getContext("2d");c.clearRect(0,0,width,height);
                c.lineCap="round";c.strokeStyle="#555555";c.lineWidth=2;
                c.beginPath();c.arc(width/2,height/2,178,Math.PI*0.61,Math.PI*1.45);c.stroke();
            }
            RotationAnimator on rotation {
                from: 0; to: 360; duration: 24000
                loops: Animation.Infinite
                running: root.visible && clockLayer.opacity>0.01
            }
        }
        Canvas {
            id: dial
            anchors.horizontalCenter: parent.horizontalCenter; y: 120
            width: 420; height: 420
            onPaint: {
                var c=getContext("2d");c.clearRect(0,0,width,height);
                var cx=width/2,cy=height/2,r=178;
                c.lineCap="round";
                var h=(root.now.getHours()%12+root.now.getMinutes()/60)*Math.PI/6;
                var m=root.now.getMinutes()*Math.PI/30;
                c.strokeStyle="#888888";c.lineWidth=4;
                c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.sin(h)*105,cy-Math.cos(h)*105);c.stroke();
                c.beginPath();c.moveTo(cx-Math.sin(m)*23,cy+Math.cos(m)*23);c.lineTo(cx+Math.sin(m)*150,cy-Math.cos(m)*150);c.stroke();
            }
        }
    }
    Column {
        id: quoteLayer
        visible: root.mode!=="art"
        width: Math.min(1620,root.width-220)
        x: (root.width-width)/2+root.offsetX*0.35
        y: (root.height-height)/2+root.offsetY
        spacing: 22; opacity: 0
        Text {
            width: parent.width
            text: root.mode==="facts"?root.fact.text:"“"+root.current.text+"”"
            textFormat: Text.PlainText; wrapMode: root.mode==="facts"?Text.WordWrap:Text.NoWrap
            horizontalAlignment: Text.AlignHCenter
            color: "#a0a0a0"; font.pixelSize: root.mode==="facts"?42:48
            font.family: root.mode==="quotes"?root.quoteFont():"sans-serif"
            fontSizeMode: root.mode==="facts"?Text.FixedSize:Text.HorizontalFit; minimumPixelSize: 26
            height: root.mode==="facts"?220:75
            verticalAlignment: Text.AlignVCenter
        }
        Text {
            width: parent.width
            text: root.mode==="facts"?root.fact.category:root.current.character+" ("+root.current.actor+")"
            textFormat: Text.PlainText; wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            color: "#858585"; font.pixelSize: 29
        }
        Text {
            width: parent.width
            text: root.mode==="facts"?"Kaynak: "+root.fact.sourceName:root.current.film+" ("+root.current.year+")"
            textFormat: Text.PlainText; wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            color: "#737373"; font.pixelSize: 27
        }
    }
    Item {
        id: artLayer; anchors.fill: parent
        visible: root.mode==="art"; opacity: 0
        Image {
            id: painting; width: parent.width
            height: parent.height-(root.reserveCaption?plaque.height+48:0)
            source: root.mode==="art" && root.initialized?"../"+root.artwork.image:""
            fillMode: Image.PreserveAspectFit
            sourceSize.width: 1920; sourceSize.height: 1080
            asynchronous: true; cache: false
            onStatusChanged: {
                if(status===Image.Ready && root.mode==="art" && root.visible)artFadeIn.restart();
                else if(status===Image.Error && root.visible)artRetry.restart();
            }
        }
        Rectangle {
            id: plaque
            width: root.sidePlaque?Math.min(520,root.sideGap-48):Math.min(1000,root.width-160)
            height: artText.height+44; radius: 10; color: "#b8000000"
            x: root.sidePlaque?(root.corner%2===0?24:root.width-width-24):(root.width-width)/2
            y: root.sidePlaque?(root.height-height)/2:root.bandPlaque?(root.corner<2?(root.topGap-height)/2:root.height-root.topGap+(root.topGap-height)/2):root.height-height-20
            Column {
                id: artText; x: 24;y: 22;width: parent.width-48;spacing: 10
                Text { width: parent.width;text: root.artwork.titleTr || root.artwork.title;color: "#eeeeee";font.pixelSize: 29;wrapMode: Text.WordWrap;textFormat: Text.PlainText }
                Text { width: parent.width;text: root.artwork.artist;color: "#dddddd";font.pixelSize: 24;wrapMode: Text.WordWrap;textFormat: Text.PlainText }
                Text { width: parent.width;text: (root.artwork.dateTr || root.artwork.year)+" • "+root.artwork.medium;color: "#cccccc";font.pixelSize: 22;wrapMode: Text.WordWrap;textFormat: Text.PlainText }
            }
        }
    }
    SequentialAnimation {
        id: artFadeIn
        NumberAnimation { target: artLayer; property: "opacity"; from: 0;to: 1;duration: 1800;easing.type: Easing.InOutSine }
        ScriptAction { script: artHold.restart() }
    }
    Timer { id: artHold;interval: 45000;onTriggered: artFadeOut.restart() }
    Timer { id: artRetry;interval: 500;onTriggered: root.advanceOther() }
    SequentialAnimation {
        id: artFadeOut
        NumberAnimation { target: artLayer;property: "opacity";to: 0;duration: 1800;easing.type: Easing.InOutSine }
        PauseAnimation { duration: 200 }
        ScriptAction { script: root.advanceOther() }
    }
    Timer {
        interval: 60000; repeat: true; running: root.visible && root.mode!=="art"
        onTriggered: { root.now=new Date(); dial.requestPaint(); }
    }
    SequentialAnimation {
        id: sequence; loops: Animation.Infinite
        PauseAnimation { duration: 11000 }
        NumberAnimation { target: clockLayer; property: "opacity"; to: 0; duration: 1400 }
        PauseAnimation { duration: 250 }
        ScriptAction { script: root.advance() }
        NumberAnimation { target: quoteLayer; property: "opacity"; to: 1; duration: 1400 }
        PauseAnimation { duration: root.dwell }
        NumberAnimation { target: quoteLayer; property: "opacity"; to: 0; duration: 1400 }
        PauseAnimation { duration: 250 }
        ScriptAction { script: { root.now=new Date(); dial.requestPaint(); } }
        NumberAnimation { target: clockLayer; property: "opacity"; to: 1; duration: 1400 }
    }
}
