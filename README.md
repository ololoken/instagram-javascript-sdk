The Instagram JavaScript SDK
============================
A JavaScript library for the Instagram REST and Search APIs
(currently supports authentication, authorization and persisting sessions)
Forked from facebookarchive/instagram-javascript-sdk

SDK Usage Examples
------------------
    IG.init({
        client_id: YOUR_CLIENT_ID,
        session: true,
        cookie: true // persist a session via cookie
    });

    // client side access_token flow (implicit)
    IG.login(function (response) {
        if (response.session) {
            // user is logged in
        }
    }, {scope: ['comments', 'likes']});

    // client side code flow
    IG.login({
      response_type: 'token', 
      redirect_uri: path+'igoauthreciever.html',
      scope: ['basic']
    });

    // get some data
    IG.load('/media/popular', {})
    	.then(function (response) {  })
    	.catch(function (responseFailed) {  });

Contributing
------------
In the spirit of [free software](http://www.fsf.org/licensing/essays/free-sw.html), **everyone** is encouraged to help improve this project.

Here are some ways *you* can contribute:

* by using alpha, beta, and prerelease versions
* by reporting bugs
* by suggesting new features
* by writing or editing documentation
* by writing specifications
* by writing code (**no patch is too small**: fix typos, add comments, clean up inconsistent whitespace)
* by refactoring code
* by closing [issues](http://github.com/Instagram/instagram-javascript-sdk/issues)
* by reviewing patches


Submitting an Issue
-------------------
We use the [GitHub issue tracker](http://github.com/Instagram/instagram-javascript-sdk/issues) to track bugs and
features. Before submitting a bug report or feature request, check to make sure it hasn't already
been submitted. You can indicate support for an existing issuse by voting it up. When submitting a
bug report, please include a [Gist](http://gist.github.com/) that includes a stack trace and any
details that may be necessary to reproduce the bug, including your library version, browser version, and
operating system. Ideally, a bug report should include a pull request with failing specs.


Submitting a Pull Request
-------------------------
1. Fork the project.
2. Create a topic branch.
3. Implement your feature or bug fix.
4. Add documentation for your feature or bug fix.
5. Commit and push your changes.
6. Submit a pull request.


