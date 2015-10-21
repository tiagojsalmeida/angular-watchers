// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
(function() {
    function checkWatch() {
        window.lastCount = 0;
        setInterval(function(){
            chrome.devtools.inspectedWindow.eval("("+toInject.toString()+")()",render);
        }, 500);
    }
    var toInject = function(){
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
        })(angular.element($$('body')).scope());
    };

    function render(count){
        document.querySelector('.no-angular').style.display = (count === false ? 'block' : 'none');
        document.querySelector('.counter').style.display = (count === false ? 'none' : 'block');
        document.querySelector('.odometer').innerHTML = count;
        var diff = count - window.lastCount;
        if(count !== false && diff != 0){
            document.querySelector('.diff-counter-offset').innerText = (diff < 0) ? '-' : '+';
            document.querySelector('.diff-counter-offset').className = (diff < 0) ? 'diff-counter-offset minus' : 'diff-counter-offset plus';
            document.querySelector('.diff-counter').innerText = Math.abs(diff);
        }
        window.lastCount = count;
    }
    window.addEventListener('load', checkWatch);
    document.querySelector('.tgl').addEventListener("click", function(e){
        if (typeof(window.localStorage) != 'undefined' ) {
            try {
                window.localStorage.setItem('theme', e.target.checked);
            } catch (e){}
        }
        document.querySelector('body').className = e.target.checked ? "light" : "dark";
    });

    if (typeof(window.localStorage) != 'undefined' ) {
        try {
            if(window.localStorage.getItem('theme') === "true"){
                document.querySelector('.tgl').click();
            }
        } catch (e){}
    }
})();


