if (!window.IG) {
    window.IG = {
        _client_id: null,
        _session: null,
        _userStatus: 'unknown',
        _logging: false,
        _domain: {
            // https_com: 'http://instagram.local/',
            https_com: 'https://instagram.com/',
            api: 'https://api.instagram.com/v1/'
        },

        getDomain: function (site) {
            switch (site) {
                case 'https_com':
                    return IG._domain.https_com;
                case 'api':
                    return IG._domain.api;
            }
        },
        provide: function (name, literal) {
            return IG.copy(IG.create(name), literal);
        },
        copy: function (to_object, from_object) {
            var key;
            for (key in from_object) {
                if (from_object.hasOwnProperty(key)) {
                    if (typeof to_object[key] === 'undefined') {
                        to_object[key] = from_object[key];
                    }
                }
            }
            return to_object;
        },
        create: function (key_or_keys, object) {
            var root = window.IG,
                keys = key_or_keys ? key_or_keys.split('.') : [],
                num_keys = keys.length,
                i;
            for (i = 0; i < num_keys; i++) {
                var key = keys[i];
                var child = root[key];
                if (!child) {
                    child = (object && i + 1 === num_keys) ? object : {};
                    root[key] = child;
                }
                root = child;
            }
            return root;
        },
        guid: function () {
            return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
        },
        log: function (message) {
            if (IG._logging) {
                if (window.Debug && window.Debug.writeln) {
                    window.Debug.writeln(message);
                } else if (window.console) {
                    window.console.log(message);
                }
            }
        }
    };
    IG.provide('Array', {
        forEach: function (array, fn) {
            var i, key;

            if (!array) {
                return;
            }

            if (Object.prototype.toString.apply(array) === '[object Array]' || (!(array instanceof Function) && typeof array.length === 'number')) {
                if (array.forEach) {
                    array.forEach(fn);
                } else {
                    for (i = 0, length = array.length; i < length; i++) {
                        fn(array[i], i, array);
                    }
                }
            } else {
                for (key in array) {
                    if (array.hasOwnProperty(key)) {
                        fn(array[key], key, array);
                    }
                }
            }
        },
        join: function (array, delimiter) {
            var join_string = '';

            IG.Array.forEach(array, function (value, key) {
                join_string += value + delimiter;
            });

            join_string = join_string.substr(0, join_string.lastIndexOf(delimiter));

            return join_string;
        }
    });
    IG.provide('QS', {
        encode: function (object, delimiter, encode) {
            delimiter = (delimiter === undefined) ? '&' : delimiter;
            encoder = (encode === false) ?
                function (component) {
                    return component;
                } : encodeURIComponent;
            var pairs = [];
            IG.Array.forEach(object, function (value, key) {
                if (value !== null && typeof value !== 'undefined') {
                    pairs.push(encoder(key) + '=' + encoder(value));
                }
            });
            pairs.sort();
            return pairs.join(delimiter);
        },
        decode: function(string) {
            var pairs = (string || '').split('&'),
                object = {},
                i;

            for (i = 0; i < pairs.length; i++) {
                pair = pairs[i].split('=', 2);
                if (pair && pair[0]) {
                    object[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
                }
            }

            return object;
        },
        toObject: function (string) {
          return string.split('&').map(function (v) {return v.split('=')}).reduce(function (v, cv) {v[cv[0]] = cv[1]; return v}, {});
        }
    });
    IG.provide('JSON', {
        stringify: function (object) {
            if (window.Prototype && Object.toJSON) {
                return Object.toJSON(object);
            } else {
                return JSON.stringify(object);
            }
        },
        parse: function (string) {
            return JSON.parse(string);
        },
        flatten: function (object) {
            var flat_object = {},
                key;

            for (key in object) {
                if (object.hasOwnProperty(key)) {
                    var value = object[key];

                    if (typeof value === 'string' && key !== null) {
                        flat_object[key] = value;
                    } else if (value !== null && value !== undefined) {
                        flat_object[key] = IG.JSON.stringify(value);
                    }
                }
            }
            return flat_object;
        }
    });
    IG.provide('EventProvider', {
        _subscribersMap: {},
        subscribers: function () {
            return this._subscribersMap;
        },
        subscribe: function (event_name, callback) {
            IG.log('Subscription to: ' + event_name);
            var subscribers = this.subscribers();
            if (!subscribers[event_name]) {
                subscribers[event_name] = [callback];
            } else {
                subscribers[event_name].push(callback);
            }
        },
        unsubscribe: function (event_name, callback) {
            var subscribers = this.subscribers()[event_name];
            IG.Array.forEach(subscribers, function (event_callback, i) {
                if (event_callback === callback) {
                    subscribers[i] = null;
                }
            });
        },
        clear: function(event_name) {
            delete this.subscribers()[event_name];
        },
        fire: function () {
            var event_args = Array.prototype.slice.call(arguments),
                event_name = event_args.shift();

            IG.log('Fire for: ' + event_name);
            IG.Array.forEach(this.subscribers()[event_name], function (subscriber) {
                if (subscriber instanceof Function) {
                    subscriber.apply(subscriber, event_args);
                }
            });
        }
    });
    IG.provide('Event', IG.EventProvider);
    IG.provide('', {
        ui: function (options) {
            var prepared_options = IG.UIServer.prepareCall(options);
            if (!prepared_options) {
                IG.log('"prepareCall" failed to return options');
                return;
            }

            var display = prepared_options.params.display;
            var display_method = IG.UIServer[display];
            if (!display_method) {
                IG.log('"display" must be');
                return;
            }

            display_method(prepared_options);
        }
    });
    IG.provide('UIServer', {
        Methods: {},
        _active: {},
        _defaultCb: {},
        prepareCall: function (options) {
            var method_name = options.method.toLowerCase(),
                method = IG.UIServer.Methods[method_name],
                popup_id = IG.guid();

            IG.copy(options, {
                client_id: IG._client_id,
                access_token: (IG._session && IG._session.access_token) || undefined
            });

            options.display = IG.UIServer.getDisplayMode(method, options);

            var prepared_options = {
                id: popup_id,
                size: method.size || {},
                url: method.url,
                params: options
            };

            if (method.transform) {
                prepared_options = method.transform(prepared_options);
                if (!prepared_options) {
                    IG.log('Call to "transform" in "prepareCall" failed to return options');
                    return;
                }
            }

            prepared_options.params.redirect_uri = options.redirect_uri;

            prepared_options.params = IG.JSON.flatten(prepared_options.params);
            var display = prepared_options.params.display;
            delete prepared_options.params.display;
            var query_string = IG.QS.encode(prepared_options.params);
            if (query_string) {
                prepared_options.url += '?' + query_string;
            }
            prepared_options.params.display = display;
            return prepared_options;
        },
        getDisplayMode: function (method, options) {
            if (options.display === 'hidden') {
                return 'hidden';
            }
            return  'popup';
        },
        popup: function (options) {
            var screenX = typeof window.screenX !== 'undefined' ? window.screenX : window.screenLeft,
                screenY = typeof window.screenY !== 'undefined' ? window.screenY : window.screenTop,
                clientWidth = typeof window.outerWidth !== 'undefined' ? window.outerWidth : document.documentElement.clientWidth,
                clientHeight = typeof window.outerHeight !== 'undefined' ? window.outerHeight : (document.documentElement.clientHeight - 22),
                popupWidth = options.size.width,
                popupHeight = options.size.height,
                screenWidth = (screenX < 0) ? window.screen.width + screenX : screenX,
                popupX = parseInt(screenWidth + ((clientWidth - popupWidth) / 2), 10),
                popupY = parseInt(screenY + ((clientHeight - popupHeight) / 2.5), 10),
                popupFeatures = ('width=' + popupWidth + ',height=' + popupHeight + ',left=' + popupX + ',top=' + popupY + ',scrollbars=1,location=1,toolbar=0');
            IG.log('opening popup: ' + options.id);
            IG.UIServer._active[options.id] = window.open(options.url, options.id, popupFeatures);
        }
    });
    IG.provide('', {
        login: function (options) {
            IG.Auth.setSession(IG.Cookie.load());
            IG.load('/users/self').then(function () {}).catch(function (e) {
              IG.ui(IG.copy({
                  'display': 'popup',
                  'method': 'authorize'
              }, options || {}))
            });
        },
        logout: function () {
            IG.Auth.setSession();
        },
        load: function (url, params) {
          return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            var callbackName = 'igcb_'+Math.round(Math.random()*1000000+1000000);
            params = IG.copy({
              'access_token': IG._session.access_token,
              'callback': callbackName
            }, params || {});
            script.setAttribute('src', IG.getDomain('api')+url+'?'+IG.QS.encode(params));

            window[callbackName] = function (data) {
              this.resolved = true;
              resolve(data);
            }.bind(this);
            script.addEventListener('load', function () {
              script.parentNode.removeChild(script);
              delete window[callbackName];
            }.bind(this));
            script.addEventListener('error', function (e) {
              script.parentNode.removeChild(script);
              delete window[callbackName];
              reject(e);
            }.bind(this));

            document.head.appendChild(script);
          });
        }
    });
    IG.provide('Auth', {
        setSession: function (session, status) {
            var did_login = !IG._session && session,
                did_logout = IG._session && !session,
                session_changed = did_login || did_logout || (IG._session && session && IG._session.access_token !== session.access_token),
                status_changed = status !== IG._userStatus;

            var session_wrapper = {session: session, status: status};

            IG._session = session;
            IG._userStatus = status;

            if (session_changed && IG.Cookie.getEnabled()) {
                IG.Cookie.set(session, Date.now()+24*3600*1000);
            }

            if (status_changed) {
                IG.Event.fire('auth.statusChange', session_wrapper);
            }

            if (did_login) {
                IG.Event.fire('auth.login', session_wrapper);
            }

            if (did_logout) {
                IG.Event.fire('auth.logout', session_wrapper);
            }

            if (session_changed) {
                IG.Event.fire('auth.sessionChange', session_wrapper);
            }
        }
    });
    IG.provide('UIServer.Methods', {
        'authorize': {
            size: {
                width: 627,
                height: 326
            },
            url: IG.getDomain('https_com') + 'oauth/authorize/',
            transform: function (options) {
                if (!IG._client_id) {
                    IG.log('IG.login() called before claling IG.init().');
                    return;
                }

                if (options.params.scope) {
                    options.params.scope = options.params.scope.join('+');
                }

                IG.copy(options.params, {
                    response_type: 'token'
                });

                return options;
            }
        }
    });
    IG.provide('Cookie', {
        _domain: null,
        _enabled: false,
        setEnabled: function (enabled) {
            IG.Cookie._enabled = enabled;
        },
        getEnabled: function () {
            return IG.Cookie._enabled;
        },
        load: function () {
            var
              cookies = document.cookie
                .split('; ')
                .map(function (v) {return v.split(/^([^=]+)=\"(.+)\"$/)})
                .reduce(function (v, cv) {v[cv[1]] = IG.QS.decode(cv[2]); return v}, {});

            var value = null;
              if ('igs_'+IG._client_id in cookies) {
                value = cookies['igs_'+IG._client_id];
              }
            return value;
        },
        setRaw: function (value, timestamp, domain) {
            document.cookie = ['igs_', IG._client_id, '="', value, '"',
              (value && timestamp === 0 ? '' : '; expires='+new Date(timestamp).toGMTString()), '; path=/',
              (domain ? '; domain=.' + domain : '')].join('');
            IG.Cookie._domain = domain;
        },
        set: function (value) {
            if (value) {
                IG.Cookie.setRaw(IG.QS.encode(value), value.expires, value.base_domain);
            } else {
                IG.Cookie.clear();
            }
        },
        clear: function () {
            IG.Cookie.setRaw('', 0, IG.Cookie._domain);
        }
    });
    IG.provide('', {
        init: function (settings) {
            settings = IG.copy(settings || {}, {
                logging: false
            });

            IG._client_id = settings.client_id;
            IG._logging = settings.logging || (typeof settings.logging === 'undefined' && window.location.toString().indexOf('ig_debug=1') > 0);

            if (IG._client_id) {
                IG.Cookie.setEnabled(settings.cookie);
            }
        }
    });
}

if (window.location.hash) {
  var session = IG.QS.toObject(window.location.hash.replace('#', ''));
    if ('access_token' in session) {
      window.opener.IG.Auth.setSession(session);
      window.close();
    }
}