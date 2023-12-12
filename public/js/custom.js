var reqCallbacks = 0;
// var APIServer = "https://screengenius.io";
var APIServer = "http://localhost:3000";
var videoID = 0;
var draggedPlayBar = false;
var totalVideoLength = 0;
var uploadedBGMusic = [];
var uploadedBGImages = [];
var selectionId = 0;
var videoProgressPercent = 0;
var videoDimesionsRatioW = 0;
var videoDimesionsRatioH = 0;
var videoEditOptionItems = [];
var prevAnnoType = "";
var prevAnnoID = "";
var formsSubmitted = 0;
var videoEditTextStrings = [];
var editInt = 0;
var imagesLimit = 30;
var videosLimit = 15;
var loginUserId = 1;
var userName = "";
var userEmail = "";
// window.onbeforeunload = function() 
// {
//     return 'Do you really want to exit? Your progress will be lost.';
// };

window.onload = function()
{
    var pathname = window.location.pathname;
    jQuery("#quix-dashboard-sidebar .quix-dashboard-sidebar-items").removeClass("active");
    if(pathname == "/"){ jQuery("#quix-dashboard-sidebar .quix-dashboard-sidebar-items:nth-child(1)").addClass("active"); }
    else if(pathname == "/dashboard"){ jQuery("#quix-dashboard-sidebar .quix-dashboard-sidebar-items:nth-child(2)").addClass("active"); }
    else if(pathname == "/starred"){ jQuery("#quix-dashboard-sidebar .quix-dashboard-sidebar-items:nth-child(3)").addClass("active"); }
    else if(pathname == "/trashed"){ jQuery("#quix-dashboard-sidebar .quix-dashboard-sidebar-items:nth-child(4)").addClass("active"); }

    if(pathname.indexOf("edit-video") > -1)
    {
        var pathnameArr = pathname.split("/");
        videoID = parseInt(pathnameArr[2]);
        makeServerRequest("GET","", APIServer+"/videos/details?vid="+videoID,"",function(res)
        {
            if(res.success)
            {
                var videoPlayer = document.querySelector('#video-editor-content video');
                videoPlayer.src = res.data.modified_path;
                videoPlayer.onloadeddata = function(e) 
                {
                    var orgW = videoPlayer.videoWidth;
                    var orgH = videoPlayer.videoHeight;
                    var rendW = jQuery("#video-editor-content-inner video").width();
                    var rendH = jQuery("#video-editor-content-inner video").height();
                    videoDimesionsRatioW = Math.round(((rendW/orgW) + Number.EPSILON) * 100) / 100;
                    videoDimesionsRatioH = Math.round(((rendH/orgH) + Number.EPSILON) * 100) / 100;
                    if(res.data.json_data && res.data.json_data !== "")
                    {
                        setTimeout(function(){ editVideoAnnotations(res.data.json_data); },500);
                    }
                };
                videoPlayer.onstarted = function(e) 
                {
                    jQuery(".video-editor-play").hide();
                    jQuery(".video-editor-pause").show();
                    positionPlayBarVideoProgress(0);
                };
                videoPlayer.ontimeupdate = function(event) 
                {
                    var currTime = secondsToHms(event.srcElement.currentTime);
                    if(currTime != "")
                    {
                        positionPlayBarVideoProgress(event.srcElement.currentTime);
                        document.querySelector('.video-progress-timer-now').innerText = currTime;
                    }
                };
                videoPlayer.onended = function(e) 
                {
                    jQuery(".video-editor-play").show();
                    jQuery(".video-editor-pause").hide();
                    positionPlayBarVideoProgress(HmsToseconds(totalVideoLength));
                };
                totalVideoLength = res.data.file_duration;
                document.querySelector('.video-progress-end-time').innerText = res.data.file_duration;
                document.querySelector('.video-progress-timer-total').innerText = "/ "+res.data.file_duration;
                // var startTime = 0;
                // var endTime = HmsToseconds(res.data.file_duration);
                // var scaleHTML = createTimeScale(startTime,endTime);
                // jQuery(".video-progress-scale-inner").html(scaleHTML.html);
                // var markerCount = scaleHTML.markerCount;
                // var progressbarWidth = jQuery(".video-progress-scale").width();
                // adjustScaleDims(progressbarWidth,markerCount);
            }
            else
            {
                jQuery("#video-editor-content-inner").html("<span>This video doesn't exist or not yet ready for editing.</span>");
                jQuery(".video-editor-controls").hide();
                jQuery("#video-editor-bottom").hide();
            }
        });
    }
    makeServerRequest("GET","", APIServer+"/user/get","",function(res)
    {
        if(res.success)
        {
            var data = res.data;
            loginUserId = data.id;
            userName = data.name;
            userEmail = data.email;
            jQuery(".quix-dashboard-user > img").attr("src",data.picture);
            jQuery(".user-profile-pic-outer > img").attr("src",data.picture);
            jQuery(".user-profile-name").text(data.name);
            jQuery(".user-profile-name").attr("title",data.name);
            jQuery(".user-profile-email").text(data.email);
            jQuery(".user-profile-email").attr("title",data.email);
            // jQuery(".nav-link.login").text("Dashboard").attr("href","/dashboard");
            // makeServerRequest("GET","", APIServer+"/screenshots/progress","",function(res)
            // {
            //     if(res.success)
            //     {
            //         var videosCount = res.videos;
            //         var screenshotCount = res.screenshots;
            //         var videoProgress = parseInt((videosCount/videosLimit)*100);
            //         var screenshotProgress = parseInt((screenshotCount/imagesLimit)*100);
            //         jQuery("span.images-progress-inner").css({"width": screenshotProgress+"%"});
            //         jQuery("span.images-progress-inner").attr("title", screenshotProgress+"%");
            //         jQuery("span.videos-progress-inner").css({"width": videoProgress+"%"});
            //         jQuery("span.videos-progress-inner").attr("title", videoProgress+"%");
            //     }
            // });
            updateUserProgress()
            jQuery(".quix-dashboard-user").unbind("mouseover");
            jQuery(".quix-dashboard-user").on("mouseover", function()
            {
                jQuery(this).find(".quix-dashboard-user-profile").show();
            });

            jQuery(".quix-dashboard-user").unbind("mouseout");
            jQuery(".quix-dashboard-user").on("mouseout", function(event){
                var e = event.toElement || event.relatedTarget;
                if (e.parentNode == this || e == this) {
                return;
                }
                jQuery(this).find(".quix-dashboard-user-profile").hide();
            });
        }
    });
    if(window.location.pathname == "/dashboard")
    {
        itemsOnloadPage();
    }
    else if(window.location.pathname == "/starred")
    {
        starredOnloadPage();
    }
    else if(window.location.pathname == "/trashed")
    {
        trashedOnloadPage();
    }
    
    jQuery(".button-logout").unbind("click");
    jQuery(".button-logout").on("click", function()
    {
        makeServerRequest("GET","", APIServer+"/user/logout","",function(res)
        {
            document.location.href = APIServer+"/login"
        });
    }); 

    jQuery(".submitbtn").unbind("click");
    jQuery(".submitbtn").on("click", function()
    {
        jQuery(".loader-image").show();
        var senderEmail = jQuery("input[name=sender-email]").val();
        var whyUninstall = jQuery("textarea[name=why-uninstall]").val();
        var otherTool = jQuery("textarea[name=other-tool]").val();
        var whatToImprove = jQuery("textarea[name=what-to-improve]").val();
        if(senderEmail == ""){ alert("Please enter email Id."); jQuery(".loader-image").hide(); return; }
        if(!IsEmail(senderEmail)){ alert("Please enter correct email Id."); jQuery(".loader-image").hide(); return;}
        var data = { "senderEmail":senderEmail, "whyUninstall":whyUninstall, "otherTool":otherTool, "whatToImprove":whatToImprove };
        makeServerRequest("POST","json", APIServer+"/screenshots/send-feedback", data ,function()
        {
            jQuery('.conversations-mid').hide();
            jQuery('.thank-you-screen').show();
        });
    }); 

    jQuery(".quix-tab").on("click",function()
    {
        var type = jQuery(this).find("span").text();
        jQuery("#quix-dashboard-content-tabs-content").find("input[type=checkbox]").prop('checked', false);
        jQuery(".quix-tab").removeClass("active");
        jQuery(this).addClass("active");
        if(type == 'My Screenshots'){
            jQuery(".quix-dashboard-content-images").show();
            jQuery(".quix-dashboard-content-videos").hide();
        }else{
            jQuery(".quix-dashboard-content-images").hide();
            jQuery(".quix-dashboard-content-videos").show();
        }
    });
    
    jQuery(".editor-save-button").unbind("click");
    jQuery(".editor-save-button").on("click", function()
    {
        videoEditTextStrings = [];
        formsSubmitted = 0;
        setVideoEditOptions(prevAnnoID,prevAnnoType); 
        displayEditMessage('Please wait. It might take around a while<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>');
        getTextStrings();
        //editVideo();
    });

    jQuery("#upload-custom-video").unbind("change");
    jQuery("#upload-custom-video").on("change", function()
    {
        jQuery("#quix-dashboard-loader-img img").attr("src", "images/UploadLoader.gif");
        jQuery("#quix-dashboard-loader-img img").css("width","200px");
        jQuery("#quix-dashboard-loader").show();
        var file = jQuery(this)[0].files[0];
        var video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            var duration = video.duration;
            var file_size = file.size; //formatBytes(file.size);
            var fileType = file.type;
            var fd = new FormData();
            fd.append('name', file.name);
            fd.append('user_id', loginUserId);
            fd.append('file_size', file_size);
            fd.append('file_duration', secondsToHms(duration));
            fd.append('recording', file);
            var url = APIServer+"/videos/upload";
            makeServerRequest("POST","form-data",url,fd,function(res)
            {
                jQuery("#quix-dashboard-loader").hide();
                jQuery("#quix-dashboard-loader-img img").attr("src", "images/light-loader.gif");
                jQuery("#quix-dashboard-loader-img img").css("width","65px");
                if(res.success)
                {
                    jQuery(".quix-dashboard-popup-title-inner").html("<span>Saved Successfuly</span>");
                    jQuery(".quix-dashboard-popup-body-inner").html("<span>Your file is uploaded Successfuly.</span>");
                    jQuery("#quix-dashboard-overlay").show();
                    jQuery(".quix-dashboard-popup-footer").hide();
                    jQuery("#quix-dashboard-popup").show();
                    setTimeout(function()
                    {
                        jQuery("#quix-dashboard-overlay").hide();
                        jQuery("#quix-dashboard-popup").hide();
                        document.location.href =  "edit-video/"+ res.insertedId;
                    },1200)
                }
                else
                {
                    jQuery(".quix-dashboard-popup-title-inner").html("<span>Upload Failed</span>");
                    jQuery(".quix-dashboard-popup-body-inner").html("<span>"+res.message+"</span>");
                    jQuery("#quix-dashboard-overlay").show();
                    jQuery(".quix-dashboard-popup-footer").hide();
                    jQuery("#quix-dashboard-popup").show();
                    setTimeout(function()
                    {
                        jQuery("#quix-dashboard-overlay").hide();
                        jQuery("#quix-dashboard-popup").hide();
                    },1200)
                }
            });
        }
        video.src = URL.createObjectURL(file);
    });

    jQuery(".quix-dashboard-close").unbind("click");
    jQuery(".quix-dashboard-close").on("click", function()
    {
        jQuery("#quix-dashboard-popup").hide();
        jQuery("#quix-dashboard-overlay").hide();
    });

    jQuery("#video-annotation-blocks-inner").unbind("click");
    jQuery("#video-annotation-blocks-inner").on("click", function(e)
    {
        if(e.target === e.currentTarget)
        {
            positionPlayBarClick(e);
        }
    });

    jQuery("#video-progress-pointer").unbind("mousedown");
    jQuery("#video-progress-pointer").on("mousedown", function(e)
    {
        draggedPlayBar = true;
        jQuery("#video-annotation-blocks-inner").css({"pointer-events":"none"});
    });

    jQuery("#video-editor-editing-selection-inner").unbind("mousemove");
    jQuery("#video-editor-editing-selection-inner").on("mousemove", function(e)
    {
        positionPlayBar(e);
    });

    jQuery("#video-editor-editing-selection-inner").unbind("mouseup");
    jQuery("#video-editor-editing-selection-inner").on("mouseup", function(e)
    {
        draggedPlayBar = false;
        jQuery("#video-annotation-blocks-inner").css({"pointer-events":"all"})
    });

    // jQuery("#video-editor-editing-selection-inner").unbind("mouseout");
    // jQuery("#video-editor-editing-selection-inner").on("mouseout", function(event)
    // {
    //     draggedPlayBar = false;
    // });

    // jQuery("#video-editor-editing-selection-inner").unbind("mouseout");
    // jQuery("#video-editor-editing-selection-inner").on("mouseout", function(event)
    // {
    //     var e = event.toElement || event.relatedTarget;
    //     while(e && e.parentNode && e.parentNode != window) {
    //         if (e.parentNode == this ||  e == this) {
    //             if(e.preventDefault) e.preventDefault();
    //             return false;
    //         }
    //         e = e.parentNode;
    //     }
    //     positionPlayBar(e);
    //     draggedPlayBar = false;
    // });

    jQuery(".video-editor-controls img").unbind("click");
    jQuery(".video-editor-controls img").on("click", function()
    {
        var video = document.querySelector('#video-editor-content video');
        var actionType = jQuery(this).attr("action-type");
        videoPlayerActions(video,actionType);
    });

    jQuery("#video-editor-editing-toolbar span").unbind("click");
    jQuery("#video-editor-editing-toolbar span").on("click", function()
    {
        var actionType = jQuery(this).attr("action-type");
        videoEditOptions(actionType);
    });

    jQuery("#upload-image").unbind('change');
    jQuery("#upload-image").on("change",function()
    {
        var filedata = this.files[0];
        uploadedBGImages.push(jQuery(this)[0].files[0]);
        addImageToVideoComp(filedata);
    });

    jQuery("#input-upload-music").unbind("change");
    jQuery("#input-upload-music").on("change", function()
    {
        uploadedBGMusic.push(jQuery(this)[0].files[0]);
        jQuery(".quix-dashboard-popup-footer").hide();
        jQuery(".quix-dashboard-popup-title-inner").html("<span>Saved Successfuly</span>");
        jQuery(".quix-dashboard-popup-body-inner").html("<span>Your file is uploaded Successfuly.</span>");
        setTimeout(function()
        {
            jQuery("#quix-dashboard-overlay").hide();
            jQuery("#quix-dashboard-popup").hide();
            intervalSelectorBox("bgMusic");
        },1200)
    });
    
    jQuery(".quix-dashboard-new-item-button").unbind("click");
    jQuery(".quix-dashboard-new-item-button").on("click", function(){
        jQuery(".quix-dashboard-popup-title-inner").html("<span>Upload File</span>");
        jQuery(".quix-dashboard-popup-body-inner").html("<input id='input-file-upload' accept='image/jpg,image/png,image/gif,video/mp4' type='file' name='input-file-upload'/>");
        jQuery("#quix-dashboard-overlay").show();
        jQuery(".quix-dashboard-popup-footer").hide();
        jQuery("#quix-dashboard-popup").show();
        jQuery("#input-file-upload").unbind("change");
        jQuery("#input-file-upload").on("change", function()
        {
            var uploadTy = null;
            jQuery("#quix-dashboard-loader").show();
            var file = jQuery(this)[0].files[0];

            var fileType = file.type;
            var fd = new FormData();
            fd.append('name', file.name);
            fd.append('user_id', loginUserId);
            fd.append('file_size', file.size); //formatBytes(file.size)
            console.log(file,"=file=");
            if(fileType.indexOf("video") > -1)
            {
                var video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = function() 
                {
                    window.URL.revokeObjectURL(video.src);
                    var duration = video.duration;
                    console.log(video,duration,"-duration-");
                    fd.append('file_duration', secondsToHms(duration));
                    fd.append('recording', file);
                    var url = APIServer+"/videos/upload";
                    uploadTy = "video";
                    makeServerRequest("POST","form-data",url,fd,function(res)
                    {
                        jQuery("#quix-dashboard-loader").hide();
                        jQuery(".quix-dashboard-popup-footer").hide();
                        jQuery(".quix-dashboard-popup-title-inner").html("<span>Saved Successfuly</span>");
                        jQuery(".quix-dashboard-popup-body-inner").html("<span>Your file is uploaded Successfuly.</span>");
                        setTimeout(function()
                        {
                            jQuery("#quix-dashboard-overlay").hide();
                            jQuery("#quix-dashboard-popup").hide();
                            //window.location.reload();
                            reloadScreenData(uploadTy);
                        },1200)
                    });
                }
                video.src = URL.createObjectURL(file);
                document.body.appendChild(video);
            }
            else if(fileType.indexOf("image") > -1)
            {
                fd.append('screenshot', file);
                var url = APIServer+"/screenshots/upload";
                makeServerRequest("POST","form-data",url,fd,function(res)
                {
                    jQuery("#quix-dashboard-loader").hide();
                    jQuery(".quix-dashboard-popup-footer").hide();
                    jQuery(".quix-dashboard-popup-title-inner").html("<span>Saved Successfuly</span>");
                    jQuery(".quix-dashboard-popup-body-inner").html("<span>Your file is uploaded Successfuly.</span>");
                    setTimeout(function()
                    {
                        jQuery("#quix-dashboard-overlay").hide();
                        jQuery("#quix-dashboard-popup").hide();
                        //window.location.reload();
                        reloadScreenData(uploadTy);
                    },1200)
                });
            }
                
        });
        jQuery(".quix-dashboard-popup-footer .cancel-popup").unbind("click");
        jQuery(".quix-dashboard-popup-footer .cancel-popup").on("click", function(){
            jQuery("#quix-dashboard-overlay").hide();
            jQuery("#quix-dashboard-popup").hide();
        });
    });

    jQuery("#quix-dashboard-sort-actions").unbind("change");
    jQuery("#quix-dashboard-sort-actions").on("change", function(){
        var requestType = jQuery(this).attr("data-type");
        var sortType = jQuery(this).val();
        if(jQuery(".quix-tab-images").hasClass("active"))
        {
            makeServerRequest("GET","",APIServer+"/screenshots/list?sort="+sortType,"",function(res)
            {
                loadItemsHTML('screenshots',"items",res);
            });
        }
        else
        {
            makeServerRequest("GET","",APIServer+"/videos/list?sort="+sortType,"",function(res)
            {
                loadItemsHTML('videos',"items",res);
            });
        }
        jQuery("#quix-dashboard-sort-actions").val("");
    });

    jQuery("#quix-dashboard-actions").unbind("change");
    jQuery("#quix-dashboard-actions").on("change", function(){
        var actionItem = jQuery(this).val();
        var checkboxes = jQuery(".check-item-type");
        reqCallbacks = 0;
        var checkedBoxes = 0;
        let text = "Are you sure?";
        if(confirm(text) == true) 
        {
            jQuery("#quix-dashboard-loader").show();
            for (let index = 0; index < checkboxes.length; index++) 
            {
                const element = checkboxes[index];
                if(jQuery(checkboxes[index]).is(":checked"))
                {
                    checkedBoxes++;
                    var itemType = jQuery(checkboxes[index]).attr("data-item-type");
                    var itemId = jQuery(checkboxes[index]).attr("data-item-id");
                    var itemSVal = jQuery(checkboxes[index]).attr("data-item-starredval");
                    var itemTVal = jQuery(checkboxes[index]).attr("data-item-trashval");
                    if(actionItem == "starred")
                    {
                        if(itemType == "videos")
                        {
                            if(itemSVal == 1){ itemSVal = 0; }else{ itemSVal = 1; }
                            var data = {"id":itemId,"is_starred":itemSVal};
                            var url = APIServer+"/videos/starred";
                        }
                        else
                        {
                            if(itemSVal == 1){ itemSVal = 0; }else{ itemSVal = 1; }
                            var data = {"id":itemId,"is_starred":itemSVal};
                            var url = APIServer+"/screenshots/starred";
                        }
                    }
                    else if(actionItem == "trash")
                    {
                        if(itemType == "videos")
                        {
                            if(itemTVal == 1){ itemTVal = 0; }else{ itemTVal = 1; }
                            var data = {"id":itemId,"is_trashed":itemTVal};
                            var url = APIServer+"/videos/trash";
                        }
                        else
                        {
                            if(itemTVal == 1){ itemTVal = 0; }else{ itemTVal = 1; }
                            var data = {"id":itemId,"is_trashed":itemTVal};
                            var url = APIServer+"/screenshots/trash";
                        }
                    }
                    else if(actionItem == "delete")
                    {
                        if(itemType == "videos")
                        {
                            var data = {"id":itemId};
                            var url = APIServer+"/videos/delete";
                        }
                        else
                        {
                            var data = {"id":itemId};
                            var url = APIServer+"/screenshots/delete";
                        }
                    }
                    makeServerRequest("POST","json",url,data,function(res)
                    {
                        reqCallbacks = reqCallbacks+1;
                        if(reqCallbacks == checkedBoxes)
                        {
                            updateUserProgress()
                            jQuery("#quix-dashboard-loader").hide();
                            reloadScreenData();
                            //window.location.reload();
                        }
                    });
                }
            }
            jQuery("#quix-dashboard-actions").val("");
        }
    });
}
function updateUserProgress (){
    makeServerRequest("GET","", APIServer+"/screenshots/progress","",function(res)
    {
        if(res.success)
        {
            var videosCount = res.videos;
            var screenshotCount = res.screenshots;
            var videoProgress = parseInt((videosCount/videosLimit)*100);
            var screenshotProgress = parseInt((screenshotCount/imagesLimit)*100);
            jQuery("span.images-progress-inner").css({"width": screenshotProgress+"%"});
            jQuery("span.images-progress-inner").attr("title", screenshotProgress+"%");
            jQuery("span.videos-progress-inner").css({"width": videoProgress+"%"});
            jQuery("span.videos-progress-inner").attr("title", videoProgress+"%");
        }
    });
}
function reloadScreenData(uploadType)
{
    var urlSCall = APIServer+"/screenshots/list";
    var urlVCall = APIServer+"/videos/list";
    var dataType = "items";
    if(document.location.pathname == "/starred"){ dataType = "starred"; urlSCall = APIServer+"/screenshots/starred-list"; urlVCall = APIServer+"/videos/starred-list";}
    else if(document.location.pathname == "/trashed"){ dataType = "trashed"; urlSCall = APIServer+"/screenshots/trashed-list"; urlVCall = APIServer+"/videos/trashed-list";}
    if(jQuery(".quix-tab-images").hasClass("active"))
    {
        makeServerRequest("GET","",urlSCall,"",function(res)
        {
            loadItemsHTML('screenshots',dataType,res);
        });
    }
    else
    {
        makeServerRequest("GET","",urlVCall,"",function(res)
        {
            loadItemsHTML('videos',dataType,res);
        });
    }
    if(uploadType !== undefined && uploadType !== null)
    {
        makeServerRequest("GET","",urlVCall,"",function(res)
        {
            loadItemsHTML('videos',dataType,res);
        });
    }
}
function getTextStrings()
{
    var forms = jQuery("form");
    if(forms.length > 0)
    {   
        jQuery(forms[0]).submit(); 
    }
    else
    {
        editVideo();
    }
}
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getFormattedDate(date)
{
  var today = new Date(date);
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  var hh = String(today.getHours()).padStart(2, '0');
  var ii = String(today.getMinutes()).padStart(2, '0');
  var am_pm = today.getHours() >= 12 ? "PM" : "AM";
  today = dd + '/' + mm + '/' + yyyy + " " + hh + ":" + ii + am_pm;
  return today;
}
function sg_rename_item(type,itemId,name)
{
    var popupTitle = "Rename Screenshot";
    var popupPlaceHolder = "Enter Screenshot Name";
    if(type == "videos"){ popupTitle = "Rename Video"; popupPlaceHolder = "Enter Video Name"; }
    var namearr = name.split(".");
    name = namearr[0];
    jQuery(".quix-dashboard-popup-title-inner").html("<span>"+popupTitle+"</span>");
    jQuery(".quix-dashboard-popup-body-inner").html("<input id='input-rename-video' type='text' value='"+name+"' placeholder='"+popupPlaceHolder+"'>");
    jQuery("#quix-dashboard-overlay").show();
    jQuery(".quix-dashboard-popup-footer").show();
    jQuery("#quix-dashboard-popup").show();

    jQuery(".quix-dashboard-popup-footer .save-popup").unbind("click");
    jQuery(".quix-dashboard-popup-footer .save-popup").on("click", function(){
        jQuery("#quix-dashboard-loader").show();
        var newname = jQuery("#input-rename-video").val();
        newname = newname+"."+namearr[1];
        if(type == "videos")
        {
            var data = {"id":itemId,"name":newname};
            var url = APIServer+"/videos/rename";
        }
        else
        {
            var data = {"id":itemId,"name":newname};
            var url = APIServer+"/screenshots/rename";
        }
        makeServerRequest("POST","json",url,data,function(res)
        {
            jQuery("#quix-dashboard-overlay").hide();
            jQuery("#quix-dashboard-loader").hide();
            jQuery("#quix-dashboard-popup").hide();
            //window.location.reload();
            reloadScreenData();
        });
    });
    jQuery(".quix-dashboard-popup-footer .cancel-popup").unbind("click");
    jQuery(".quix-dashboard-popup-footer .cancel-popup").on("click", function(){
        jQuery("#quix-dashboard-overlay").hide();
        jQuery("#quix-dashboard-popup").hide();
    });
}
function adjustScaleDims(outerWid,markerCount)
{
    outerWid = parseInt(outerWid);
    if(markerCount > 800)
    {
        var totalMajorMarkers = jQuery(".mark-sec").length;
        var itemWid = ((outerWid-totalMajorMarkers)/markerCount);
        jQuery(".mark-ms").css({'border':'none','width': itemWid+'px'});
        jQuery(".mark-half-sec").css({'border':'none','width': itemWid+'px'});
        jQuery(".mark-sec").css({'width': itemWid+'px'});
    }
    else //if(markerCount > 400)
    {
        var totalMajorMarkers = jQuery(".mark-half-sec").length + jQuery(".mark-sec").length;
        var itemWid = ((outerWid-totalMajorMarkers)/markerCount);
        jQuery(".mark-ms").css({'border':'none','width': itemWid+'px'});
        jQuery(".mark-half-sec").css({'width': itemWid+'px'});
        jQuery(".mark-sec").css({'width': itemWid+'px'});
    }
}
function sg_starred_item(type,itemId,val)
{
    let text = "Are you sure?";
    if(confirm(text) == true) 
    {
        jQuery("#quix-dashboard-loader").show();
        if(type == "videos")
        {
            if(val == 1){ val = 0; }else{ val = 1; }
            var data = {"id":itemId,"is_starred":val};
            var url = APIServer+"/videos/starred";
        }
        else
        {
            if(val == 1){ val = 0; }else{ val = 1; }
            var data = {"id":itemId,"is_starred":val};
            var url = APIServer+"/screenshots/starred";
        }
        makeServerRequest("POST","json",url,data,function(res)
        {
            jQuery("#quix-dashboard-loader").hide();
            reloadScreenData();
        });
    }
}
function sg_trash_item(type,itemId,val)
{
    let text = "Are you sure?";
    if(confirm(text) == true) 
    {
        jQuery("#quix-dashboard-loader").show();
        if(type == "videos")
        {
            if(val == 1){ val = 0; }else{ val = 1; }
            var data = {"id":itemId,"is_trashed":val};
            var url = APIServer+"/videos/trash";
        }
        else
        {
            if(val == 1){ val = 0; }else{ val = 1; }
            var data = {"id":itemId,"is_trashed":val};
            var url = APIServer+"/screenshots/trash";
        }
        makeServerRequest("POST","json",url,data,function(res)
        {
            jQuery("#quix-dashboard-loader").hide();
            reloadScreenData();
        });
    }
}
function makeServerRequest(type,dataType,url,data,callback)
{
    var contentType = 'application/json';
    if(dataType == "json")
    {
        data = JSON.stringify(data); 
    }
    else if(dataType == "form-data")
    {
        contentType = false;
    }
    jQuery.ajax({
        url: url,
        type: type,
        contentType: contentType,
        cache: false,
        processData: false,
        success: function(data){
            callback(data);
        },
        error: function(error){
            callback(error);
        },
        data: data
    });
}
function itemsOnloadPage()
{
    makeServerRequest("GET","",APIServer+"/videos/list","",function(res)
    {
        loadItemsHTML('videos',"items",res);
    });
    makeServerRequest("GET","",APIServer+"/screenshots/list","",function(res)
    {
        loadItemsHTML('screenshots',"items",res);
    });
}
function trashedOnloadPage()
{
    makeServerRequest("GET","",APIServer+"/videos/trashed-list","",function(res)
    {
        loadItemsHTML('videos',"trashed",res);
    });
    makeServerRequest("GET","",APIServer+"/screenshots/trashed-list","",function(res)
    {
        loadItemsHTML('screenshots',"trashed",res);
    });
}
function starredOnloadPage()
{
    makeServerRequest("GET","",APIServer+"/videos/starred-list","",function(res)
    {
        loadItemsHTML('videos',"starred",res);
    });
    makeServerRequest("GET","",APIServer+"/screenshots/starred-list","",function(res)
    {
        loadItemsHTML('screenshots',"starred",res);
    });
}
function sg_open_item(path)
{
    window.open(path,'_blank');
    jQuery(".item-options-icon").hide();
}
function sg_share_link(type,itemId)
{
    jQuery("#quix-dashboard-loader").show();
    var url = "";
    if(type == "videos")
    {
        url = APIServer+"/videos/details?vid="+itemId;
    }
    else
    {
        url = APIServer+"/screenshots/details?sid="+itemId;
    }
    makeServerRequest("GET","", url,"",function(res)
    {
        jQuery("#quix-dashboard-loader").hide();
        var path = "";
        if(res.data.path){ path = res.data.path; }
        var mHTML = '<input value="'+APIServer+path+'" type="text" name="share-Link" id="share-screenshot-link"/><button class="send-link-share">Copy</button><button class="close-link-share">Close</button>';
        
        jQuery(".quix-dashboard-popup-title-inner").html("<span>Share link with Anyone</span>");
        jQuery(".quix-dashboard-popup-body-inner").html(mHTML);
        jQuery("#quix-dashboard-overlay").show();
        jQuery("#quix-dashboard-popup").show();
        jQuery(".quix-dashboard-popup-footer").hide();

        jQuery("#link-share-popup-wrapper .email-share-form").html(mHTML);
        jQuery(".send-link-share").unbind('click');
        jQuery(".send-link-share").on("click",function(){
            jQuery("#share-screenshot-link").select();
            navigator.clipboard.writeText(jQuery("#share-screenshot-link").val());
            jQuery(".send-link-share").unbind('click');
            jQuery("#quix-dashboard-overlay").hide();
            jQuery("#quix-dashboard-popup").hide();
        });
        jQuery(".close-link-share").unbind('click');
        jQuery(".close-link-share").on("click",function(){
            jQuery("#quix-dashboard-overlay").hide();
            jQuery("#quix-dashboard-popup").hide();
            jQuery(".close-link-share").unbind('click');
        });
    });
}
function sg_share_email(type,itemId)
{
    jQuery(".quix-dashboard-popup-title-inner").html("<span>Send through Email</span>");
    jQuery(".quix-dashboard-popup-body-inner").html('<input type="text" name="to-name-feedback" placeholder="Enter Your First Name">\n\
    <input type="text" name="to-email" placeholder="To Email"/>\n\
    <textarea id="email-message" placeholder="Message" maxlength ="300" name="email-message"></textarea>\n\
    <p class="message-counter"></p>');
    jQuery("#quix-dashboard-overlay").show();
    jQuery("#quix-dashboard-popup").show();
    jQuery(".quix-dashboard-popup-footer-inner").html('<img class="loader-icon" src="/images/light-loader.gif"><button class="send-email">Send</button><button class="cancel-popup">Cancel</button>');
    jQuery(".quix-dashboard-popup-footer").show();
    jQuery("#email-message").keyup(function(){
        jQuery(".message-counter").text((300 - jQuery(this).val().length) + " characters left");
    });
    jQuery(".send-email").on("click",function()
    {
        // jQuery("#share-screenshot-link").select();
        // navigator.clipboard.writeText(jQuery("#share-screenshot-link").val());
        jQuery(".loader-icon").show();
        var toName = jQuery("input[name=to-name-feedback]").val();
        var toEmail = jQuery("input[name=to-email]").val();
        var emailMessage = jQuery("textarea[name=email-message]").val();
        if(toName == ""){ alert("Please enter your name."); jQuery(".loader-icon").hide(); return; }
        if(toEmail == ""){ alert("Please enter email Id."); jQuery(".loader-icon").hide(); return; }
        if(!IsEmail(toEmail)){ alert("Please enter correct email Id."); jQuery(".loader-icon").hide(); return;}

        var data = {"toname":toName,"emailId":toEmail,"userMessage":emailMessage,"senderName":userName,"senderEmail":userEmail,"sid":itemId};
        var url = "";
        if(type == "videos")
        {
            url = APIServer+"/videos/send-email";
        }
        else
        {
            url = APIServer+"/screenshots/send-email";
        }
        makeServerRequest("POST","json", APIServer+"/screenshots/send-email",data,function(res)
        {
            if(res.success)
            {
                alert("Shared via email successfully.");
                jQuery(".send-email").unbind('click');
                jQuery("#quix-dashboard-overlay").hide();
                jQuery("#quix-dashboard-popup").hide();
                jQuery(".loader-icon").hide();
            }
            else
            {
                alert("Error Occurred.");
                jQuery(".loader-icon").hide();
            }
        });
    });

    jQuery(".quix-dashboard-popup-footer .cancel-popup").unbind("click");
    jQuery(".quix-dashboard-popup-footer .cancel-popup").on("click", function(){
        jQuery("#quix-dashboard-overlay").hide();
        jQuery("#quix-dashboard-popup").hide();
    });
}
function sg_delete_item(type,itemId,val)
{
    let text = "Are you sure?";
    if(confirm(text) == true) 
    {
        jQuery("#quix-dashboard-loader").show();
        if(type == "videos")
        {
            var data = {"id":itemId};
            var url = APIServer+"/videos/delete";
        }
        else
        {
            var data = {"id":itemId};
            var url = APIServer+"/screenshots/delete";
        }
        makeServerRequest("POST","json",url,data,function(res)
        {
            updateUserProgress()
            jQuery("#quix-dashboard-loader").hide();
            //window.location.reload();
            reloadScreenData();
        });
    }
}

function sg_download_item(type, path, itemId, itemName, downloadType)
{
    var namearr = itemName.split(".");
    var name = namearr[0];
    if(type == "videos")
    {
        if(downloadType == "webm")
        {
            const link = document.createElement('a');
            link.href = path;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            successMessagePopup("Download Complete","Recording is downloaded into downloads."); 
        }
        else
        {
            jQuery("#quix-dashboard-loader").show();
            var data = {"type":downloadType,"vid":itemId};
            makeServerRequest("POST","json", APIServer+"/videos/download",data,function(res)
            {
                jQuery("#quix-dashboard-loader").hide();
                const link = document.createElement('a');
                link.href = APIServer+res.path;
                link.download = name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                if(res.success)
                {
                    successMessagePopup("Download Complete","Recording is downloaded into downloads."); 
                }
                else
                {
                    jQuery("#quix-dashboard-loader").hide();
                    failureMessagePopup("Download Failed", "Failed to Download Video.");
                }
            });
        }
    }
    else
    {
        getBase64FromUrl(path).then(function(source)
        {
            if(downloadType == "png" || downloadType == "jpg")
            {
                var fileName = name+".png";
                if(downloadType == "jpg"){ fileName = name+".jpg"; }
                var el = document.createElement("a");
                el.setAttribute("href", source);
                el.setAttribute("download", fileName);
                document.body.appendChild(el);
                try
                {
                    el.click();
                    successMessagePopup("Download Complete","Recording is downloaded into downloads."); 
                }
                catch(err)
                {
                    alert(err+"Please try to download in full screen mode as host page is retricting the pdf download.");
                }
                el.remove();    
            }
            else if(downloadType == "pdf")
            {
                var base64EncodedPDF = source.split(',')[1];
                var decodedPdfContent = atob(base64EncodedPDF);
                var byteArray = new Uint8Array(decodedPdfContent.length)
                for(var i=0; i<decodedPdfContent.length; i++){
                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                }
                var blob = new Blob([byteArray.buffer], { type: 'image/jpeg' });
                var source = URL.createObjectURL(blob);
                getImageFromUrl(source, name, createPDF);
            }
        });
    }
}

function successMessagePopup(title, msg)
{
    jQuery("#quix-dashboard-loader").hide();
    jQuery(".quix-dashboard-popup-footer").hide();
    jQuery(".quix-dashboard-popup-title-inner").html("<span>"+title+"</span>");
    jQuery(".quix-dashboard-popup-body-inner").html("<span>"+msg+"</span>");
    jQuery("#quix-dashboard-overlay").show();
    jQuery("#quix-dashboard-popup").show();
    jQuery(".quix-dashboard-popup-footer").hide();
    setTimeout(function()
    {
        jQuery("#quix-dashboard-overlay").hide();
        jQuery("#quix-dashboard-popup").hide();
    },1200);
}

function failureMessagePopup(title, msg)
{
    jQuery("#quix-dashboard-loader").hide();
    jQuery(".quix-dashboard-popup-footer").hide();
    jQuery(".quix-dashboard-popup-title-inner").html("<span>"+title+"</span>");
    jQuery(".quix-dashboard-popup-body-inner").html("<span>"+msg+"</span>");
    jQuery("#quix-dashboard-overlay").show();
    jQuery("#quix-dashboard-popup").show();
    jQuery(".quix-dashboard-popup-footer").hide();
    setTimeout(function()
    {
        jQuery("#quix-dashboard-overlay").hide();
        jQuery("#quix-dashboard-popup").hide();
    },1200);
}

// Get image's base64 data from an image Url
function getImageFromUrl(url, name, callback) {
    var img = new Image();
    img.onError = function() {
        alert('Cannot load image: "'+url+'"');
    };
    img.onload = function() {
        callback(img, name);
    };
    img.src = url;
}

// To create PDF for download operation
function createPDF(imgData, name) 
{
    var doc = new jsPDF();
    var ww = imgData.width;
    var hh = imgData.height;
    var ar = ww/hh;
    var pdfW = parseInt(doc.internal.pageSize.width-20);
    var pdfH = parseInt(pdfW/ar);
    var position = 0;
    var heightLeft = pdfH;
    var pageHeight = parseInt(doc.internal.pageSize.height);
    doc.addImage(imgData, 'JPEG', 10, position, pdfW, pdfH); // Cache the image using the alias 'monkey'/
	heightLeft -= pageHeight;
	while (heightLeft >= 0) 
	{
	  position += (pageHeight); // top padding for other pages
	  doc.addPage();
	  doc.addImage(imgData, 'JPEG', 10, -Math.abs(position), pdfW, pdfH);
	  heightLeft -= pageHeight;
	}

    var fileName = name+".pdf";
    var source = doc.output('datauristring');
    var el = document.createElement("a");
    el.setAttribute("href", source);
    el.setAttribute("download", fileName);
    document.body.appendChild(el);
    try
    {
        el.click();
        successMessagePopup("Download Complete","Recording is downloaded into downloads."); 
    }
    catch(err)
    {
        alert(err+"Please try to download in full screen mode as host page is retricting the pdf download.");
    }
    el.remove();
    
}

const getBase64FromUrl = async (url) => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob); 
      reader.onloadend = () => {
        const base64data = reader.result;   
        resolve(base64data);
      }
    });
}

function loadItemsHTML(type,event,res)
{
    if(res.success)
    {
        var rowHTML = "";
        if(res.data.length > 0)
        {
            for (let index = 0; index < res.data.length; index++) 
            {
                var itemId = res.data[index].id;
                var itemName = res.data[index].name;
                var is_starred = res.data[index].is_starred;
                var starredVal = 0;
                var starHTML = "";
                if(event == "starred"){ starredVal = 1; }
                if(is_starred == 1)
                {
                    starHTML += '<div class="starred-image-outer"><img src="images/quix-dash-goldenstarred.png"/></div>';
                }
                var is_trashed = res.data[index].is_trashed;
                var trashedVal = 0;
                if(event == "trashed"){ trashedVal = 1; }
                var path = res.data[index].path;
                path = APIServer+"/"+path;
                var itemImg = res.data[index].thumbnail;
                var itemSize = formatBytes(res.data[index].file_size);
                itemImg = APIServer+"/"+itemImg;
                var itemDate = getFormattedDate(res.data[index].created_at);
                var optionsHTML = starredHTML = editVideoHTML = DownloadHTML = openNewTabHTML = "";
                var itemTypeIcon = '<img src="images/quix-dash-clock.png"/>';
                var detailsHTML = '<div class="item-date" style="width:70%;font-size: 12px;"><img src="images/quix-dash-calendar.png"/><span>'+itemDate+'</span></div><div class="item-date" style="width:30%;font-size: 12px;"><img src="images/quix-dash-size.png"/><span>'+itemSize+'</span></div>';                
                var itemAvailable = "";
                if(type == "videos")
                {
                    path = res.data[index].modified_path;
                    //if(res.data[index].is_ready == 1){ itemAvailable = "item-available"; }else{ itemAvailable = "item-not-available"; }
                    var itemDuration = res.data[index].file_duration;
                    var detailsHTML = '<div class="item-date" style="width:50%;font-size: 12px;"><img src="images/quix-dash-calendar.png"/><span>'+itemDate+'</span></div><div class="item-date" style="width:28%;font-size: 12px;"><img src="images/quix-dash-size.png"/><span>'+itemSize+'</span></div><div class="item-date" style="width:22%;font-size: 12px;"><img src="images/quix-dash-clock.png"/><span>'+itemDuration+'</span></div>';
                    itemTypeIcon  = '<img src="images/icon-video.png"/>';
                    editVideoHTML = '<div class="item-options-grid-row resize-items">\n\
                        <a target="_blank" href="edit-video/'+itemId+'"><img src="images/quix-edit-video.png"/>\n\
                        <span>Edit Video</span></a>\n\
                    </div>';
                    DownloadHTML = '<div class="item-options-grid-row resize-items" onclick="sg_download_item(\''+type+'\', \''+path+'\', \''+itemId+'\', \''+itemName+'\', \'webm\')">\n\
                                        <img src="images/quix-save-cloud.png"/>\n\
                                        <span>Download(WebM)</span>\n\
                                    </div>\n\
                                    <div class="item-options-grid-row resize-items" onclick="sg_download_item(\''+type+'\', \''+path+'\', \''+itemId+'\', \''+itemName+'\', \'mp4\')">\n\
                                        <img src="images/quix-save-cloud.png"/>\n\
                                        <span>Download(Mp4)</span>\n\
                                    </div>';
                    openNewTabHTML = '<div class="item-options-grid-row resize-items" onclick="sg_open_item(\''+path+'\')">\n\
                                    <img src="images/quix-dash-resize.png"/>\n\
                                    <span>Play in new Tab</span>\n\
                                </div>';
                }
                else
                {
                    DownloadHTML = '<div class="item-options-grid-row resize-items" onclick="sg_download_item(\''+type+'\', \''+path+'\', \''+itemId+'\', \''+itemName+'\', \'png\')">\n\
                                    <img src="images/quix-save-cloud.png"/>\n\
                                    <span>Download(PNG)</span>\n\
                                </div>\n\
                                <div class="item-options-grid-row resize-items" onclick="sg_download_item(\''+type+'\', \''+path+'\', \''+itemId+'\', \''+itemName+'\', \'jpg\')">\n\
                                    <img src="images/quix-save-cloud.png"/>\n\
                                    <span>Download(JPEG)</span>\n\
                                </div>\n\
                                <div class="item-options-grid-row resize-items" onclick="sg_download_item(\''+type+'\', \''+path+'\', \''+itemId+'\', \''+itemName+'\', \'pdf\')">\n\
                                    <img src="images/quix-save-cloud.png"/>\n\
                                    <span>Download(PDF)</span>\n\
                                </div>';
                    openNewTabHTML = '<div class="item-options-grid-row resize-items" onclick="sg_open_item(\''+path+'\')">\n\
                                <img src="images/quix-dash-resize.png"/>\n\
                                <span>View in new Tab</span>\n\
                            </div>';
                }
                if(is_starred == 1){
                    starredHTML = '<div class="item-options-grid-row starred-items"  onclick="sg_starred_item(\''+type+'\',\''+itemId+'\',1)">\n\
                    <img src="images/quix-dash-starred.png"/>\n\
                    <span>Remove Starred</span>\n\
                    </div>';
                }else{
                    starredHTML = '<div class="item-options-grid-row starred-items"  onclick="sg_starred_item(\''+type+'\',\''+itemId+'\',\''+starredVal+'\')">\n\
                    <img src="images/quix-dash-starred.png"/>\n\
                    <span>Add to Starred</span>\n\
                    </div>';
                }
                
                if(event == "items")
                {
                    optionsHTML += starredHTML+'<div class="item-options-grid-row rename-items" onclick="sg_rename_item(\''+type+'\',\''+itemId+'\',\''+itemName+'\')">\n\
                            <img src="images/quix-dash-rename.png"/>\n\
                            <span>Rename</span>\n\
                        </div>\n\
                        '+openNewTabHTML+'<div class="item-options-grid-row trash-items"  onclick="sg_share_link(\''+type+'\',\''+itemId+'\')">\n\
                            <img src="images/quix-share-link.png"/>\n\
                            <span>Share Link</span>\n\
                        </div>\n\
                        <div class="item-options-grid-row trash-items"  onclick="sg_share_email(\''+type+'\',\''+itemId+'\')">\n\
                            <img src="images/quix-share-email.png"/>\n\
                            <span>Share via Email</span>\n\
                        </div>\n\
                        <div class="item-options-grid-row trash-items" onclick="sg_delete_item(\''+type+'\',\''+itemId+'\')">\n\
                            <img src="images/quix-dash-delete.png"/>\n\
                            <span>Delete</span>\n\
                        </div>'+editVideoHTML+DownloadHTML;
                }
                else if(event == "trashed")
                {
                    optionsHTML += '<div class="item-options-grid-row resize-items" onclick="sg_trash_item(\''+type+'\',\''+itemId+'\',\''+trashedVal+'\')">\n\
                        <img src="images/quix-dash-resize.png"/>\n\
                        <span>Restore</span>\n\
                    </div>\n\
                    <div class="item-options-grid-row trash-items" onclick="sg_delete_item(\''+type+'\',\''+itemId+'\')">\n\
                        <img src="images/quix-dash-delete.png"/>\n\
                        <span>Delete</span>\n\
                    </div>';
                }
                else if(event == "starred")
                {
                    optionsHTML += '<div class="item-options-grid-row starred-items"  onclick="sg_starred_item(\''+type+'\',\''+itemId+'\',\''+starredVal+'\')">\n\
                        <img src="images/quix-dash-starred.png"/>\n\
                        <span>Remove Starred</span>\n\
                    </div>\n\
                    <div class="item-options-grid-row trash-items" onclick="sg_delete_item(\''+type+'\',\''+itemId+'\')">\n\
                        <img src="images/quix-dash-delete.png"/>\n\
                        <span>Delete</span>\n\
                    </div>';
                }
                rowHTML += '<div class="quix-dashboard-content-item-outer" data-video-id="'+itemId+'">\n\
                        <input type="checkbox" class="check-item-type" name="check-item-type" data-item-type="'+type+'" data-item-id="'+itemId+'" data-item-starredval="'+starredVal+'" data-item-trashval="'+trashedVal+'">\n\
                        <div class="quix-dashboard-content-item '+itemAvailable+'">\n\
                        <img onclick="sg_open_item(\''+path+'\')" class="quix-dashboard-content-item-img" src="'+itemImg+'"/>\n\
                        <div class="item-options-icon">\n\
                            <img class="item-options-icon-img" src="images/quix-dash-options.png"/><div class="item-options-grid">'+optionsHTML+'</div>\n\
                        </div>\n\
                    </div>\n\
                    <div class="item-footer-info">\n\
                        <div class="item-footer-inner">\n\
                            <div class="item-title" title="'+itemName+'">'+itemName+'</div>\n\
                            <div class="item-bottom-details">'+detailsHTML+'</div>'+starHTML+'\n\
                            </div>\n\
                        </div>\n\
                    </div>\n\
                </div>';
            }
            if(type == "videos")
            {
                jQuery(".quix-dashboard-content-videos .quix-dashboard-content-innr").html(rowHTML);
            }
            else if(type == "screenshots")
            {
                jQuery(".quix-dashboard-content-images .quix-dashboard-content-innr").html(rowHTML);
            }

            jQuery(".quix-dashboard-content-item").unbind("mouseover");
            jQuery(".quix-dashboard-content-item").on("mouseover", function(){
                jQuery(this).parent(".quix-dashboard-content-item-outer").find(".item-options-icon").show();
            });

            jQuery(".quix-dashboard-content-item").unbind("mouseout");
            jQuery(".quix-dashboard-content-item").on("mouseout", function(event){
                var e = event.toElement || event.relatedTarget;
                if (e.parentNode == this || e == this) {
                return;
                }
                jQuery(this).parent(".quix-dashboard-content-item-outer").find(".item-options-icon").hide();
            });
        }
        else
        {
            rowHTML = '<div class="no-records-outer"><div class="no-records-inner"><p>No Records Found</p></div></div>';
            if(type == "videos")
            {
                jQuery(".quix-dashboard-content-videos .quix-dashboard-content-innr").html(rowHTML);
            }
            else if(type == "screenshots")
            {
                jQuery(".quix-dashboard-content-images .quix-dashboard-content-innr").html(rowHTML);
            }
        }
    }
}

/* Video Editor */
function displayMessage(message)
{
    jQuery("#quix-dashboard-overlay").show()
    jQuery("#quix-dashboard-message span").html(message);
    jQuery("#quix-dashboard-message").show();
}
function displayEditMessage(message)
{
    editInt = 0;
    var intEditMessage = setInterval(function()
    {
        var messageArr = [
            'Uploading Assests<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>',
            'Analyzing Annotations<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>',
            'Processing Video Conversion<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>',
            'Almost There<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>',
            'Preparing Video<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>',
            'Finishing with video editing<span class="loader__dot">.</span><span class="loader__dot">.</span><span class="loader__dot">.</span>'
        ];
        var message = messageArr[editInt];
        jQuery("#quix-dashboard-message span").html(message);
        editInt++;
        if(editInt === 7)
        {
            clearInterval(intEditMessage);
        }
    },20000);
    jQuery("#quix-dashboard-overlay").show()
    jQuery("#quix-dashboard-message span").html(message);
    jQuery("#quix-dashboard-message").show();
}
function hideMessage()
{
    jQuery("#quix-dashboard-overlay").hide()
    jQuery("#quix-dashboard-message span").html("");
    jQuery("#quix-dashboard-message").hide();
}
function editVideo()
{
    var vpath = jQuery("#video-editor-content video").attr("src");
    
    var cropIntervals = [];
    var blurIntervals = [];
    var textIntervals = [];
    var imageIntervals = [];
    var bgMusicIntervals = [];
    var cropPoints = jQuery(".int-select-box.crop");
    var blurPoints = jQuery(".int-select-box.blur");
    var textPoints = jQuery(".int-select-box.text");
    var imagePoints = jQuery(".int-select-box.image");
    var bgMusicPoints = jQuery(".int-select-box.bgMusic");
    if(cropPoints.length > 0)
    {
        cropIntervals = calculateCropIntervals(cropPoints);
    }
    if(blurPoints.length > 0)
    {
        blurIntervals = calculatePostData(blurPoints,"blur");
    }
    if(textPoints.length > 0)
    {
        textIntervals = calculatePostData(textPoints,"text");
    }
    if(imagePoints.length > 0)
    {
        imageIntervals = calculatePostData(imagePoints,"image");
    }
    if(bgMusicPoints.length > 0)
    {
        bgMusicIntervals = calculatePostData(bgMusicPoints,"bgMusic");
    }
    var fd = new FormData();
    fd.append('video_id', videoID);
    fd.append('crop_points', JSON.stringify(cropIntervals));
    fd.append('blur_points', JSON.stringify(blurIntervals));
    fd.append('text_points', JSON.stringify(textIntervals));
    fd.append('image_points', JSON.stringify(imageIntervals));
    fd.append('bgMusic_points', JSON.stringify(bgMusicIntervals));
    if(uploadedBGMusic.length > 0)
    {
        $.each(uploadedBGMusic,function(j, file){
            fd.append('bg_files', file);
        });
    }
    if(uploadedBGImages.length > 0)
    {
        $.each(uploadedBGImages,function(j, file){
            fd.append('bg_files', file);
        });
    }
    var url = APIServer+"/videos/edit";
    makeServerRequest("POST","form-data",url,fd,function(res)
    {
        hideMessage();
        //jQuery("#video-editor-content video").attr("src",res.modified_path);
        document.location.href = "/dashboard";
    });
}

function calculatePostData(points,type)
{
    //var pointsArr = [];
    var blocks = [];
    var compsData = [];
    var boxWidth = parseInt(jQuery('#video-editor-editing-selection-inner').width());
    if(type == "text"){ blocks = jQuery(".editor-text-box"); }
    else if(type == "blur"){ blocks = jQuery(".editor-blur-box"); }
    else if(type == "image"){ blocks = jQuery(".editor-video-image"); }
    var textInt = 0;
    //for (let i = 0; i < points.length; i++) 
    for (let i = points.length - 1; i >= 0; i--)
    {
        var compsOBJ = "";
        if(type == "text")
        { 
            var dataVal = videoEditTextStrings[textInt]; //jQuery(blocks[i]).find("textarea").val();
            textInt++; 
            var dataValW = jQuery(blocks[i]).find("textarea").width();
            var dataValH = jQuery(blocks[i]).find("textarea").height();
            var dataOffsetI = jQuery(blocks[i]).offset(); 
            var dataOffsetO = jQuery("#video-editor-content-inner").offset(); 
            var dataOffsetL = dataOffsetI.left - dataOffsetO.left;
            var dataOffsetT = dataOffsetI.top - dataOffsetO.top;
            var fontSize = jQuery(blocks[i]).find("textarea").css("font-size");
            var fontColor = jQuery(blocks[i]).find("textarea").css("color");
            var fontAlign = jQuery(blocks[i]).find("textarea").css("text-align");
            var fontStyle = jQuery(blocks[i]).find("textarea").css("font-style");
            if(fontStyle == "normal"){ fontStyle = false;}else{fontStyle = true;}
            var fontWeight = jQuery(blocks[i]).find("textarea").css("font-weight");
            if(fontWeight == "400"){ fontWeight = false;}else{fontWeight = true;}
            if(dataVal != "")
            {
                compsOBJ = {
                    "val":dataVal,
                    "w":parseInt(dataValW/videoDimesionsRatioW),
                    "h":parseInt(dataValH/videoDimesionsRatioH),
                    "x":parseInt(dataOffsetL/videoDimesionsRatioW),
                    "y":parseInt(dataOffsetT/videoDimesionsRatioH),
                    "fontSize":parseInt(fontSize),
                    "fontColor":rgbToHex(fontColor),
                    "fontAlign":fontAlign,
                    "fontStyle":fontStyle,
                    "fontWeight":fontWeight
                };
            }
        }
        else if(type == "blur")
        { 
            var dataValW = jQuery(blocks[i]).find(".editor-blur-box-inner").width();
            var dataValH = jQuery(blocks[i]).find(".editor-blur-box-inner").height();
            var dataVal = "";
            var dataOffsetI = jQuery(blocks[i]).offset(); 
            var dataOffsetO = jQuery("#video-editor-content-inner").offset(); 
            var dataOffsetL = dataOffsetI.left - dataOffsetO.left;
            var dataOffsetT = dataOffsetI.top - dataOffsetO.top;
            var intensity = jQuery(blocks[i]).find(".editor-blur-box-inner").css("backdrop-filter");
            var intensityOBj = intensity.split("blur(");
            var intensityOBj = intensityOBj[1].split(")");
            intensity = intensityOBj[0];
            compsOBJ = {
                "val":dataVal,
                "w":parseInt(dataValW/videoDimesionsRatioW),
                "h":parseInt(dataValH/videoDimesionsRatioH),
                "x":parseInt(dataOffsetL/videoDimesionsRatioW),
                "y":parseInt(dataOffsetT/videoDimesionsRatioH),
                "intensity":parseInt(intensity),
            };
        }
        else if(type == "image")
        { 
            var ponitsIndex = jQuery(points[i]).attr("data-bg-index");
            var fileName = encodeURIComponent("public"+jQuery(blocks[i]).find("img").attr("src"));
            if(uploadedBGImages[ponitsIndex] !== undefined)
            {
                fileName = uploadedBGImages[ponitsIndex]['name'];
            }
            var dataValW = jQuery(blocks[i]).find("img").width();
            var dataValH = jQuery(blocks[i]).find("img").height();
            //var dataVal = jQuery(blocks[i]).find("img").attr("src");
            var dataOffsetI = jQuery(blocks[i]).offset(); 
            var dataOffsetO = jQuery("#video-editor-content-inner").offset(); 
            var dataOffsetL = dataOffsetI.left - dataOffsetO.left;
            var dataOffsetT = dataOffsetI.top - dataOffsetO.top;
            var opacity = jQuery(blocks[i]).find("img").css("opacity");
            var shadow = jQuery(blocks[i]).css("box-shadow");
            compsOBJ = {
                "val": fileName,
                "w":parseInt(dataValW/videoDimesionsRatioW),
                "h":parseInt(dataValH/videoDimesionsRatioH),
                "x":parseInt(dataOffsetL/videoDimesionsRatioW),
                "y":parseInt(dataOffsetT/videoDimesionsRatioH),
                "opacity":opacity,
                "shadow":shadow
            };
        }
        else if(type == "bgMusic")
        {
            var ponitsIndex = jQuery(points[i]).attr("data-bg-index");
            var fileName = uploadedBGMusic[ponitsIndex]['name'];
            // var fileName = jQuery(blocks[i]).find("img").src;
            // if(uploadedBGMusic[ponitsIndex] !== undefined)
            // {
            //     fileName = uploadedBGMusic[ponitsIndex]['name'];
            // }
            compsOBJ = {
                "val": fileName,
            };
        }
        //compsData.push(compsOBJ);
        var ponitsOffset = jQuery(points[i]).offset();
        var leftPos = ponitsOffset.left;
        var outerOffset = jQuery("#video-editor-editing-selection").offset();
        var outerOffsetLeft = parseInt(outerOffset.left);
        leftPos = (leftPos - outerOffsetLeft);
        var widthCord = jQuery(points[i]).width();
        var startPoint = calculateVideoProgress(leftPos);
        var endPoint = calculateVideoProgress(leftPos+widthCord);
        var endPointF = parseInt(endPoint);
        var startPointF = parseInt(startPoint);
        if(compsOBJ != "")
        {
            var pointsObj = {'start':startPointF, 'end':endPointF};
            var combOBJ = {"data":compsOBJ,"points":pointsObj}
            compsData.push(combOBJ);
        }
    }
    return compsData;
}

function calculateCropIntervals(points)
{
    var cropPointsArr = [];
    var boxWidth = parseInt(jQuery('#video-editor-editing-selection-inner').width());
    for (let i = 0; i < points.length; i++) 
    {
        var ponitsOffset = jQuery(points[i]).offset();
        var leftPos = ponitsOffset.left;
        var outerOffset = jQuery("#video-editor-editing-selection").offset();
        var outerOffsetLeft = parseInt(outerOffset.left);
        leftPos = (leftPos - outerOffsetLeft);
        var widthCord = jQuery(points[i]).width();
        var startPoint = calculateVideoProgress(leftPos);
        var endPoint = calculateVideoProgress(leftPos+widthCord);
        var endPointF = parseInt(endPoint);
        var startPointF = parseInt(startPoint);
        var cropPointsObj = {'start':startPointF,'end':endPointF};
        cropPointsArr.push(cropPointsObj);
    }
    var remainingSlots = {};
    for (let i = 0; i < cropPointsArr.length; i++) 
    {
        var slotStart = cropPointsArr[i].start;
        var slotEnd = cropPointsArr[i].end;
        remainingSlots[slotStart] = slotEnd;
    }
    var cropPoints = findRemainingSlots(remainingSlots);
    return cropPoints;
}

function findRemainingSlots(remainingSlots)
{
    var i = 0;
    var finalRes = [];
    var lastStart = 0;
    var lastEnd = 0;
    var obJLen = Object.keys(remainingSlots).length;
    for (let obj of Object.keys(remainingSlots)) 
    {
        finalOBJ = "";
        if(i == 0 && obj > 0)
        {
            var start = secondsToHms(0);
            var end = secondsToHms(obj);
            var interval = (obj);
            if(interval > 0)
            {
                finalOBJ = {'start':'00:'+start,'end':'00:'+end,'interval':interval}; 
            }
        }
        else
        {
            var start = secondsToHms(lastEnd+1);
            var end = secondsToHms(obj);
            var interval = (obj-lastEnd);
            if(interval > 0)
            {
                finalOBJ = {'start':'00:'+start,'end':'00:'+end,'interval':interval}; 
            }
        }
        lastStart = obj;
        lastEnd = remainingSlots[obj];
        if(finalOBJ != "")
        {
            finalRes.push(finalOBJ);
        }
        if(i == (obJLen-1))
        {
            var start = secondsToHms(lastEnd+1);
            var end = totalVideoLength;
            var interval = (HmsToseconds(totalVideoLength)-lastEnd);
            if(interval > 0)
            {
                finalOBJ = {'start':'00:'+start,'end':'00:'+end,'interval':interval};
                finalRes.push(finalOBJ); 
            }
        }
        i++;
    }
    return finalRes;
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
    var seconds = (+a[0]) * 60 + (+a[1]); 
    return seconds;
}
function positionPlayBarClick(e)
{
    jQuery("#video-progress-pointer").css({"left":e.offsetX});
    var progressShould = calculateVideoProgress(e.offsetX);
    var video = document.querySelector('#video-editor-content video');
    video.currentTime = progressShould;
}
function positionPlayBar(e)
{
    if(draggedPlayBar && e.offsetX > 5)
    {
        jQuery("#video-progress-pointer").css({"left":e.offsetX});
        var progressShould = calculateVideoProgress(e.offsetX);
        var video = document.querySelector('#video-editor-content video');
        video.currentTime = progressShould;
    }
}
function positionPlayBarVideoProgress(currTime)
{
    var totalVideoLengthSeconds = HmsToseconds(totalVideoLength);
    var boxWidth = parseInt(jQuery('#video-editor-editing-selection-inner').width());
    var progressPercent = ((currTime/totalVideoLengthSeconds)*100);
    var leftPos = parseInt((boxWidth/100)*progressPercent);
    if(!draggedPlayBar){ jQuery("#video-progress-pointer").css({"left":(leftPos+1)}); }
}

function positionPlayBarVideoProgressEdit(startTime,endTime,callback)
{
    var totalVideoLengthSeconds = HmsToseconds(totalVideoLength);
    if(endTime > totalVideoLengthSeconds){ endTime = totalVideoLengthSeconds;}
    var boxWidth = parseInt(jQuery('#video-editor-editing-selection-inner').width());
    startTime = startTime+1;
    endTime = endTime+1;
    var progressPercent = ((startTime/totalVideoLengthSeconds)*100);
    var progressPercent2 = ((endTime/totalVideoLengthSeconds)*100);
    var leftPos = parseInt((boxWidth/100)*progressPercent);
    var rightPos = parseInt((boxWidth/100)*progressPercent2);
    var wid = rightPos - leftPos;
    callback({"left":leftPos,"width":wid});
    //elem.css({"left":leftPos,"width":wid});
}

// function calculateVideoProgressByTime(leftPos)
// {
//     var boxWidth = parseInt(jQuery('#video-editor-editing-selection-inner').width());
//     var progressPercent = parseInt((leftPos/boxWidth)*100);
//     if(progressPercent < 0){ progressPercent = 0; }
//     if(progressPercent > 100){ progressPercent = 100; }
//     videoProgressPercent = progressPercent;
//     var seconds = HmsToseconds(totalVideoLength);
//     return ((seconds*progressPercent)/100);
// }

function calculateVideoProgress(leftPos)
{
    var boxWidth = parseInt(jQuery('#video-editor-editing-selection-inner').width());
    var progressPercent = ((leftPos/boxWidth)*100);
    if(progressPercent < 0){ progressPercent = 0; }
    if(progressPercent > 100){ progressPercent = 100; }
    videoProgressPercent = progressPercent;
    var seconds = HmsToseconds(totalVideoLength);
    return ((seconds*progressPercent)/100);
}
function videoEditOptions(actionType)
{
    setVideoEditOptions(prevAnnoID,prevAnnoType);
    switch (actionType) {
        case "edit-text":
            addTextToVideo();
        break;
        case "edit-shapes":
        break;
        case "edit-blur":
            addBlurToVideo();
        break;
        case "edit-crop":
            cropVideoLength();
        break;
        case "edit-music":
            //uploadBackgroundMusic();
        break;
        case "edit-link":
        break;
        case "edit-image":
            //addImageToVideo();
        break;
    }
}
function videoPlayerActions(video,actionType)
{
    switch (actionType) {
        case "prev": 
        break;
        case "backward": 
            video.currentTime -= 10;
        break;
        case "play": 
            jQuery(".video-editor-play").hide();
            jQuery(".video-editor-pause").show();
            video.play();
        break;
        case "pause":
            jQuery(".video-editor-play").show();
            jQuery(".video-editor-pause").hide();
            video.pause(); 
        break;
        case "forward":
            video.currentTime += 10; 
        break;
        case "next": 
        break;
    }
}
function uploadBackgroundMusic()
{
    jQuery(".quix-dashboard-popup-title-inner").html("<span>Upload Audio</span>");
    jQuery(".quix-dashboard-popup-body-inner").html("<input accept='audio/mp3' id='input-upload-music' type='file'>");
    jQuery("#quix-dashboard-overlay").show();
    jQuery("#quix-dashboard-popup").show();
}
function intervalSelectorBox(type,data,id)
{
    var selHTML = "";
    // selHTML = '<div class="int-select-box" id="int-select-box-'+selectionId+'"><div class="int-select-box-inner"><span>'+type+'</span></div></div>';
    if(id !== undefined)
    { 
        selectionId = id; 
    }
    else
    { 
        selectionId++;
        prevAnnoID = selectionId;
        prevAnnoType = type;
    }
    if(data !== undefined)
    {
        data = data.points;
        var marginBottom = 24;
        positionPlayBarVideoProgressEdit(data.start,data.end,function(res){
            var new_width = res.width;
            var new_height = 20;
            var new_offset = {bottom:marginBottom, left:res.left}
            addINTBOX(type,selectionId,new_width,new_height,new_offset,marginBottom);
        });
        // jQuery("#video-editor-editing-selection-inner").append(selHTML);
        
    }
    else
    {
        var marginBottom = 24;
        var new_width = 100;
        var new_height = 20;
        var new_offset = {bottom:marginBottom, left:0}
        addINTBOX(type,selectionId,new_width,new_height,new_offset,marginBottom);
    }

}

function addINTBOX(type,id,new_width,new_height,new_offset,marginBottom)
{
    if(id !== undefined){ selectionId = id; }
    var elemId = "int-select-box-"+selectionId;
    var bgMelemId = "";
    if(type == "bgMusic"){  bgMelemId = 'data-bg-index="'+(uploadedBGMusic.length-1)+'"';} 
    if(type == "image"){  bgMelemId = 'data-bg-index="'+(uploadedBGImages.length-1)+'"';}
    // marginBottom = marginBottom*(id-1);
    if(id == marginBottom){ marginBottom = 0;}
    var anntitle = type;
    if(type == "crop"){ anntitle = 'trim'; }
    jQuery('<div title="'+anntitle+'" class="int-select-box '+type+' int-select-box-'+selectionId+'" '+bgMelemId+' data-index="'+selectionId+'" id="'+elemId+'"><div class="int-select-box-inner"><span class="box-timer-left"></span><span class="box-title">'+anntitle+'</span><span class="box-timer-right"></span><span class="box-timer-close"><img src="/images/quix-close.png"/></span></div></div>')
        .width(new_width)
        .height(new_height)
        .draggable({
            cancel: "text",
            containment: "parent",
            axis: 'x',
            scroll: false,
            start: function (e){
                },
            stop: function (e)
                {
                    var blockW = jQuery("#video-annotation-blocks-inner").width();
                    var elemL = e.target.offsetLeft;
                    var elemW = e.target.offsetWidth;
                    var diff = (elemW+elemL) - blockW;
                    if(diff > 0)
                    {
                        jQuery(this).css({"left": parseInt(elemL-diff)+"px"});
                    }
                    intSelectBoxEvents(elemId);
                } 
            })
        .resizable({
            cancel: "text",
            aspectRatio: false,
            containment: "parent",
            handles:"e,w",
            scroll: false,
            resize: function (e){
                    intSelectBoxEvents(elemId);
                }, 
            start: function (e){
                },
            stop: function (e){
                    var blockW = jQuery("#video-annotation-blocks-inner").width();
                    var elemL = e.target.offsetLeft;
                    var elemW = e.target.offsetWidth;
                    var diff = (elemW+elemL) - blockW;
                    if(diff > 0)
                    {
                        jQuery(this).css({"left": parseInt(elemL-diff)+"px"});
                    }
                    intSelectBoxEvents(elemId);
                } 
            })
        .css({
                'position' : 'relative',
                'border' : '2px solid #525FB0'
            })
            .offset(new_offset)
            .prependTo('#video-annotation-blocks-inner');
        // jQuery("#"+elemId).css({"bottom":marginBottom});
        setTimeout(function()
        {
            intSelectBoxEvents(elemId);
        },0);
        jQuery(".int-select-box").on("mouseover", function()
        {
            jQuery(this).find(".box-timer-left").show();
            jQuery(this).find(".box-timer-right").show();
        });
        //jQuery(".int-select-box .ui-resizable-e").unbind("mouseout");
        jQuery(".int-select-box").on("mouseout", function()
        {
            jQuery(this).find(".box-timer-left").hide();
            jQuery(this).find(".box-timer-right").hide();
        });

        //jQuery(".int-select-box .ui-resizable-e").unbind("mouseover");
        // jQuery(".int-select-box .ui-resizable-e").on("mouseover", function()
        // {
        //     jQuery(this).parents(".int-select-box").find(".box-timer-right").show();
        // });
        //jQuery(".int-select-box .ui-resizable-e").unbind("mouseout");
        // jQuery(".int-select-box .ui-resizable-e").on("mouseout", function()
        // {
        //     jQuery(this).parents(".int-select-box").find(".box-timer-right").hide();
        // });

        //jQuery(".int-select-box .ui-resizable-w").unbind("mouseover");
        // jQuery(".int-select-box .ui-resizable-w").on("mouseover", function()
        // {
        //     jQuery(this).parents(".int-select-box").find(".box-timer-left").show();
        // });
        //jQuery(".int-select-box .ui-resizable-w").unbind("mouseout");
        // jQuery(".int-select-box .ui-resizable-w").on("mouseout", function()
        // {
        //     jQuery(this).parents(".int-select-box").find(".box-timer-left").hide();
        // });

        jQuery(".editor-video-box").unbind("click");
        jQuery(".editor-video-box").on("click", function()
        {
            var index = jQuery(this).attr("data-index");
            editSettingsLoad(jQuery(".int-select-box-"+index));
            jQuery(".int-select-box").removeClass("active");
            jQuery(".editor-video-box").removeClass("active");
            jQuery(this).addClass("active");
            jQuery(".int-select-box-"+index).addClass("active");
            $(this).find("textarea").focus();
        });
        jQuery(".int-select-box").unbind("click");
        jQuery(".int-select-box").on("click", function()
        {
            editSettingsLoad(this);
            var index = jQuery(this).attr("data-index");
            jQuery(".int-select-box").removeClass("active");
            jQuery(".editor-video-box").removeClass("active");
            jQuery(this).addClass("active");
            jQuery(".editor-video-box-"+index).addClass("active");
            // $(".editor-video-box-"+index).find("textarea").focus();
        });
        jQuery(".box-timer-close").unbind("click");
        jQuery(".box-timer-close").on("click", function()
        {
            var index = jQuery(this).parents(".int-select-box").attr("data-index");
            if(jQuery(this).parents(".int-select-box").hasClass("text"))
            {
                closeCompLayer(index,".editor-text-box");
            }
            else if(jQuery(this).parents(".int-select-box").hasClass("blur"))
            {
                closeCompLayer(index,".editor-blur-box");
            }
            else if(jQuery(this).parents(".int-select-box").hasClass("image"))
            {
                closeCompLayer(index,".editor-video-image");
                var bgindex = jQuery(this).parents(".int-select-box").attr("data-bg-index");
                delete uploadedBGImages[bgindex];
            }
            else if(jQuery(this).parents(".int-select-box").hasClass("bgMusic"))
            {
                var bgindex = jQuery(this).parents(".int-select-box").attr("data-bg-index");
                delete uploadedBGMusic[bgindex];
            }
            jQuery(this).parents(".int-select-box").remove();
        });
}
function closeCompLayer(index,cls)
{
    var elem = jQuery(cls);
    for (let i = 0; i < elem.length; i++) 
    {
        var compIndex = jQuery(elem[i]).attr("data-index");
        if(compIndex == index)
        {
            jQuery(elem[i]).remove();
            return;
        }
    }
}
function cropVideoLength()
{
    intervalSelectorBox("crop");
}

function addImageToVideoComp(filedata,data,id)
{
    if(filedata)
    {
        if(jQuery("#video-editor-content-inner canvas").length <= 0)
        {
            var canvasHTML = '<canvas id="video-layer"></canvas>';
            jQuery("#video-editor-content-inner").append(canvasHTML);
        }
        intervalSelectorBox("image",data,id); 
        if(data !== undefined)
        {
            data = data.data;
            addImageToComp(data.val,data,id);
        }
        else
        {
            let reader = new FileReader();
            reader.onload = function(event)
            {
                var image = new Image();
                image.src = event.target.result;
                image.onload = function() 
                {
                    addImageToComp(event.target.result,undefined,undefined,image.width,image.height);
                }
            }
            reader.readAsDataURL(filedata);
        }
    }
}
function addImageToComp(src,data,id,w,h)
{
    if(id !== undefined){ selectionId = id; }
    if(data !== undefined)
    {
        data = data;
        var x = parseInt(data.x*videoDimesionsRatioW);
        var y = parseInt(data.y*videoDimesionsRatioW);
        var w = parseInt(data.w*videoDimesionsRatioW);
        var h = parseInt(data.h*videoDimesionsRatioW);
        var new_offset = {top:y, left:x};
        var new_width = w;
        var new_height = h;
    }
    else
    {
        var imageAR = w/h;
        var new_offset = {top:100, left:100};
        if(w > 300){ w = 300; }
        var new_width = w;
        var new_height = (w/imageAR);
        editingOptionsImage(selectionId);
    }
    var elemId = "int-image-upload-"+selectionId;
    //jQuery(".editor-outer-image-overlay").remove();
    if(src.indexOf("public") > -1){ src = src.replace("public","");  src = decodeURIComponent(src);}
    jQuery('<div class="editor-video-image editor-video-box editor-video-box-'+selectionId+'" data-index="'+selectionId+'" id="'+elemId+'"><img src="'+src+'"/></div>')
    .width(new_width)
    .height(new_height)
    .draggable({
        cancel: "text",
        containment: "parent",
        start: function (){},
        stop: function (){ } 
    })
    .resizable({
        cancel: "text",
        aspectRatio: true,
        containment: "parent",
        start: function (){},
        stop: function (){ } 
    })
    .css({
            'position' : 'absolute',
            'border' : '2px solid #525FB0'
        })
    .offset(new_offset)
    .appendTo('#video-editor-content-inner');
    //jQuery("#upload-image").val("");
}
function addTextToVideo(data,id)
{
    if(jQuery("#video-editor-content-inner canvas").length <= 0)
    {
        var canvasHTML = '<canvas id="video-layer"></canvas>';
        jQuery("#video-editor-content-inner").append(canvasHTML);
    }
    intervalSelectorBox("text",data,id);
    addTextToVideoComp(data,id);
}
function addTextToVideoComp(data,id)
{
    if(id !== undefined)
    { 
        selectionId = id; 
    }
    if(data !== undefined)
    {
        data = data.data;
        var x = parseInt(data.x*videoDimesionsRatioW);
        var y = parseInt(data.y*videoDimesionsRatioW);
        var w = parseInt(data.w*videoDimesionsRatioW);
        var h = parseInt(data.h*videoDimesionsRatioW);
        var new_offset = {top:y, left:x};
        var new_width = w;
        var new_height = h;
        var elemId = "int-text-box-"+selectionId;
        var text = data.val;
        text = text.join("\r\n");
    }
    else
    {
        var new_offset = {top:100, left:100};
        var new_width = 200;
        var new_height = 100;
        var elemId = "int-text-box-"+selectionId;
        var text = "";
        editingOptionsText(selectionId);
    }
    //jQuery(".editor-outer-image-overlay").remove();
    jQuery('<div class="editor-text-box editor-video-box editor-video-box-'+selectionId+'" data-index="'+selectionId+'" id="'+elemId+'"><form id="quix-textare-form-'+selectionId+'" name="main" method="get" target="ifrm"><textarea name="bar" cols=5 wrap="hard" placeholder="Write text here">'+text+'</textarea><input type="submit"></form></div>')
    .width(new_width)
    .height(new_height)
    .draggable({
        cancel: "text",
        containment: "parent",
        start: function (){},
        stop: function (){ } 
    })
    .resizable({
        cancel: "text",
        aspectRatio: false,
        containment: "parent",
        start: function (){},
        stop: function (){ } 
    })
    .css({
            'position' : 'absolute',
            'border' : '2px solid #525FB0'
        })
    .offset(new_offset)
    .appendTo('#video-editor-content-inner');
    applyVideoEditFront(selectionId,"text");
    jQuery(".editor-text-box textarea").unbind('click');
    jQuery(".editor-text-box textarea").on("click",function(){
        $(this).focus();
    });
    jQuery(".editor-text-box textarea").unbind('dblclick');
    jQuery(".editor-text-box textarea").on("dblclick",function(){
        $(this).focus();
        $(this).select();
    });

    jQuery(".editor-text-box textarea").unbind('mousedown');
    jQuery(".editor-text-box textarea").on("mousedown",function(){
        jQuery(this).css("cursor","move");
    });
    jQuery(".editor-text-box textarea").unbind('mouseup');
    jQuery(".editor-text-box textarea").on("mouseup",function(){
        jQuery(this).css("cursor","text");
    });
    jQuery(".editor-text-box textarea").unbind('keyup');
    jQuery(".editor-text-box textarea").on("keyup",function(event)
    {
        if((event.keyCode == 86 && event.ctrlKey) || event.keyCode == 32)
        {
            //adjustTextAreaAutomatically();
        }
        jQuery("#captured-screen").unbind('click');
    });
}
function addBlurToVideo(data,id)
{
    if(jQuery("#video-editor-content-inner canvas").length <= 0)
    {
        var canvasHTML = '<canvas id="video-layer"></canvas>';
        jQuery("#video-editor-content-inner").append(canvasHTML);
    }
    intervalSelectorBox("blur",data,id);
    addBlurToVideoComp(data,id);
}
function addBlurToVideoComp(data,id)
{
    if(id !== undefined)
    { 
        selectionId = id; 
    }
    if(data !== undefined)
    {
        data = data.data;
        var x = parseInt(data.x*videoDimesionsRatioW);
        var y = parseInt(data.y*videoDimesionsRatioW);
        var w = parseInt(data.w*videoDimesionsRatioW);
        var h = parseInt(data.h*videoDimesionsRatioW);
        var new_offset = {top:y, left:x};
        var new_width = w;
        var new_height = h;
        var elemId = "int-blur-box-"+selectionId;
    }
    else
    {
        var new_offset = {top:100, left:100};
        var new_width = 200;
        var new_height = 200;
        var elemId = "int-blur-box-"+selectionId;
        editingOptionsBlur(selectionId);
    }
    jQuery('<div class="editor-blur-box editor-video-box editor-video-box-'+selectionId+'" data-index="'+selectionId+'" id="'+elemId+'"><div class="editor-blur-box-inner"></div></div>')
    .width(new_width)
    .height(new_height)
    .draggable({
        cancel: "text",
        containment: "parent",
        start: function (){},
        stop: function (){ } 
    })
    .resizable({
        cancel: "text",
        aspectRatio: false,
        containment: "parent",
        start: function (){},
        stop: function (){ } 
    })
    .css({
            'position' : 'absolute',
            'border' : '2px solid #525FB0'
        })
    .offset(new_offset)
    .appendTo('#video-editor-content-inner');
    applyVideoEditFront(selectionId,"blur");
}
function adjustTextAreaAutomatically()
{
    var fontSize = jQuery("#font-size").val();
    var textScrollH = jQuery(".editor-outer-overlay-textarea").prop('scrollHeight');
    var w = jQuery(".text #width-val").val();
    var h = jQuery(".text #height-val").val();
    var diffBet = (textScrollH-h);
    if(textScrollH !== undefined && textScrollH > 0 && diffBet > 0)
    {
        var incW = (parseInt(w) + parseInt(textScrollH/3))+"px";
        jQuery(".editor-outer-overlay").css({"width":incW});
        jQuery(".text #width-val").val(parseInt(incW));
        var tScrollH = jQuery(".editor-outer-overlay-textarea").prop('scrollHeight');
        if(tScrollH !== undefined && tScrollH > 0)
        {
            var incH = parseInt(tScrollH+(parseInt(fontSize)))+"px";
            jQuery(".editor-outer-overlay").css({"height":incH});
            jQuery(".text #height-val").val(parseInt(incH));
        }
    }
}
function intSelectBoxEvents(elemId)
{
    var elemSel = jQuery("#"+elemId);
    var ponitsOffset = elemSel.offset();
    var leftPos = ponitsOffset.left;
    var outerOffset = jQuery("#video-editor-editing-selection").offset();
    var outerOffsetLeft = parseInt(outerOffset.left);
    leftPos = (leftPos - outerOffsetLeft);
    var widthCord = elemSel.width();
    calculaterSelectionAreaPoints(elemSel,leftPos,widthCord);
}
function calculaterSelectionAreaPoints(obj,leftPos,widthCord)
{
    var startPoint = secondsToHms(calculateVideoProgress(leftPos));
    var endPoint = secondsToHms(calculateVideoProgress(leftPos+widthCord));
    jQuery(obj).find(".box-timer-left").text(startPoint);
    jQuery(obj).find(".box-timer-right").text(endPoint);
}
function videoPlaybackWithAnnotations()
{

}
function editVideoAnnotations(jsonData)
{
    jsonData = JSON.parse(jsonData);
    var blur_points = jsonData.blur_points;
    var text_points = jsonData.text_points;
    var image_points = jsonData.image_points;
    var bgMusic_points = jsonData.bgMusic_points;
    var id = 1;
    var settings = {};
    if(blur_points.length > 0)
    {
        for (let i = 0; i < blur_points.length; i++) {
            blurData = blur_points[i];
            settings = 
            {
                'intensity' : blurData.data.intensity,
            }
            videoEditOptionItems[(id-1)] = settings;
            addBlurToVideo(blurData,id);
            id++;
        }
    }
    if(text_points.length > 0)
    {
        for (let i = 0; i < text_points.length; i++) {
            textData = text_points[i];
            settings = 
            {
                'font-size-real' : textData.data.fontSize,
                'font-size' : parseInt(parseInt(textData.data.fontSize)*videoDimesionsRatioW),
                'font-bold' : textData.data.fontWeight,
                'font-italic' : textData.data.fontStyle,
                'font-color' : textData.data.fontColor,
                'font-align': textData.data.fontAlign,
            }
            videoEditOptionItems[(id-1)] = settings;
            addTextToVideo(textData,id);
            id++;
        }
    }
    if(image_points.length > 0)
    {
        for (let i = 0; i < image_points.length; i++) {
            imageData = image_points[i]; 
            //uploadedBGImages.push({'name' : imageData.data.val});
            settings = 
            {
                'img-shadow' : imageData.data.shadow,
                'img-opacity' : imageData.data.opacity
            }
            videoEditOptionItems[(id-1)] = settings;
            addImageToVideoComp(imageData.data.val,imageData,id);
            id++;
        }
    }
    if(bgMusic_points.length > 0)
    {
        for (let i = 0; i < bgMusic_points.length; i++) {
            bgMusicData = bgMusic_points[i];
            //addImageToVideoComp(bgMusicData.data.val,bgMusicData,id);
            uploadedBGMusic.push({'name' : bgMusicData.data.val});
            intervalSelectorBox("bgMusic",bgMusicData,id); 
            id++;
        }
    }
}
function editingOptionsText(id,data)
{
    var html = "";
    jQuery(".video-editor-editing-options-col.text").html(html);
    jQuery(".video-editor-editing-options-col.blur").html(html);
    jQuery(".video-editor-editing-options-col.image").html(html);
    html+= '<span class="fields-row"><label>Text Options: </label></span>';
    html += '<span class="fields-row font-size"><select id="choose-font-size"><option value="14">14px</option><option value="20">20px</option><option value="28">28px</option><option value="36">36px</option><option value="48">48px</option><option value="64">64px</option><option value="80">80px</option><option value="112">112px</option></select></span>';
    html += '<span class="fields-row font-bold"><img src="/images/quix-bold-icon.png"/><input type="checkbox" name="choose-bold"></span>';
    //html += '<span class="fields-row font-italic"><img src="/images/quix-italic-icon.png"/><input type="checkbox" name="choose-italic"></span>';
    //html += '<div class="fields-row font-align"><span class="fields-col"><img src="/images/quix-alignleft-icon.png"/><input type="radio" value="left" name="choose-align" id="choose-left"></span><span class="fields-col"><img src="/images/quix-aligncenter-icon.png"/><input type="radio" value="center" name="choose-align" id="choose-center"></span><span class="fields-col"><img src="/images/quix-alignright-icon.png"/><input type="radio" value="right" name="choose-align" id="choose-right"></span></div>';
    html += '<div class="fields-row font-color"><span style="background-color:#ff0000;"><input type="radio" value="#ff0000" name="choose-color"></span><span style="background-color:#ff9900;"><input type="radio" value="#ff9900" name="choose-color"></span><span style="background-color:#0072e6;"><input type="radio" value="#0072e6" name="choose-color"></span><span style="background-color:#12dc00;"><input type="radio" value="#12dc00" name="choose-color"></span><span style="background-color:#e7e7e7;"><input type="radio" value="#e7e7e7" name="choose-color"></span></div>';
    //html += '<span class="fields-row apply-button" title="Apply"><span>Apply</span></span>';
    jQuery(".video-editor-editing-options-col.text").html(html);
    jQuery(".video-editor-editing-options-col.text").attr("data-index",id);
    if(data !== undefined)
    {
        jQuery("#choose-font-size").val(parseInt(data['font-size-real']));
        jQuery("input[name=choose-bold]").attr("checked",data['font-bold']);
        if(data['font-bold']){ jQuery(".fields-row.font-bold").addClass("active");}
        jQuery("input[name=choose-italic]").attr("checked",data['font-italic']);
        if(data['font-italic']){ jQuery(".fields-row.font-italic").addClass("active");}
        var alignElem = jQuery(".fields-row.font-align span");
        var colorElem = jQuery(".fields-row.font-color span");
        for (let i = 0; i < alignElem.length; i++) {
            var element = alignElem[i];
            var elemVal = jQuery(element).find("input").val();
            if(elemVal == data['font-align'])
            {
                jQuery(element).find("input").attr("checked",true);
                jQuery(element).addClass("active");
            }
        }
        for (let j = 0; j < colorElem.length; j++) {
            var element = colorElem[j];
            var elemVal = jQuery(element).find("input").val();
            if(elemVal == data['font-color'])
            {
                jQuery(element).find("input").attr("checked",true);
                jQuery(element).addClass("active");
            }
        }
    }
    
    jQuery("#video-editor-editing-options").show();

    // jQuery(".fields-row.apply-button span").unbind("click");
    // jQuery(".fields-row.apply-button span").on("click", function(){
    //     setVideoEditOptions(id,"text");
    //     applyVideoEditFront(id,"text");
    // });
    jQuery("#choose-font-size").unbind("change");
    jQuery("#choose-font-size").on("change", function(){
        activeStateToggle("same",this);
        setVideoEditOptions(id,"text");
        applyVideoEditFront(id,"text");
    });

    jQuery(".fields-row.font-bold").unbind("click");
    jQuery(".fields-row.font-bold").on("click", function(){
        activeStateToggle("same",this);
        setVideoEditOptions(id,"text");
        applyVideoEditFront(id,"text");
    });
    jQuery(".fields-row.font-italic").unbind("click");
    jQuery(".fields-row.font-italic").on("click", function(){
        activeStateToggle("same",this);
        setVideoEditOptions(id,"text");
        applyVideoEditFront(id,"text");
    });
    jQuery(".fields-row.font-align span").unbind("click");
    jQuery(".fields-row.font-align span").on("click", function(e){
        activeStateToggle("parent",this,jQuery(".fields-row.font-align span"));
        setVideoEditOptions(id,"text");
        applyVideoEditFront(id,"text");
    });
    jQuery(".fields-row.font-color span").unbind("click");
    jQuery(".fields-row.font-color span").on("click", function(e){
        activeStateToggle("parent",this,jQuery(".fields-row.font-color span"));
        setVideoEditOptions(id,"text");
        applyVideoEditFront(id,"text");
    });
}
function editingOptionsImage(id,data)
{
    var html = "";
    jQuery(".video-editor-editing-options-col.text").html(html);
    jQuery(".video-editor-editing-options-col.blur").html(html);
    jQuery(".video-editor-editing-options-col.image").html(html);
    html+= '<span class="fields-row"><label>Image Options: </label></span>';
    //html += '<span class="fields-row image-shadow" title="Shadow"><input id="image-shadow" type="number" min="1" max="5" value="3"></span>';
    html += '<span class="fields-row image-opacity" title="Opacity"><input id="image-opacity" type="number" min="0" max="5" value="3"></span>';
    //html += '<span class="fields-row apply-button" title="Apply"><span>Apply</span></span>';
    jQuery(".video-editor-editing-options-col.image").html(html);
    if(data !== undefined)
    {
        jQuery("#image-opacity").val(data['img-opacity']);
        jQuery("#image-shadow").val(data['img-shadow']);
    }
    jQuery(".video-editor-editing-options-col.image").attr("data-index",id);
    jQuery("#video-editor-editing-options").show();
    jQuery(".image-opacity").unbind("change");
    jQuery(".image-opacity").on("change", function(){
        setVideoEditOptions(id,"image");
        applyVideoEditFront(id,"image");
    });
}
function editingOptionsBlur(id,data)
{
    var html = "";
    jQuery(".video-editor-editing-options-col.text").html(html);
    jQuery(".video-editor-editing-options-col.blur").html(html);
    jQuery(".video-editor-editing-options-col.image").html(html);
    html+= '<span class="fields-row"><label>Blur Options: </label></span>';
    html += '<span class="fields-row blur-intensity" title="Blur Intensity"><input id="blur-intensity" type="number" min="1" max="3" value="3"></span>';
    //html += '<span class="fields-row apply-button" title="Apply"><span>Apply</span></span>';
    jQuery(".video-editor-editing-options-col.blur").html(html);
    if(data !== undefined)
    {
        jQuery("#blur-intensity").val(data['intensity']);
    }
    jQuery(".video-editor-editing-options-col.blur").attr("data-index",id);
    jQuery("#video-editor-editing-options").show();
    jQuery(".blur-intensity").unbind("change");
    jQuery(".blur-intensity").on("change", function(){
        setVideoEditOptions(id,"blur");
        applyVideoEditFront(id,"blur");
    });
}
function activeStateToggle(type,obj,elem)
{
    if(type == "parent")
    {
        for (let i = 0; i < elem.length; i++) 
        {
            jQuery(elem[i]).removeClass("active");
        }
        if(!jQuery(obj).hasClass("active"))
        {
            jQuery(obj).addClass("active");
        }
    }
    else
    {
        if(!jQuery(obj).hasClass("active"))
        {
            jQuery(obj).addClass("active");
        }
        else
        {
            jQuery(obj).removeClass("active");
        }
    }
}
function applyVideoEditFront(id,type)
{
    var data = videoEditOptionItems[(id-1)];
    if(data !== undefined)
    {
        if(type == "text")
        {
            var elem = jQuery("#int-text-box-"+id);
            var textElem = jQuery(elem).find("textarea");
            var fontSize = data['font-size']+"px";
            var fontColor = data['font-color'];
            var fontBold = data['font-bold'];
            var fontWeight = 400;
            if(fontBold){ fontWeight = 800; }
            var fontItalic = data['font-italic'];
            var fontStyle = "normal";
            if(fontItalic){ fontStyle = "italic"; }
            var fontAlign = data['font-align'];
            textElem.css({"font-size":fontSize,"color":fontColor,"text-align":fontAlign,"font-style":fontStyle,"font-weight":fontWeight});
        }
        else if(type == "blur")
        {
            var elem = jQuery("#int-blur-box-"+id);
            var blurElem = jQuery(elem).find(".editor-blur-box-inner");
            var intensity = "blur("+(data['intensity']*3)+"px)";
            blurElem.css({"backdrop-filter":intensity});
        }
        else if(type == "image")
        {
            var elem = jQuery("#int-image-upload-"+id);
            var imageElem = jQuery(elem).find("img");
            var imgOpacity= data['img-opacity'];
            imgOpacity = (((imgOpacity/5)*100)/100);
            var imgShadow = (data['img-shadow']*2);
            imgShadow = "0px 0px "+imgShadow+"px #706f6f";
            imageElem.css({"opacity":imgOpacity});
            elem.css({"box-shadow":imgShadow});
        }
    }
}
function setVideoEditOptions(id,type)
{
    if(id !== "")
    {
        var settings = {};
        if(type == "text")
        {
            var fontSize = jQuery("#choose-font-size").val();
            var fontBold = fontStyle = false;
            if(jQuery("input[name=choose-bold]").is(':checked')){ var fontBold = true; }
            if(jQuery("input[name=choose-italic]").is(':checked')){ var fontStyle = true; }
            var fontAlign = jQuery("input[name=choose-align]:checked").val();
            var fontColor = jQuery("input[name=choose-color]:checked").val();
            settings = {
                'font-size-real' : fontSize,
                'font-size' : fontSize,
                'font-bold' : fontBold,
                'font-italic' : fontStyle,
                'font-color' : fontColor,
                'font-align': fontAlign,
            }
        }
        else if(type == "blur")
        {
            var blurIntensity = jQuery("#blur-intensity").val();
            settings = {
                'intensity' : blurIntensity,
            }
        }
        else if(type == "image")
        {
            var imageShadow = jQuery("#image-shadow").val();
            var imageOpacity = jQuery("#image-opacity").val();
            settings = {
                'img-shadow' : imageShadow,
                'img-opacity' : imageOpacity
            }
        }
        videoEditOptionItems[(id-1)] = settings;
    }
}
function editSettingsLoad(obj)
{
    var index = jQuery(obj).attr("data-index");
    var editData = videoEditOptionItems[(index-1)];
    if(jQuery(obj).hasClass("text"))
    {
        editingOptionsText(index,editData);
    }
    else if(jQuery(obj).hasClass("blur"))
    {
        editingOptionsBlur(index,editData);
    }
    else if(jQuery(obj).hasClass("image"))
    {
        editingOptionsImage(index,editData);
    }
}
function rgbToHex(rgb) 
{
    var strSplit = rgb.split("rgb(");
    var strSplit2 = strSplit[1].split(")");
    var strSplit3 = strSplit2[0].split(",");
    var r = strSplit3[0];
    var g = strSplit3[1];
    var b = strSplit3[2];
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}
function getURLParameter(qs, name)
{
  var pattern = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( pattern );
  var res = regex.exec( qs );
  if (res == null)
    return "";
  else
    return res[1];
}
function getHardWrappedText()
{
    if (top.location.href !== window.location.href) return;
    var frm_url = document.getElementById('ifrm').contentDocument.URL;
    if (frm_url.indexOf('http') < 0) return;
    var text = unescape(getURLParameter(document.getElementById('ifrm').contentDocument.URL, 'bar')).replace(/\+/g,' ');
    var arrTxt = text.split(/\r?\n|\r|\n/g);
    videoEditTextStrings.push(arrTxt);
    var forms = jQuery("form");
    formsSubmitted++;
    if(formsSubmitted < forms.length)
    {
        jQuery(forms[formsSubmitted]).submit();
    }
    else
    {
        editVideo();
    }
}
function createTimeScale(startTime,endTime)
{
    var timeDiff = (endTime - startTime);
    var numMarkers = (timeDiff*10);
    var markerHTML = "";
    for(var i = 1;i <= numMarkers; i++)
    {
        var markerClass = "ms";
        if((i+1) % 10 == 0)
        {
            markerClass = "sec"; //'+((i+1)/10)+'
            markerHTML += '<div class="mark-'+markerClass+'" data-id="'+i+'"><span>&nbsp;</span></div>';
        }
        else if((i+1) % 5 == 0)
        {
            markerClass = "half-sec"; //'+((i+1)/10)+'
            markerHTML += '<div class="mark-'+markerClass+'" data-id="'+i+'"><span>&nbsp;</span></div>'; 
        }
        else
        {
            markerClass = "ms";
            markerHTML += '<div class="mark-'+markerClass+'" data-id="'+i+'"><span>&nbsp;</span></div>'; 
        }
    }
    return { "markerCount": numMarkers, "html" :markerHTML };
}
/* Video Editor */

function IsEmail(email) {
    var regex =
/^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    if (!regex.test(email)) {
        return false;
    }
    else {
        return true;
    }
}

async function optimizeVideoContent(file,width,height,callback)
{
    console.log(file,width,height,"***********");
    var resizedImage;
    if(file.type.match(/image.*/)) 
    {
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var image = new Image();
            image.onload = function (imageEvent) {
                // Resize the image
                var can = document.createElement('canvas');
                can.width = width;
                can.height = height;
                can.getContext('2d').drawImage(image, 0, 0, width, height);
                resizedImage = can.toDataURL('image/png');
                resizedImage = new File([resizedImage], file.name);
                callback(resizedImage);
            }
            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(file);
    }
}