const db = require('./db');
const helper = require('../helper');
const config = require('../config');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
const imageThumbnail = require('image-thumbnail');
const fs = require("fs");
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const imagesLimit = 30;
const videosLimit = 15;
// const webPath = "https://screengenius.io/";
const webPath = "http://localhost:3000/";

const webmailUser = 'notifications@screengenius.io';
const webmailPass = 'v538h1@OA#S5';

async function userGet(req, res)
{
  if(req.session.passport && req.session.passport.user) 
  {
    var response = req.session.passport.user;
    const rows1 = await db.query(
      `SELECT * FROM screenshots WHERE user_id = 1 AND is_trashed = 0`
    );
    const data1 = helper.emptyOrRows(rows1);
    const rows2 = await db.query(
      `SELECT * FROM videos WHERE user_id = 1 AND is_trashed = 0`
    );
    const data2 = helper.emptyOrRows(rows2);

    response['videos'] = data2.length;
    response['screenshots'] = data1.length;
    res.json({
      "success" : true,
      "data" : response
    });
  }
  else
  {
    res.json({
      "success" : false,
      "message" : "Authentication Failed."
    });
  }
}

async function userLogin(req, res)
{
  
    const rows = await db.query(
      `SELECT * FROM users WHERE email = "${req.body.email}"`
    );
    const data = helper.emptyOrRows(rows);
    if(data.length > 0)
    {
      var response = data[0];
      const rows1 = await db.query(
        `SELECT * FROM screenshots WHERE user_id = ${response.id} AND is_trashed = 0`
      );
      const data1 = helper.emptyOrRows(rows1);
      const rows2 = await db.query(
        `SELECT * FROM videos WHERE user_id = ${response.id} AND is_trashed = 0`
      );
      const data2 = helper.emptyOrRows(rows2);

      response['videos'] = data2.length;
      response['screenshots'] = data1.length;
      res.json({
        "success" : true,
        "data" : response
      });
    }
    else
    {
      await db.query(
        `INSERT INTO users (name,email,picture) VALUES ("${req.body.name}","${req.body.email}","${req.body.picture}")`
      );
      const rows = await db.query(
        `SELECT * FROM users WHERE email = "${req.body.email}"`
      );
      const data = helper.emptyOrRows(rows);
      var response = data[0];
      response['videos'] = 0;
      response['screenshots'] = 0;
      res.json({
          "success" : true,
          "data": response
      });
    }
}
async function userLogout(req, res)
{
  res.json({
    "success" : true,
    "message" : "session Destroyed."
  });
}

async function getVideoRecordingList(req, res)
{
  var orderBy = "ORDER BY id DESC";
  if(req.query.sort)
  {
    var sortType = req.query.sort;
    switch(sortType)
    {
      case "name":
        orderBy = "ORDER BY name ASC"
      break;
      case "size":
        orderBy = "ORDER BY file_size DESC"
      break;
      case "date":
        orderBy = "ORDER BY created_at DESC"
      break;
    }
  }

  const rows = await db.query(
    `SELECT * FROM videos WHERE user_id = 1 AND is_trashed = 0 `+orderBy
  );
  const data = helper.emptyOrRows(rows);
  res.json({
    "success" : true,
    "data" : data
  });
}
async function getStarredVideoRecordingList(req, res)
{
  var orderBy = "ORDER BY id DESC";
  if(req.query.sort)
  {
    var sortType = req.query.sort;
    switch(sortType)
    {
      case "name":
        orderBy = "ORDER BY name ASC"
      break;
      case "size":
        orderBy = "ORDER BY file_size DESC"
      break;
      case "date":
        orderBy = "ORDER BY created_at DESC"
      break;
    }
  }

  const rows = await db.query(
    `SELECT * FROM videos WHERE user_id = 1 AND is_starred = 1 AND is_trashed = 0 `+orderBy
  );
  const data = helper.emptyOrRows(rows);
  res.json({
    "success" : true,
    "data" : data
  });
}
async function getTrashedVideoRecordingList(req, res)
{
  var orderBy = "ORDER BY id DESC";
  if(req.query.sort)
  {
    var sortType = req.query.sort;
    switch(sortType)
    {
      case "name":
        orderBy = "ORDER BY name ASC"
      break;
      case "size":
        orderBy = "ORDER BY file_size DESC"
      break;
      case "date":
        orderBy = "ORDER BY created_at DESC"
      break;
    }
  }

  const rows = await db.query(
    `SELECT * FROM videos WHERE user_id = 1 AND is_trashed = 1 `+orderBy
  );
  const data = helper.emptyOrRows(rows);
  res.json({
    "success" : true,
    "data" : data
  });
}
async function uploadVideoRecording(req, res)
{
  try
  {
    const rows = await db.query(
      `SELECT * FROM videos WHERE user_id = ${req.body.user_id} AND is_trashed = 0`
    );
    const data = helper.emptyOrRows(rows);
    if(data.length < videosLimit)
    {
      let path = "./public/upload/videos/"+req.file.filename;
      let pathDB = "/upload/videos/"+req.file.filename;
      let pathT = "./public/upload/videos/thumbnails";
      var fileName = req.file.filename;
      var fileNameArr = fileName.split(".");
      var thumbName = fileNameArr[0]+".png";
      let pathTDB = "/upload/videos/thumbnails/"+thumbName;
      ffmpeg(path)
      .screenshots({
        timestamps: ['00:00:01.000'],
        filename: thumbName,
        folder: pathT,
        size: '500x282'
      });

      const rows = await db.query(
        `INSERT INTO videos (user_id,name,path,modified_path,thumbnail,file_size,file_duration,is_ready) VALUES ("${req.body.user_id}","${req.file.filename}","${pathDB}","${pathDB}","${pathTDB}","${req.body.file_size}","${req.body.file_duration}",1)`
      );
      res.json({
            "success" : true,
            "insertedId": rows.insertId,
            "path": pathDB
      });

      // helper.compressVideoSize(path,fileName, rows.insertId, async function(pathDB,insertId)
      // { 
      //   var stats = fs.statSync("./public"+pathDB);
      //   var vidSize = stats.size;
      //   await db.query(
      //     `UPDATE videos SET path = "${pathDB}", modified_path = "${pathDB}", file_size = "${vidSize}", is_ready = 1 WHERE id = ${insertId}`
      //   );
      // });
    }
    else
    {
      res.json({
        "success" : false,
        "message" : "You exceeded Limit."
      });
    }
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Upload failed."
    });
  }
}

async function deleteVideoRecording(req, res)
{
  try
  {
    const rows = await db.query(
      `DELETE FROM videos WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Deleted Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Deletion failed."
    });
  }
}

async function renameVideoRecording(req, res)
{
  try
  {
    const rows = await db.query(
      `UPDATE videos SET name = "${req.body.name}" WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Updated Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}

async function starredVideoRecording(req, res)
{
  try
  {
    const rows = await db.query(
      `UPDATE videos SET is_starred = "${req.body.is_starred}" WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Updated Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}

async function trashVideoRecording(req, res)
{
  try
  {
    const rows = await db.query(
      `UPDATE videos SET is_trashed = "${req.body.is_trashed}" WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Updated Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}

async function getScreenshotList(req, res)
{
  var orderBy = "ORDER BY id DESC";
  if(req.query.sort)
  {
    var sortType = req.query.sort;
    switch(sortType)
    {
      case "name":
        orderBy = "ORDER BY name ASC"
      break;
      case "size":
        orderBy = "ORDER BY file_size DESC"
      break;
      case "date":
        orderBy = "ORDER BY created_at DESC"
      break;
    }
  }

  const rows = await db.query(
    `SELECT * FROM screenshots WHERE user_id = 1 AND is_trashed = 0 `+orderBy
  );
  const data = helper.emptyOrRows(rows);
  res.json({
    "success" : true,
    "data" : data
  });
}

async function getStarredScreenshotList(req, res)
{
  var orderBy = "ORDER BY id DESC";
  if(req.query.sort)
  {
    var sortType = req.query.sort;
    switch(sortType)
    {
      case "name":
        orderBy = "ORDER BY name ASC"
      break;
      case "size":
        orderBy = "ORDER BY file_size DESC"
      break;
      case "date":
        orderBy = "ORDER BY created_at DESC"
      break;
    }
  }

  const rows = await db.query(
    `SELECT * FROM screenshots WHERE user_id = 1 AND is_starred = 1 AND is_trashed = 0 `+orderBy
  );
  const data = helper.emptyOrRows(rows);
  res.json({
    "success" : true,
    "data" : data
  });
}
async function getTrashedScreenshotList(req, res)
{
  var orderBy = "ORDER BY id DESC";
  if(req.query.sort)
  {
    var sortType = req.query.sort;
    switch(sortType)
    {
      case "name":
        orderBy = "ORDER BY name ASC"
      break;
      case "size":
        orderBy = "ORDER BY file_size DESC"
      break;
      case "date":
        orderBy = "ORDER BY created_at DESC"
      break;
    }
  }

  const rows = await db.query(
    `SELECT * FROM screenshots WHERE user_id = 1 AND is_trashed = 1 `+orderBy
  );
  const data = helper.emptyOrRows(rows);
  res.json({
    "success" : true,
    "data" : data
  });
}
async function uploadScreenshot(req, res)
{
  try
  {
    const rows = await db.query(
      `SELECT * FROM screenshots WHERE user_id = ${req.body.user_id} AND is_trashed = 0`
    );
    const data = helper.emptyOrRows(rows);
    if(data.length < imagesLimit)
    {
      let path = "./public/upload/screenshots/"+req.file.filename;
      let pathDB = "/upload/screenshots/"+req.file.filename;
      let pathT = "./public/upload/screenshots/thumbnails/";
      let fileName = req.file.filename;
      let fileNameArr = fileName.split(".");
      let thumbName = fileNameArr[0]+".png";
      let pathTDB = "/upload/screenshots/thumbnails/"+thumbName;
      let options = { width: 500, height: 282, responseType: 'base64', jpegOptions: { force:true, quality:90 } }
      let thumbnail = await imageThumbnail(path, options);
      let base64Data = thumbnail.replace(/^data:image\/png;base64,/, "");
      var thumbPath = pathT+thumbName;
      fs.writeFile(pathT+thumbName, base64Data, 'base64', function(err) {
      });
      const rows = await db.query(
        `INSERT INTO screenshots (user_id,name,path,thumbnail,file_size) VALUES ("${req.body.user_id}","${req.file.filename}","${pathDB}","${pathTDB}","${req.body.file_size}")`
      );
      res.json({
          "success" : true,
          "insertedId": rows.insertId,
          "path": pathDB
      });
    }
    else
    {
      res.json({
        "success" : false,
        "message" : "You exceeded Limit."
      });
    }
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Upload failed."
    });
  }
}

async function deleteScreenshot(req, res)
{
  try
  {
    const rows = await db.query(
      `DELETE FROM screenshots WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Deleted Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Deletion failed."
    });
  }
}

async function renameScreenshot(req, res)
{
  try
  {
    const rows = await db.query(
      `UPDATE screenshots SET name = "${req.body.name}" WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Updated Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}

async function starredScreenshot(req, res)
{
  try
  {
    const rows = await db.query(
      `UPDATE screenshots SET is_starred = "${req.body.is_starred}" WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Updated Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}

async function trashScreenshot(req, res)
{
  try
  {
    const rows = await db.query(
      `UPDATE screenshots SET is_trashed = "${req.body.is_trashed}" WHERE id = ${req.body.id}`
    );
    res.json({
      "success" : true,
      "message" : "Updated Successfully."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}

async function downloadVideoRecording(req, res)
{
  try
  {
    var video_id = req.body.vid;
    const rows = await db.query(
      `SELECT * FROM videos WHERE id = ${video_id}`
    );
    var data = helper.emptyOrRows(rows);
    if(data.length > 0)
    {
      data = data[0];
      var filename = data.name;
      var inFilename = "./public"+data.path;
      var filenameArr = filename.split(".");
      var outFilename = "./public/upload/videos/"+filenameArr[0]+"."+req.body.type;
      outfile = "/upload/videos/"+filenameArr[0]+"."+req.body.type;
      ffmpeg(inFilename)
        .outputOptions("-c:v", "copy") // this will copy the data instead or reencode it
        .save(outFilename);

        res.json({
          "success" : true,
          "path" : outfile
        });
    }
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed."
    });
  }
}
async function editVideoRecording(req, res)
{
  try
  {
    var video_id = req.body.video_id;
    const rows = await db.query(
      `SELECT * FROM videos WHERE id = ${video_id}`
    );
    var data = helper.emptyOrRows(rows);
    var bgAudioData = [];
    if(data.length > 0)
    {
      data = data[0];
      var cropData = JSON.parse(req.body.crop_points);
      var blurData = JSON.parse(req.body.blur_points);
      var textData = JSON.parse(req.body.text_points);
      var imageData = JSON.parse(req.body.image_points);
      var bgMusicData = JSON.parse(req.body.bgMusic_points);
      var filesData = req.files;
      var imagesIndex = (imageData.length-1);
      var audiosIndex = (bgMusicData.length-1);
      if(filesData.length > 0)
      {
        //for (let i = 0; i < filesData.length; i++) 
        for (let i = filesData.length - 1; i >= 0; i--)
        {
          if(filesData[i]['mimetype'] === "image/png" || filesData[i]['mimetype'] === "image/jpeg")
          {
            var filepath = filesData[i]['path'];
            imageData[imagesIndex]['data']['val'] = encodeURIComponent(filepath);
            imagesIndex--;
          }
          else
          {
            var filepath = filesData[i]['path'];
            bgMusicData[audiosIndex]['data']['val'] = encodeURIComponent(filepath);
            audiosIndex--;
          }
        }
      }
      var jsonData = {
        "blur_points" : blurData,
        "text_points" : textData,
        "image_points" : imageData,
        "crop_points" : cropData,
        "bgMusic_points" : bgMusicData,
      }
      jsonData = JSON.stringify(jsonData);
      var videoObjects = [];
      helper.addText(data,textData, req, async function(resp)
      {
        helper.addImages(data,imageData, resp, async function(resp)
        {
          helper.addBlur(data, blurData, resp, async function(resp)
          {
            helper.addMusic(data, bgMusicData, resp, async function(resp)
            {
              helper.cropVideo(data, cropData, resp, async function(resp)
              {
                var stats = fs.statSync(resp.outputURI);
                var vidSize = stats.size;
                await db.query(
                  `UPDATE videos SET modified_path = "${resp.outputPath}", file_size = "${vidSize}", file_duration = "${resp.videoLen}", json_data = '${jsonData}' WHERE id = ${video_id} `
                ); 
                res.json({
                  "success" : true,
                  "path" : resp.outputPath
                });
              });
            });
          });
        });
      });
    }
    else
    {
      res.json({
        "success" : false,
        "message" : "Video doesn't exist."
      });
    }
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Update failed"
    });
  }
}
async function getVideoDetails(req, res)
{
  try
  {
    var video_id = req.query.vid;
    const rows = await db.query(
      `SELECT * FROM videos WHERE id = ${video_id}`
    );
    var data = helper.emptyOrRows(rows);
    if(data.length > 0)
    {
      res.json({
        "success" : true,
        "data" : data[0]
      });
    }
    else
    {
      res.json({
        "success" : false,
        "message" : "No Records Found"
      });
    }
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "No Records Found"
    });
  }
}

async function getScreenshotDetails(req, res)
{
  try
  {
    var screenshot_id = req.query.sid;
    const rows = await db.query(
      `SELECT * FROM screenshots WHERE id = ${screenshot_id}`
    );
    var data = helper.emptyOrRows(rows);
    if(data.length > 0)
    {
      res.json({
        "success" : true,
        "data" : data[0]
      });
    }
    else
    {
      res.json({
        "success" : false,
        "message" : "No Records Found"
      });
    }
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "No Records Found"
    });
  }
}

async function sendScreenshotEmail(req, res)
{
  try
  {
    var screenshot_id = req.body.sid;
    var to_name = req.body.toname;
    var to_email = req.body.emailId;
    var message = req.body.userMessage;
    var senderName = req.body.senderName;
    var senderEmail = req.body.senderEmail;
    var emailhtml = "";
    if(screenshot_id !== "")
    {
      to_name = helper.capitalizeFirstLetter(to_name);
      const rows = await db.query(
        `SELECT * FROM screenshots WHERE id = ${screenshot_id}`
      );
      var data = helper.emptyOrRows(rows);
      if(data.length > 0)
      {
        var screenshotData = data[0];
        var filePath = screenshotData.path;
        //filePath = "./public"+filePath;
        var attachments = [
          {
            fileName: screenshotData.name,
            path: webPath+filePath
          }
        ];
      }
    }
    emailhtml = '<table style="width: 100%;text-align: center;font-family: sans-serif;max-width: 600px;margin: 0px auto;"><tr><td>&nbsp;</td></tr><tr><td><img style="width: 205px;" src="https://screengenius.io/images/email-main-logo.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 330px;" src="https://screengenius.io/images/email-share-header.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><h3 style="font-size: 28px;margin: 0px;">Hi '+to_name+'!</h3></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 14px;">Here is a screenshot in the attachment shared with you by '+to_name+' and '+to_email+' through ScreenGenius - Screenshot & Video Capture Tool.</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 14px;"><b>Message from Sender:</b> '+message+'</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 18px;">Have a Great Day!</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 130px;" src="https://screengenius.io/images/email-text-logo.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 540px;" src="https://screengenius.io/images/email-footer-header.png"></td></tr><tr><td>&nbsp;</td></tr></table><table style="width: 100%;text-align: center;background: #131313;color: #FFF;font-family: sans-serif;"><tr><td>&nbsp;</td></tr><tr><td style="text-align: center;"><table cellspacing="15" style="width: 170px;text-align: center;margin: 0px auto;"><tr><td><img style="width: 32px;" src="https://screengenius.io/images/email-facebook.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-linkedin.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-instagram.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-youtube.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-twitter.png"></td></tr></table></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">Copyright ® 2023 Company All rights Reserved</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">If you have any question, please contact us info@quixy.com</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 203px;background: #FFF; padding: 5px 20px; border-radius: 15px;" src="https://screengenius.io/images/email-use-extension.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 160px;" src="https://screengenius.io/images/email-footer-logo.png"></td></tr><tr><td>&nbsp;</td></tr></table>';
    const transporter = nodemailer.createTransport({
      service: 'godaddy',
      auth: {
        user: webmailUser,
        pass: webmailPass
      }
    });
    let info = await transporter.sendMail({
      from: '"Screengenius.io" <'+webmailUser+'>', // sender address
      to: to_email, // list of receivers
      subject: senderName+" shared thru ScreenGenius - Screenshot & Video capture tool", // Subject line
      html: emailhtml, // html body
      attachments: attachments
    });
    res.json({
      "success" : true,
      "message" : "email sent."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "email sending failed."
    });
  }
}

async function sendFeedback(req, res)
{
  try
  {
    var emailhtml = "";
    var senderEmail = req.body.senderEmail;
    var userMessage = req.body.userMessage;
    if(userMessage !== undefined)
    {
      emailhtml = '<table style="width: 100%;text-align: center;font-family: sans-serif;padding: 10px 20px;max-width: 600px;margin: 0px auto;"><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><img style="width: 205px;" src="https://screengenius.io/images/email-main-logo.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 330px;" src="https://screengenius.io/images/email-feedback-header.png"></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><span style="font-size: 23px;">Dear Quixians,</span></td></tr><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><label style="font-size: 14px;font-weight: 600;width: 100%;float: left;">Email: </label><span style="font-size: 14px;">'+senderEmail+'</span></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><label style="font-size: 14px;font-weight: 600;width: 100%;float: left;">Message: </label><p style="font-size: 14px;margin: 0px;">'+userMessage+'</p></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><span style="font-size: 14px;"><b>Thanks & Regards,<b></span></td></tr><tr style="text-align: left;"><td><span style="font-size: 14px;">New Age Team</span></td></tr><tr><td>&nbsp;</td></tr></table><table style="width: 100%;text-align: center;background: #131313;color: #FFF;font-family: sans-serif;"><tr><td>&nbsp;</td></tr><tr><td style="text-align: center;"><table cellspacing="15" style="width: 170px;text-align: center;margin: 0px auto;"><tr><td><img style="width: 32px;" src="https://screengenius.io/images/email-facebook.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-linkedin.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-instagram.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-youtube.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-twitter.png"></td></tr></table></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">Copyright ® 2023 Company All rights Reserved</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">If you have any question, please contact us info@quixy.com</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 203px;background: #FFF; padding: 5px 20px; border-radius: 15px;" src="https://screengenius.io/images/email-use-extension.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 160px;" src="https://screengenius.io/images/email-footer-logo.png"></td></tr><tr><td>&nbsp;</td></tr></table>';
    }
    else
    {
      var whyUninstall = req.body.whyUninstall;
      var otherTool = req.body.otherTool;
      var whatToImprove = req.body.whatToImprove;
      emailhtml = '<table style="width: 100%;text-align: center;font-family: sans-serif;padding: 10px 20px;max-width: 600px;margin: 0px auto;"><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><img style="width: 205px;" src="https://screengenius.io/images/email-main-logo.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 330px;" src="https://screengenius.io/images/email-feedback-header.png"></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><span style="font-size: 23px;">Dear Quixians,</span></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><label style="font-size: 14px;font-weight: 600;width: 100%;float: left;">Email: </label><span style="font-size: 14px;">'+senderEmail+'</span></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><label style="font-size: 14px;font-weight: 600;width: 100%;float: left;">Why did you uninstall ScreenGenius? </label><span style="font-size: 14px;">'+whyUninstall+'</span></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><label style="font-size: 14px;font-weight: 600;width: 100%;float: left;">Are you using any other tool instead of ScrenGenius?</label><span style="font-size: 14px;">'+otherTool+'</span></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><label style="font-size: 14px;font-weight: 600;width: 100%;float: left;">What can we do to improve ScreenGenius?</label><span style="font-size: 14px;">'+whatToImprove+'</span></td></tr><tr><td>&nbsp;</td></tr><tr style="text-align: left;"><td><span style="font-size: 14px;"><b>Thanks & Regards,<b></span></td></tr><tr style="text-align: left;"><td><span style="font-size: 14px;">New Age Team</span></td></tr><tr><td>&nbsp;</td></tr></table><table style="width: 100%;text-align: center;background: #131313;color: #FFF;font-family: sans-serif;"><tr><td>&nbsp;</td></tr><tr><td style="text-align: center;"><table cellspacing="15" style="width: 170px;text-align: center;margin: 0px auto;"><tr><td><img style="width: 32px;" src="https://screengenius.io/images/email-facebook.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-linkedin.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-instagram.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-youtube.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-twitter.png"></td></tr></table></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">Copyright ® 2023 Company All rights Reserved</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">If you have any question, please contact us info@quixy.com</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 203px;background: #FFF; padding: 5px 20px; border-radius: 15px;" src="https://screengenius.io/images/email-use-extension.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 160px;" src="https://screengenius.io/images/email-footer-logo.png"></td></tr><tr><td>&nbsp;</td></tr></table>';
    }
    const transporter = nodemailer.createTransport({
      service: 'godaddy',
      auth: {
        user: webmailUser,
        pass: webmailPass
      }
    });
    let info = await transporter.sendMail({
      from: '"Screengenius.io" <'+webmailUser+'>', // sender address
      to: "support@screengenius.io", // list of receivers
      subject: "User shared thru ScreenGenius - Screenshot & Video capture tool", // Subject line
      html: emailhtml, // html body
    });
    res.json({
      "success" : true,
      "message" : "email sent."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "email sending failed."
    });
  }
}

async function sendVideoEmail(req, res)
{
  try
  {
    var video_id = req.body.vid;
    var to_name = req.body.toname;
    var to_email = req.body.emailId;
    var message = req.body.userMessage;
    var senderName = req.body.senderName;
    var senderEmail = req.body.senderEmail;
    var emailhtml = "";
    if(video_id !== "")
    {
      to_name = helper.capitalizeFirstLetter(to_name);
      const rows = await db.query(
        `SELECT * FROM videos WHERE id = ${video_id}`
      );
      var data = helper.emptyOrRows(rows);
      if(data.length > 0)
      {
        var screenshotData = data[0];
        var filePath = screenshotData.path;
        //filePath = "./public"+filePath;
        var attachments = [
          {
            fileName: screenshotData.name,
            path: webPath+filePath
          }
        ];
      }
    }
    emailhtml = '<table style="width: 100%;text-align: center;font-family: sans-serif;max-width: 600px;margin: 0px auto;"><tr><td>&nbsp;</td></tr><tr><td><img style="width: 205px;" src="https://screengenius.io/images/email-main-logo.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 330px;" src="https://screengenius.io/images/email-share-header.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><h3 style="font-size: 28px;margin: 0px;">Hi '+to_name+'!</h3></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 14px;">Here is a video in the attachment shared with you by '+to_name+' and '+to_email+' through ScreenGenius - Screenshot & Video Capture Tool.</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 14px;"><b>Message from Sender:</b> '+message+'</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 18px;">Have a Great Day!</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 130px;" src="https://screengenius.io/images/email-text-logo.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 540px;" src="https://screengenius.io/images/email-footer-header.png"></td></tr><tr><td>&nbsp;</td></tr></table><table style="width: 100%;text-align: center;background: #131313;color: #FFF;font-family: sans-serif;"><tr><td>&nbsp;</td></tr><tr><td style="text-align: center;"><table cellspacing="15" style="width: 170px;text-align: center;margin: 0px auto;"><tr><td><img style="width: 32px;" src="https://screengenius.io/images/email-facebook.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-linkedin.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-instagram.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-youtube.png"></td><td><img style="width: 32px;" src="https://screengenius.io/images/email-twitter.png"></td></tr></table></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">Copyright ® 2023 Company All rights Reserved</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><span style="font-size: 13px;">If you have any question, please contact us info@quixy.com</span></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 203px;background: #FFF; padding: 5px 20px; border-radius: 15px;" src="https://screengenius.io/images/email-use-extension.png"></td></tr><tr><td>&nbsp;</td></tr><tr><td><img style="width: 160px;" src="https://screengenius.io/images/email-footer-logo.png"></td></tr><tr><td>&nbsp;</td></tr></table>';
    const transporter = nodemailer.createTransport({
      service: 'godaddy',
      auth: {
        user: webmailUser,
        pass: webmailPass
      }
    });

    let info = await transporter.sendMail({
      from: '"Screengenius.io" <'+webmailUser+'>', // sender address
      to: to_email, // list of receivers
      subject: senderName+" shared thru ScreenGenius - Screenshot & Video capture tool", // Subject line
      html: emailhtml, // html body
      attachments: attachments
    });
    res.json({
      "success" : true,
      "message" : "email sent."
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "email sending failed."
    });
  }
}

async function getAccountUploadProgress(req, res)
{
  const {id} = req?.params
  try
  {
    var rows1 = await db.query(
      `SELECT * FROM screenshots WHERE user_id = ${id}`
    );
    var data1 = helper.emptyOrRows(rows1);

    var rows2 = await db.query(
      `SELECT * FROM videos WHERE user_id = ${id}`
    );
    var data2 = helper.emptyOrRows(rows2);
    res.json({
      "success" : true,
      "screenshots" : data1.length,
      "videos" : data2.length
    });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "No Records Found"
    });
  }
}

async function updateDB(req, res)
{
  // try
  // {
  //   await db.query(
  //     `ALTER TABLE videos ADD is_ready INT DEFAULT 1`
  //   );
  //   res.json({
  //     "success" : true
  //   });
  // }
  // catch
  // {
  //   res.json({
  //     "success" : false
  //   });
  // }
}

async function wipeAllData(req, res)
{
  try
  {
    // await db.query(
    //   `TRUNCATE TABLE screenshots`
    // );
    // await db.query(
    //   `TRUNCATE TABLE videos`
    // );
    // await db.query(
    //   `TRUNCATE TABLE users`
    // );
    // res.json({
    //   "success" : true,
    //   "message" : "Data cleanup done"
    // });
  }
  catch
  {
    res.json({
      "success" : false,
      "message" : "Data cleanup failed"
    });
  }
}

module.exports = {
  userGet,
  userLogin,
  userLogout,
  getVideoRecordingList,
  getStarredVideoRecordingList,
  getTrashedVideoRecordingList,
  uploadVideoRecording,
  deleteVideoRecording,
  renameVideoRecording,
  starredVideoRecording,
  trashVideoRecording,
  getScreenshotList,
  getStarredScreenshotList,
  getTrashedScreenshotList,
  uploadScreenshot,
  deleteScreenshot,
  renameScreenshot,
  starredScreenshot,
  trashScreenshot,
  downloadVideoRecording,
  editVideoRecording,
  getVideoDetails,
  getScreenshotDetails,
  sendScreenshotEmail,
  sendVideoEmail,
  getAccountUploadProgress,
  sendFeedback,
  wipeAllData,
  updateDB
}