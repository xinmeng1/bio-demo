
// BEGIN OF CONFIGURATION
var token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbmlkIjoiY2Y1YTBhZjYtMzc1NC00MGQ4LThjYTctM2I4ZDBlNjg4ZjQ4IiwiY2xudCI6IkJpb0lEIiwiYXBwIjoiMTgxNDk4MjQwNi45MTY5LmFwcC5iaW9pZC5jb20iLCJiY2lkIjoiYmlvaWQvNDIvMjM3NTM3NzQxIiwidGFzayI6MjkxLCJpc3MiOiJCV1MiLCJhdWQiOiJodHRwczovL2J3cy5iaW9pZC5jb20iLCJleHAiOjE0NzE5NTQ4NDQsIm5iZiI6MTQ3MTk1NDI0NH0.XzWUDj3LRVfUcRsLRmqHGvc2w7H4ADuigsdRNPYLuXs";
var returnURL = "https://account.bioid.com/manage/enrollcallback";
var state = "NcfposPpdM2Sk3zWuxNHjWfJp5i6PxiF6TUjPunUqmgqQ7llkNBhPvv-o0fcOKGxlxBEksgLgDeq8QNlDIhwUj51k5hqlDknUXVd1E7fzD4oPJ7K5Kn87k_-82Tykxa4PmWpcuciicTp_28op0iETw";
var host = "bws.bioid.com";
var task = "enrollment";
var executions = 3;
var recordings = 3;
var autostart = true;
var challengeResponse = false;
var challenges = [];
var maxHeight = task === 'enrollment' ? 480 : 320;

// disable console log
// console.log = function () { }

// END OF CONFIGURATION

// localized messages (english defaults, might get overloaded in initialize())
var localizedData = {
    "guiTitle": "BioID Web Service",
    "guiSubTitleEnrollment": "Biometric enrollment",
    "guiSubTitleVerification": "Biometric verification",
    "guiHtml5Title": "BWS unified user interface (HTML5 version)",
    "buttonCancel.title": "Abort and navigate back to caller",
    "buttonMirror.title": "Mirror the display of the captured images",
    "buttonStart.title": "Start the recording of images",
    "buttonContinue.title": "Skip biometric process",
    "buttonContinue": "Continue without biometrics",
    "prompt": "This web page requires the HTML5 Media Capture and Streams API (getUserMedia(), as supported by the actual versions of Opera, Firefox, Chrome and Edge). You also have to grant access to your camera.",
    "silverlightPrompt": "If the Media Capture API is not supported by your browser, a Silverlight module will be loaded to get access to your video capture device.",
    "guimobileapp": "If you have installed the BioID App on your mobile device, you can use this app for enrollment or verification.",
    "guimobileapp.title": "Start the BioID app",
    "lookUp": "look slightly upward...",
    "lookLeft": "look a little bit to the left...",
    "lookRight": "look a little bit to the right...",
    "lookDown": "look slightly downward...",
    "uploadInfo": "Uploading...",
    "capture-error": "Video capture failed to start with error: {0}<br />The user might have denied access to their camera.<br />Sorry, but without access to a camera, biometric face recognition is not possible!",
    "nogetUserMedia": "Your browser does not support the HTML5 Media Capture and Streams API. We are trying to load a Silverlight module to access the multimedia capture device. You might want to use the BioID mobile App instead.",
    "silverlightError": "Unhandled Error in Silverlight Application occurred. {0}",
    "idle": "Please press the Start button to start recording",
    "Uploading": "Uploading sample {0} of {1} ...",
    "Uploaded": "",
    "NoFaceFound": "Upload failed: no face found",
    "MultipleFacesFound": "Upload failed: multiple faces were found",
    "NoMovement": "No motion detected, please move your head",
    "Verifying": "Verifying ...",
    "Training": "Training ...",
    "LiveDetectionFailed": "Live detection failed - retrying...",
    "ChallengeResponseFailed": "Challenge-Response failed!<br />Please turn head toward arrows...",
    "NotRecognized": "You have not been recognized - retrying...",
    "PermissionDenied": "Permission Denied!",
    "3": "3 ...",
    "2": "2 ...",
    "1": "1 ..."
};
var capture = null;
var currentExecution = 0;

// jQuery - shortcut for $(document).ready()
// Document Object Model (DOM) is ready
$(function () {
    initialize();

    // set navigation for the buttons
    $('#guicancel').attr('href', returnURL + '?error=user_abort&access_token=' + token + '&state=' + state);
    $('#guiskip').attr('href', returnURL + '?error=user_skip&access_token=' + token + '&state=' + state);
    $('#guimobileapp').attr('href', 'bioid-verify://?access_token=' + token + '&return_url=' + returnURL + '&state=' + state);
    $('#guimobileapp').click(function () {
        $('#guimobileapp').hide();
    });
});

// initialize - load content in specific language and initialize bws capture
function initialize() {
    $('#silverlightPrompt').show();

    // change gui subtitle if task is enrollment
    if (task === 'enrollment') {
        $('#guisubtitle').attr('data-res', 'guiSubTitleEnrollment');
    }

    // try to get language info from the browser.
    var lang = window.navigator.userLanguage || window.navigator.language || "en";
    if (lang.length > 2) {
        // Convert e.g. 'en-US' to 'en'.
        lang = lang.substring(0, 2);
    }

    var language = $.getJSON('/Content/uui/lang/' + lang + '.json').
        done(function (data) {
            console.log('Loaded the language-specific resource successfully');
            localizedData = data;
        }).fail(function (jqxhr, textStatus, error) {
            console.log('Loading of language-specific resource failed with: ' + textStatus + ', ' + error);
        }).always(function () {
            localize();
            // init BWS capture jQuery plugin (see bws.capture.js)
            capture = bws.initcapture(document.getElementById('guicanvas'), null, token, {
                host: host,
                task: task,
                challengeResponse: challengeResponse,
                recordings: recordings,
                maxheight: maxHeight,
                display: 'circle'
            });
            // and start everything
            onStart();
        });
}

// localization of displayed strings
function localize() {
    // loops through all HTML elements that must be localized.
    var resourceElements = $('[data-res]');
    for (var i = 0; i < resourceElements.length; i++) {
        var element = resourceElements[i];
        var resourceKey = $(element).attr('data-res');
        if (resourceKey) {
            // Get all the resources that start with the key.
            for (var key in localizedData) {
                if (key.indexOf(resourceKey) == 0) {
                    var value = localizedData[key];
                    // Dot notation in resource key - assign the resource value to the elements property
                    if (key.indexOf('.') > -1) {
                        var attrKey = key.substring(key.indexOf(".") + 1);
                        $(element).attr(attrKey, value);
                    }
                    // No dot notation in resource key, assign the resource value to the element's innerHTML.
                    else if (key === resourceKey) {
                        $(element).html(value);
                    }
                }
            }
        }
    }
}

// localization and string formatting (additional arguments replace {0}, {1}, etc. in localizedData[key])
function formatText(key) {
    var formatted = key;
    if (localizedData[key] !== undefined) {
        formatted = localizedData[key];
    }
    for (var i = 1; i < arguments.length; i++) {
        formatted = formatted.replace('{' + (i - 1) + '}', arguments[i]);
    }
    return formatted;
}

// called by onStart or the Silverlight plugin to update GUI
function captureStarted() {
    $('#guisplash').hide();
    $('#guiapp').show();
    $('#guimessage').show();
    $('#guiarrows').show();
    $('#guimirror').show().click(mirror);

    if (autostart) {
        setTimeout(function () { startRecording(); }, 1000);
    }
    else {
        $('#guistart').show().click(startRecording);
    }
}

// called from Start button and onStart to initiate a new recording
function startRecording() {
    $('#guistart').hide();
    capture.startCountdown(function () {
        for (var i = 1; i <= recordings; i++) {
            $('#guiuploaded' + i).hide();
            $('#guiupload' + i).hide();
            $('#guiwait' + i).show();
            $('#guiimage' + i).show();
        }
        var tags = challengeResponse && challenges.length > currentExecution && challenges[currentExecution].length > 0 ? challenges[currentExecution] : [];
        capture.startRecording(tags);
        if (typeof silverlightHost !== 'undefined' && silverlightHost !== null) {
            silverlightHost.Content.MainPage.StartCapturing();
        }
    });
}

// called from onStart when recording is done
function stopRecording() {
    capture.stopRecording();
    for (var i = 1; i <= recordings; i++) {
        $('#guiimage' + i).hide();
    }
    if (typeof silverlightHost !== 'undefined' && silverlightHost !== null) {
        silverlightHost.Content.MainPage.StopCapturing();
    }
}

// called from Mirror button to mirror the captured image
function mirror() {
    if (typeof silverlightHost !== 'undefined' && silverlightHost !== null) {
        silverlightHost.Content.MainPage.MirrorDisplay();
    } else {
        capture.mirror();
    }
}

// startup code
function onStart() {
    capture.start(function () {
        $('#guicanvas').show();
        $('#guisilverlight').hide();
        captureStarted();
    }, function (error) {
        if (error !== undefined) {
            // different browsers use different errors
            if (error.code === 1 || error.name === 'PermissionDeniedError') {
                // in the spec we find code == 1 and name == PermissionDeniedError for the permission denied error
                $('#guierror').html(formatText('capture-error', formatText('PermissionDenied')));
            } else {
                // otherwise try to print the error
                $('#guierror').html(formatText('capture-error', error));
            }
            // show button for continue (skip biometric task)
            $('#guiskip').show();
            // for mobile browser we offer the possibility to start the mobile app version
            $('#guistartapp').show();
        } else {
            // no error info typically says that browser doesn't support getUserMedia
            $('#guierror').html(formatText('nogetUserMedia'));
            // show button for continue (skip biometric task)
            $('#guiskip').show();
            // for mobile browser we offer the possibility to start the mobile app version
            $('#guistartapp').show();
            // fallback if no getUserMedia available - try to load silverlight plugin
            // Note: If you do not included the required silverlight js files nothing happens!
            if (typeof silverlightHost !== 'undefined' && silverlightHost == null) {
                createSilverlightPlugin('/Content/uui/clientBin/BioID.Silverlight.Capture.xap');
            }
        }
    }, function (error, retry) {
        // done
        stopRecording();
        currentExecution++;
        if (error !== undefined && retry && currentExecution < executions) {
            // if failed restart if retries are left, but wait a bit until the user has read the error message!
            setTimeout(function () { startRecording(); }, 1800);
        } else {
            // done: redirect to caller ...
            var url = returnURL + '?access_token=' + token;
            if (error !== undefined) {
                url = url + '&error=' + error;
            }
            url = url + '&state=' + state;
            window.location.replace(url);
        }
    }, function (status, message, dataURL) {
        if (status === 'DisplayTag') {
            if (message.search('up') < 0) { $('#guiarrowup').hide(); } else { $('#guiarrowup').show(); }
            if (message.search('down') < 0) { $('#guiarrowdown').hide(); } else { $('#guiarrowdown').show(); }
            if (message.search('left') < 0) { $('#guiarrowleft').hide(); } else { $('#guiarrowleft').show(); }
            if (message.search('right') < 0) { $('#guiarrowright').hide(); } else { $('#guiarrowright').show(); }
        } else {
            // report a message on the screen
            var uploaded = capture.getUploaded();
            var recording = uploaded + capture.getUploading();
            var msg = formatText(status, recording, recordings);
            var $msg = $('#guimessage');
            $msg.html(msg);
            $msg.stop(true).fadeIn(400).fadeOut(3000);

            // we display some animations/images dpending on the status
            if (status === 'Uploading') {
                // begin an upload
                $('#guiwait' + recording).hide();
                $('#guiupload' + recording).show();
            } else if (status === 'Uploaded') {
                // successfull upload (we should have a dataURL)
                if (dataURL) {
                    $('#guiupload' + uploaded).hide();
                    $image = $('#guiuploaded' + uploaded);
                    $image.attr('src', dataURL);
                    $image.attr('width', 90);
                    $image.attr('height', 120);
                    $image.show();
                }
            } else if (status === 'NoFaceFound' || status === 'MultipleFacesFound') {
                // upload failed
                recording++;
                $('#guiupload' + recording).hide();
                $('#guiwait' + recording).show();
            }
        }
    });
};
