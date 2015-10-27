(function() {
    function initFramesDropdown() {
        var injectFramesCounter = function (){
            var framesObj = [],
                frames = window.document.getElementsByTagName("iframe");
            for (var i = 0; i < frames.length; ++i)
            {
                framesObj.push({
                    name: frames[i].id || frames[i].name,
                    url: frames[i].src
                });
            }
            return framesObj;
        };
        clearInterval(window.initFramesDropdownInterval);
        window.initFramesDropdownInterval = setInterval(function(){
            chrome.devtools && chrome.devtools.inspectedWindow.eval("("+injectFramesCounter.toString()+")()", renderFramesDropdown);
        }, 500);
    }

    function initAngularWatchers() {
        var injectAngularWatchers = function (){
            if(!('angular' in window)) return false;

            return (function getWatchCount(scope, scopeHash) {
                // default for scopeHash
                if (scopeHash === undefined) {
                    scopeHash = {};
                }

                // make sure scope is defined and we haven't already processed this scope
                if (!scope || scopeHash[scope.$id] !== undefined) {
                    return 0;
                }

                var watchCount = 0;

                if (scope.$$watchers) {
                    watchCount = scope.$$watchers.length;
                }
                scopeHash[scope.$id] = watchCount;

                // get the counts of children and sibling scopes
                // we only need childHead and nextSibling (not childTail or prevSibling)
                watchCount+= getWatchCount(scope.$$childHead, scopeHash);
                watchCount+= getWatchCount(scope.$$nextSibling, scopeHash);

                return watchCount;
            })(angular.element( window.document.querySelector('body') ).scope());
        };

        window.lastCount = 0;
        clearInterval(window.initAngularWatchersInterval);
        window.initAngularWatchersInterval = setInterval(function(){
            var options = window.selectedFrame != 'top' ? {'frameURL': window.selectedFrame} : {};
            chrome.devtools && chrome.devtools.inspectedWindow.eval("("+injectAngularWatchers.toString()+")()", options, renderWatchers);
        }, 500);
    }

    function initAngularModules(){

        var injectAngularModules = function(){
            if(!('angular' in window)) return false;

            var  r = {};
            function AngularModules( mod, split ) {
                r[mod] = {};

                var inj = window.angular.element(window.document.querySelector('[ng-app]')).injector().get,
                    get = function( controllerName ) {
                        return window.angular.element(window.document.querySelector('[ng-controller= ' + controllerName + ']')).scope();
                    };

                window.angular.forEach( window.angular.module( mod ).requires, function(m) {
                    AngularModules( m );
                });

                window.angular.forEach(window.angular.module(mod)._invokeQueue, function(a) {
                    try {
                        var component = a[1] == 'register' ? get (a[2][0] ) : inj (a[2][0] );

                        if( component ) {

                            if( typeof split != 'undefined') {
                                if( typeof r[ a[1] ] == 'undefined') {
                                    r[mod][ a[1] ] = {};
                                }

                                r[mod][ a[1] ][ a[2][0] ] = component;
                            } else {
                                r[mod][ a[2][0] ] = component;
                            }

                        }

                    } catch (e) {

                    }
                });

                return r;
            };

            window.$$am = AngularModules( window.document.querySelector('[ng-app]').getAttribute('ng-app') );
        }
        clearInterval(window.injectAngularModulesInterval);
        window.injectAngularModulesInterval = setInterval(function(){
            var options = window.selectedFrame != 'top' ? {'frameURL': window.selectedFrame} : {};
            chrome.devtools && chrome.devtools.inspectedWindow.eval("("+injectAngularModules.toString()+")()", options);
        }, 2000);
    }

    function initGraph(){
        var lineChartData = {
            labels: window.lastCount ? [0, +(new Date)] : [0],
            datasets: [{
                fillColor: "transparent",
                strokeColor: "#2AA198",
                pointColor: "#2AA198",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "#2AA198",
                data: window.lastCount ? [0,window.lastCount] : [0]
            }]
        }

        Chart.defaults.global.tooltipYPadding = 16;
        Chart.defaults.global.tooltipCornerRadius = 0;
        Chart.defaults.global.tooltipTitleFontStyle = "normal";
        Chart.defaults.global.tooltipFillColor = "rgba(0,0,0,0.25)";
        Chart.defaults.global.maintainAspectRatio = true;
        Chart.defaults.global.responsive = true;
        Chart.defaults.global.scaleOverride = true;
        Chart.defaults.global.scaleShowLabels = false;
        Chart.defaults.global.showScale = false;
        Chart.defaults.global.scaleLineColor = "#073642";
        Chart.defaults.global.scaleStartValue = 0;
        Chart.defaults.global.scaleFontSize = 16;
        Chart.defaults.global.scaleSteps = 800;
        Chart.defaults.global.scaleStepWidth = 10;
        Chart.defaults.global.tooltipTemplate = " <%= value %> watchers ";

        var ctx = document.getElementById("canvas").getContext("2d");
        if(window.lineChart) window.lineChart.destroy();
        window.lineChart = new Chart(ctx).Line(lineChartData, {
            pointDot:  true,
            bezierCurve: false,
            scaleStartValue: 0,
            scaleShowVerticalLines: false
        });
    }

    function toggleTheme( toggle ) {
        document.querySelector('body').className = toggle ? "light" : "dark";
        document.querySelector('.tgl.theme').checked = toggle;
    }

    function toggleGraph( toggle ) {
        document.querySelector('.counter-container').style.display = (toggle ? 'none' : 'block');
        document.querySelector('.graph-container').style.display = (toggle ? 'block' : 'none');
        window.showGraph = toggle;
        document.querySelector('.tgl.graph').checked = toggle;
        if(toggle && !window.lineChart) initGraph();
    }


    function angularNotFound(noAngular){
        document.querySelector('.no-angular').style.display = (noAngular ? 'block' : 'none');
        document.querySelector('.counter-container').style.display = (noAngular || window.showGraph ? 'none' : 'block');
        document.querySelector('.graph-container').style.display = (noAngular || !window.showGraph ? 'none' : 'block');
        document.querySelector('.graph-options').style.display = (noAngular ? 'none' : 'inline-block');
    }

    function renderWatchers(count,errors){
          angularNotFound( typeof count == 'undefined' || count === false );
        var diff = ~~(count - window.lastCount);
        if(diff){
            document.querySelector('.odometer').innerHTML = count;
            document.querySelector('.diff-counter-offset').innerText = (diff < 0) ? '-' : '+';
            document.querySelector('.diff-counter-offset').className = (diff < 0) ? 'diff-counter-offset minus' : 'diff-counter-offset plus';
            document.querySelector('.diff-counter').innerText = Math.abs(diff);
            if(window.lineChart){
                window.lineChart.addData([~~count], +(new Date));
                if(window.lineChart.datasets[0].points.length > 25){
                    window.lineChart.removeData();
                }
            }
        }

        window.lastCount = count;
    }

    function removeDropdownOptions(selector){
        for(var i=selector.options.length-1;i>=0;i--){
            selector.remove(i);
        }
    }
    function renderFramesDropdown(frames){
        var frameSelector = document.getElementById('frameSelector');
        removeDropdownOptions(frameSelector);
        frameSelector.options[frameSelector.options.length] = new Option('Top frame', 'top', false, (!window.selectedFrame || 'top' === window.selectedFrame));

        frames.map(function(frame){
            var parser = document.createElement('a');
            parser.href = frame.url;
            frameSelector.options[frameSelector.options.length] = new Option(
                frame.name + (parser && parser.hostname ? ' : ' + parser.hostname : ''),
                frame.url,
                false,
                (window.selectedFrame && frame.url === window.selectedFrame)
            );
        });
        document.querySelector('.frame-options').style.display = (frames && frames.length) ? 'block' : 'none';
    }

    function loadOptions(){
        window.selectedFrame = 'top'; //initial selected
        document.getElementById('frameSelector').addEventListener("change", function(a,b,c){
            window.selectedFrame = this.options[this.selectedIndex].value;
            window.lastCount = false;
            toggleGraph(false);
            angularNotFound(true);
            window.lineChart && window.lineChart.destroy();
            window.lineChart = false;
            initAngularWatchers();
            initAngularModules();
        });

        document.querySelector('.tgl.theme').addEventListener("click", function(e){
            if (typeof(window.localStorage) != 'undefined' ) {
                try {
                    window.localStorage.setItem('theme', e.target.checked);
                } catch (e){}
            }
            toggleTheme(e.target.checked);
        });

        document.querySelector('.tgl.graph').addEventListener("click", function(e){
            if (typeof(window.localStorage) != 'undefined' ) {
                try {
                    window.localStorage.setItem('graph', e.target.checked);
                } catch (e){}
            }

            toggleGraph(e.target.checked);
        });

        if (typeof(window.localStorage) != 'undefined' ) {
            try {
                toggleTheme(JSON.parse(window.localStorage.getItem('theme')));
                toggleGraph(JSON.parse(window.localStorage.getItem('graph')));
            } catch (e){}
        }
    }

    function init() {
        initFramesDropdown();
        initAngularWatchers();
        initAngularModules();
        loadOptions();
        angularNotFound( true );
    }

    document.addEventListener('DOMContentLoaded', function() {
        init();
    });
})();
