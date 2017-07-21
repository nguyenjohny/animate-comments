'use strict';

function loadIssues(request) {
    startSpinner();

    $.ajax({
        url: request.dataUrl,
        dataType: request.dataType,
        jsonpCallback: request.jsonpCbFunc
    }).fail((options, status) => {
        var code = options.status;
        if (code === 0) {
            alert(`XMLHttpRequest cannot load '${request.dataUrl}' due to cross orign request. \n` +
                 "Please either with a start server, or run using firefox or with chrome with security disabled.");
        } else {
            alert(`${status.toUpperCase()}(${options.status}): failed to parse '${request.dataUrl}' due to '${options.statusText}'`);
        }
    }).done((data) => {
        var test = '';
        if (data.length == 0) {
            test = getNoIssuesTemplate();
        } else {
            data.forEach((issue) => {
               test += getResultTemplate(issue.beganAt, issue.description, issue.id, 
                            issue.resolvedAt, issue.status, issue.title, issue.updates);
            });
        }

        $('#view-port').html(test);
        reactWithinViewport();
   }).then(() => {
        $('#loadFile').html("<i class='fa fa-check'></i> Done");
   });
}

function isUnresolved(status) {
    return status === 'Unresolved';
}

function minutesAgo(dateString) {
    var diffMs = Math.abs(new Date(dateString) - Date.now());
    return Math.floor((diffMs/1000)/60);
}


function getResultTemplate(beganAt, desc, id, resolvedAt, status, title, updates) {
    // Each issue will be rendered with the following template 
    var compareTimeAt = isUnresolved(status) ? beginAt : resolvedAt;
    var diffMins = minutesAgo(compareTimeAt);
    
    return `<div class="issue-template revealer ">
                <h4>${title} - ${isUnresolved(status) ? 'Begin' : status} ${diffMins} minutes ago</h4> 
                <p>${desc}</p>
                <div style="padding-left:50px">
                    <h5>Updates:</h5>
                    ${getUpdatesTemplate(updates)}
                </div>
                <hr />
            </div> `;
}

function getUpdatesTemplate(updates) {
    var markup = '';
    updates.forEach((u) => {
         markup += `<div class="update-template">                    
                        <p>${u.update}</p>
                        <em>By <img class="avatar" src=${u.avatar} /> ${u.by} ${minutesAgo(u.at)} minutes ago</em>
                        <hr style="width:50%"/>
                    </div>`;
    });

    return markup;
}

function getNoIssuesTemplate() {
    // Render this if there are no issues returned
    return `<div class="no-issues-template jumbotron"> Everybody is happy! </div>`;
}

function startSpinner() {
    $('#loadFile').html("<i class='fa fa-spinner fa-spin '></i> Loading Issues");
}

// built from example  http://xtianmiller.com/notes/animating-elements-when-they-appear-in-viewport/
var reactWithinViewport = function() {

    if (window.requestAnimationFrame && document.documentElement.classList) {

        // Passes the test so add enhanced class to HTML tag
        document.documentElement.classList.add('enhanced');

        // Throttle
        // http://underscorejs.org/#throttle
        var throttle = (func, wait, options) => {
            var _ = {
                now: Date.now || function() {
                    return new Date().getTime();
                }
        };

        var context, args, result;
        var timeout = null;
        var previous = 0;
        if (!options) {
            options = {};
        }

        var later = () => {
            previous = options.leading === false ? 0 : _.now();
            timeout = null;
            result = func.apply(context, args);
            if (!timeout) {
                context = args = null;
            }
        };

        return function() {
            var now = _.now();
            if (!previous && options.leading === false) {
                previous = now;
            }
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0 || remaining > wait) {
              if (timeout) {
                clearTimeout(timeout);
                timeout = null;
               }
               previous = now;
               result = func.apply(context, args);
               if (!timeout) {
                  context = args = null;
               }
            } else if (!timeout && options.trailing !== false) {
               timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };
    
    // requestAnimationFrame:  http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    var _requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame 
            || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame;

    // Global class for revealing element
    var revealer = document.querySelectorAll('.revealer');

    // Get the viewport (window) dimensions
    var getViewportSize = function() {
      return {
        width: window.document.documentElement.clientWidth,
        height: window.document.documentElement.clientHeight
      };
    };

    // Get the current scoll position
    var getCurrentScroll = function() {
      return {
        x: window.pageXOffset,
        y: window.pageYOffset
      };
    };

    // Get element dimensions and position
    var getElemInfo = function(elem) {
      var offsetTop = 0;
      var offsetLeft = 0;
      var offsetHeight = elem.offsetHeight;
      var offsetWidth = elem.offsetWidth;

      do {
        if (!isNaN(elem.offsetTop)) {
          offsetTop += elem.offsetTop;
        }
        if (!isNaN(elem.offsetLeft)) {
          offsetLeft += elem.offsetLeft;
        }
      } while ((elem = elem.offsetParent) !== null);

      return {
        top: offsetTop,
        left: offsetLeft,
        height: offsetHeight,
        width: offsetWidth
      };
    };

    // Check visibility of the element in the viewport
    var checkVisibility = function(elem) {
      var viewportSize = getViewportSize();
      var currentScroll = getCurrentScroll();
      var elemInfo = getElemInfo(elem);
      var spaceOffset = 0.2;
      var elemHeight = elemInfo.height;
      var elemWidth = elemInfo.width;
      var elemTop = elemInfo.top;
      var elemLeft = elemInfo.left;
      var elemBottom = elemTop + elemHeight;
      var elemRight = elemLeft + elemWidth;

      var checkBoundaries = function() {
        // Defining the element boundaries and extra space offset
        var top = elemTop + elemHeight * spaceOffset;
        var left = elemLeft + elemWidth * spaceOffset;
        var bottom = elemBottom - elemHeight * spaceOffset;
        var right = elemRight - elemWidth * spaceOffset;

        // Defining the window boundaries and window offset
        var wTop = currentScroll.y + 0;
        var wLeft = currentScroll.x + 0;
        var wBottom = currentScroll.y - 0 + viewportSize.height;
        var wRight = currentScroll.x - 0 + viewportSize.width;

        // Check if the element is within boundary
        return (top < wBottom) && (bottom > wTop) && (left > wLeft) && (right < wRight);
      };

      return checkBoundaries();
    };

    // Run a loop with checkVisibility() and add / remove classes to the elements
    var toggleElement = function() {
      for (var i = 0; i < revealer.length; i++) {
        if (checkVisibility(revealer[i])) {
          revealer[i].classList.add('revealed');
        } else {
          revealer[i].classList.remove('revealed');
        }
      }
    };

    // Throttle events and requestAnimationFrame
    var scrollOrResizeHandler = throttle(function() {
      _requestAnimationFrame(toggleElement);
    }, 300);

    scrollOrResizeHandler();

    // Listening for events
    if (window.addEventListener) {
      addEventListener('scroll', scrollOrResizeHandler, false);
      addEventListener('resize', scrollOrResizeHandler, false);
    } else if (window.attachEvent) {
      window.attachEvent('onscroll', scrollOrResizeHandler);
      window.attachEvent('onresize', scrollOrResizeHandler);
    } else {
      window.onscroll = scrollOrResizeHandler;
      window.onresize = scrollOrResizeHandler;
    }

  }

  return reactWithinViewport;

};


