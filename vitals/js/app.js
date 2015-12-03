/*jslint  nomen: true*/
/*global angular, Papa, _gaq, Utils, alert, console, moment, FileReader, prompt, d3*/

var Tex = angular.module('Tex', ['ES', 'ngSanitize']);

Tex.controller('texCtrl', function ($scope, es, $sce) {
    'use strict';
    
    $scope.security = {};
    $scope.data = {};
    $scope.state = {};
    $scope.filter = {};
    $scope.loading = {
        login: 0,
        documents: 0,
        histogram: 0,
        facets: 0,
        terms: 0,
        bigrams: 0
    };
    /*"review": {
            "Bedside Manner": 5,
            "Ease of Appointment": 5,
            "Overall rating": 5,
            "Spends Time with Me": 5,
            "Specialty": "Obstetrics & Gynecology",
            "Accurate Diagnosis": 5,
            "Courteous Staff": 5,
            "Follows Up After Visit": 5,
            "created": "2015-03-10T08:09:21",
            "text": "Everyone was both professional and attentive. The facility is clean, neat and orderly. The doctor's very warm, caring and on top of various details of my care.",
            "Promptness": 5
          },
          "business": {
            "Average Wait Time": "10 min",
            "Provider_id": 13439066,
            "Degree": "Medical Doctor",
            "State (primary address)": "GA",
            "name": "E"
          }*/
    $scope.facets = [
        {order: 1, title: "Overall rating", field: "review.OverallRating", directive: "rating", noSignificant: true},
        {order: 2, title: "Bedside Manner", field: "review.BedsideManner", directive: "rating", noSignificant: true},
        {order: 3, title: "Ease of Appointment", field: "review.EaseOfAppointment", directive: "rating", noSignificant: true},
        {order: 4, title: "Spends Time with Me", field: "review.SpendsTimeWithMe", directive: "rating", noSignificant: true},
        {order: 5, title: "Accurate Diagnosis", field: "review.AccurateDiagnosis", directive: "rating", noSignificant: true},
        {order: 6, title: "Courteous Staff", field: "review.CourteousStaff", directive: "rating", noSignificant: true},
        {order: 7, title: "Follows Up After Visit", field: "review.FollowsUpAfterVisit", directive: "rating", noSignificant: true},
        {order: 8, title: "Specialty", field: "review.Specialty", directive: "provider"},
        {order: 8, title: "Visibility", field: "review.Visibility", directive: "provider"},
        {order: 9, title: "Degree", field: "business.Degree", directive: "provider"},
        {order: 10, title: "AverageWaitTime", field: "business.AverageWaitTime", directive: "provider"},
        {order: 11, title: "Name", field: "business.name", directive: "provider"},
        {order: 12, title: "State", field: "business.State", directive: "provider"}
    
        
    ];
    
    /*Properties -----------------------------------*/
    $scope.HTML = function (html) {
        return $sce.trustAsHtml(html);
    };
    
    $scope.filters = function () {
        return JSON.parse(JSON.stringify($scope.filter));
    };
    
    $scope.filtersList = function (state) {
        var values = [state.filter.search];
        if (es.hasFacets(state.filter)) {
            state.filter.filters.forEach(function (f) {
                values.push(f.value.join(", "));
            });
        }
        
        return values.join("; ");
    };
    
    /*Interaction ----------------------------------*/
    $scope.selectDocument = function (doc) {
        var filter = doc.search ? {search: doc.search} : $scope.filters();
        filter.id = doc.id;
        es.getDocument(filter).then(function (docRes) {
            $scope.state.selectedDocument = docRes;
        });
        _gaq.push(['_trackEvent', 'Document', 'Selected', '']);
    };
    
    $scope.saveDocument = function (doc) {
        if ($scope.selectedCase.documents.indexOf(doc) > 0) {
            doc.saved = true;
            return;
        }
        var filter = $scope.filters();
        filter.id = doc.id;
        es.getDocument(filter, 50).then(function (docRes) {
            var document = { id: docRes.id, title: docRes.business.name, details: docRes.high, search: $scope.filter.search};
            doc.saved = true;
            $scope.selectedCase.documents.push(document);
            alert('Document Saved');
        });
        _gaq.push(['_trackEvent', 'Document', 'Saved', '']);
    };
    
    $scope.setDate = function (start, end) {
        $scope.filter.date.from = start;
        end.stamp = end.stamp === "*" ? es.stats.dateMax.value : end.stamp;
        $scope.filter.date.to = end;
        $scope.setUrl();
        _gaq.push(['_trackEvent', 'Date', 'Changed', '']);
    };
    
    $scope.saveState = function () {
        var desc = prompt("Provide a description for the state", $scope.filter.search),
            state = {
                filter: $scope.filter,
                desc: desc
            };
        $scope.selectedCase.states.push(state);
        _gaq.push(['_trackEvent', 'State', 'Saved', '']);
    };
    
    $scope.addFacetFilter = function (filter, facet) {
        $scope.filter.filters = $scope.filter.filters || [];
        $scope.filter.filters.push({facet: facet.facet, value: [filter.key]});
        $scope.setUrl();
        _gaq.push(['_trackEvent', 'Facet', 'Added', '']);
    };
    
    $scope.removeFilter = function (f, idx) {
        $scope.filter.filters.splice(idx, 1);
        $scope.setUrl();
        _gaq.push(['_trackEvent', 'Facet', 'Removed', '']);
    };
    
    $scope.removeState = function (idx) {
        $scope.selectedCase.states.splice(idx, 1);
        _gaq.push(['_trackEvent', 'State', 'Removed', '']);
    };
    
    $scope.removeDoc = function (idx) {
        $scope.selectedCase.documents.splice(idx, 1);
        _gaq.push(['_trackEvent', 'Document', 'Removed', '']);
    };
    
    $scope.removeMin = function () {
        $scope.config.minCount = 1;
        $scope.loadData();
    };
    
    $scope.loadState = function (state) {
        $scope.filter = state.filter;
        $scope.setUrl();
    };
    
    $scope.appendWord = function (word) {
        if ($scope.filter.search && $scope.filter.search.length > 0) {
            if ($scope.filter.search.indexOf(" ") > 0) {
                $scope.filter.search = "(" + $scope.filter.search + ")";
            }
            $scope.filter.search = "+" + $scope.filter.search + " +" + word;
        } else {
            $scope.filter.search = word;
        }
        $scope.setUrl();
        _gaq.push(['_trackEvent', 'Search', 'Added Suggestion', '']);
    };
    
    $scope.loadMore = function () {
        $scope.loadDocuments($scope.data.documents.length);
        _gaq.push(['_trackEvent', 'Documents', 'Load More', '']);
    };
    
    $scope.changeSort = function () {
        $scope.loadDocuments();
        _gaq.push(['_trackEvent', 'Documents', 'Changed Sort', '']);
    };
    
    $scope.changeSearch = function () {
        _gaq.push(['_trackEvent', 'Search', 'Changed', '']);
    };
    
    $scope.upload = function () {
        var input = document.getElementById("uploadBox");
        input.click();
    };
    
    $scope.loadCasesFromFile = function (cases) {
        $scope.cases = cases;
        $scope.selectedCase = $scope.cases[0];
        alert('Data loaded');
        _gaq.push(['_trackEvent', 'Cases', 'Upload', '']);
    };
    
    $scope.addCase = function () {
        var name;
        do {
            name = prompt("Type a name for the case");
        } while (!name || name.length === 0);
        $scope.cases.push({name: name, states: [], documents: []});
        $scope.selectedCase = $scope.cases[$scope.cases.length - 1];
        _gaq.push(['_trackEvent', 'Cases', 'Add', '']);
    };
    
    $scope.getCsvValue = function (obj, field) {
        if (obj[field]) {
            return '"' + obj[field].replace(/\r?\n|\r/g, "") + '"';
        }
        return "";
    };
    
    $scope.downloadDocuments = function () {
        var pom = document.createElement('a'),
            event;
        
       /*
        
        header = Object.keys(docRef.business).map(function (v) {return "business_" + v; }).join(";");
        header += Object.keys(docRef.user).map(function (v) {return "user_" + v; }).join(";");
        header += Object.keys(docRef.review).map(function (v) {return "review_" + v; }).join(";");
        header += "\r\n";
        $scope.data.documents.forEach(function (docRef) {
            line += Object.keys(docRef.business).map(function (v) {return $scope.getCsvValue(docRef.business, v); }).join(";");
            line += Object.keys(docRef.user).map(function (v) {return $scope.getCsvValue(docRef.user, v); }).join(";");
            line += Object.keys(docRef.review).map(function (v) {return $scope.getCsvValue(docRef.review, v); }).join(";");
            line += "\r\n";
        });
        */
        
        $scope.flatDocument = function (d) {
            var f = {};
            Object.keys(d.review).forEach(function (k) { f["review_" + k] = d.review[k]; });
            Object.keys(d.business).forEach(function (k) { f["business_" + k] = d.business[k]; });
            Object.keys(d.user).forEach(function (k) { f["user_" + k] = d.user[k]; });
            return f;
        };
        
        pom.setAttribute('href', 'data:text/csv;charset=utf-8,' +
                          encodeURIComponent(Papa.unparse($scope.data.documents.map(function (d) {return $scope.flatDocument(d); }))));
        pom.setAttribute('download', "documents.csv");
        
        if (document.createEvent) {
            event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
        _gaq.push(['_trackEvent', 'Documents', 'Download', '']);
        
    };
    
    
    
    $scope.downloadCases = function () {
        var pom = document.createElement('a'), event;
        pom.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify($scope.cases)));
        pom.setAttribute('download', "cases.json");

        if (document.createEvent) {
            event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        } else {
            pom.click();
        }
        _gaq.push(['_trackEvent', 'Cases', 'Download', '']);
    };
       
    $scope.searchFix = function (orig, newWord) {
        $scope.filter.search = $scope.filter.search.replace(orig, newWord);
        $scope.setUrl();
        _gaq.push(['_trackEvent', 'Search', 'Fixed', '']);
    };
    
    /* Feedback ------------------------------------*/
    $scope.showToolTip = function (content) {
        $scope.toolTip.html(content);
        $scope.toolTip
            .style({
                "left": (d3.event.x - 10) + "px",
                "top": (d3.event.y + 15) + "px",
                "display": "block"
            });
    };
    
    $scope.hideToolTip = function () {
        $scope.toolTip
            .style({
                "display": "none"
            });
    };
    
    /*Life Cicle ----------------------------------*/
    $scope.login = function () {
        if ($scope.security.password && $scope.security.password.length > 0) {
            $scope.security.user = "user";
            $scope.loading.login += 1;
            es.login($scope.security).then(
                function (result) {
                    if (result) {
                        sessionStorage.setItem("user", $scope.security.user);
                        sessionStorage.setItem("password", $scope.security.password);
                        $scope.logged = true;
                        $scope.load();
                    } else {
                        $scope.security.status = "Password Invalid!";
                    }
                    $scope.loading.login -= 1;
                }
            );
        }
    };
    
    $scope.load = function () {
        $scope.readUrl();
        $scope.loadCases();
    };
    
    $scope.loadData = function () {
        $scope.loadDocuments();
        $scope.loadHistogram();
        $scope.loadFacets();
        $scope.loadClouds();
    };
    
    $scope.loadCases = function () {
        var store = JSON.parse(localStorage.getItem("TextExplorer"));
        if (!store || store.length === 0) {
            store = [];
            store.push({name: "Default", states: [], documents: []});
        }
        $scope.selectedCase = store[0];
        $scope.cases = store;
    };
    
    $scope.$watch(function () { return !$scope.filter.date ? undefined : $scope.filter.date.from.desc; }, function () {console.log('changed'); $scope.setUrl(); }, true);
    $scope.$watch(function () { return !$scope.filter.date ? undefined : $scope.filter.date.to.desc; }, function () {$scope.setUrl(); }, true);
    $scope.$watch(function () { return $scope.cases; }, function () {$scope.saveCases(); }, true);
    $scope.saveCases = function () {
        if ($scope.cases) {
            localStorage.setItem("TextExplorer", JSON.stringify($scope.cases));
        }
    };
    
    
    /* DB -----------------------------------------*/
    $scope.loadDocuments = function (from) {
        from = from || 0;
        $scope.loading.documents += 1;
        es.getDocuments($scope.filter, from).then(function (result) {
            if (from > 0) {
                
                $scope.data.documents = $scope.data.documents.concat(result.docs);
            } else {
                $scope.data.documents = result.docs;
            }
            $scope.data.total = result.total;
            $scope.data.suggestions = result.suggestions;
            $scope.loading.documents -= 1;
        });
    };
    
    $scope.loadHistogram = function () {
        es.getHistogram($scope.filters()).then(function (result) {
            $scope.data.histogram = result;
        });
    };
    
    $scope.loadFacets = function () {
        $scope.loading.facets += 1;
        es.getFacets($scope.filters(), $scope.facets, $scope.config).then(function (result) {
            $scope.data.facets = result;
            $scope.loading.facets -= 1;
        });
    };
    
    $scope.loadClouds = function () {
        $scope.getTerms();
        $scope.getBigrams();
    };
    
    $scope.getTerms = function () {
        $scope.loading.terms += 1;
        es.getTerms($scope.filters()).then(function (result) {
            $scope.data.terms = result;
            $scope.loading.terms -= 1;
        });
    };
    
    $scope.getBigrams = function () {
        $scope.loading.bigrams += 1;
        es.getTerms($scope.filters(), "bigrams").then(function (result) {
            console.log(result);
            $scope.data.bigrams = result;
            $scope.loading.bigrams -= 1;
        });
    };
    
    /* Functions ----------------------------------*/
    $scope.readUrl = function () {
        var attrs = decodeURIComponent(location.hash.substring(1)).split("|");
        
        $scope.filter = {};
        $scope.filter.sortDocuments = "relevance";
        attrs.forEach(function (attr) {
            var dateFrom, dateTo,
                key = attr.split("=")[0],
                value = attr.split("=")[1];
                
            switch (key) {
            case "search":
                $scope.filter.search = value.trim();
                break;
            case "date":
                dateFrom = value.split("TO")[0].trim();
                dateTo = value.split("TO")[1].trim();
                $scope.filter.date = {
                    from: {desc: dateFrom, stamp: moment.utc(dateFrom, "MMM YYYY").unix() * 1000},
                    to: {desc: dateTo, stamp: moment.utc(dateTo, "MMM YYYY").add(1, "M").unix() * 1000}
                };
                break;
            case "filters":
                $scope.filter.filters = [];
                value = value.replace("[", "").replace("]", "");
                value.split(";").forEach(function (filter) {
                    var _key = filter.split(":")[0].trim(),
                        _value = filter.split(":")[1].trim(),
                        f = {};
                    f.facet = _key;
                    f.value = _value.split(",").map(function (v) { return v.trim(); });
                    
                    f.det = $scope.facets.find(function (fc) { return fc.title === f.facet; });
                    
                    $scope.filter.filters.push(f);
                });
                break;
            case "sort":
                $scope.filter.sortDocuments = value.trim();
                break;
            }
        });
        //Defaults
        console.log(es.stats);
        $scope.filter.date = $scope.filter.date || {
            from: {desc: moment.utc(es.stats.dateMin.value).format("MMM YYYY"), stamp: es.stats.dateMin.value},
            to: {desc: moment.utc(es.stats.dateMax.value).format("MMM YYYY"), stamp: es.stats.dateMax.value},
            maxExtent: true
        };
        $scope.loadData();
    };
    
    $scope.setUrl = function () {
        var url = [], facets;
        
        if (es.hasSearch($scope.filter)) {
            url.push("search=" + $scope.filter.search);
        }
        if (es.filterDate($scope.filter) || ($scope.filter.date && $scope.filter.date.from.desc)) {
            url.push("date=" + $scope.filter.date.from.desc + " TO " + $scope.filter.date.to.desc);
        }
        if (es.hasFacets($scope.filter)) {
            
            facets = $scope.filter.filters.map(function (f) {
                return f.facet + ":" + f.value.join(",");
            });
            url.push("filters=[" + facets.filter(Utils.onlyUnique).join(";") + "]");
            
        }
        window.location.hash = url.length > 0 ? "#" + url.join("|") : "";
    };
    
    
    /*Init --------------------------------------*/
    $scope.init = function () {
        es.params({
            //host: "localhost:9500",
            host: "vgc.poly.edu/projects/es-gateway",
            index: "vitals2"
        });
        
        if (sessionStorage.getItem("user")) {
            $scope.security.user = sessionStorage.getItem("user");
            $scope.security.password = sessionStorage.getItem("password");
            console.log("Saved");
            $scope.login();
        }
        $scope.config = {};
        $scope.config.minCount = 1;
        window.addEventListener("hashchange", $scope.readUrl, false);
        $scope.toolTip = d3.select(document.getElementById("toolTip"));
    };
    
});

Tex.directive('ngEnter', function () {
    'use strict';
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if (event.which === 13) {
                scope.$apply(function () {
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});

Tex.directive('ngRightClick', function ($parse) {
    'use strict';
    return function (scope, element, attrs) {
        var fn = $parse(attrs.ngRightClick);
        element.bind('contextmenu', function (event) {
            scope.$apply(function () {
                event.preventDefault();
                fn(scope, {$event: event});
            });
        });
    };
});

Tex.directive("fileread", [function () {
    'use strict';
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element) {
            element.bind("change", function (changeEvent) {
                
                var reader = new FileReader();
                reader.onload = function (loadEvent) {
                    
                    scope.$apply(function () {
                        try {
                            var newCases = JSON.parse(loadEvent.target.result);
                            scope.$parent.loadCasesFromFile(newCases);
                        } catch (err) {
                            alert('Error loading the file');
                        }
                        
                        
                    });
                };
                reader.readAsText(changeEvent.target.files[0]);
            });
        }
    };
}]);

Tex.filter('list', function () {
    'use strict';
    return function (input) {
        input = input || [];
        var out = input.join(", ");
        return out;
    };
});
Tex.filter('stars', function () {
    'use strict';
    return function (input) {
        var i, out = "";
        input = input || 0;
        for (i = 0; i < input; i += 1) {
            out += '<i class="fa fa-star"></i>';
        }
        return out;
    };
});

