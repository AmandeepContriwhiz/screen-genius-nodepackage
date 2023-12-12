const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
const imageThumbnail = require('image-thumbnail');
const fs = require("fs");
const spawn = require('child_process').spawn;
const LocalStorage = require('node-localstorage').LocalStorage;
const localStorage = new LocalStorage('./local-storage');
var imageIden = "";
var cmdHEAD = []; 
var cmdBODY = [];
var cmdFOOT = [];
var cmdATTR = [];
var outputVAR = 0;
var cmdBodyStr = "";
var inputVAR = 1;
var inputPaths = [];
var annotationsRequested = 0;
var isMusicData = false;
function getOffset(currentPage = 1, listPerPage) {
    return (currentPage - 1) * [listPerPage];
  }
  
    function emptyOrRows(rows) {
        if (!rows) {
            return [];
        }
        return rows;
    };
    function sessionCheckerWeb(req, res, next)
    {    
      if(req.session.passport && req.session.passport.user) 
      {
          next();
      }
      else
      {
        if(req.route.path == '/video-upload')
        {
          localStorage.setItem('quixDashReturnTo', "/video-upload");
        }
        res.redirect('/login');
      }
    };
    function sessionCheckerWebLogin(req, res, next)
    {    
      if(req.session.passport && req.session.passport.user) 
      {
        res.redirect('/');
      }
      else
      {
        next();
      }
    };
    function formatBytes(bytes, decimals = 2) 
    {
      if (!+bytes) return '0 Bytes'
  
      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      
      return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  } 
  function secondsToHms(d) {
      d = Number(d);
      var h = Math.floor(d / 3600);
      var m = Math.floor(d % 3600 / 60);
      var s = Math.floor(d % 3600 % 60);

      var hDisplay = h > 0 ? (h < 10 ? "0" : "") + h : "00";
      var mDisplay = m > 0 ? (m < 10 ? "0" : "") + m : "00";
      var sDisplay = s > 0 ? (s < 10 ? "0" : "") + s : "00";
      return mDisplay +":"+ sDisplay; 
  }
  function HmsToseconds(hms) 
  {
      var a = hms.split(':');
      var seconds = (+a[1]) * 60 + (+a[2]); 
      return seconds;
  } 
  function HmsToseconds2(hms) 
  {
      var a = hms.split(':');
      var seconds = (+a[0]) * 60 + (+a[1]); 
      return seconds;
  } 
  function capitalizeFirstLetter(string) 
  {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }
  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};
  
    if (matches.length !== 3) {
      return new Error('Invalid input string');
    }
  
    response.type = matches[1];
    response.data = new Buffer.from(matches[2], 'base64');
  
    return response;
  }

  function cmd(op,command,callback) {
    let p = spawn(op, command);
    return new Promise((resolve) => {
      p.stdout.on("data", (data) => {
        //console.log(data);
      });
      p.stderr.setEncoding("utf8");
      p.stderr.on("data", (data) => {
        //console.log(data);
      });
      p.on("close", (data) => {
        callback();
      });
    });
  }
  async function addText(dbData,textData,res,callback)
  {
    isMusicData = false;
    cmdHEAD = []; 
    cmdBODY = [];
    cmdFOOT = [];
    cmdATTR = [];
    cmdBodyStr = "";
    outputVAR = 0;
    inputVAR = 1;
    var vidName = dbData.name;
    var vidPath = "./public"+dbData.path;
    var modPath = "./public/upload/videos/output_text_"+vidName;
    var modOutputPath = "/upload/videos/output_text_"+vidName;
    var cmdText = "";
    
    cmdHEAD.push('-y');
    cmdHEAD.push('-i');
    cmdHEAD.push(vidPath);
    if(textData.length > 0)
    {
      annotationsRequested++;
      var starting = "";
      var closing = "";
      for (let i = 0; i < textData.length; i++) 
      {
        var data = textData[i].data;
        var textC = data.val;
        var interval = textData[i].points;
        for (let j = 0; j < textC.length; j++) 
        {
          outputVAR++;
          if(outputVAR == 1){ starting = ""; }else{ starting = "[v0"+(outputVAR-1)+"]"; }
          if(i+1 == textData.length && j+1 == textC.length){ closing = "[v0"+outputVAR+"]"; }else{ closing = "[v0"+outputVAR+"];"; }
          if(j != 0){ data.y = data.y+(data.fontSize+3); }
          cmdText += starting+"drawtext=enable='between(t,"+interval.start+","+interval.end+")':text='"+textC[j]+"':fontcolor="+data.fontColor+":fontsize="+data.fontSize+":box=1:boxcolor=#FFFFFF@1:boxborderw=5:x="+data.x+":y="+data.y+closing;
        }
      }
    }
    cmdBODY.push('-filter_complex');
    cmdBodyStr = cmdText;
    var resp = {"outputURI":vidPath,"outputPath":dbData.path,"videoLen": dbData.file_duration};
    callback(resp);
  }
  async function addImages(dbData,imageData,res,callback)
  {
    var vidName = dbData.name;
    var vidPath = "./public"+dbData.path;
    var modPath = "./public/upload/videos/output_images_"+vidName;
    var modOutputPath = "/upload/videos/output_images_"+vidName;
    var cmdImage = "";
    if(imageData.length > 0)
    {
      annotationsRequested++;
      var closing = "";
      var starting = "";
      var closingPad = "";
      var imageInput = 1;
      for (let i = 0; i < imageData.length; i++) 
      {
        inputVAR++;
        var data = imageData[i].data;
        var imagePath = "./"+data.val;
        var interval = imageData[i].points;
        var ovr = aa = bb = cc = dd = "";
        if(i == 0){ aa  = 1; bb = "v"+(i+1); cc = "ovrl"; dd = "v"+(i+1);}
        else{ aa = (i+1); bb  = "v"+i; cc = "ovrl"+i; dd = "v"+(i+1);}
        closingPad = "["+dd+"]";
        outputVAR++;
        if(outputVAR == 1){ starting = "[0:v]"; }else{ starting = "[v0"+(outputVAR-1)+"]"; }
        if(i+1 == imageData.length){ closing = "[v0"+outputVAR+"]"; }else{ closing = "[v0"+outputVAR+"];"; }
        if(i == 0)
        {

          cmdImage += "["+imageInput+":v]scale="+data.w+":"+data.h+" ["+cc+"];";
          cmdImage += starting+"["+cc+"]overlay="+data.x+":"+data.y+":enable='between(t,"+interval.start+","+interval.end+")'"+closing;
        }
        else
        {
          imageInput++;
          cmdImage += "["+imageInput+":v]scale="+data.w+":"+data.h+" ["+cc+"];";
          cmdImage += starting+"["+cc+"]overlay="+data.x+":"+data.y+":enable='between(t,"+interval.start+","+interval.end+")'"+closing;
        }
        cmdHEAD.push('-i');
        cmdHEAD.push(decodeURIComponent(imagePath));
        inputPaths.push(decodeURIComponent(imagePath));
      }
      imageIden = dd;
      if(cmdBodyStr !== "")
      {
        cmdBodyStr += ';'+cmdImage;
      }
      else
      {
        cmdBodyStr = cmdImage;
      }
    }
    var resp = {"outputURI":res.outputURI,"outputPath":res.outputPath,"videoLen":res.videoLen};
    callback(resp);
  }

  async function cropVideo(dbData,cropData,res,callback)
  {
    var videoLenCropped = 0;
    var vidName = Date.now()+"_"+dbData.name;
    var videoObjects = [];
    var vidNameOutput = "./public/upload/videos/output_"+vidName;
    var vidPaths = [];
    var outputPath = "/upload/videos/output_"+vidName;
    var totalVideoLen = res.videoLen;
    if(cropData.length > 0)
    {
      annotationsRequested++;
      
      var cropCMD = cropCMDSplit = cropCMDTrim = "";
      var cropF = "";
      totalVideoLen = HmsToseconds2(res.videoLen);
      var outputV = outputVAR;
      for (var i = 0; i < cropData.length; i++) 
      {
        var cmSplit = "[t0"+i+"]";
        cropCMDSplit += cmSplit;
        outputV++;
        var startTime = HmsToseconds(cropData[i].start);
        var endTime = HmsToseconds(cropData[i].end);
        var duration = parseInt(endTime-startTime);
        var cropInt = parseInt(cropData[i].interval); 
        videoLenCropped += duration;
        cropCMDTrim += cmSplit+"trim=start="+startTime+":duration="+duration+",setpts=PTS-STARTPTS[v0"+outputV+"];";
        cropF += "[v0"+outputV+"]";
      }
      totalVideoLen = secondsToHms(videoLenCropped);
      if(outputVAR > 0)
      {
        cropCMD += "[v0"+outputVAR+"]split="+cropData.length+cropCMDSplit+";";
      }
      else
      {
        cropCMD += "[0:v]split="+cropData.length+cropCMDSplit+";";
      }
      cropCMD += cropCMDTrim;
      cropCMD += cropF+"concat=n="+cropData.length+":v=1[vout]";
      if(cmdBodyStr !== "")
      {
        cmdBodyStr += ';'+cropCMD;
      }
      else
      {
        cmdBodyStr = cropCMD;
      }

      cmdFOOT.push('-map');
      cmdFOOT.push('[vout]');
      if(isMusicData)
      {
        cmdFOOT.push('-map');
        cmdFOOT.push('[a]');
        cmdFOOT.push('-async');
        cmdFOOT.push('1');
        cmdFOOT.push('-t');
        cmdFOOT.push(videoLenCropped);
        cmdFOOT.push('-c:a');
        cmdFOOT.push('libopus');
      }
    }
    else
    {
      if(outputVAR > 0)
      {
        cmdFOOT.push('-map');
        cmdFOOT.push("[v0"+outputVAR+"]");
      } 
      else
      {
        cmdFOOT.push('-map');
        cmdFOOT.push("0:v");
      }  
      if(isMusicData)
      {
        cmdFOOT.push('-map');
        cmdFOOT.push('[a]');
        cmdFOOT.push('-async');
        cmdFOOT.push('1');
        if(outputVAR <= 0)
        {
          cmdFOOT.push('-c:v');
          cmdFOOT.push('copy');
        }
        cmdFOOT.push('-c:a');
        cmdFOOT.push('libopus');
      }
    }
      cmdBODY.push(cmdBodyStr);
      cmdFOOT.push(vidNameOutput);
      cmdATTR = cmdATTR.concat(cmdHEAD, cmdBODY, cmdFOOT);
      if(annotationsRequested > 0)
      {
        //console.log(cmdATTR,"-cmdATTR-");
        await cmd('ffmpeg', cmdATTR, function()
        {
          var resp = {"outputURI":vidNameOutput,"outputPath":outputPath,"videoLen":totalVideoLen};
          callback(resp); 
        });
      }
      else
      {
        var resp = {"outputURI":res.outputURI,"outputPath":res.outputPath,"videoLen":res.videoLen};
        callback(resp); 
      }
  }

  async function addMusic(dbData,bgAudioData,res,callback)
  {
    var vidName = dbData.name;
    var modPath = "./public/upload/videos/output_pre_"+vidName;
    var modOutputPath = "/upload/videos/output_pre_"+vidName;
    if(bgAudioData.length > 0)
    {
      annotationsRequested++;
      var outputsTags = "";
      var cmdBG = "";
      var starting = "";
      for (let i = 0; i < bgAudioData.length; i++) 
      {
        var data = bgAudioData[i].data;
        var interval = bgAudioData[i].points;
        var intStart = interval.start;
        var intEnd = interval.end;
        var bgAudioPath = "./"+data.val; 
        var aa = (i+1); 
        var bb  = "v"+(i+1);
        cmdBG += "["+inputVAR+":a]atrim=duration="+intEnd+"["+bb+"];";
        outputsTags += "["+bb+"]";
        cmdHEAD.push('-itsoffset');
        cmdHEAD.push(intStart);
        cmdHEAD.push('-i');
        cmdHEAD.push(decodeURIComponent(bgAudioPath));
        inputPaths.push(bgAudioPath);
        inputVAR++;
      }
      cmdBG += outputsTags+"amix=inputs="+(bgAudioData.length+1)+"[a]";
      if(cmdBodyStr !== "")
      {
        cmdBodyStr += ';'+cmdBG;
      }
      else
      {
        cmdBodyStr = cmdBG;
      }
      isMusicData = true;
    }
    var lastLetter = cmdBodyStr.slice(-1);
    if(lastLetter === "," || lastLetter === ";")
    {
      cmdBodyStr = cmdBodyStr.slice(0,-1)+ '';
    }
    var resp = {"outputURI":res.outputURI,"outputPath":res.outputPath,"videoLen":res.videoLen};
    callback(resp); 
  }
  async function addBlur(dbData,blurData,res,callback)
  {
    var cmdSTR = "";
    if(blurData.length > 0)
    {
      annotationsRequested++;
      var cmdSTR1 = "";
      var cmdSTR2 = "";
      var closing = "";
      var starting = "";
      for (let i = 0; i < blurData.length; i++) 
      {
        var data = blurData[i].data;
        var interval = blurData[i].points;
        var ovr = aa = bb = "";
        outputVAR++;
        if(outputVAR == 1){ starting = "[0:v]"; }else{ starting = "[v0"+(outputVAR-1)+"]"; }
        if(i+1 == blurData.length){ closing = "[v0"+outputVAR+"]"; }else{ closing = "[v0"+outputVAR+"];"; }
        if(i == 0){aa  = "0:v"; bb  = "b"+i; if(blurData.length > 1){ ovr = "[ovr"+i+"];";}}
        else{ aa  = "ovr"+(i-1); bb  = "b"+i; ovr = "[ovr"+i+"];"; }
        if(i+1 == blurData.length && i !== 0){ aa  = "ovr"+(i-1); bb  = "b"+i; ovr = ""; }
        cmdSTR1 += "[0:v]crop="+data.w+":"+data.h+":"+data.x+":"+data.y+",avgblur="+data.intensity+":enable='between(t,"+interval.start+","+interval.end+")'["+bb+"];";
        cmdSTR2 += starting+"["+bb+"]overlay="+data.x+":"+data.y+closing;
      }
      cmdSTR = cmdSTR1+cmdSTR2;
      if(cmdBodyStr !== "")
      {
        cmdBodyStr += ';'+cmdSTR;
      }
      else
      {
        cmdBodyStr = cmdSTR;
      }
    }
    var resp = {"outputURI":res.outputURI,"outputPath":res.outputPath,"videoLen":res.videoLen};
    callback(resp); 
  }

  async function compressVideoSize(path, fileName, insertID, callback)
  {
    var inputVideo = path;
    var outputVideo = "./public/upload/videos/compressed_"+fileName;
    var outputPath = "/upload/videos/compressed_"+fileName;

    var cmdA = ['-i', inputVideo, '-c:v', 'libvpx-vp9', '-crf', 40, '-b:v', 0, '-preset', 'ultrafast', outputVideo];

    await cmd('ffmpeg', cmdA, function()
    {
      fs.unlinkSync(inputVideo);
      callback(outputPath,insertID); 
    });
  }

  const createToken =()=>{

  }
  function generateRandomString() {
    let length = 60; 
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
  
    return randomString;
  }
  
  module.exports = {
    getOffset,
    generateRandomString,
    emptyOrRows,
    sessionCheckerWebLogin,
    sessionCheckerWeb,
    formatBytes,
    secondsToHms,
    HmsToseconds,
    HmsToseconds2,
    addText,
    addImages,
    cropVideo,
    addBlur,
    addMusic,
    decodeBase64Image,
    capitalizeFirstLetter,
    compressVideoSize
  }