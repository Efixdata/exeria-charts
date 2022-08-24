/*globals _webrcp_platform_small_screen Blob FileReader _webrcp_historyManager_getInstance*/
/* exported WebRCPUtils*/

import { isSmallScreen } from "./environment";
import theme from "../themes/dexer";

export default function WebRCPUtils () {
  // UTLIS GET ISTANCE IS CALLED AFTER COMPONENTS ARE LOADED
  this.dateTimeFormatter = new DateTimeFormatter();
  this.assignColor = assignColor;
  this.getContrastColor = getContrastColor;
  this.openWindowWithUrl = openWindowWithUrl;
  this.colorManager = new ColorManager(theme, "dark");
  this.currencyFormatter = new CurrencyFormatter();
  this.textTransformer = new TextTransformer();
//   this.storage = new StorageUtils();
  this.getSelectedTags = getSelectedTags;
  this.getUsedTags = getUsedTags;
  this.inspectablePromise = inspectablePromise;
  this.getOrderOfMagnitude = getOrderOfMagnitude;
  this.getTagsFromText = getTagsFromText;
  this.marketDataManager = new MarketDataManager();
  this.fitCanvasToContainer = fitCanvasToContainer;
  this.getPriceFromTick = getPriceFromTick;
  this.isInstrumentOption = isInstrumentOption;
  this.isOrderActive = isOrderActive;
  this.isOrderWaiting = isOrderWaiting;
  this.csv = new CSVTool();
  this.pasteAsPlainText = pasteAsPlainText;
  this.roundPrice = roundPrice;
//   this.extractInstrumentDataSourceName = extractInstrumentDataSourceName;

//   _webrcp_historyManager_getInstance();

  function pasteAsPlainText(pasteEvent) {
      pasteEvent.preventDefault();
      const text = (pasteEvent.originalEvent || pasteEvent).clipboardData.getData('text/plain');
      document.execCommand("insertHTML", false, text);
  }

  function getOrderOfMagnitude (number) {
      if (number === 0 || number == null) {
          return 0;
      }
      var orderOfMagnitude = 0;
      while (number < 1) {
          number *= 10;
          ++orderOfMagnitude;
      }
      return orderOfMagnitude;
  };

  function roundPrice(price, step, precision) {
      if (!step) return price;

      const stepDifference = price % step;
  const previousValue = price - stepDifference;
      let roundedPrice = previousValue;
  
  if (stepDifference > step / 2) roundedPrice = previousValue + step;

      if (precision) return parseFloat(roundedPrice.toFixed(precision));
      else return roundedPrice;
  }

  function TextTransformer() {
      var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      //var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
      var urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/ig;
      var youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
      var gifRegex = /\.gif$/i;
      var imageRegex = /\.(jpg|gif|png|jpeg)$/i;
      var textarea = document.createElement("textarea");
      var maxSize = 150;
      var that = this;

      this.validateEmail = function(email) {
          return emailRegex.test(email);
      };

      this.linkify = function(text, size) {
          var textObject = replaceURL(text, function(match) {
              return createAnchorLinkObject(match);
          });
          return generateMultisizeTextObject(textObject.text, textObject.urlObjects, size);
      };

      this.linkifyAndEmbedMedia = function(text, size) {
          var textObject = replaceURL(text, function(match) {
              var youtubeElement = createYoutubeLinkObject(match);
              if(youtubeElement){
                  return youtubeElement;
              }
              var imageElement = createImageLinkObject(match);
              if(imageElement){
                  return imageElement;
              }
              else
                  return createAnchorLinkObject(match);
          });
          return generateMultisizeTextObject(textObject.text, textObject.urlObjects, size);
      };

      function replaceURL(text, onRegexMatch){
          var encodedText = encodeText(text);
          var textObject = {
              urlObjects: []
          };
          var match;
          while ((match = urlRegex.exec(encodedText)) != null) {
              textObject.urlObjects.push(onRegexMatch(match));
          }
          textObject.text = encodedText;
          return textObject;
      }

      this.getProxiedSmallImage = function (url) {
          if (url.match(gifRegex)) {
              return getProxiedImage(url);
          }
          else return "/images/480,fit/" + url;

      };

      function getProxiedImage (url) {
          return "/images/" + url;
      }

      function createImageLinkObject(match) {
          var url = getMatchUrl(match);
          if (url && url.match(imageRegex)) {
              var object = {};
              object.startIndex = match.index;
              object.endIndex = match.index + match[0].length;
              object.removeURL = true;
              object.startCode = '<img style="cursor: pointer" onclick="WEBRCP.utils.openWindowWithUrl(\'' + getProxiedImage(url) + '\')" class="webrcp-image" src="' + that.getProxiedSmallImage(url) + '" />';
              object.endCode = '';
              return object;
          } else {
              return null;
          }
      }

      function createYoutubeLinkObject(match) {
          var url = getMatchUrl(match);
          var youtubeRegexMatch = url.match(youtubeRegex);
          if (url && youtubeRegexMatch && youtubeRegexMatch[2].length === 11) {
              var object = {};
              object.startIndex = match.index;
              object.endIndex = match.index + match[0].length;
              object.removeURL = true;
              object.startCode = '<iframe allowfullscreen="allowfullscreen" mozallowfullscreen="mozallowfullscreen" msallowfullscreen="msallowfullscreen" oallowfullscreen="oallowfullscreen" webkitallowfullscreen="webkitallowfullscreen" class="webrcp-iframe" src="https://www.youtube.com/embed/' + youtubeRegexMatch[2] + '"></iframe>';
              object.endCode = '';
              return object;
          } else {
              return null;
          }
      }

      function createAnchorLinkObject(match) {
          var url = getMatchUrl(match);
          if(!url) return;
          var object = {};
          object.startIndex = match.index;
          object.endIndex = match.index + match[0].length;
          object.startCode = '<a class="webrcp-link" target="_blank" href="' + url + '">';
          object.endCode = '</a>';
          return object;
      }

      function getMatchUrl(match) {
          if (match[0].startsWith("http://") || match[0].startsWith("https://")) {
              return match[0];
          } else {
              return "http://" + match[0];
          }
      }

      function generateMultisizeTextObject(text, linkObjects, size) {
          if(!size) size = maxSize;
          return {
              text: generateLinkifiedText(text, linkObjects),
              shortText: generateShortLinkifiedText(text, linkObjects, size)
          };
      }

      function generateLinkifiedText(text, linkObjects) {
          var addedCharacters = 0;
          for(var i in linkObjects){
              var linkObject = linkObjects[i];
              text = insertText(text, linkObject.startIndex + addedCharacters, linkObject.startCode);
              addedCharacters += linkObject.startCode.length;

              if(linkObject.removeURL){
                  text = removeText(text, linkObject.startIndex + addedCharacters, linkObject.endIndex + addedCharacters);
                  addedCharacters += linkObject.startIndex - linkObject.endIndex;
              }
              else{
                  text = insertText(text, linkObject.endIndex + addedCharacters, linkObject.endCode);
                  addedCharacters += linkObject.endCode.length;
              }
          }
          return text;
      }

      function generateShortLinkifiedText(text, linkObjects, maxSize) {
          var addedCharacters = 0;
          if(text.length > maxSize){
              text = text.slice(0, maxSize);
              text += "&hellip; ";
          }
          for(var i in linkObjects){
              var linkObject = linkObjects[i];
             
              if (linkObject.startIndex >= maxSize) break;
              text = insertText(text, linkObject.startIndex + addedCharacters, linkObject.startCode);
              addedCharacters += linkObject.startCode.length;

              if(linkObject.removeURL){
                  text = removeText(text, linkObject.startIndex + addedCharacters, linkObject.endIndex + addedCharacters);
                  addedCharacters += linkObject.startIndex - linkObject.endIndex;
              }
              else{
                  var endIndex;
                  if (linkObject.endIndex >= maxSize) {
                      endIndex = maxSize + addedCharacters;
                  } else {
                      endIndex = linkObject.endIndex + addedCharacters;
                  }
                  text = insertText(text, endIndex, linkObject.endCode);
                  addedCharacters += linkObject.endCode.length;
              }
          }
          return text;
      }

      function removeText(text, startIndex, endIndex) {
          return text.slice(0, startIndex) + "" + text.slice(endIndex);
      }

      function insertText(str, index, value) {
          return str.substr(0, index) + value + str.substr(index);
      }

      function encodeText(str) {
          textarea.innerHTML = str;
          return textarea.innerHTML;
      }
  };

//   function StorageUtils() {
//       this.download = function () {
//           var {data, user, storage} = WEBRCP.getUserStorage();
//           var json = JSON.stringify(data);
//           var file = new Blob([json], {type: 'text/json'});
//           var a = document.createElement('a');
//           a.href = URL.createObjectURL(file);
//           function pad2(n) { return n < 10 ? '0' + n : n; }
//           var date = new Date();
//           var time = date.getFullYear().toString() + pad2(date.getMonth() + 1) + pad2(date.getDate()) + pad2(date.getHours()) + pad2(date.getMinutes()) + pad2(date.getSeconds());
//           a.download = `localstorage-${user}-${storage}-${time}.json`;
//           a.click();
//       };

//       this.upload = function () {
//           var input = document.createElement('input');
//           input.type = 'file';
//           input.click();

//           input.onchange = (event) => {
//               var file = event.target.files[0];
//               console.log('Loaded: ', file.name);
//               var reader = new FileReader();
//               reader.onload = (event) => {
//                   var json = event.target.result;
//                   var model = JSON.parse(json);
//                   if(model.version < 4){
//                       WEBRCP.storage.storage = model;
//                       WEBRCP.storage.storage.id = WEBRCP.getUser();
//                       WEBRCP.storage.version = model.version;
//                   }else{
//                       WEBRCP.storage.storage = model;
//                       WEBRCP.storage.storage.id = WEBRCP.getStorageId();
//                   }

//                   WEBRCP.storage.save()
//                       .then(() => WEBRCP.restoreUI());

//                   console.log(`Storage loaded from ${file.name}. Will refresh in a while...`);
//                   setTimeout(() => location.reload(), 3000);
//               };
//               reader.readAsText(file, 'UTF-8');
//           };

//           console.log(input.form);
//       };
//   };

  function openWindowWithUrl(url) {
      var dialog = $('<div></div>').addClass('webrcp-fullscreen-dialog');
      var content = $('<img>').attr('src', url);
      var actions = [
          {
      myClass: (isSmallScreen()) ? "webrcp-icon-arrow_back webrcp-dark-black webrcp-light-black webrcp-icon-arrow_back__light--bgc" : "webrcp-icon-close webrcp-dark-black webrcp-light-black webrcp-icon-close--light-bgc",
      title: '',
      onKey: 27,
      callback: function(e) {
                  e.stopPropagation();
        dialog.rcpDialog('dismiss');
      }
    }
      ];
      
      dialog.on('click', function() {
          dialog.rcpDialog('dismiss');
      });

      content.on('click', function(e) {
          e.stopPropagation();
          this.classList.toggle('webrcp-fullscreen-dialog__image--expanded');
      });

      dialog.rcpDialog({
              content: content,
              actions: actions
          }).rcpDialog('showDialog');
  }

  function ColorManager(theme, variant) {
      this.theme = theme;
      this.variant = variant || "dark";

      this.images = {
          exeriaWatermark: {light: "exeria_watermark.png", dark: "exeria_watermark_white.png"}
      };

      this.hexToRGB = function(hex, alpha) {
          var r = parseInt(hex.slice(1, 3), 16);
          var g = parseInt(hex.slice(3, 5), 16);
          var b = parseInt(hex.slice(5, 7), 16);

          if (alpha) {
              return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
          } else {
              return "rgb(" + r + ", " + g + ", " + b + ")";
          }
      };

      this.getColor = function(colorName){
          if (colorName.indexOf('#') > -1 || colorName.indexOf('rgb') > -1 || colorName.indexOf('RGB') > -1) return colorName;

          if(this.bw){
              var color = this.theme.colors[colorName].bw;
              if(color != null)
                  return color;
          }
          if (this.variant === 'light') {
              return this.theme.colors[colorName].light;
          }
          else
              return this.theme.colors[colorName].dark;
      }.bind(this);

      this.getFont = function(key){
        if (key.indexOf('#') > -1 || key.indexOf('rgb') > -1 || key.indexOf('RGB') > -1) return key;

        if(this.bw){
            var color = this.theme.fonts[key].bw;
            if(color != null)
                return color;
        }
        if (this.variant === 'light') {
            return this.theme.fonts[key].light;
        }
        else
            return this.theme.fonts[key].dark;
    }.bind(this);

      this.getImage = function(imageName){
          if (this.theme === 'light') {
              return this.images[imageName].light;
          }
          else
              return this.images[imageName].dark;
      };
  };

  function DateTimeFormatter() {
      var defaultDateSeparator = '-';
      var defaultTimeSeparator = ':';

    //   var timeagoInstance = timeago();

      this.stamp = function (stamp) { return new StampFormatter(stamp); };
      this.date = function (date) { return new DateFormatter(date); };

      var DateFormatter = function (date) {
          this.toDateTime = function (timeSeparator, dateSeparator) { return formatDateTime(date, timeSeparator, dateSeparator); };
          this.toDateTimeString = function (timeSeparator, dateSeparator) {
              var formatted = formatDateTime(date, timeSeparator, dateSeparator);
              return formatted.date + ' ' + formatted.time;
          };
          this.toTime = function (timeSeparator) { return formatTime(date, timeSeparator); };
          this.toDate = function (dateSeparator) { return formatDate(date, dateSeparator); };
      };

      var StampFormatter = function (stamp) {
          var date = new Date(stamp);
          this.toDateTime = function (timeSeparator, dateSeparator) { return formatDateTime(date, timeSeparator, dateSeparator); };
          this.toDateTimeString = function (timeSeparator, dateSeparator) {
              var formatted = formatDateTime(date, timeSeparator, dateSeparator);
              return formatted.date + ' ' + formatted.time;
          };
          this.toTime = function (timeSeparator) { return formatTime(date, timeSeparator); };
          this.toDate = function (dateSeparator) { return formatDate(date, dateSeparator); };
      };

    //   this.getTimeago = function(stamp) {
    //       return timeagoInstance.format(stamp, WEBRCP.platformManifest.LocaleSettings.locale);
    //   };

    //   this.renderInTimeago = function(element, datetime) {
    //       element.attr("datetime", datetime);
    //       timeagoInstance.render(element, WEBRCP.platformManifest.LocaleSettings.locale);
    //   };

      function formatDateTime (date, timeSeparator, dateSeparator) {
          return {
              date: formatDate(date, dateSeparator),
              time: formatTime(date, timeSeparator)
          };
      }

      function formatTime (date, customSeparator) {
          var separator = customSeparator || defaultTimeSeparator;
          return '' + padded(date.getHours(), 2) + separator + padded(date.getMinutes(), 2) + separator + padded(date.getSeconds(), 2);
      }

      function formatDate (date, customSeparator) {
          var separator = customSeparator || defaultDateSeparator;
          return '' + date.getFullYear() + separator + padded(date.getMonth() + 1, 2) + separator + padded(date.getDate(), 2);
      }

      function padded(num, size) {
          var s = '' + num;
          while (s.length < size) s = '0' + s;
          return s;
      }
  };

  function assignColor(text) {
      var letter = text ? text[0].toLowerCase() : ' ';
      var colors = {
              a: '#F44336',
              b: '#E91E63',
              c: '#9C27B0',
              d: '#673AB7',
              e: '#3F51B5',
              f: '#2196F3',
              g: '#03A9F4',
              h: '#00BCD4',
              i: '#009688',
              j: '#4CAF50',
              k: '#8BC34A',
              l: '#CDDC39',
              m: '#FFC107',
              n: '#FF9800',
              o: '#FF5722',
              p: '#795548',
              q: '#9E9E9E',
              r: '#F44336',
              s: '#E91E63',
              t: '#9C27B0',
              u: '#673AB7',
              v: '#3F51B5',
              w: '#2196F3',
              x: '#03A9F4',
              y: '#00BCD4',
              z: '#009688',
              ' ': '#009688'
          };

      var color = colors[letter] ? colors[letter] : '#00BCD4';
      return color;
  };

  function getContrastColor(color, dark, light) {
      var convertToRGB = function(color) {
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
          return result ? {r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)} : [0, 0, 0];
      };
      var rgb;
      if (color.indexOf('#') === -1) 	{ rgb = color.replace('rgb(', '').replace(')', '').split(','); }
      else 							{ rgb = convertToRGB(color); }

      var sum = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;

      if (sum >= 135) return dark || '#424242';
      else return light || '#ffffff';
  };

  this.getMessages = function(locale) {
      return new Messages(locale);
  };

  var MISSING_LOCALES = {};
  function Messages(locale){
      this.locale = locale;

      //dla zgodności poprzednią wersją lokalizacji
      //umożliwia bezpośrednie pobranie klucza
      for (var k in locale) {
          this[k] = locale[k];
      }

      this.getMessage = function(key, defaultMsg, emptyAllowed = true){
          if (locale && locale[key]) {
              return this.locale[key];
          } else if (defaultMsg) {
              if (!emptyAllowed) {
                  console.error("No locale", this.locale, key);
                  saveEmptyLocale(key, defaultMsg);
              }
              return defaultMsg;
          } else {
              if (!emptyAllowed) {
                  console.error("No locale", this.locale, key);
                  saveEmptyLocale(key, defaultMsg);
              }
              return "NO LOCALE[" + key + "]!";
          }
      };

      function saveEmptyLocale(key, defaultMsg){
          MISSING_LOCALES[key] = defaultMsg;
          console.log("EMPTY_LOCALES", JSON.stringify(MISSING_LOCALES));
      }
  };

  function CurrencyFormatter() {
      this.format = function(string) {
          return string.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              currencyDisplay: 'symbol',
              minimumFractionDigits: 2
          });
      };
  };

  this.getErrorMessage = function (locale, res) {
      let text = res.status;

      if (res.status === 401) {
          text = locale.getMessage("unauthorized_error_message", "Unauthorized");
      } else if (res.data) {
          text = locale.getMessage(res.data.errorKey, res.data.message);
      } else if (res.responseJSON && res.responseJSON.data && typeof res.responseJSON.data.message === 'string') {
          text = locale.getMessage(res.responseJSON.data.message, res.responseJSON.data.message);
      }

      return text;
  };

  /**
   * https://ourcodeworld.com/articles/read/317/how-to-check-if-a-javascript-promise-has-been-fulfilled-rejected-or-resolved
   *
   * This function allow you to modify a JS Promise by adding some status properties.
   * Based on: http://stackoverflow.com/questions/21485545/is-there-a-way-to-tell-if-an-es6-promise-is-fulfilled-rejected-resolved
   * But modified according to the specs of promises : https://promisesaplus.com/
   */
  function inspectablePromise(promise) {
      // Don't modify any promise that has been already modified.
      if (promise.isResolved) return promise;

      // Set initial state
      var isPending = true;
      var isRejected = false;
      var isFulfilled = false;
      var value;

      // Observe the promise, saving the fulfillment in a closure scope.
      var result = promise.then(
          function(v) {
              isFulfilled = true;
              isPending = false;
              value = v;
              return v;
          },
          function(e) {
              isRejected = true;
              isPending = false;
              throw e;
          }
      );

      result.isFulfilled = function() { return isFulfilled; };
      result.isPending = function() { return isPending; };
      result.isRejected = function() { return isRejected; };
      result.getValue = function() { return value; };

      var unsubscribeFn = function () {
          if (result.isFulfilled() && !!result.getValue()) {
              result.getValue().unsubscribe();
    } else {
              console.log("Promise not fulfilled. Unable to unsubscribe");
    }
  };
  return {
    unsubscribe: unsubscribeFn
  };
  }

  function getTagsFromText (contents) {
      var tags = [];
      const hashtag = /#[^\s]+/g;
      Object.values(contents).forEach((content) => {
          if(content.description && content.description.trim().length > 1){
              var descTags = content.description.match(hashtag) || [];
              tags = tags.concat(descTags);
          }
          if(content.title && content.title.trim().length > 1){
              var titleTags = content.title.match(hashtag) || [];
              tags = tags.concat(titleTags);
          }
      });

      for (var i = 0, length = tags.length; i < length; i++) {
          tags[i] = tags[i].replace('#', '').trim();
      }
      return tags;
  }

  function MarketDataManager() {
      this.check = function (instruments, onSuccess, onError, quickhide, replacementInfo) {
          const transformToReplacedInstruments = (fetchedInstruments) => {
              let transformed = false;
              for (const i in fetchedInstruments) {
                  if (fetchedInstruments[i].error) {
                      fetchedInstruments[i] = null;
                      transformed = true;
                  }
              }
              return transformed;
          };

          SERVICES.datasource.getMixedBrokerInstruments(instruments)
              .then((newInstruments) => {          
                  if (transformToReplacedInstruments(newInstruments)) {
                      this.showReplaceInstrumentsDialog(this.extractInstrumentsSymbols(instruments), newInstruments, onSuccess, onError, quickhide);
                  } else {
                      onSuccess(this.transformInstruments(newInstruments));
                  }
              })
              .catch(() => {
                  this.showReplaceInstrumentsDialog(this.extractInstrumentsSymbols(instruments), [], onSuccess, onError, quickhide, replacementInfo);
              });
      };

      this.checkChartModel = function (originalModel, onSuccess, onError) {
          const model = JSON.parse(JSON.stringify(originalModel));
          const instruments = this.extractInstrumentsFromSeries(model.instrumentsSeries);
          this.check(
              instruments,
              function (newInstruments) {
                  model.interval = this.getInstrumentsBestMatchingInterval(model.interval, newInstruments);
                  this.replaceInstrumentsInSeries(model.instrumentsSeries, newInstruments, model.interval);
                  onSuccess(model);
              }.bind(this),
              onError
          );
      };

      this.checkStrategyModel = function (originalModel, onSuccess, onError) {
          const model = JSON.parse(JSON.stringify(originalModel));
          const instruments = this.extractInstrumentsFromSeries(model.series);
          this.check(
              instruments,
              function (newInstruments) {
                  const interval = this.getInstrumentsBestMatchingInterval(model.series[0].interval, newInstruments);
                  this.replaceInstrumentsInSeries(model.series, newInstruments, interval);
                  onSuccess(model);
              }.bind(this),
              onError
          );
      };

      this.checkTesterModel = function (originalModel, onSuccess, onError) {
          const model = JSON.parse(JSON.stringify(originalModel));
          const instruments = {};
          for (const key in model.strategies) {
              const strategy = model.strategies[key];
              const seriesInstruments = this.extractInstrumentsFromSeries(strategy.fusion.instrumentsSeries);
              for (const instrumentId in seriesInstruments) {
                  instruments[instrumentId] = seriesInstruments[instrumentId];
              }
          }

          this.check(
              instruments,
              (newInstruments) => {
                  for (const key in model.strategies) {
                      const strategy = model.strategies[key];
                      const interval = this.getInstrumentsBestMatchingInterval(strategy.interval, newInstruments);
                      strategy.interval = interval;
                      strategy.fusion.interval = interval;
                      this.replaceInstrumentsInSeries(strategy.fusion.instrumentsSeries, newInstruments, strategy.interval);
                  }
                  onSuccess(model);
              },
              onError
          );
      };

      this.checkPortfolioModel = function (originalModel, onSuccess, onError) {
          const model = JSON.parse(JSON.stringify(originalModel));
          const instruments = {};
          for (const key in model.strategies) {
              const strategy = model.strategies[key];
              const seriesInstruments = this.extractInstrumentsFromSeries(strategy.series);
              for (const instrumentId in seriesInstruments) {
                  instruments[instrumentId] = seriesInstruments[instrumentId];
              }
          }

          this.check(
              instruments,
              (newInstruments) => {
                  for (const strategyKey in model.strategies) {
                      const strategy = model.strategies[strategyKey];
                      strategy.interval = this.getInstrumentsBestMatchingInterval(strategy.interval, newInstruments);
                      this.replaceInstrumentsInSeries(strategy.series, newInstruments, strategy.interval);
                  }
                  onSuccess(model);
              },
              onError
          );
      };

    //   this.checkTradeModel = function (originalModel, onSuccess, onError) {
    //       const model = JSON.parse(JSON.stringify(originalModel));

    //       const instruments = {
    //           [model.order.instrument.id]: model.order.instrument
    //       };

    //       this.check(
    //           instruments,
    //           onCheck,
    //           onError,
    //           true,
    //           WEBRCP.locale.fusion.getMessage("instruments_unavailable_message_trade")
    //       );

    //       async function onCheck(newInstruments) {
    //           model.order.instrument = newInstruments[model.order.instrument.id];

    //           const order = model.order;
    //           const classification = order.classification || 'DEFAULT';
    //           const tradeRequest = await SERVICES.trading.getTradeRequestModel(order.instrument, 'CREATE');
    //           const tradeModel = tradeRequest.orders.get(classification);

    //           tradeRequest.orders = new Map([
    //               [classification, tradeRequest.orders.get(classification)]
    //           ]); // FIXME! ASK FOR SPECIFIC MODEL
              

    //           const trade = Object.keys(tradeModel)
    //               .reduce((result, key) => {
    //                   let orderKey = key;

    //                   switch (key) {
    //                       case 'quantity':
    //                           orderKey = 'amount';
    //                           break;
    //                       case 'limitPrice':
    //                           if (order.triggerPrice) {
    //                               result.type = 'LIMIT';
    //                               orderKey = 'triggerPrice';
    //                           }
    //                           break;
    //                       default:
    //                           orderKey = key;
    //                   }

    //                   return Object.assign({
    //                       [key]: order[orderKey] || order[key]
    //                   }, result);
    //               }, {});

    //           onSuccess(trade, tradeRequest);
    //       }
    //   };

    //   this.checkWatchlistModel = function (originalModel, onSuccess, onError) {
    //       const model = JSON.parse(JSON.stringify(originalModel));
    //       this.check(
    //           this.transformInstruments(model.instruments),
    //           function (newInstruments) {
    //               for (const i in model.instruments) {
    //                   model.instruments[i] = newInstruments[model.instruments[i].id];
    //               }
    //               onSuccess(model);
    //           },
    //           onError
    //       );
    //   };

    //   this.checkTilechartModel = function (originalModel, onSuccess, onError) {
    //       const model = JSON.parse(JSON.stringify(originalModel));
    //       let instruments = {};
    //       for (const tileId in model.tiles) {
    //           const seriesInstruments = this.extractInstrumentsFromSeries(model.tiles[tileId].fusion.instrumentsSeries);
    //           for (const instrumentId in seriesInstruments) {
    //               instruments[instrumentId] = seriesInstruments[instrumentId];
    //           }
    //       }
    //       this.check(
    //           instruments,
    //           (newInstruments) => {
    //               for (let tileId in model.tiles) {
    //                   const tile = model.tiles[tileId];
    //                   tile.fusion.interval = this.getInstrumentsBestMatchingInterval(tile.fusion.instrumentsSeries[0].interval, newInstruments);
    //                   this.replaceInstrumentsInSeries(tile.fusion.instrumentsSeries, newInstruments, tile.fusion.interval);
    //               }
    //               onSuccess(model);
    //           },
    //           onError
    //       );
    //   };

      this.extractInstrumentsSymbols = function (instruments) {
          const symbols = {};
          for (const i in instruments) {
              symbols[instruments[i].id] = instruments[i].symbol;
          }

          return symbols;
      };

      this.extractInstrumentsAvailableIntervals = function (instruments) {
          const availableIntervals = [];
          for (const i in instruments) {
              availableIntervals.push(instruments[i].availableIntervals);
          }
          return availableIntervals;
      };

      this.extractInstrumentsFromSeries = function (series) {
          const instruments = {};
          series.forEach(singleSeries => {
              instruments[singleSeries.instrument.id] = singleSeries.instrument;
          });
          return instruments;
      };

      this.getInstrumentsBestMatchingInterval = function (interval, instruments) {
          const availableIntervalsArray = this.extractInstrumentsAvailableIntervals(instruments);
          const commonIntervals = this.getCommonIntervals(availableIntervalsArray);
          return this.getBestMatchingInterval(interval, commonIntervals);
      };

      this.replaceInstrumentsInSeries = function (series, newInstruments, interval) {
          for (const k in series) {
              const newInstrument = newInstruments[series[k].instrument.id];
              if (!newInstrument) throw new Error("instrument undefined");
              
              series[k].instrument = newInstrument;
              series[k].title = newInstrument.name;
              if (interval) {
                  series[k].interval = interval;
              }
          }
      };

      this.transformInstruments = function (instrumentsArray) {
          const instrumentsObject = {};
          for (const key in instrumentsArray) {
              instrumentsObject[instrumentsArray[key].id] = instrumentsArray[key];
          }
          return instrumentsObject;
      };

    //   this.showReplaceInstrumentsDialog = function (instruments, replacedInstruments, onInstrumentsReplaced, onCancel, quickhide, replacementInfo) {
    //       const dialog = $('<div></div>');
    //       const content = $('<div></div>')
    //           .addClass("webrcp-padded-dialog-content")
    //           .instrumentsReplacementContent({
    //               instruments,
    //               parentDialog: dialog,
    //               replacedInstruments,
    //               onAllInstrumentsReplaced: function () {
    //                   actions[2].disabled = false;
    //                   dialog.rcpDialog('option', "actions", actions);
    //               },
    //               description: replacementInfo
    //           });

    //       const myClass = "webrcp-dark-white webrcp-light-white ";
    //       const actions = [
    //           {
    //               myClass: (_webrcp_platform_small_screen) ? myClass + "webrcp-icon-arrow_back" : myClass + "webrcp-icon-close",
    //               title: '',
    //               onKey: 27,
    //               callback: function () {
    //                   this.dismiss();
    //                   if (onCancel) onCancel();
    //               }
    //           },
    //           {
    //               title: WEBRCP.locale.fusion.getMessage("Cancel", "Cancel"),
    //               onKey: 27,
    //               callback: function () {
    //                   this.dismiss();
    //                   if (onCancel) onCancel();
    //               }
    //           },
    //           {
    //               title: WEBRCP.locale.fusion.getMessage("OK", "OK"),
    //               callback: function () {
    //                   if (onInstrumentsReplaced) {
    //                       const replacedInstruments = content.instrumentsReplacementContent("getReplacedInstruments");
    //                       this.dismiss(quickhide);
    //                       onInstrumentsReplaced(replacedInstruments);
    //                   } else {
    //                       this.dismiss(quickhide);
    //                   }  
    //               },
    //               onKey: 13,
    //               disabled: true
    //           }
    //       ];

          
    //       dialog
    //           .addClass('webrcp-replace-instrument-dialog')
    //           .rcpDialog({
    //               title: WEBRCP.locale.fusion.getMessage("instruments_not_found", "Instruments not found"),
    //               actions: actions,
    //               content: content,
    //               onShown: function () {
    //                   if (content.height() > $(window).height() * 0.8) {
    //                       content.parent().css("overflow-y", "scroll");
    //                   }
    //               }
    //           });
    //       dialog.rcpDialog('showDialog');
    //   };

      this.getAvailableInterval = function (defaultInterval, availableIntervals) {
          let interval;

          for (let i in availableIntervals) {
              if (defaultInterval === availableIntervals[i].symbol) {
                  interval = availableIntervals[i].symbol;
                  break;
              }
          }

          return interval || availableIntervals[0].symbol;
      };

      this.getAllAvailableIntervals = function(intervals, series) {
          if (series) {
              intervals = [];
              for (let s in series) { if (series[s].instrument) intervals.push(series[s].instrument.availableIntervals); }
          }

          let availableIntervals = intervals[0];

          if (intervals.length === 1) return availableIntervals;

          for (let i = 1; i < intervals.length; i++) {
              availableIntervals = intervals[i].filter((interval) => {
                  for (let j in availableIntervals) {
                      if (interval.symbol === availableIntervals[j].symbol) return true;
                  }
                  return false;
              });
          }

          return availableIntervals;
      };

      this.getCommonIntervals = function (availableIntervalsArray) {
          if (availableIntervalsArray.length === 0) throw new Error("No available intervals");
          else if (availableIntervalsArray.length === 1) return availableIntervalsArray[0];

          const commonIntervals = [];
          const availableIntervals = availableIntervalsArray[0];

          const isCommonInterval = (interval) => {
              for (let i = 1; i < availableIntervalsArray.length; ++i) {
                  const intervals = availableIntervalsArray[i];

                  if (!intervalsIncludeInterval(intervals, interval)) {
                      return false;
                  }
              }
              return true;
          };

          const intervalsIncludeInterval = (intervals, expectedInterval) => {
              for (const interval of intervals) {
                  if (interval.symbol === expectedInterval.symbol)
                      return true;
              }
              return false;
          };

          for (const interval of availableIntervals) {
              if (isCommonInterval(interval)) {
                  commonIntervals.push(interval);
              }
          }

          return commonIntervals;
      };

      this.getBestMatchingInterval = function (originalInterval, availableIntervals) {
          if (availableIntervals.length === 0) throw new Error("No intervals available for the instrument");
          if (!originalInterval) return availableIntervals[0];

          const bestDelta = availableIntervals
              .filter(interval => interval.milis > 0)
              .map((interval, index) => {
                  return {
                      index: index,
                      value: Math.abs(originalInterval.milis - interval.milis)
                  };
              })
              .sort((deltaA, deltaB) => deltaA.value - deltaB.value)
              .slice(0, 1);
          return availableIntervals[bestDelta[0].index];
      };
  };

  function getPriceFromTick(tick, priceSide) {
      if (priceSide === 'ASK' && tick.ask) return tick.ask;
      if (tick.bid) return tick.bid;
      else if (tick.price) return tick.price;
      throw new Error('Both price and bid are not available');
  }

  function isInstrumentOption(instrument) {
      if (instrument.optionExpiration) {
          return true;
      } else {
          return false;
      }
  }

  function isOrderActive(order) {
      return order.status === 'PENDING' ||
          order.status === 'OPEN' || 
          order.status === 'PARTIALLY_FILLED';
  }

  function isOrderWaiting(order) {
      return order.status === 'HELD' ||
          order.status === 'PENDING';
  }

  function CSVTool() {
      this.downloadCSV = function (data, fileName) {
          const csvFile = this.prepareCSV(data);
          const blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
          
          if (navigator.msSaveBlob) { // IE 10+
              navigator.msSaveBlob(blob, fileName);
          } else {
              var link = document.createElement("a");
              if (link.download !== undefined) { // feature detection
                  // Browsers that support HTML5 download attribute
                  const url = URL.createObjectURL(blob);
                  link.setAttribute("href", url);
                  link.setAttribute("download", fileName);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
              }
          }
      };

      this.prepareCSV = function (data) {
          let csvContent = "";
          data.forEach(function (rowArray) {
              let row = rowArray.join(",");
              csvContent += row + "\r\n";
          });
          return csvContent;
      };
  };
};

var getSelectedTags = function (tagSettings) {
  var selectedTags = [];
  for (var t in tagSettings) {
      if (tagSettings[t]) selectedTags.push(t);
  }
  return selectedTags;
};

var getUsedTags = function(allowedTags) {
  var usedTagInfo = {};
  for (var t in allowedTags) {
      usedTagInfo[allowedTags[t]] = false;
  }
  return usedTagInfo;
};

var removeDoubleSlash = function (url) {
  return url.replace(/([^:]\/)\/+/g, "$1");
};

function fitCanvasToContainer(canvas, parent) {
  if(canvas.style.position !== 'absolute')
      canvas.style.position = 'absolute';
  
  if(canvas.style.top !== 0 || canvas.style.left !== 0){
      canvas.style.top = 0;
      canvas.style.left = 0;
  }
  
  if(canvas.width !== parent.width()){
      canvas.setAttribute('width', parent.width() + 'px');
      canvas.width = parent.width();
  }

  if(canvas.height !== parent.height()){
      canvas.setAttribute('height', parent.height() + 'px');
      canvas.height = parent.height(); 
  }
}

// function extractInstrumentDataSourceName(instrument) {
//   const brokers = WEBRCP.locale.fusion.getMessage('brokers');
  
//   if (instrument.broker) {
//       if (instrument.broker && brokers[instrument.broker]) return brokers[instrument.broker];
//       return instrument.broker;
//   }

//   if (instrument.dataSource) {
//       if (instrument.dataSource.id && brokers[instrument.dataSource.id]) return brokers[instrument.dataSource.id];
//       if (instrument.dataSource.name) return instrument.dataSource.name;
//   }

//   return "Unknown";

// }

//# sourceURL=./platform/core/js/webrcp.utils.js
