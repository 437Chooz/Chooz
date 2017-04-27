/*
  helper function to decode error message for
  login from Facebook, Google, and our login page

  @params object error
*/
var displayError = function (error) {
  var message = "An error has occurred. Please try again.";

  if (error.hasOwnProperty('message')) {
    message = error.message;
  }

  return message;
}

var login = function () {
  console.log('login fn');
  var id = document.getElementById('log_id').value;
  var password = document.getElementById('log_password').value;
  console.log('log_id: ' + id);
  console.log('log_password: ' + password);

  // Sign in
  firebase.auth().signInWithEmailAndPassword(id, password)
    .then(function (user) {
      document.querySelector('#myNav').pushPage('location.html', { data: { title: 'Location' } });
    })
    .catch(function (error) {
      document.getElementById("error").innerHTML = displayError(error);
    });
};

var facebookLogin = function () {
  console.log('clicking facebook login');
  var provider = new firebase.auth.FacebookAuthProvider();

  firebase.auth().signInWithPopup(provider)
    .then(function (result) {
      // This gives you a Facebook Access Token. You can use it to access the Facebook API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      document.querySelector('#myNav').pushPage('location.html', { data: { title: 'Location' } });
    }).catch(function (error) {
      document.getElementById("error").innerHTML = displayError(error);
    });
}

var googleLogin = function () {
  console.log('clicking google login');
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(function (result) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      document.querySelector('#myNav').pushPage('location.html', { data: { title: 'Location' } });
    }).catch(function (error) {
      document.getElementById("error").innerHTML = displayError(error);
    });
}

var anonLogin = function () {
  console.log('anonLogin fn');
  firebase.auth().signInAnonymously().catch(function (error) {
    console.log('errorCode: ' + errorCode);
    console.log('errorMessgae: ' + errorMessage);
    document.getElementById("error").innerHTML = displayError(error);
  });

};

var register = function () {
  console.log('register fn');
  var id = document.getElementById('reg_id').value;
  var password = document.getElementById('reg_password').value;
  var re_password = document.getElementById('reg_re_password').value;
  console.log('id: ' + id);
  console.log('password: ' + password);
  console.log('re_password: ' + re_password);

  var error_msg = document.getElementById('reg_error_msg');

  if (password == re_password) {
    const auth = firebase.auth();
    // Sign in
    const promise = auth.createUserWithEmailAndPassword(id, password);
    promise.catch(e => console.log(e.message));
    error_msg.color = "#badcef";
    console.log('promise done');

    document.querySelector('#myNav').pushPage('location.html', { data: { title: 'Location' } });
  } else {
    error_msg.color = "#ff0000";
  }
};

function resetPassword() {

var user = firebase.auth().currentUser;
var newPassword = getASecureRandomPassword();

user.updatePassword(newPassword).then(function() {
  // Update successful.
}, function(error) {
  // An error happened.
});

}

function setting() {
  currentUser = firebase.auth().currentUser;
  
  var email = document.getElementById('email');
  var settings_tip = document.getElementById('settings_tip');
  var settings_budget = document.getElementById('settings_budget');
  var settings_zipcode = document.getElementById('settings_zipcode');

  settings_tip.innerHTML = tip+"%";
  settings_budget.innerHTML = "$"+budget;
  settings_zipcode.innerHTML = zipcode;

  if (currentUser === undefined || currentUser == null) {
    // didn't log in
    email.innerHTML = "N/A";
  } else {

    firebase.database().ref('/users/' + currentUser.uid).once('value').then(function(snapshot) {
      data = snapshot.val();

      var settings_mid = document.getElementById("settingMid");

      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          var order_date = data[key];

          var p = document.createElement('p');
          p.className = "pastOrder";
          var st = document.createElement('strong');
          st.innerHTML = key;
          p.appendChild(st);
          settings_mid.appendChild(p);

          var list = document.createElement('ons-list');

          for (var order_key in order_date) {
            if (order_date.hasOwnProperty(order_key)) {

              var order = order_date[order_key];
              var menus = order["orders"];
              var name = order["name"];

              var restaurant_header = document.createElement('ons-list-header');
              restaurant_header.innerText = name;

              list.appendChild(restaurant_header);

              for (var i=0; i<menus.length; i++) {
                var menu_item = document.createElement('ons-list-item');
                var html_text = "<div class='center'>" + menus[i]["menu"] + "</div><div class='right'>" + menus[i]["price"] + "</div>"
                menu_item.innerHTML = html_text;
                list.appendChild(menu_item);
              }
            }
          }

          settings_mid.appendChild(list);
        }
      }
    });

    email.innerHTML = currentUser.email;
  }
}

function logOut() {
  firebase.auth().signOut().then(function() {
  // Sign-out successful.
}).catch(function(error) {
  // An error happened.
});
}

/*
  get zipcode, tip, and budget amount
  from user input, and do calculations
  based on determined sales tax
*/
var tipNbudget = function () {
  console.log('tip n budget function');
  // Location();
  tip = document.getElementById('tip').value;
  budget = document.getElementById('budget').value;
  console.log("tip&budget: " + tip + " " + budget);
  zipcode = document.getElementById('zipcode');
  var locationOff = document.body.contains(zipcode);
  var salesTax = 0;

  if (!locationOff) {
    console.log('user enabled location services');

    getZipcode(function (res) {
      /* 
        use a callback function so that
        this function does not go on until
        response returned
      */
      zipcode = res.long_name;
      salesTax = getSalesTax(res.long_name);
    });
  } else {
    salesTax = getSalesTax(zipcode.value);
  }

  console.log('salestax', salesTax);

};

/*
  helper function called in tipNbudget()
  to get sales tax based on zipcode

  @params - String zipcode
*/
var getSalesTax = function (zipcode) {
  console.log('get sales tax function');
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      salesdata = JSON.parse(this.responseText);
      tax = parseFloat(salesdata.charAt(18) + salesdata.charAt(19) + salesdata.charAt(20) + salesdata.charAt(21) + salesdata.charAt(22));
      console.log(tax);
      console.log(salesdata);
      return tax;
    }
  });

  var url = "/tax?zipcode=" + zipcode;

  xhr.open("GET", url);
  xhr.setRequestHeader("cache-control", "no-cache");
  xhr.send();
}

/*
  helper function called in tipNbudget()
  to use reverse geolocation to get zipcode
  if user has enabled location services

  @params - function callback
*/
var getZipcode = function (callback) {
  var geocoder = new google.maps.Geocoder;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      // console.log(position.address.postalCode);
      console.log(position);
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      geocoder.geocode({ 'location': pos }, function (result, status) {
        if (status === 'OK') {
          if (result[0]) {
            let postalCode = result[0].address_components.find(function (component) {
              return component.types[0] == "postal_code";
            });
            callback(postalCode);
          }
        }
      });
    });
  }
}

// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.

var map;
var venues = [];
var venue_dict = {};
var menu_dict = {};

var initMap = function (enabled) {
  // if (!bool) return;
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 15
  });
  map.setOptions({
    styles: [
      {
        featureType: 'poi.business',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      }
    ]
  });

  var infoWindow = new google.maps.InfoWindow();

  // Try HTML5 geolocation.
  if (navigator.geolocation) {
    if (enabled) {
      navigator.geolocation.getCurrentPosition(function (position) {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        map.setCenter(pos);
        updateFQ();
      }, function () {
        handleLocationError(true, infoWindow, map.getCenter());
      });
    } else {
      var geocoder = new google.maps.Geocoder();
      var address = document.getElementById("zipcode").value;
      geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var pos = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };

          map.setCenter(pos);
          updateFQ();

        } else {
          alert("Request failed.")
        }
      });
    }
  }
  else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, map.getCenter());
  }

  // Update Foursquare locations every time where is a change in the map bounds
  map.addListener('zoom_changed', function (e) {
    updateFQ();
  });
  map.addListener('drag_end', function (e) {
    updateFQ();
  });
};

var handleLocationError = function (browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
    'Error: The Geolocation service failed.' :
    'Error: Your browser doesn\'t support geolocation.');
};

function menulist(title, id) {
  if (venue_dict[id] === undefined) {
    var menu_xhttp = getQueryXhttp(1, id);
    menu_xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        var menu_response = JSON.parse(menu_xhttp.responseText).response;
        if (menu_response.menu.menus.count != 0) {
          var menu_entries_array = menu_response.menu.menus.items[0].entries.items;
          var menu_entries_dict = {};
          for (var i = 0; i < menu_entries_array.length; i++) {
            var menu_entries = menu_entries_array[i];
            menu_entries_dict[menu_entries.name] = menu_entries.entries.items;
          }
          venue_dict[id] = menu_entries_dict;

          populateList(title, id);
        }
      }
    }
  } else {
    populateList(title, id);
  }
};

function showDetail(target) {
  var price = finalPrice;
  // console.log("finalPrice: " + price);
  var taxPrice = (1 + tax / 100) * price;
  // console.log("tax: " + tax);
  // console.log("tax/100: " + tax / 100);
  // console.log("taxPrice: " + taxPrice.toFixed(2));
  var tipPrice = (price * tip / 100);
  // console.log("tip: " + tip);
  // console.log("tipPrice: " + tipPrice);
  var totalPrice = taxPrice + tipPrice;
  // console.log("totalPrice: " + totalPrice);
  var originalPrice = document.getElementById('originalPrice');
  originalPrice.innerHTML = "original price: " + price.toFixed(2);
  var taxedPrice = document.getElementById('taxPrice');
  taxedPrice.innerHTML = "taxed price: " + taxPrice.toFixed(2);
  var tipedPrice = document.getElementById('tipPrice');
  tipedPrice.innerHTML = "tip price: " + tipPrice.toFixed(2);
  var totaledPrice = document.getElementById('totalPrice');
  totaledPrice.innerHTML = "total price: " + totalPrice.toFixed(2);

  document
    .getElementById('popover')
    .show(target);
}
finalPrice = 0.0;
function cart(checkbox) {
  // <ons-progress-bar id="budgetbar" value="0"></ons-progress-bar>
  var budgetbar = document.getElementById('budgetbar');
  var originalPrice = parseFloat(checkbox.value);
  if (checkbox.checked) {
    finalPrice += originalPrice;
    // console.log("finalPrice plus: " + finalPrice);
  }
  else {
    if(finalPrice-originalPrice<0){
      finalPrice=0;
    }
    else{
      finalPrice -= originalPrice;
    }
    // console.log("finalPrice minus: " + finalPrice);
  }
  
  var taxPrice = (1 + tax / 100) * finalPrice;
  // console.log("tax: " + tax);
  // console.log("tax/100: " + tax / 100);
  // console.log("taxPrice: " + taxPrice);
  var tipPrice = (finalPrice * tip / 100);
  // console.log("tip: " + tip);
  // console.log("tipPrice: " + tipPrice);
  var totalPrice = taxPrice + tipPrice;
  // console.log("totPrice: " + totalPrice.toFixed(2));
  totalPrice = (totalPrice).toFixed(2);
  // console.log("rounded: " + budgetbar.value);
  if(totalPrice>budget*1.00){
    budgetbar.value = 100;
  }
  else{
    budgetbar.value = totalPrice*100/budget;
  }
  // console.log("rounded price: " + budgetbar.value*100/budget);
}
function populateList(title, id) {
  // Populate the list with menu items
  var detail = document.getElementById("detail");
  var button = document.createElement("ons-button");
  button.className = "detailBtn"
  button.id = "detailButton";
  button.appendChild(document.createTextNode("DETAIL"));


  document.getElementById('list-title').innerHTML = title;
  var menuList = document.getElementById('menu-list');
  for (var menu_type in venue_dict[id]) {
    var menu_header = document.createElement('ons-list-header');
    menu_header.innerText = menu_type;

    menuList.appendChild(menu_header);

    for (var i = 0; i < venue_dict[id][menu_type].length; i++) {
      var menu = venue_dict[id][menu_type][i];
      var menu_item = document.createElement('ons-list-item');
      var newMenuName = menu.name.replace(/ /g, "@");
      var newMenuPrice = (menu.price === undefined) ? "N/A" : menu.price;
      
      var taxPrice = (1 + tax / 100) * menu.price;
      // console.log("taxPrice: " + taxPrice.toFixed(2));
      var tipPrice = (menu.price * tip / 100);
      // console.log("tipPrice: " + tipPrice);
      var totalPrice = taxPrice + tipPrice;

      // console.log("totalPrice: " + totalPrice.toFixed(2));
      if (totalPrice.toFixed(2) > budget * 1.00) {
        var html_text = "<div class='left'><ons-input type='checkbox' input-id='check-1' class='menulist' id=" + newMenuName + " value=" + newMenuPrice + "></ons-input></div><div class='center'>" + menu.name.fontcolor("red") + "</div><div class='right'>" + newMenuPrice + "</div>"
      }
      else {
        var html_text = "<div class='left'><ons-input type='checkbox' input-id='check-1' class='menulist' id=" + newMenuName + " value=" + newMenuPrice + "></ons-input></div><div class='center'>" + menu.name + "</div><div class='right'>" + newMenuPrice + "</div>"
      }
      menu_item.innerHTML += html_text;
      var checkbox = menu_item.childNodes[0].childNodes[0];
      checkbox.addEventListener('click', function(checkbox) {
        return function() {
          cart(checkbox);
        }
      }(checkbox));

      menuList.appendChild(menu_item);
    }
  }
  document.getElementById('budgetbar').addEventListener('click', function () {
    showDetail(this);
  });
  button.addEventListener("click", function () {
    showDetail(this);
  });
  detail.appendChild(button);
}

function chooz() {
  var orderSummary = document.getElementById('orderSummary');
  var menu = document.getElementsByClassName("menulist");
  var restaurant = document.getElementById('list-title').innerHTML;

  var orders = [];
  for (var i = 0; i < menu.length; i++) {
    if (menu[i].checked) {
      var menu_item = document.createElement('ons-list-item');
      var menuInfo = menu[i].id.replace(/@/g, " ");
      var menuPrice = menu[i].value;
      var html_text = "<div class='center'>" + menuInfo + "</div><div class='right'>" + menuPrice + "</div>"

      menu_item.innerHTML = html_text;
      orderSummary.appendChild(menu_item);

      var order = { "menu": menuInfo, "price": menuPrice };
      orders.push(order);

    }
  }


  const currentUser = firebase.auth().currentUser;
  
  if (currentUser === undefined) {
    // didn't log in
  } else {

    const dateFull = new Date();
    const dateToday = 'Order on ' + (dateFull.getMonth() + 1) + ' ' + dateFull.getDate() + ' ' + dateFull.getFullYear();


    var newPostKey = firebase.database().ref().child(dateToday).push().key;

    firebase.database().ref('users/' + currentUser.uid + '/'+ dateToday + '/' + newPostKey).update({
          orders: orders,
          name: restaurant
        })  
  }

}
var showPopover = function (target) {
  document
    .getElementById('popover')
    .show(target);
};
var hidePopover = function () {
  document
    .getElementById('popover')
    .hide();
};
function showModal() {
  var modal = document.querySelector('ons-modal');
  modal.show();
  setTimeout(function () {
    modal.hide();
  }, 2000);
}
ons.ready(function () {
  console.log('ons.ready firing');
  // Onsen UI is now initialized
  //ons.notification.alert('Onsen ready');
  document.addEventListener('init', function (event) {
    var page = event.target;
    console.log('event listener added', page);
    
    if (page.id === 'register') {
      page.querySelector('ons-toolbar .center').innerHTML = page.data.title;
      page.querySelector('#registerButton').onclick = function () {
        document.querySelector('#myNav').pushPage('login.html', { data: { title: 'login' } });
      };
    }
    if (page.id === 'login') {
      page.querySelector('#anonLoginButton').onclick = function () {
        document.querySelector('#myNav').pushPage('location.html', { data: { title: 'Location' } });
      };
    }
    if (page.id === 'location') {
      page.querySelector('#allowLocationButton').onclick = function () {
        console.log('allow location button clicked');
        document.querySelector('#myNav').pushPage('tipNbudgetW/location.html', { data: { title: 'tipNbudget' } });
      };
      page.querySelector('#notAllowLocationButton').onclick = function () {
        document.querySelector('#myNav').pushPage('tipNbudgetW/Olocation.html', { data: { title: 'tipNbudget' } });
      };
    }
    if (page.id === 'tipNbudgetW/location' || page.id === 'tipNbudgetW/Olocation') {
      console.log('tip n budget');
      page.querySelector('#confirm').onclick = function () {
        document.querySelector('#myNav')
          .pushPage('search.html', { data: { title: 'search' } })
          .then(function () {
            enabled = (page.id === 'tipNbudgetW/location') ? true : false;
            initMap(enabled);
            tipNbudget();
          });
      }
    };
    if (page.id === 'search' || page.id === 'menulist' || page.id === 'ordersummary') {
      
      page.querySelector('#settingButton').onclick = function () { //FIX ME: temporary trigger button as Setting. modify this to trigger when marker is clicked
        document.querySelector('#myNav').pushPage('setting.html', { data: { title: 'Setting' } })
          .then(function () {
            setting();
          });
      };
    }
    if (page.id === 'menulist') {
      if(page.id==='menulist'){
        console.log('menu page');
        finalPrice=0.0;
        console.log("reset finalPrice: "+finalPrice);
      }
      page.querySelector('#choozButton').onclick = function () {
        document.querySelector('#myNav').pushPage('ordersummary.html', { data: { title: 'OrderSummary' } })
          .then(function () {
            chooz();
          });
      };
    }
    if (page.id === 'setting') {
      page.querySelector('#viewRestaurantButton').onclick = function () {
        document.querySelector('#myNav')
          .pushPage('search.html', { data: { title: 'search' } });
      }
    }
  });
});

function getQueryXhttp(type, venue_id) {
  var date = new Date();
  var dd = date.getDate();
  var mm = date.getMonth() + 1; //January is 0
  var yyyy = date.getFullYear();
  if (dd < 10) {
    dd = '0' + dd;
  }
  if (mm < 10) {
    mm = '0' + mm;
  }
  var today = yyyy + mm + dd;
  var client_id = "VZP5RZFVTJRAPIASNSAEHBOBU12DK3WC4SQQNHZCAG3FAXT2";
  var client_secret = "XDVSW4E3LHM3NM31BYPOGNSW21MFDXF3BDPJ0YBSPGCGCVQX";
  var center = map.getCenter().toUrlValue(14);
  var sw_lat, sw_lon, ne_lat, ne_lon = 0.0;
  if (map.getBounds()) {
    sw_lat = map.getBounds().getSouthWest().lat();
    sw_lon = map.getBounds().getSouthWest().lng();
    ne_lat = map.getBounds().getNorthEast().lat();
    ne_lon = map.getBounds().getNorthEast().lng();
  }
  var radius = getRadius(sw_lat, sw_lon, ne_lat, ne_lon);

  xhttp = new XMLHttpRequest();

  var query_link;
  if (type == 0) {
    query_link = "https://api.foursquare.com/v2/venues/explore" +
      "?client_id=" + client_id + "&client_secret=" + client_secret +
      "&ll=" + center +
      "&v=" + today +
      "&radius=" + radius +
      "&section=food" +
      "&limit=10";
  } else if (type == 1) {
    query_link = "https://api.foursquare.com/v2/venues/" + venue_id + "/menu" +
      "?client_id=" + client_id + "&client_secret=" + client_secret +
      "&v=" + today;
  }
  xhttp.open("GET", query_link, true);
  xhttp.send();

  return xhttp;
}

var updateFQ = function () {
  var explore_xhttp = getQueryXhttp(0);
  explore_xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      var explore_response = JSON.parse(explore_xhttp.responseText).response;

      var items = explore_response.groups[0].items;

      for (var i = 0; i < venues.length; i++) {
        venues[i].marker.setMap(null);
      }

      venues = [];
      for (var i = 0; i < items.length; i++) {
        var venue =
          {
            marker: new google.maps.Marker({
              position: { lat: items[i].venue.location.lat, lng: items[i].venue.location.lng },
              // position: items[i].geometry.location,
              map: map,
              title: items[i].venue.name,
              icon: {
                url: 'https://developers.google.com/maps/documentation/javascript/images/circle.png',
                anchor: new google.maps.Point(10, 10),
                scaledSize: new google.maps.Size(10, 17)
              },
              store_id: items[i].venue.id
            }),
            id: items[i].venue.id,
          }
        console.log(venue.marker.title + ": " + venue.id);
        venues.push(venue);

        infoWindow = new google.maps.InfoWindow();
        venue.marker.addListener('click', function () {

          var div = document.createElement("DIV");
          var s = document.createElement("STRONG");
          s.innerHTML = this.title;
          var br = document.createElement("BR");
          var id = document.createElement("P");
          id.id = "venueId";
          id.innerHTML = this.store_id;
          var button = document.createElement("BUTTON");
          button.type = "button";
          var button_text = document.createTextNode("Menu");

          div.appendChild(s);
          div.appendChild(br);
          button.appendChild(button_text);
          div.appendChild(button);
          div.appendChild(id);

          div.addEventListener('click', function (div) {
            return function () {
              console.log(this);
              openMenuList(div.childNodes[0].innerHTML, div.childNodes[div.childNodes.length - 1].innerHTML);

            }
          }(div));

          infoWindow.setContent(div);
          infoWindow.open(map, this);
        });

        venues.push(venue);
      }
    }
  }
};

function openMenuList(title, id) {
  document.querySelector('#myNav').pushPage('menulist.html', { data: { title: 'Menulist' } })
    .then(function () {
      menulist(title, id);
    });
}

function getRadius(lat1, lon1, lat2, lon2) {
  var R = 6378.137; // Radius of earth in KM
  var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
  var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Math.round(d * 1000); // meters
}
// (function(){   

//   if(btnLogout){
//   btnLogout.addEventListener('click', e => {
//     firebase.auth().signOut();
//   });
//   }

//   firebase.auth().onAuthStateChanged(firebaseUser => {
//     if(firebaseUser){
//       console.log(firebaseUser);
//       btnLogout.classList.remove('hide');
//     }
//     else{
//       console.log('not logged in');
//       if(btnLogout){
//       btnLogout.classList.add('hide');
//       }
//     }
//   });
// });
