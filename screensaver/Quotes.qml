import QtQuick 2.4
import Eos.Window 0.1
import Qt.labs.settings 1.0
import "Quotes.js" as Library

WebOSWindow {
    id: root
    width: 1920; height: 1080
    color: "black"
    windowType: "_WEBOS_WINDOW_TYPE_SCREENSAVER"
    appId: "com.webos.app.screensaver"
    title: "Replikli Ekran Koruyucu"
    visible: true
    property var current: Library.quotes[0]
    property int dwell: 16000
    property bool initialized: false
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
        if(!initialized)return;
        sequence.stop(); clockLayer.opacity=1; quoteLayer.opacity=0;
        now=new Date(); dial.requestPaint();
        if(visible)sequence.start();
    }
    onVisibleChanged: restartCycle()
    Component.onCompleted: { initialized=true; restartCycle(); }

    Item {
        anchors.fill: parent; focus: true
        Keys.onPressed: { event.accepted=true; Qt.quit(); }
        MouseArea { anchors.fill: parent; onClicked: Qt.quit() }
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
        width: Math.min(1620,root.width-220)
        x: (root.width-width)/2+root.offsetX*0.35
        y: (root.height-height)/2+root.offsetY
        spacing: 22; opacity: 0
        Text {
            width: parent.width
            text: "“"+root.current.text+"”"
            textFormat: Text.PlainText; wrapMode: Text.NoWrap
            horizontalAlignment: Text.AlignHCenter
            color: "#a0a0a0"; font.pixelSize: 48
            font.family: root.quoteFont()
            fontSizeMode: Text.HorizontalFit; minimumPixelSize: 26
            height: 75
        }
        Text {
            width: parent.width
            text: root.current.character+" ("+root.current.actor+")"
            textFormat: Text.PlainText; wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            color: "#858585"; font.pixelSize: 29
        }
        Text {
            width: parent.width
            text: root.current.film+" ("+root.current.year+")"
            textFormat: Text.PlainText; wrapMode: Text.WordWrap
            horizontalAlignment: Text.AlignHCenter
            color: "#737373"; font.pixelSize: 27
        }
    }
    Timer {
        interval: 60000; repeat: true; running: root.visible
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
