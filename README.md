String2Regex
============

Overview
--------

String2Regex is an angularjs module that provide a directive called 'string2regex' which generate widget which helps user to generate a string based on a sample string. See http://asdacap.com/projects/string2regex/ for a hosted application. It is inspired from http://txt2re.com but it works entirely on clientside and not as full featured. 

Usage
-----

If you download the whole repository, run `bower install`, then `npm install`, then `grunt`. The demo should be working now. 

As in the demo, simply import the module `string2regex` into your application module, then the directive `string2regex` is available to you. String2Regex assume Twitter's Bootstrap 3 environment, but you can just modify the template if you wish so. The `string2regex` module accept a `holder` object. The `holder` object should have a property called `sample` which is the sample string. The widget will dynamically adjust when the sample string changes using angularjs's data binding technique. The holder object also contain the state of the widget in the `rootGroup` property. You can safely JSONify the holder object if you wish save the state on some form of persistent storage and change the JSON. See http://asdacap.com/projects/string2regex/demo.html to see how this work. The generated regular expression is in the holder's property called `regex`. 

It also have a directive called `string2regex-prettyregex` which take a holder's property called `taggedRegex`. It can then use this tagged regex to generate some html elements which classes that you can style using CSS. A practical use for this is to change different color of different regular expression part. 

License
-------

This library is licensed under the MIT license.
