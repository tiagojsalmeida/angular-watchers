# Angular Watchers
**Angular watchers** is the ultimate AngularJS tool which tells you how many active watchers you currently have.
It automatically updates so you can see live how many watcher a page have.
This is perfect to debug any performance issues.

## Features
* Total number of watcher on the current page
* Difference from the last total number of watchers
* Visual graph that plots the number of watchers in time (max 25 plots)
* Choose Iframe where you want to count the watchers
* Expose Angular Modules in a global variable **window.$$am**
* Graph/Counter view toggle
* Dark/Light theme toggle

<p align="center">
  <img src="https://github.com/tiagojsalmeida/angular-watchers/blob/master/Screenshots/test-case.gif"/>
  <img src="https://github.com/tiagojsalmeida/angular-watchers/blob/master/Screenshots/1.jpg"/>
  <img src="https://github.com/tiagojsalmeida/angular-watchers/blob/master/Screenshots/2.jpg"/>
</p>

## How to use
* Install the [Chrome extension](https://chrome.google.com/webstore/detail/angular-watchers/nlmjblobloedpmkmmckeehnbfalnjnjk)
* [Open developer tools](https://developers.google.com/web/tools/chrome-devtools/iterate/inspect-styles/shortcuts#keyboard-shortcuts-by-panel)
* Navigate to $$Watchers tab

## How to install for development

* Clone the project
* Open [Chrome Extensions](chrome://extensions)
* Ensure that the Developer mode checkbox in the top right-hand corner is checked
* Click Load unpacked extension… to pop up a file-selection dialog.
* Navigate to the **Angular Watchers** directory and select it.

## How it works
Every 500ms we inject a angular watchers counter and show you that result.

If your page has Iframes you can choose the one you want to target in a dropdown and we will counter the watchers on the given Iframe.

We also expose all the available angular modules and their services on a **window.$$am** variable. This is a usefull shortcut to debug angular services without a need to use *injector().get()* everytime.

## Credits

Developed by the [Tiago Almeida](https://github.com/tiagojsalmeida), [Giulio Dellorbo](https://github.com/egm0121) and [Firmino Alves](https://github.com/firminoalves).

## License
The MIT License (MIT)

Copyright (c) 2015 Tiago Almeida

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.