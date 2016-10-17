(function() {
    //little pollyfil
    NodeList.prototype.forEach = Array.prototype.forEach;

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
            })(angular.element( window.document.querySelector('[ng-app]') ).scope());
        };

        window.lastCount = 0;
        clearInterval(window.initAngularWatchersInterval);
        window.initAngularWatchersInterval = setInterval(function(){
            var options = window.selectedFrame != 'top' ? {'frameURL': window.selectedFrame} : {};
            chrome.devtools && chrome.devtools.inspectedWindow.eval("("+injectAngularWatchers.toString()+")()", options, renderWatchers);
        }, 500);
    }

    function initAngularModules(){

        var injectAngularModules = function( enabled ){
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

            window.$$am = enabled && AngularModules( window.document.querySelector('[ng-app]').getAttribute('ng-app') );
        }
        clearInterval(window.injectAngularModulesInterval);
        window.injectAngularModulesInterval = setInterval(function(){
            var options = window.selectedFrame != 'top' ? {'frameURL': window.selectedFrame} : {};
            chrome.devtools && chrome.devtools.inspectedWindow.eval("("+injectAngularModules.toString()+")(" + enableModulesHelper.toString() + ")", options);
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

    var showConfiguration = false,
        enableModulesHelper = false,
        toggle = {
            configuration: function() {
                showConfiguration = !showConfiguration;
                document.querySelector('.configuration-container').className = 'configuration-container' + (!showConfiguration ? ' hidden' : '');
            },
            theme: function( toggle ) {
                var theme = !!~["dark", "light"].indexOf(toggle) ? toggle : "dark";
                document.querySelector('body').className = theme;
                this.selected( 'theme', theme );
                window.localStorage.setItem('theme', theme );
            },
            graph: function( toggle ) {
                toggle = toggle === 'true' ? true : false;
                document.querySelector('.counter-container').style.display = (toggle ? 'none' : 'block');
                document.querySelector('.graph-container').style.display = (toggle ? 'block' : 'none');
                window.showGraph = toggle;
                if(toggle && !window.lineChart) initGraph();
                this.selected( 'graph', toggle );
                window.localStorage.setItem('graph', toggle );
            },
            modules: function( toggle ) {
                enableModulesHelper = toggle === 'true' ? true : false;
                this.selected( 'modules', enableModulesHelper );
                window.localStorage.setItem('modules', enableModulesHelper );
            },
            selected: function( namespace, value ){
                document.querySelectorAll('[data-click="' + namespace + '"]').forEach(function(elm) {
                    elm.className = 'option' + ( elm.getAttribute('data-value') == value.toString() ? ' selected' : '');
                });
            }
        }

    function angularNotFound(noAngular){
        document.querySelector('.no-angular').style.display = (noAngular ? 'block' : 'none');
        document.querySelector('.counter-container').style.display = (noAngular || window.showGraph ? 'none' : 'block');
        document.querySelector('.graph-container').style.display = (noAngular || !window.showGraph ? 'none' : 'block');
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

        var framesUrl = frames.map(function(frame){
            return frame.url;
        });
        //if the selected frame doesnt exist anymore, switch to top frame
        if( framesUrl.indexOf( window.selectedFrame ) == -1 ){
            window.selectedFrame = 'top';
        }
        
        frames.map(function(frame){
            var parser = document.createElement('a');
            parser.href = frame.url;
            frameSelector.options[frameSelector.options.length] = new Option(
                frame.name + ( frame.name && parser && parser.hostname ? ' : ' : '') + (parser && parser.hostname || ''),
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
            window.selectedFrame = this.options[this.selectedIndex].value || 'top';
            window.lastCount = false;
            toggle.graph(false);
            angularNotFound(true);
            window.lineChart && window.lineChart.destroy();
            window.lineChart = false;
            initAngularWatchers();
            initAngularModules();
        });

        document.querySelectorAll('[data-click]').forEach(function(elm) {
            elm.addEventListener("click", function(e){
                toggle[ elm.getAttribute('data-click') ]( elm.getAttribute('data-value') );
            });
        });

        if (typeof(window.localStorage) != 'undefined' ) {
            try {
                toggle.theme(window.localStorage.getItem('theme'));
                toggle.graph(window.localStorage.getItem('graph'));
                toggle.modules(window.localStorage.getItem('modules'));
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
