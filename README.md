## Hoist.js

Even over a fast connection, the user experience on image-heavy websites can suffer from slow loading times. Hoist.js is a library that wraps up the logic of loading a large collection of images a few at a time. It's similar in spirit to the 'infinite scroll' approach but instead opts to _preemptively_ load the entire collection, rather than waiting for the user to scroll to load more. Such an approach is not suitable for _massive_ collections of images but, for a large collection, the result is quite effective.


### Example implementation
~~~ js
var urls = [
  'http://example.com/images/0.jpeg',
  'http://example.com/images/1.jpeg',
  'http://example.com/images/2.jpeg',
  'http://example.com/images/3.jpeg',
  'http://example.com/images/4.jpeg',
  'http://example.com/images/5.jpeg',
  'http://example.com/images/6.jpeg',
  'http://example.com/images/7.jpeg',
  'http://example.com/images/8.jpeg',
  'http://example.com/images/9.jpeg',
  'http://example.com/images/10.jpeg'
];

var hoister = new Hoist({
  urls: urls,
  container: document.getElementById('container'),
});

hoister.launch();
~~~

The above will load the images for the first four urls into the browser's memory, create DOM nodes for each of them and append them to the container div. It will then move on to the next four and perform the same steps until it runs out.

Hoist.js can be configured to do the following:
- query an API endpoint for retrieving the list of URLs via an AJAX request
- use a custom render / DOM append function
- rather than an array of simple URLs, accept an array of objects whose properties can be used for more complex rendering

Hoist.js has no external dependencies.
