//Version 20181203 V 4

var serialport = require("serialport"),
    fs = require('fs'),
    ///argv = require('optimist').argv,
    Main = require('../Vikings_API.js');
    GCODE = require('./module.js');
    var printCommands = [],
    printPosition = 0;
var settings = {
    printFile : undefined,
    serialPort : undefined,
    baudrate : undefined,
    printing : false,
    paused : false
}
var SerialPort
var Readline
var sp
var returnText = "";
function printGcode(Port,GcodeUrl,baudrate,speed){
    ///console.log("=Call Print.js Success=");
    if (Port){
        settings.serialPort = Port;
    } else {
        settings.serialPort = undefined;
        consoleAndPrint(" No serial port passed. Exiting",true);
        //process.exit(1);
    }
    if(baudrate){
        //console.log(baudrate);
        settings.baudrate = baudrate;
    } else {
        settings.baudrate = undefined;
        consoleAndPrint(" No Baudrate passed for serial port. Exiting",true);
    }
    if(GcodeUrl){
        settings.printFile = GcodeUrl;
        //console.log(settings.printFile);
    }else{
        settings.printFile = undefined;
    }
    //Optional :: The multiplying factor that affects the travelling speed of the printhead
    if(speed){
        consoleAndPrint(" Speed multiplying factor:" + speed,false);
        GCODE.settings.speedMultiplier = speed;
    }

    /////////////Start Run
    if(settings.printFile != undefined && settings.baudrate != undefined && settings.serialPort != undefined){
        if(settings.printFile.indexOf(".gcode") != -1){
            fs.readFile(settings.printFile, 'utf8', function (err,data) {
                if (err) {
                    consoleAndPrint(err,false);
                }
                printCommands = GCODE.deconstruct(data);
            });
        }else{
            printCommands = GCODE.deconstruct(settings.printFile);
            console.log("Code Send : "+JSON.stringify(printCommands));
        }
        printPosition = 0;
        return printerCommand(GCODE.reconstruct(printCommands[printPosition]));
    }else if(settings.baudrate != undefined && settings.serialPort != undefined){
        return printerRead();
        consoleAndPrint("no printFile",false);
    }

}

function printerCommand(comm){
    if(sp){
        sp.close();
    }
    SerialPort = serialport.SerialPort;
    Readline = serialport.parsers.Readline;
    sp = new serialport(settings.serialPort, {
        parser: new Readline("\n"),
        baudrate : settings.baudRate,
        ///brk:true,cts:true,dsr:true,dtr:true,rts:true
    });
    //////////////////
    sp.on('open', function () {
            sp.write(comm + "\n", function(err){
            if (err) {
                consoleAndPrint(comm+'...'+'Error on write: '+err.message,false);
                setTimeout(printerCommand(comm), 50);
            }else{
                printPosition += 1;
                consoleAndPrint(comm+'...'+'Success on write',false);
                //consoleAndPrint('Response:'+results,false);
                if(printPosition < printCommands.length) {
                    printerCommand(GCODE.reconstruct(printCommands[printPosition]));
                }else{
                    //printerClose(false);
                    consoleAndPrint('Finish',true);
                }
            }
        });
    });
    //sp.on('error',function(err){
        //printerClose(false);
        //consoleAndPrint(err.message);
    //});
    ////測試

}
var CheckIfNotChange = false;
var CheckifChangeNum = 0;
function printerRead(){
    SerialPort = serialport.SerialPort;
    Readline = serialport.parsers.Readline;
    sp = new serialport(settings.serialPort, {
        parser: new Readline("\n"),
        baudrate : settings.baudRate,
    });
    var parser = sp.pipe(new Readline({ delimiter: '\n' })); ////自動整合所有傳出值
    var dataText ='';
    parser.on('data', function(data){
        dataText = data;
        sp.unpipe(parser);
    });
    parser.on('unpipe', (src) => {
        consoleAndPrint("Data Response:"+dataText,true);
        sp.close();
    });
}

function printerClose(type){
    if(sp){
        sp.close(function (err) {
            if(err){
                consoleAndPrint('$Close'+err.message,false);
            }else{
                consoleAndPrint('',true);
            }
        });
    }

}
function consoleAndPrint(printText,state){
    //console.log(printText);
    if(state){
        Main.printResponse(printText.toString()+"$Close");
    }else{
        Main.printResponse(printText.toString());
    }
}
function ascii (ASCtext) {
    return ASCtext.charCodeAt(0);
}
//process.on('exit', function() {
//    console.log("Issuing Stop Command");
//    printerCommand("M112");
//});

module.exports.printGcode = printGcode;